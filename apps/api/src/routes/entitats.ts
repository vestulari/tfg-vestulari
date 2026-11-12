// API REST de la gestió d'entitats.

import { Hono } from 'hono'
import { validaEntitatNova, type EntitatCreadaDto } from '@tfg-vestulari/shared'
import type { Env } from '../types'
import { auth } from '../middleware/auth'
import { bd } from '../middleware/bd'
import * as entitatRepo from '../repositories/entitatRepository'

export const entitats = new Hono<Env>()

// Totes les rutes d'entitats necessiten l'usuari autenticat i la connexió a la BD
entitats.use('*', auth, bd)

// Crea una entitat nova, amb la plantilla de perfil i el perfil del creador.
entitats.post('/', async (c) => {
  let cos: unknown
  try {
    cos = await c.req.json()
  } catch {
    return c.json({ error: 'Cos de la petició no vàlid' }, 400)
  }

  const r = validaEntitatNova(cos)
  if (!r.ok) return c.json({ error: r.error }, 400)

  const id = await entitatRepo.crea(c.get('sql'), c.get('userId'), r.dades)
  const resposta: EntitatCreadaDto = { id }
  return c.json(resposta, 201)
})