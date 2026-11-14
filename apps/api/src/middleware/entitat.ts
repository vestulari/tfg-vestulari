// Middlewares de les rutes d'una entitat (/entitats/:id/...).
// Miren que l'usuari en sigui membre i, si cal, administrador.

import { createMiddleware } from 'hono/factory'
import type { Env } from '../types'
import { llegeixId } from '../lib/params'
import * as entitatRepo from '../repositories/entitatRepository'

export const NO_TROBADA = 'Aquesta entitat no existeix o no hi tens accés.'

// Carrega l'entitat amb el perfil i els permisos de l'usuari, i la deixa a c.get('entitat').
// Si l'usuari no n'és membre, respon 404, com si l'entitat no existís.
export const membre = createMiddleware<Env>(async (c, next) => {
  const id = llegeixId(c.req.param('id') ?? '')
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const entitat = await entitatRepo.detallPerUsuari(c.get('sql'), c.get('userId'), id)
  if (!entitat) return c.json({ error: NO_TROBADA }, 404)

  c.set('entitat', entitat)
  await next()
})

// Deixa passar només els administradors de l'entitat. S'ha de posar després de membre.
export const nomesAdmin = createMiddleware<Env>(async (c, next) => {
  if (!c.get('entitat').perfil.esAdministrador) {
    return c.json({ error: "Només els administradors de l'entitat poden fer això." }, 403)
  }
  await next()
})
