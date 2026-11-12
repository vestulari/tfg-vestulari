// API REST de la gestió d'invitacions.

import { Hono } from 'hono'
import type { Env } from '../types'
import * as invitacioRepo from '../repositories/invitacioRepository'

export const invitacions = new Hono<Env>()

// Llegeix un identificador d'invitació.
function llegeixId(valor: string): number | null {
  const n = Number(valor)
  return Number.isInteger(n) && n > 0 ? n : null
}

// Missatges d'error per a cada motiu de rebuig
const MISSATGES: Record<invitacioRepo.MotiuRebuig, string> = {
  no_trobada: "Aquesta invitació ja no està disponible.",
  ja_membre: "Ja formes part d'aquesta entitat.",
  perfil_no_disponible: "El perfil que t'ofereixen ja no està disponible.",
}

// Retorna la llista d'invitacions pendents (rebudes) de l'usuari
invitacions.get('/', async (c) => {
  const llista = await invitacioRepo.llistaPendents(c.get('sql'), c.get('userId'))
  return c.json(llista)
})

// Retorna el detall d'una invitació i la marca com a oberta (si no estava marcat ja)
invitacions.get('/:id', async (c) => {
  const id = llegeixId(c.req.param('id'))
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const invitacio = await invitacioRepo.obre(c.get('sql'), c.get('userId'), id)
  if (!invitacio) return c.json({ error: MISSATGES.no_trobada }, 404)
  return c.json(invitacio)
})

// Accepta una invitació.
invitacions.post('/:id/accepta', async (c) => {
  const id = llegeixId(c.req.param('id'))
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const r = await invitacioRepo.accepta(c.get('sql'), c.get('userId'), id)
  if (r.ok) return c.json({ entitatId: r.entitatId })
  return c.json({ error: MISSATGES[r.motiu] }, r.motiu === 'no_trobada' ? 404 : 409)
})

// Rebutja una invitació.
invitacions.post('/:id/rebutja', async (c) => {
  const id = llegeixId(c.req.param('id'))
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const fet = await invitacioRepo.rebutja(c.get('sql'), c.get('userId'), id)
  if (!fet) return c.json({ error: MISSATGES.no_trobada }, 404)
  return c.body(null, 204)
})