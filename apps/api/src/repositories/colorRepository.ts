// Crides SQL a la paleta de colors del vestuari d'una entitat (taula colors_vestuari).
// Els atributs de tipus color de les peces guarden l'id del color com a text.

import type { ColorDadesDto, ColorDto } from '@tfg-vestulari/shared'
import type { Sql } from '../lib/db'

// Retorna els colors de l'entitat, per ordre de creació
export async function llista(sql: Sql, entitatId: number): Promise<ColorDto[]> {
  return sql<ColorDto[]>`
    select id, nom, trim(hex) as hex
    from public.colors_vestuari
    where entitat_id = ${entitatId}
    order by id
  `
}

// Desa la paleta sencera en una transacció: esborra els colors que ja no hi són, canvia els que es
// queden i crea els nous. Si algun dels que s'esborren el fa servir alguna peça, no es desa res i
// retorna els seus noms.
export function desa(
  sql: Sql,
  entitatId: number,
  colors: ColorDadesDto[]
): Promise<{ ok: true } | { ok: false; motiu: 'en_us'; noms: string[] }> {
  return sql.begin(async (tx) => {
    const queden = colors.filter((c) => c.id !== null).map((c) => c.id as number)

    // Els colors que s'esborrarien i que alguna peça de l'entitat fa servir
    const enUs = await tx<{ nom: string }[]>`
      select distinct c.nom
      from public.colors_vestuari c
      join public.valors_atribut_roba v on v.valor = c.id::text
      join public.definicions_atribut_roba d on d.id = v.definicio_id and d.tipus = 'color'
      join public.peces_roba p on p.id = v.peca_id and p.entitat_id = ${entitatId}
      where c.entitat_id = ${entitatId}
        and not (c.id = any(${queden}::int[]))
      order by c.nom
    `
    if (enUs.length > 0) return { ok: false, motiu: 'en_us', noms: enUs.map((c) => c.nom) }

    await tx`
      delete from public.colors_vestuari
      where entitat_id = ${entitatId}
        and not (id = any(${queden}::int[]))
    `

    // Primer un nom temporal, perquè intercanviar dos noms no xoqui amb el unique (entitat_id, nom)
    if (queden.length > 0) {
      await tx`
        update public.colors_vestuari
        set nom = '__temp__' || id
        where entitat_id = ${entitatId} and id = any(${queden}::int[])
      `
    }

    for (const c of colors) {
      if (c.id === null) {
        await tx`
          insert into public.colors_vestuari (entitat_id, nom, hex)
          values (${entitatId}, ${c.nom}, ${c.hex})
        `
      } else {
        await tx`
          update public.colors_vestuari
          set nom = ${c.nom}, hex = ${c.hex}
          where id = ${c.id} and entitat_id = ${entitatId}
        `
      }
    }
    return { ok: true }
  })
}
