// Crides SQL a Perfil: llistar, veure, crear i editar perfils, i compartir-los amb un usuari.

import type {
  Genere,
  PerfilDadesDto,
  PerfilDetallDto,
  PerfilResumDto,
} from '@tfg-vestulari/shared'
import type { TransactionSql } from 'postgres'
import type { Sql } from '../lib/db'

type Tx = TransactionSql<{}>

// Retorna tots els perfils de l'entitat, amb els seus permisos, per ordre alfabètic
export async function llista(sql: Sql, entitatId: number): Promise<PerfilResumDto[]> {
  const rows = await sql<
    { id: number; nom: string; es_administrador: boolean; es_interpret: boolean }[]
  >`
    select p.id,
           p.nom,
           exists (select 1 from public.administradors a where a.perfil_id = p.id) as es_administrador,
           exists (select 1 from public.interprets i where i.perfil_id = p.id) as es_interpret
    from public.perfils p
    where p.entitat_id = ${entitatId}
    order by p.nom
  `
  return rows.map((r) => ({
    id: r.id,
    nom: r.nom,
    esAdministrador: r.es_administrador,
    esInterpret: r.es_interpret,
  }))
}

// Retorna el detall d'un perfil de l'entitat: les dades, els valors dels atributs, el correu de
// l'usuari que el té i la invitació pendent. Retorna null si el perfil no és d'aquesta entitat.
export async function detall(
  sql: Sql,
  userId: string,
  entitatId: number,
  perfilId: number
): Promise<PerfilDetallDto | null> {
  const [p] = await sql<
    {
      id: number
      nom: string
      edat: number | null
      genere: Genere | null
      es_administrador: boolean
      es_interpret: boolean
      es_creador: boolean
      es_meu: boolean
      compartit_amb: string | null
    }[]
  >`
    select p.id,
           p.nom,
           p.edat,
           p.genere,
           exists (select 1 from public.administradors a where a.perfil_id = p.id) as es_administrador,
           exists (select 1 from public.interprets i where i.perfil_id = p.id) as es_interpret,
           coalesce(p.usuari_id = e.creada_per, false) as es_creador,
           coalesce(p.usuari_id = ${userId}, false) as es_meu,
           u.email as compartit_amb
    from public.perfils p
    join public.entitats e on e.id = p.entitat_id
    left join auth.users u on u.id = p.usuari_id
    where p.id = ${perfilId} and p.entitat_id = ${entitatId}
  `
  if (!p) return null

  const [valors, invitacions] = await Promise.all([
    sql<{ definicio_id: number; valor: string }[]>`
      select definicio_id, valor
      from public.valors_atribut_perfil
      where perfil_id = ${perfilId}
    `,
    sql<{ id: number; email: string }[]>`
      select i.id, u.email
      from public.invitacions i
      join auth.users u on u.id = i.usuari_id
      where i.perfil_id = ${perfilId} and i.estat = 'rebuda'
      order by i.data desc
      limit 1
    `,
  ])

  return {
    id: p.id,
    nom: p.nom,
    edat: p.edat,
    genere: p.genere,
    esAdministrador: p.es_administrador,
    esInterpret: p.es_interpret,
    esCreador: p.es_creador,
    esMeu: p.es_meu,
    valors: valors.map((v) => ({ atributId: v.definicio_id, valor: v.valor })),
    compartitAmb: p.compartit_amb,
    invitacio: invitacions[0] ?? null,
  }
}

// Posa els permisos i els valors d'un perfil tal com diuen les dades (dins d'una transacció)
async function desaPermisosIValors(tx: Tx, perfilId: number, d: PerfilDadesDto) {
  if (d.esAdministrador) {
    await tx`insert into public.administradors (perfil_id) values (${perfilId}) on conflict do nothing`
  } else {
    await tx`delete from public.administradors where perfil_id = ${perfilId}`
  }

  if (d.esInterpret) {
    await tx`insert into public.interprets (perfil_id) values (${perfilId}) on conflict do nothing`
  } else {
    await tx`delete from public.interprets where perfil_id = ${perfilId}`
  }

  await tx`delete from public.valors_atribut_perfil where perfil_id = ${perfilId}`
  for (const v of d.valors) {
    await tx`
      insert into public.valors_atribut_perfil (definicio_id, perfil_id, valor)
      values (${v.atributId}, ${perfilId}, ${v.valor})
    `
  }
}

// Crea un perfil nou a l'entitat, encara sense usuari. Retorna el seu id.
export function crea(sql: Sql, entitatId: number, d: PerfilDadesDto): Promise<number> {
  return sql.begin(async (tx) => {
    const [perfil] = await tx<{ id: number }[]>`
      insert into public.perfils (nom, entitat_id, edat, genere)
      values (${d.nom}, ${entitatId}, ${d.edat}, ${d.genere})
      returning id
    `
    await desaPermisosIValors(tx, perfil.id, d)
    return perfil.id
  })
}

// Motius pels quals no es pot editar, compartir o descompartir un perfil
export type MotiuPerfil =
  | 'no_trobat'
  | 'creador_admin'
  | 'ja_compartit'
  | 'perfil_amb_invitacio'
  | 'ja_membre'
  | 'ja_convidat'
  | 'es_creador'
  | 'es_meu'

type Resultat = { ok: true } | { ok: false; motiu: MotiuPerfil }

// Edita un perfil de l'entitat. Al perfil del creador no se li pot treure el rol d'administrador,
// perquè l'entitat sempre ha de tenir algú que la pugui gestionar.
export function edita(
  sql: Sql,
  entitatId: number,
  perfilId: number,
  d: PerfilDadesDto
): Promise<Resultat> {
  return sql.begin(async (tx): Promise<Resultat> => {
    const [p] = await tx<{ es_creador: boolean }[]>`
      select coalesce(p.usuari_id = e.creada_per, false) as es_creador
      from public.perfils p
      join public.entitats e on e.id = p.entitat_id
      where p.id = ${perfilId} and p.entitat_id = ${entitatId}
      for update of p
    `
    if (!p) return { ok: false, motiu: 'no_trobat' }
    if (p.es_creador && !d.esAdministrador) return { ok: false, motiu: 'creador_admin' }

    await tx`
      update public.perfils
      set nom = ${d.nom}, edat = ${d.edat}, genere = ${d.genere}
      where id = ${perfilId}
    `
    await desaPermisosIValors(tx, perfilId, d)
    return { ok: true }
  })
}

// Comparteix un perfil amb l'usuari d'aquest correu: li envia una invitació.
// Retorna 'sense_compte' si el correu no és de cap usuari de Vestulari.
// Si ja li havien enviat una invitació per aquest perfil i l'havia rebutjada, es torna a enviar.
export function comparteix(
  sql: Sql,
  entitatId: number,
  perfilId: number,
  email: string
): Promise<Resultat | { ok: false; motiu: 'sense_compte' }> {
  return sql.begin(async (tx) => {
    // `for update` bloqueja el perfil perquè no se'n facin dues invitacions alhora
    const [p] = await tx<{ usuari_id: string | null }[]>`
      select usuari_id
      from public.perfils
      where id = ${perfilId} and entitat_id = ${entitatId}
      for update
    `
    if (!p) return { ok: false, motiu: 'no_trobat' as const }
    if (p.usuari_id !== null) return { ok: false, motiu: 'ja_compartit' as const }

    const [pendent] = await tx`
      select 1 from public.invitacions where perfil_id = ${perfilId} and estat = 'rebuda'
    `
    if (pendent) return { ok: false, motiu: 'perfil_amb_invitacio' as const }

    const [usuari] = await tx<{ id: string }[]>`
      select u.id
      from auth.users u
      join public.usuaris pu on pu.id = u.id
      where lower(u.email) = lower(${email})
    `
    if (!usuari) return { ok: false, motiu: 'sense_compte' as const }

    const [membre] = await tx`
      select 1 from public.perfils where entitat_id = ${entitatId} and usuari_id = ${usuari.id}
    `
    if (membre) return { ok: false, motiu: 'ja_membre' as const }

    const [convidat] = await tx`
      select 1 from public.invitacions
      where entitat_id = ${entitatId} and usuari_id = ${usuari.id} and estat = 'rebuda'
    `
    if (convidat) return { ok: false, motiu: 'ja_convidat' as const }

    const reenviades = await tx`
      update public.invitacions
      set estat = 'rebuda', data = now(), oberta_el = null
      where entitat_id = ${entitatId}
        and perfil_id = ${perfilId}
        and usuari_id = ${usuari.id}
        and estat = 'rebutjada'
      returning id
    `
    if (reenviades.length === 0) {
      await tx`
        insert into public.invitacions (entitat_id, perfil_id, usuari_id)
        values (${entitatId}, ${perfilId}, ${usuari.id})
      `
    }
    return { ok: true as const }
  })
}

// Cancel·la (esborra) la invitació pendent d'un perfil. Retorna false si no n'hi havia cap.
export async function cancelaInvitacio(
  sql: Sql,
  entitatId: number,
  perfilId: number
): Promise<boolean> {
  const rows = await sql`
    delete from public.invitacions
    where entitat_id = ${entitatId} and perfil_id = ${perfilId} and estat = 'rebuda'
    returning id
  `
  return rows.length > 0
}

// Treu l'usuari d'un perfil: el perfil queda lliure i la invitació que havia acceptat passa a
// rebutjada (com quan algú surt). No es pot fer amb el perfil del creador ni amb el propi.
export function descomparteix(
  sql: Sql,
  userId: string,
  entitatId: number,
  perfilId: number
): Promise<Resultat> {
  return sql.begin(async (tx): Promise<Resultat> => {
    const [p] = await tx<{ usuari_id: string | null; creada_per: string | null }[]>`
      select p.usuari_id, e.creada_per
      from public.perfils p
      join public.entitats e on e.id = p.entitat_id
      where p.id = ${perfilId} and p.entitat_id = ${entitatId}
      for update of p
    `
    if (!p || p.usuari_id === null) return { ok: false, motiu: 'no_trobat' }
    if (p.usuari_id === userId) return { ok: false, motiu: 'es_meu' }
    if (p.usuari_id === p.creada_per) return { ok: false, motiu: 'es_creador' }

    await tx`update public.perfils set usuari_id = null where id = ${perfilId}`
    await tx`
      update public.invitacions
      set estat = 'rebutjada'
      where perfil_id = ${perfilId} and usuari_id = ${p.usuari_id} and estat = 'acceptada'
    `
    return { ok: true }
  })
}
