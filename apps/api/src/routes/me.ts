import { Hono } from 'hono'
import type { UsuariDto } from '@tfg-vestulari/shared'
import type { Env } from '../types'
import { auth } from '../middleware/auth'
import { bd } from '../middleware/bd'
import * as usuariRepo from '../repositories/usuariRepository'
import * as entitatRepo from '../repositories/entitatRepository'
import * as invitacioRepo from '../repositories/invitacioRepository'

export const me = new Hono<Env>()

me.use('*', auth, bd)

me.get('/', async (c) => {
  const sql = c.get('sql')
  const userId = c.get('userId')

  const [usuari, pendents] = await Promise.all([
    usuariRepo.troba(sql, userId),
    invitacioRepo.comptaPendents(sql, userId),
  ])
  if (!usuari) return c.json({ error: 'Usuari no trobat' }, 404)

  const dto: UsuariDto = {
    id: userId,
    nom: usuari.nom,
    email: c.get('email'),
    invitacionsPendents: pendents,
  }
  return c.json(dto)
})

me.get('/entitats', async (c) => {
  const entitats = await entitatRepo.llistaPerUsuari(c.get('sql'), c.get('userId'))
  return c.json(entitats)
})
