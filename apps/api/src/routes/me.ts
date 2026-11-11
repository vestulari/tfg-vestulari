// Crides API REST a /me. Crida base de tot el que estigui relacionat amb l'usuari autenticat.

import { Hono } from 'hono'
import type { UsuariDto } from '@tfg-vestulari/shared'
import type { Env } from '../types'
import { auth } from '../middleware/auth'
import { bd } from '../middleware/bd'
import * as usuariRepo from '../repositories/usuariRepository'
import * as entitatRepo from '../repositories/entitatRepository'
import * as invitacioRepo from '../repositories/invitacioRepository'
import { invitacions } from './invitacions'

export const me = new Hono<Env>()

// Afegeix el middleware d'autenticació i de base de dades.
// Aqui s'especifiquen totes les rutes que neixen de /me
me.use('*', auth, bd)
me.route('/invitacions', invitacions)

// Retorna les dades de l'usuari autenticat i el nombre d'invitacions pendents
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

// Retorna la llista d'entitats a les que l'usuari té algun perfil assignat
me.get('/entitats', async (c) => {
  const entitats = await entitatRepo.llistaPerUsuari(c.get('sql'), c.get('userId'))
  return c.json(entitats)
})
