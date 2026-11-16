// Crides SQL a Invitació.

import type { InvitacioDetallDto, InvitacioResumDto } from '@tfg-vestulari/shared'
import type { Sql } from '../lib/db'

// Les invitacions surten de la BD amb la clau de la imatge de l'entitat, i la ruta la canvia per una URL.
type AmbClauEntitat<T> = Omit<T, 'entitatImatgeUrl'> & { entitatImatgeClau: string | null }
export type InvitacioResum = AmbClauEntitat<InvitacioResumDto>
export type InvitacioDetall = AmbClauEntitat<InvitacioDetallDto>

// Retorna el nombre d'invitacions pendents (rebudes) de l'usuari
export async function comptaPendents(sql: Sql, userId: string): Promise<number> {
  const [row] = await sql<{ n: number }[]>`
    select count(*)::int as n
    from public.invitacions
    where usuari_id = ${userId}
      and estat = 'rebuda'
  `
  return row?.n ?? 0
}

// Retorna la llista d'invitacions pendents (rebudes) de l'usuari
export async function llistaPendents(sql: Sql, userId: string): Promise<InvitacioResum[]> {
  const rows = await sql<
    {
      id: number
      entitat_id: number
      entitat_nom: string
      entitat_imatge_clau: string | null
      oberta: boolean
    }[]
  >`
    select i.id,
           i.entitat_id,
           e.nom as entitat_nom,
           e.imatge_clau as entitat_imatge_clau,
           (i.oberta_el is not null) as oberta
    from public.invitacions i
    join public.entitats e on e.id = i.entitat_id
    where i.usuari_id = ${userId}
      and i.estat = 'rebuda'
    order by i.data desc
  `
  return rows.map((r) => ({
    id: r.id,
    entitatId: r.entitat_id,
    entitatNom: r.entitat_nom,
    entitatImatgeClau: r.entitat_imatge_clau,
    oberta: r.oberta,
  }))
}

// Retorna el detall i la marca com a oberta (si no estava marcat ja)
export async function obre(
  sql: Sql,
  userId: string,
  id: number
): Promise<InvitacioDetall | null> {
  const [r] = await sql<
    {
      id: number
      entitat_id: number
      entitat_nom: string
      entitat_imatge_clau: string | null
      entitat_descripcio: string | null
    }[]
  >`
    with i as (
      update public.invitacions
      set oberta_el = coalesce(oberta_el, now())
      where id = ${id}
        and usuari_id = ${userId}
        and estat = 'rebuda'
      returning id, entitat_id
    )
    select i.id,
           i.entitat_id,
           e.nom as entitat_nom,
           e.imatge_clau as entitat_imatge_clau,
           e.descripcio as entitat_descripcio
    from i
    join public.entitats e on e.id = i.entitat_id
  `
  if (!r) return null
  return {
    id: r.id,
    entitatId: r.entitat_id,
    entitatNom: r.entitat_nom,
    entitatImatgeClau: r.entitat_imatge_clau,
    oberta: true,
    entitatDescripcio: r.entitat_descripcio,
  }
}

// Tipus de rebuig d'una invitació [Errors]
export type MotiuRebuig =
  | 'no_trobada'
  | 'ja_membre'
  | 'perfil_no_disponible'

// Resultat d'acceptar una invitació
export type ResultatAcceptar =
  | { ok: true; entitatId: number }
  | { ok: false; motiu: MotiuRebuig }

// Tot dins d'una transacció: al invitar, es fan moltes coses!
// Es marca com a acceptada, es vincula el perfil a l'usuari, i es comprova que no sigui ja membre.
export function accepta(sql: Sql, userId: string, id: number): Promise<ResultatAcceptar> {
  return sql.begin(async (tx): Promise<ResultatAcceptar> => {
    // `for update` bloqueja la invitació perquè no s'accepti dues vegades alhora
    const [inv] = await tx<{ entitat_id: number; perfil_id: number }[]>`
      select entitat_id, perfil_id
      from public.invitacions
      where id = ${id}
        and usuari_id = ${userId}
        and estat = 'rebuda'
      for update
    `
    if (!inv) return { ok: false, motiu: 'no_trobada' }
    const perfilId = inv.perfil_id

    const jaMembre = await tx`
      select 1 from public.perfils
      where entitat_id = ${inv.entitat_id} and usuari_id = ${userId}
    `
    if (jaMembre.length > 0) return { ok: false, motiu: 'ja_membre' }

    const vinculats = await tx`
      update public.perfils
      set usuari_id = ${userId}
      where id = ${perfilId}
        and entitat_id = ${inv.entitat_id}
        and usuari_id is null
      returning id
    `
    if (vinculats.length === 0) return { ok: false, motiu: 'perfil_no_disponible' }

    await tx`
      update public.invitacions
      set estat = 'acceptada', oberta_el = coalesce(oberta_el, now())
      where id = ${id}
    `
    return { ok: true, entitatId: inv.entitat_id }
  })
}

// Marca com a rebutjada una invitació.
export async function rebutja(sql: Sql, userId: string, id: number): Promise<boolean> {
  const rows = await sql`
    update public.invitacions
    set estat = 'rebutjada', oberta_el = coalesce(oberta_el, now())
    where id = ${id}
      and usuari_id = ${userId}
      and estat = 'rebuda'
    returning id
  `
  return rows.length > 0
}