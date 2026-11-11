// Crides SQL a Entitat.
import type { EntitatNovaDto, EntitatResumDto } from '@tfg-vestulari/shared'
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