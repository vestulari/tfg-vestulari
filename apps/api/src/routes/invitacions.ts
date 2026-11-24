// API REST de la gestió d'invitacions.

import { Hono, type Context } from 'hono'
import type { InvitacioRespostaDto } from '@tfg-vestulari/shared'
import type { Env } from '../types'
import { llegeixId } from '../lib/params'
import { urlImatge } from '../lib/imatges'
import * as invitacioRepo from '../repositories/invitacioRepository'

export const invitacions = new Hono<Env>()

// Missatges d'error per a cada motiu de rebuig
const MISSATGES: Record<invitacioRepo.MotiuRebuig, string> = {
  no_trobada: "Aquesta invitació ja no està disponible.",
  ja_membre: "Ja formes part d'aquesta entitat.",
  perfil_no_disponible: "El perfil que t'ofereixen ja no està disponible.",
}

// Canvia la clau de la imatge de l'entitat per una URL temporal.
// El convidat pot veure la imatge de l'entitat que el convida, encara que no en sigui membre.
async function ambUrl<T extends { entitatImatgeClau: string | null }>(c: Context<Env>, inv: T) {
  const { entitatImatgeClau, ...resta } = inv
  return { ...resta, entitatImatgeUrl: await urlImatge(c.env, entitatImatgeClau) }
}

// Retorna la llista d'invitacions pendents (rebudes) de l'usuari
invitacions.get('/', async (c) => {
  const llista = await invitacioRepo.llistaPendents(c.get('sql'), c.get('userId'))
  return c.json(await Promise.all(llista.map((i) => ambUrl(c, i))))
})

// Retorna el detall d'una invitació i la marca com a oberta (si no estava marcat ja)
invitacions.get('/:id', async (c) => {
  const id = llegeixId(c.req.param('id'))
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const invitacio = await invitacioRepo.obre(c.get('sql'), c.get('userId'), id)
  if (!invitacio) return c.json({ error: MISSATGES.no_trobada }, 404)
  return c.json(await ambUrl(c, invitacio))
})

// Accepta una invitació. Retorna l'entitat on s'ha entrat i quantes invitacions queden pendents,
// perquè el frontend actualitzi el comptador sense haver de tornar a demanar l'usuari.
invitacions.post('/:id/accepta', async (c) => {
  const id = llegeixId(c.req.param('id'))
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const r = await invitacioRepo.accepta(c.get('sql'), c.get('userId'), id)
  if (r.ok) {
    const resposta: InvitacioRespostaDto = {
      entitatId: r.entitatId,
      invitacionsPendents: await invitacioRepo.comptaPendents(c.get('sql'), c.get('userId')),
    }
    return c.json(resposta)
  }
  return c.json({ error: MISSATGES[r.motiu] }, r.motiu === 'no_trobada' ? 404 : 409)
})

// Rebutja una invitació. Retorna quantes invitacions queden pendents (per al comptador).
invitacions.post('/:id/rebutja', async (c) => {
  const id = llegeixId(c.req.param('id'))
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const fet = await invitacioRepo.rebutja(c.get('sql'), c.get('userId'), id)
  if (!fet) return c.json({ error: MISSATGES.no_trobada }, 404)
  const resposta: InvitacioRespostaDto = {
    invitacionsPendents: await invitacioRepo.comptaPendents(c.get('sql'), c.get('userId')),
  }
  return c.json(resposta)
})