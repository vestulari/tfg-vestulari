// Crides SQL als espectacles d'una entitat i a les seves escenes (i, de moment, només llegir-ne les actuacions).

import type {
  ActuacioResumDto,
  EscenaDto,
  EspectacleDadesDto,
  EspectacleDetallDto,
  EspectacleResumDto,
} from '@tfg-vestulari/shared'
import type { TransactionSql } from 'postgres'
import type { Sql } from '../lib/db'

// Retorna els espectacles de l'entitat, per ordre d'estrena (i pel nom, si s'estrenen el mateix any)
export async function llista(sql: Sql, entitatId: number): Promise<EspectacleResumDto[]> {
  const rows = await sql<{ id: number; nom: string; any_estrena: number }[]>`
    select id, nom, any_estrena
    from public.espectacles
    where entitat_id = ${entitatId}
    order by any_estrena, mes_estrena nulls first, dia_estrena nulls first, nom
  `
  return rows.map((r) => ({ id: r.id, nom: r.nom, anyEstrena: r.any_estrena }))
}

// Retorna un espectacle amb les escenes (en ordre) i les actuacions (per data), o null si no és de l'entitat
export async function detall(sql: Sql, entitatId: number, id: number): Promise<EspectacleDetallDto | null> {
  const [e] = await sql<
    {
      id: number
      nom: string
      descripcio: string | null
      any_estrena: number
      mes_estrena: number | null
      dia_estrena: number | null
    }[]
  >`
    select id, nom, descripcio, any_estrena, mes_estrena, dia_estrena
    from public.espectacles
    where id = ${id} and entitat_id = ${entitatId}
  `
  if (!e) return null

  const [escenes, actuacions] = await Promise.all([
    sql<EscenaDto[]>`
      select id, nom from public.escenes where espectacle_id = ${id} order by ordre
    `,
    sql<ActuacioResumDto[]>`
      select id, nom, to_char(data, 'YYYY-MM-DD') as data
      from public.actuacions
      where espectacle_id = ${id}
      order by data nulls last, id
    `,
  ])

  return {
    id: e.id,
    nom: e.nom,
    descripcio: e.descripcio,
    anyEstrena: e.any_estrena,
    mesEstrena: e.mes_estrena,
    diaEstrena: e.dia_estrena,
    escenes: [...escenes],
    actuacions: [...actuacions],
  }
}

// Crea una escena nova a l'espectacle, a la posició que li toca (ordre)
async function creaEscena(tx: TransactionSql<{}>, espectacleId: number, nom: string, ordre: number) {
  await tx`
    insert into public.escenes (espectacle_id, nom, ordre)
    values (${espectacleId}, ${nom}, ${ordre})
  `
}

// Crea un espectacle amb les seves escenes, tot en una transacció. Retorna l'id nou.
export function crea(sql: Sql, entitatId: number, d: EspectacleDadesDto): Promise<number> {
  return sql.begin(async (tx) => {
    const [e] = await tx<{ id: number }[]>`
      insert into public.espectacles (entitat_id, nom, descripcio, any_estrena, mes_estrena, dia_estrena)
      values (${entitatId}, ${d.nom}, ${d.descripcio === '' ? null : d.descripcio},
              ${d.anyEstrena}, ${d.mesEstrena}, ${d.diaEstrena})
      returning id
    `
    for (const [i, escena] of d.escenes.entries()) await creaEscena(tx, e.id, escena.nom, i + 1)
    return e.id
  })
}

// Desa un espectacle sencer en una transacció. Les escenes que ja no hi són s'esborren (i, en cascada,
// el que tenien a les actuacions); les que hi són només canvien de nom i d'ordre; les noves es creen.
// Retorna false si l'espectacle no és de l'entitat.
export function desa(sql: Sql, entitatId: number, id: number, d: EspectacleDadesDto): Promise<boolean> {
  return sql.begin(async (tx) => {
    const [e] = await tx`
      select 1 from public.espectacles where id = ${id} and entitat_id = ${entitatId} for update
    `
    if (!e) return false

    await tx`
      update public.espectacles
      set nom = ${d.nom},
          descripcio = ${d.descripcio === '' ? null : d.descripcio},
          any_estrena = ${d.anyEstrena},
          mes_estrena = ${d.mesEstrena},
          dia_estrena = ${d.diaEstrena}
      where id = ${id}
    `

    const queden = d.escenes.filter((x) => x.id !== null).map((x) => x.id as number)
    await tx`
      delete from public.escenes
      where espectacle_id = ${id} and not (id = any(${queden}::int[]))
    `

    for (const [i, escena] of d.escenes.entries()) {
      if (escena.id === null) {
        await creaEscena(tx, id, escena.nom, i + 1)
      } else {
        await tx`
          update public.escenes
          set nom = ${escena.nom}, ordre = ${i + 1}
          where id = ${escena.id} and espectacle_id = ${id}
        `
      }
    }
    return true
  })
}

// Elimina un espectacle (amb les escenes i les actuacions, en cascada). Retorna false si no és de l'entitat.
export async function elimina(sql: Sql, entitatId: number, id: number): Promise<boolean> {
  const rows = await sql`
    delete from public.espectacles where id = ${id} and entitat_id = ${entitatId} returning id
  `
  return rows.length > 0
}
