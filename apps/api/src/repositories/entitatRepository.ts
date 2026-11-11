// Crides SQL a Entitat.

import type { EntitatResumDto } from '@tfg-vestulari/shared'
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
