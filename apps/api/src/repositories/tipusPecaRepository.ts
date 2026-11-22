// Crides SQL als tipus de peça (Camisa, Samarreta...) i als seus atributs.
// A la base de dades són les taules plantilles_roba i definicions_atribut_roba.

import type {
  AtributPecaDto,
  TipusPecaDadesDto,
  TipusPecaDto,
  TipusPecaResumDto,
} from '@tfg-vestulari/shared'
import type { TransactionSql } from 'postgres'
import type { Sql } from '../lib/db'

// Retorna els tipus de peça de l'entitat, per ordre alfabètic
export async function llista(sql: Sql, entitatId: number): Promise<TipusPecaResumDto[]> {
  return sql<TipusPecaResumDto[]>`
    select id, nom
    from public.plantilles_roba
    where entitat_id = ${entitatId}
    order by nom
  `
}

// Retorna un tipus de peça amb els seus atributs (per ordre de creació), o null si no és de l'entitat
export async function detall(sql: Sql, entitatId: number, id: number): Promise<TipusPecaDto | null> {
  const [tipus] = await sql<TipusPecaResumDto[]>`
    select id, nom
    from public.plantilles_roba
    where id = ${id} and entitat_id = ${entitatId}
  `
  if (!tipus) return null

  const atributs = await sql<AtributPecaDto[]>`
    select id, nom, tipus
    from public.definicions_atribut_roba
    where plantilla_id = ${id}
    order by id
  `
  return { ...tipus, atributs }
}

// Crea un tipus de peça amb els seus atributs, tot en una transacció. Retorna l'id nou.
export function crea(sql: Sql, entitatId: number, d: TipusPecaDadesDto): Promise<number> {
  return sql.begin((tx) => creaAmb(tx, entitatId, d))
}

// Crea el tipus i els atributs amb la connexió que li passen. La fa servir també la creació
// d'una entitat, per posar-hi els tipus inicials dins de la mateixa transacció.
export async function creaAmb(
  tx: TransactionSql,
  entitatId: number,
  d: { nom: string; atributs: { nom: string; tipus: AtributPecaDto['tipus'] }[] }
): Promise<number> {
  const [tipus] = await tx<{ id: number }[]>`
    insert into public.plantilles_roba (entitat_id, nom)
    values (${entitatId}, ${d.nom})
    returning id
  `
  for (const a of d.atributs) {
    await tx`
      insert into public.definicions_atribut_roba (plantilla_id, nom, tipus)
      values (${tipus.id}, ${a.nom}, ${a.tipus})
    `
  }
  return tipus.id
}

// Desa un tipus de peça sencer en una transacció: canvia el nom, esborra els atributs que ja no hi són
// (i els seus valors a les peces, en cascada), canvia el nom dels que es queden i crea els nous.
// Retorna false si el tipus no és de l'entitat.
export function desa(sql: Sql, entitatId: number, id: number, d: TipusPecaDadesDto): Promise<boolean> {
  return sql.begin(async (tx) => {
    const [tipus] = await tx`
      update public.plantilles_roba
      set nom = ${d.nom}
      where id = ${id} and entitat_id = ${entitatId}
      returning id
    `
    if (!tipus) return false

    const queden = d.atributs.filter((a) => a.id !== null).map((a) => a.id as number)
    await tx`
      delete from public.definicions_atribut_roba
      where plantilla_id = ${id}
        and not (id = any(${queden}::int[]))
    `

    // Primer un nom temporal, perquè intercanviar dos noms no xoqui amb el unique (plantilla_id, nom)
    if (queden.length > 0) {
      await tx`
        update public.definicions_atribut_roba
        set nom = '__temp__' || id
        where plantilla_id = ${id} and id = any(${queden}::int[])
      `
    }

    for (const a of d.atributs) {
      if (a.id === null) {
        await tx`
          insert into public.definicions_atribut_roba (plantilla_id, nom, tipus)
          values (${id}, ${a.nom}, ${a.tipus})
        `
      } else {
        await tx`
          update public.definicions_atribut_roba
          set nom = ${a.nom}
          where id = ${a.id} and plantilla_id = ${id}
        `
      }
    }
    return true
  })
}

// Motius pels quals no es pot eliminar un tipus de peça
export type MotiuEliminar = 'no_trobat' | 'te_peces'

// Elimina un tipus de peça i els seus atributs, si cap peça de roba el fa servir.
// El `for update` evita que algú hi afegeixi una peça mentre s'elimina.
export function elimina(
  sql: Sql,
  entitatId: number,
  id: number
): Promise<{ ok: true } | { ok: false; motiu: MotiuEliminar }> {
  return sql.begin(async (tx) => {
    const [tipus] = await tx`
      select id from public.plantilles_roba
      where id = ${id} and entitat_id = ${entitatId}
      for update
    `
    if (!tipus) return { ok: false, motiu: 'no_trobat' }

    const [peca] = await tx`select 1 from public.peces_roba where plantilla_id = ${id} limit 1`
    if (peca) return { ok: false, motiu: 'te_peces' }

    await tx`delete from public.plantilles_roba where id = ${id}`
    return { ok: true }
  })
}
