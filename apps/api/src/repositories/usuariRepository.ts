// Crides SQL a Usuari.

import type { Sql } from '../lib/db'

// Retorna l'usuari amb el nom i l'identificador
export async function troba(sql: Sql, userId: string) {
  const [row] = await sql<{ id: string; nom: string }[]>`
    select id, nom from public.usuaris where id = ${userId}
  `
  return row
}
