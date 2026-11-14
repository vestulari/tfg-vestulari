// Crides SQL a la plantilla de perfil (els atributs que tenen tots els perfils d'una entitat).

import type { AtributDto, AtributPlantillaDto } from '@tfg-vestulari/shared'
import type { Sql } from '../lib/db'

// Retorna els atributs de la plantilla de l'entitat, per ordre de creació
export async function llista(sql: Sql, entitatId: number): Promise<AtributDto[]> {
  return sql<AtributDto[]>`
    select id, nom, tipus
    from public.definicions_atribut_perfil
    where entitat_id = ${entitatId}
    order by id
  `
}

// Desa la plantilla sencera en una transacció: esborra els atributs que ja no hi són (i els seus
// valors, en cascada), canvia el nom dels que es queden i crea els nous.
export function desa(sql: Sql, entitatId: number, atributs: AtributPlantillaDto[]): Promise<void> {
  return sql.begin(async (tx) => {
    const queden = atributs.filter((a) => a.id !== null).map((a) => a.id as number)

    await tx`
      delete from public.definicions_atribut_perfil
      where entitat_id = ${entitatId}
        and not (id = any(${queden}::int[]))
    `

    // Primer un nom temporal, perquè intercanviar dos noms no xoqui amb el unique (entitat_id, nom)
    if (queden.length > 0) {
      await tx`
        update public.definicions_atribut_perfil
        set nom = '__temp__' || id
        where entitat_id = ${entitatId} and id = any(${queden}::int[])
      `
    }

    for (const a of atributs) {
      if (a.id === null) {
        await tx`
          insert into public.definicions_atribut_perfil (entitat_id, nom, tipus)
          values (${entitatId}, ${a.nom}, ${a.tipus})
        `
      } else {
        await tx`
          update public.definicions_atribut_perfil
          set nom = ${a.nom}
          where id = ${a.id} and entitat_id = ${entitatId}
        `
      }
    }
  })
}
