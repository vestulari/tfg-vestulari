// Crides SQL a Entitat.
import type {
  AdministradorDto,
  EntitatDetallDto,
  EntitatEditadaDto,
  EntitatNovaDto,
  EntitatResumDto,
} from '@tfg-vestulari/shared'
import type { Sql } from '../lib/db'

// Retorna la llista d'entitats a les que l'usuari té algun perfil assignat
export async function llistaPerUsuari(sql: Sql, userId: string): Promise<EntitatResumDto[]> {
  const rows = await sql<{ id: number; nom: string }[]>`
    select e.id, e.nom
    from public.entitats e
    where exists (
      select 1
      from public.perfils p
      where p.entitat_id = e.id
        and p.usuari_id = ${userId}
    )
    order by e.nom
  `
  return rows.map((r) => ({ id: r.id, nom: r.nom }))
}

// Retorna l'entitat amb el perfil que hi té l'usuari i els seus permisos.
// Si l'usuari no hi té cap perfil, retorna null (encara que l'entitat existeixi).
export async function detallPerUsuari(
  sql: Sql,
  userId: string,
  id: number
): Promise<EntitatDetallDto | null> {
  const [r] = await sql<
    {
      id: number
      nom: string
      descripcio: string | null
      any_creacio: number
      mes_creacio: number | null
      dia_creacio: number | null
      es_creador: boolean
      perfil_id: number
      perfil_nom: string
      es_administrador: boolean
      es_interpret: boolean
    }[]
  >`
    select e.id,
           e.nom,
           e.descripcio,
           e.any_creacio,
           e.mes_creacio,
           e.dia_creacio,
           e.creada_per is not distinct from p.usuari_id as es_creador,
           p.id as perfil_id,
           p.nom as perfil_nom,
           exists (select 1 from public.administradors a where a.perfil_id = p.id) as es_administrador,
           exists (select 1 from public.interprets i where i.perfil_id = p.id) as es_interpret
    from public.entitats e
    join public.perfils p on p.entitat_id = e.id and p.usuari_id = ${userId}
    where e.id = ${id}
  `
  if (!r) return null
  return {
    id: r.id,
    nom: r.nom,
    descripcio: r.descripcio,
    anyCreacio: r.any_creacio,
    mesCreacio: r.mes_creacio,
    diaCreacio: r.dia_creacio,
    perfil: {
      id: r.perfil_id,
      nom: r.perfil_nom,
      esAdministrador: r.es_administrador,
      esInterpret: r.es_interpret,
      esCreador: r.es_creador,
    },
  }
}

// Tot en una transacció: o es crea tot (entitat, plantilla, perfil del creador i els seus valors),
// o no es crea res. El creador sempre és administrador.
export function crea(sql: Sql, userId: string, d: EntitatNovaDto): Promise<number> {
  return sql.begin(async (tx) => {
    const [entitat] = await tx<{ id: number }[]>`
      insert into public.entitats
        (nom, descripcio, creada_per, any_creacio, mes_creacio, dia_creacio)
      values
        (${d.nom}, ${d.descripcio === '' ? null : d.descripcio}, ${userId},
         ${d.anyCreacio}, ${d.mesCreacio}, ${d.diaCreacio})
      returning id
    `

    const idsAtribut = new Map<string, number>()
    for (const a of d.atributs) {
      const [def] = await tx<{ id: number }[]>`
        insert into public.definicions_atribut_perfil (entitat_id, nom, tipus)
        values (${entitat.id}, ${a.nom}, ${a.tipus})
        returning id
      `
      idsAtribut.set(a.nom, def.id)
    }

    const [perfil] = await tx<{ id: number }[]>`
      insert into public.perfils (nom, entitat_id, usuari_id, edat, genere)
      values (${d.perfil.nom}, ${entitat.id}, ${userId}, ${d.perfil.edat}, ${d.perfil.genere})
      returning id
    `

    await tx`insert into public.administradors (perfil_id) values (${perfil.id})`
    if (d.perfil.esInterpret) {
      await tx`insert into public.interprets (perfil_id) values (${perfil.id})`
    }

    for (const v of d.perfil.valors) {
      const definicioId = idsAtribut.get(v.atribut)
      if (definicioId === undefined) continue // ja validat abans
      await tx`
        insert into public.valors_atribut_perfil (definicio_id, perfil_id, valor)
        values (${definicioId}, ${perfil.id}, ${v.valor})
      `
    }

    return entitat.id
  })
}
// Canvia el nom, la descripció i la data de creació d'una entitat.
export async function edita(sql: Sql, id: number, d: EntitatEditadaDto): Promise<void> {
  await sql`
    update public.entitats
    set nom = ${d.nom},
        descripcio = ${d.descripcio === '' ? null : d.descripcio},
        any_creacio = ${d.anyCreacio},
        mes_creacio = ${d.mesCreacio},
        dia_creacio = ${d.diaCreacio}
    where id = ${id}
  `
}

// Esborra l'entitat. Tot el que en depèn (perfils, invitacions, roba, espectacles…) s'esborra en cascada.
export async function elimina(sql: Sql, id: number): Promise<void> {
  await sql`delete from public.entitats where id = ${id}`
}

// Retorna els administradors de l'entitat que tenen usuari, menys el mateix usuari.
// Són els que poden rebre el rol de creador.
export async function altresAdministradors(
  sql: Sql,
  userId: string,
  id: number
): Promise<AdministradorDto[]> {
  const rows = await sql<{ perfil_id: number; perfil_nom: string; usuari_nom: string }[]>`
    select p.id as perfil_id, p.nom as perfil_nom, u.nom as usuari_nom
    from public.perfils p
    join public.administradors a on a.perfil_id = p.id
    join public.usuaris u on u.id = p.usuari_id
    where p.entitat_id = ${id}
      and p.usuari_id <> ${userId}
    order by p.nom
  `
  return rows.map((r) => ({ perfilId: r.perfil_id, perfilNom: r.perfil_nom, usuariNom: r.usuari_nom }))
}

// Motius pels quals no es pot passar el rol de creador o sortir de l'entitat
export type MotiuConfiguracio = 'no_creador' | 'no_administrador' | 'es_creador' | 'no_membre'

// Passa el rol de creador a un altre administrador de l'entitat.
// Només ho pot fer el creador, i el nou creador ha de ser un administrador amb usuari.
export function passaCreador(
  sql: Sql,
  userId: string,
  id: number,
  perfilId: number
): Promise<{ ok: true } | { ok: false; motiu: MotiuConfiguracio }> {
  return sql.begin(async (tx) => {
    // `for update` bloqueja l'entitat perquè no es passi el rol dues vegades alhora
    const [entitat] = await tx<{ creada_per: string | null }[]>`
      select creada_per from public.entitats where id = ${id} for update
    `
    if (!entitat || entitat.creada_per !== userId) return { ok: false, motiu: 'no_creador' }

    const [nou] = await tx<{ usuari_id: string }[]>`
      select p.usuari_id
      from public.perfils p
      join public.administradors a on a.perfil_id = p.id
      where p.id = ${perfilId}
        and p.entitat_id = ${id}
        and p.usuari_id is not null
        and p.usuari_id <> ${userId}
    `
    if (!nou) return { ok: false, motiu: 'no_administrador' }

    await tx`update public.entitats set creada_per = ${nou.usuari_id} where id = ${id}`
    return { ok: true }
  })
}

// Desvincula l'usuari de l'entitat: el perfil queda lliure (sense usuari) i la invitació
// que havia acceptat passa a rebutjada, perquè el puguin tornar a convidar.
// El creador no pot sortir: primer ha de passar el rol a un altre administrador.
export function surt(
  sql: Sql,
  userId: string,
  id: number
): Promise<{ ok: true } | { ok: false; motiu: MotiuConfiguracio }> {
  return sql.begin(async (tx) => {
    const [entitat] = await tx<{ creada_per: string | null }[]>`
      select creada_per from public.entitats where id = ${id} for update
    `
    if (!entitat) return { ok: false, motiu: 'no_membre' }
    if (entitat.creada_per === userId) return { ok: false, motiu: 'es_creador' }

    const [perfil] = await tx<{ id: number }[]>`
      update public.perfils
      set usuari_id = null
      where entitat_id = ${id} and usuari_id = ${userId}
      returning id
    `
    if (!perfil) return { ok: false, motiu: 'no_membre' }

    await tx`
      update public.invitacions
      set estat = 'rebutjada'
      where entitat_id = ${id}
        and perfil_id = ${perfil.id}
        and usuari_id = ${userId}
        and estat = 'acceptada'
    `
    return { ok: true }
  })
}
