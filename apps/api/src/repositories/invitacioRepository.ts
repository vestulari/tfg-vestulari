import type { Sql } from '../lib/db'

export async function comptaPendents(sql: Sql, userId: string): Promise<number> {
  const [row] = await sql<{ n: number }[]>`
    select count(*)::int as n
    from public.invitacions
    where usuari_id = ${userId}
      and estat in ('rebuda', 'reenviada')
  `
  return row?.n ?? 0
}