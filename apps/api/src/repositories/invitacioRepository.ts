// Crides SQL a Invitació.

import type { InvitacioDetallDto, InvitacioResumDto } from '@tfg-vestulari/shared'
import type { Sql } from '../lib/db'

// Retorna el nombre d'invitacions pendents (rebudes o reenviades) de l'usuari
export async function comptaPendents(sql: Sql, userId: string): Promise<number> {
  const [row] = await sql<{ n: number }[]>`
    select count(*)::int as n
    from public.invitacions
    where usuari_id = ${userId}
      and estat in ('rebuda', 'reenviada')
  `
  return row?.n ?? 0
}

// Retorna la llista d'invitacions pendents (rebudes o reenviades) de l'usuari
export async function llistaPendents(sql: Sql, userId: string): Promise<InvitacioResumDto[]> {
  const rows = await sql<
    { id: number; entitat_id: number; entitat_nom: string; oberta: boolean }[]
  >`
    select i.id,
           i.entitat_id,
           e.nom as entitat_nom,
           (i.oberta_el is not null) as oberta
    from public.invitacions i
    join public.entitats e on e.id = i.entitat_id
    where i.usuari_id = ${userId}
      and i.estat in ('rebuda', 'reenviada')
    order by i.data desc
  `
  return rows.map((r) => ({
    id: r.id,
    entitatId: r.entitat_id,
    entitatNom: r.entitat_nom,
    oberta: r.oberta,
  }))
}

// Retorna el detall i la marca com a oberta (si no estava marcat ja)
export async function obre(
  sql: Sql,
  userId: string,
  id: number
): Promise<InvitacioDetallDto | null> {
  const [r] = await sql<
    { id: number; entitat_id: number; entitat_nom: string; entitat_descripcio: string | null }[]
  >`
    with i as (
      update public.invitacions
      set oberta_el = coalesce(oberta_el, now())
      where id = ${id}
        and usuari_id = ${userId}
        and estat in ('rebuda', 'reenviada')
      returning id, entitat_id
    )
    select i.id,
           i.entitat_id,
           e.nom as entitat_nom,
           e.descripcio as entitat_descripcio
    from i
    join public.entitats e on e.id = i.entitat_id
  `
  if (!r) return null
  return {
    id: r.id,
    entitatId: r.entitat_id,
    entitatNom: r.entitat_nom,
    oberta: true,
    entitatDescripcio: r.entitat_descripcio,
  }
}

// Tipus de rebuig d'una invitació [Errors]
export type MotiuRebuig =
  | 'no_trobada'
  | 'perfils_ambigus'
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
    const [inv] = await tx<{ entitat_id: number }[]>`
      select entitat_id
      from public.invitacions
      where id = ${id}
        and usuari_id = ${userId}
        and estat in ('rebuda', 'reenviada')
      for update
    `
    if (!inv) return { ok: false, motiu: 'no_trobada' }

    const perfils = await tx<{ perfil_id: number }[]>`
      select perfil_id from public.invitacio_perfils where invitacio_id = ${id}
    `
    if (perfils.length !== 1) return { ok: false, motiu: 'perfils_ambigus' }
    const perfilId = perfils[0].perfil_id

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
      and estat in ('rebuda', 'reenviada')
    returning id
  `
  return rows.length > 0
}