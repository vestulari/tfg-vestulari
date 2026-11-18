// Crides SQL a les peces de roba de l'inventari d'una entitat.

import type { PecaResumDto } from '@tfg-vestulari/shared'
import type { Sql } from '../lib/db'

// Retorna totes les peces de roba de l'entitat, per ordre alfabètic
export async function llista(sql: Sql, entitatId: number): Promise<PecaResumDto[]> {
  const rows = await sql<{ id: number; nom: string; plantilla_id: number }[]>`
    select id, nom, plantilla_id
    from public.peces_roba
    where entitat_id = ${entitatId}
    order by nom
  `
  return rows.map((r) => ({ id: r.id, nom: r.nom, tipusId: r.plantilla_id }))
}
