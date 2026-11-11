import { Hono } from 'hono'
import { validaEntitatNova, type EntitatCreadaDto } from '@tfg-vestulari/shared'
import type { Env } from '../types'
import { auth } from '../middleware/auth'
import { bd } from '../middleware/bd'
import * as entitatRepo from '../repositories/entitatRepository'

export const entitats = new Hono<Env>()

entitats.use('*', auth, bd)

entitats.post('/', async (c) => {
  let cos: unknown
  try {
    cos = await c.req.json()
  } catch {
    return c.json({ error: 'Cos de la petició no vàlid' }, 400)
  }

  // Un dia de marge perquè la zona horària del servidor no rebutgi «avui» a algú que ja és demà
  const marge = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const r = validaEntitatNova(cos, marge)
  if (!r.ok) return c.json({ error: r.error }, 400)

  const id = await entitatRepo.crea(c.get('sql'), c.get('userId'), r.dades)
  const resposta: EntitatCreadaDto = { id }
  return c.json(resposta, 201)
})