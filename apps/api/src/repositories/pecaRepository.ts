// Crides SQL a les peces de roba de l'inventari d'una entitat, amb els valors dels seus atributs.

import type { PecaDadesDto, PecaDetallDto, PecaResumDto } from '@tfg-vestulari/shared'
import type { Sql } from '../lib/db'
import type { AmbClau } from '../lib/imatges'

// Les peces surten de la BD amb la clau de la foto. La ruta la canvia per una URL temporal.
export type PecaResum = AmbClau<PecaResumDto>
export type PecaDetall = AmbClau<PecaDetallDto>

// Retorna totes les peces de roba de l'entitat, per ordre alfabètic
export async function llista(sql: Sql, entitatId: number): Promise<PecaResum[]> {
  const rows = await sql<{ id: number; nom: string; plantilla_id: number; imatge_clau: string | null }[]>`
    select id, nom, plantilla_id, imatge_clau
    from public.peces_roba
    where entitat_id = ${entitatId}
    order by nom
  `
  return rows.map((r) => ({ id: r.id, nom: r.nom, tipusId: r.plantilla_id, imatgeClau: r.imatge_clau }))
}

// Retorna una peça amb el seu tipus, el perfil que la va crear i els valors, o null si no és de l'entitat
export async function detall(sql: Sql, entitatId: number, id: number): Promise<PecaDetall | null> {
  const [r] = await sql<
    {
      id: number
      nom: string
      descripcio: string | null
      plantilla_id: number
      tipus_nom: string
      imatge_clau: string | null
      creada_per: string | null
    }[]
  >`
    select p.id, p.nom, p.descripcio, p.plantilla_id, t.nom as tipus_nom, p.imatge_clau,
           pf.nom as creada_per
    from public.peces_roba p
    join public.plantilles_roba t on t.id = p.plantilla_id
    left join public.perfils pf on pf.id = p.creada_per
    where p.id = ${id} and p.entitat_id = ${entitatId}
  `
  if (!r) return null

  const valors = await sql<{ atributId: number; valor: string }[]>`
    select definicio_id as "atributId", valor
    from public.valors_atribut_roba
    where peca_id = ${id}
  `
  return {
    id: r.id,
    nom: r.nom,
    descripcio: r.descripcio,
    tipusId: r.plantilla_id,
    tipusNom: r.tipus_nom,
    imatgeClau: r.imatge_clau,
    creadaPer: r.creada_per,
    valors,
  }
}

// Crea una peça amb els seus valors, tot en una transacció. creadaPer és el perfil (administrador)
// de qui la crea. Retorna l'id nou.
export function crea(sql: Sql, entitatId: number, creadaPer: number, d: PecaDadesDto): Promise<number> {
  return sql.begin(async (tx) => {
    const [peca] = await tx<{ id: number }[]>`
      insert into public.peces_roba (entitat_id, plantilla_id, nom, descripcio, creada_per)
      values (${entitatId}, ${d.tipusId}, ${d.nom}, ${d.descripcio === '' ? null : d.descripcio}, ${creadaPer})
      returning id
    `
    for (const v of d.valors) {
      await tx`
        insert into public.valors_atribut_roba (definicio_id, peca_id, valor)
        values (${v.atributId}, ${peca.id}, ${v.valor})
      `
    }
    return peca.id
  })
}

// Canvia el nom, la descripció i els valors d'una peça (el tipus no canvia mai).
// Els valors es tornen a escriure sencers. Retorna false si la peça no és de l'entitat.
export function edita(sql: Sql, entitatId: number, id: number, d: PecaDadesDto): Promise<boolean> {
  return sql.begin(async (tx) => {
    const [peca] = await tx`
      update public.peces_roba
      set nom = ${d.nom}, descripcio = ${d.descripcio === '' ? null : d.descripcio}
      where id = ${id} and entitat_id = ${entitatId}
      returning id
    `
    if (!peca) return false

    await tx`delete from public.valors_atribut_roba where peca_id = ${id}`
    for (const v of d.valors) {
      await tx`
        insert into public.valors_atribut_roba (definicio_id, peca_id, valor)
        values (${v.atributId}, ${id}, ${v.valor})
      `
    }
    return true
  })
}

// Esborra una peça (els valors s'esborren en cascada). Retorna la clau de la seva foto perquè la ruta
// l'esborri de l'R2, o undefined si la peça no és de l'entitat.
export async function elimina(sql: Sql, entitatId: number, id: number): Promise<string | null | undefined> {
  const [r] = await sql<{ imatge_clau: string | null }[]>`
    delete from public.peces_roba
    where id = ${id} and entitat_id = ${entitatId}
    returning imatge_clau
  `
  return r ? r.imatge_clau : undefined
}

// Posa una foto nova a la peça (o cap, amb null) i retorna la clau de la que tenia, perquè la ruta
// l'esborri de l'R2. El `for update` evita que dos canvis alhora es trepitgin.
export function canviaImatge(
  sql: Sql,
  entitatId: number,
  id: number,
  clau: string | null
): Promise<{ ok: true; vella: string | null } | { ok: false }> {
  return sql.begin(async (tx) => {
    const [peca] = await tx<{ imatge_clau: string | null }[]>`
      select imatge_clau from public.peces_roba
      where id = ${id} and entitat_id = ${entitatId}
      for update
    `
    if (!peca) return { ok: false }
    await tx`update public.peces_roba set imatge_clau = ${clau} where id = ${id}`
    return { ok: true, vella: peca.imatge_clau }
  })
}
