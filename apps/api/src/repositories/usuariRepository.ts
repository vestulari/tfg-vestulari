// Crides SQL a Usuari.

import type { Sql } from '../lib/db'

// Retorna l'usuari amb el nom, l'identificador i la clau de la seva foto
export async function troba(sql: Sql, userId: string) {
  const [row] = await sql<{ id: string; nom: string; imatge_clau: string | null }[]>`
    select id, nom, imatge_clau from public.usuaris where id = ${userId}
  `
  return row
}

// Posa una foto nova a l'usuari (o cap, amb null) i retorna la clau de la que tenia,
// perquè la ruta l'esborri de l'R2. El `for update` evita que dos canvis alhora es trepitgin.
export function canviaImatge(sql: Sql, userId: string, clau: string | null): Promise<string | null> {
  return sql.begin(async (tx) => {
    const [vella] = await tx<{ imatge_clau: string | null }[]>`
      select imatge_clau from public.usuaris where id = ${userId} for update
    `
    await tx`update public.usuaris set imatge_clau = ${clau} where id = ${userId}`
    return vella?.imatge_clau ?? null
  })
}

// Canvia el nom de l'usuari. Retorna false si l'usuari no existeix.
export async function canviaNom(sql: Sql, userId: string, nom: string): Promise<boolean> {
  const rows = await sql`
    update public.usuaris set nom = ${nom} where id = ${userId} returning id
  `
  return rows.length > 0
}
