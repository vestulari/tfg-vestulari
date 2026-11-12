// Crides SQL a Usuari.

import type { Sql } from '../lib/db'

// Retorna l'usuari amb el nom i l'identificador
export async function troba(sql: Sql, userId: string) {
  const [row] = await sql<{ id: string; nom: string }[]>`
    select id, nom from public.usuaris where id = ${userId}
  `
  return row
}

// Canvia el nom de l'usuari. Retorna false si l'usuari no existeix.
export async function canviaNom(sql: Sql, userId: string, nom: string): Promise<boolean> {
  const rows = await sql`
    update public.usuaris set nom = ${nom} where id = ${userId} returning id
  `
  return rows.length > 0
}
