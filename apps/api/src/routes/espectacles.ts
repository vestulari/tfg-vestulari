// API REST dels espectacles d'una entitat (/entitats/:id/espectacles), amb les seves escenes.
// Es munta dins d'entitats.ts, que ja ha comprovat que l'usuari és membre de l'entitat.
// Tothom els pot mirar; crear, desar i eliminar només ho poden fer els administradors.

import { Hono, type Context } from 'hono'
import { validaEspectacle } from '@tfg-vestulari/shared'
import type { Env } from '../types'
import { nomesAdmin } from '../middleware/entitat'
import { llegeixCos, llegeixId } from '../lib/params'
import * as espectacleRepo from '../repositories/espectacleRepository'

export const espectacles = new Hono<Env>()

const NO_TROBAT = 'Aquest espectacle no existeix.'

// Llegeix l'id de l'espectacle de la URL. Si no és vàlid, retorna null.
const idEspectacle = (c: Context<Env>) => llegeixId(c.req.param('espectacleId') ?? '')

// Llista dels espectacles de l'entitat (amb l'any d'estrena)
espectacles.get('/', async (c) => {
  return c.json(await espectacleRepo.llista(c.get('sql'), c.get('entitat').id))
})

// Crea un espectacle amb les seves escenes (només administradors). Retorna l'espectacle ja creat.
espectacles.post('/', nomesAdmin, async (c) => {
  const cos = await llegeixCos(c)
  if (cos === undefined) return c.json({ error: 'Cos de la petició no vàlid' }, 400)

  const r = validaEspectacle(cos, [])
  if (!r.ok) return c.json({ error: r.error }, 400)

  const sql = c.get('sql')
  const entitatId = c.get('entitat').id
  const id = await espectacleRepo.crea(sql, entitatId, r.dades)
  return c.json(await espectacleRepo.detall(sql, entitatId, id), 201)
})

// Detall d'un espectacle: les dades, les escenes (en ordre) i les actuacions
espectacles.get('/:espectacleId', async (c) => {
  const id = idEspectacle(c)
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const espectacle = await espectacleRepo.detall(c.get('sql'), c.get('entitat').id, id)
  return espectacle ? c.json(espectacle) : c.json({ error: NO_TROBAT }, 404)
})

// Desa un espectacle sencer amb les escenes (només administradors). Les escenes que falten s'esborren
// amb el que tenien a les actuacions, les que tenen id canvien de nom i d'ordre, i les noves es creen.
// Retorna l'espectacle ja desat.
espectacles.put('/:espectacleId', nomesAdmin, async (c) => {
  const id = idEspectacle(c)
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const cos = await llegeixCos(c)
  if (cos === undefined) return c.json({ error: 'Cos de la petició no vàlid' }, 400)

  const sql = c.get('sql')
  const entitatId = c.get('entitat').id
  const actual = await espectacleRepo.detall(sql, entitatId, id)
  if (!actual) return c.json({ error: NO_TROBAT }, 404)

  const r = validaEspectacle(cos, actual.escenes)
  if (!r.ok) return c.json({ error: r.error }, 400)

  if (!(await espectacleRepo.desa(sql, entitatId, id, r.dades))) return c.json({ error: NO_TROBAT }, 404)
  return c.json(await espectacleRepo.detall(sql, entitatId, id))
})

// Elimina un espectacle, amb les escenes i les actuacions (només administradors)
espectacles.delete('/:espectacleId', nomesAdmin, async (c) => {
  const id = idEspectacle(c)
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const fet = await espectacleRepo.elimina(c.get('sql'), c.get('entitat').id, id)
  return fet ? c.body(null, 204) : c.json({ error: NO_TROBAT }, 404)
})
