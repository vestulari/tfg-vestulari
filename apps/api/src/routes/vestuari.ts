// API REST del vestuari d'una entitat: els tipus de peça (/entitats/:id/tipus-peca)
// i les peces de roba (/entitats/:id/peces).
// Es munten dins d'entitats.ts, que ja ha comprovat que l'usuari és membre de l'entitat.

import { Hono, type Context } from 'hono'
import { mateixNom, validaTipusPeca, type TipusPecaDadesDto } from '@tfg-vestulari/shared'
import type { Env } from '../types'
import { nomesAdmin } from '../middleware/entitat'
import { llegeixCos, llegeixId } from '../lib/params'
import * as tipusPecaRepo from '../repositories/tipusPecaRepository'
import * as pecaRepo from '../repositories/pecaRepository'

export const tipusPeca = new Hono<Env>()
export const peces = new Hono<Env>()

const NO_TROBAT = 'Aquest tipus de peça no existeix.'
const NOM_REPETIT = 'Ja hi ha un tipus de peça amb aquest nom.'

// Diu si un altre tipus de peça de l'entitat ja té aquest nom (sense mirar majúscules ni accents)
async function nomRepetit(c: Context<Env>, d: TipusPecaDadesDto, excepte?: number): Promise<boolean> {
  const tots = await tipusPecaRepo.llista(c.get('sql'), c.get('entitat').id)
  return tots.some((t) => t.id !== excepte && mateixNom(t.nom, d.nom))
}

// Llista dels tipus de peça. La poden veure tots els membres.
tipusPeca.get('/', async (c) => {
  return c.json(await tipusPecaRepo.llista(c.get('sql'), c.get('entitat').id))
})

// Crea un tipus de peça nou (només administradors)
tipusPeca.post('/', nomesAdmin, async (c) => {
  const cos = await llegeixCos(c)
  if (cos === undefined) return c.json({ error: 'Cos de la petició no vàlid' }, 400)

  const r = validaTipusPeca(cos, [])
  if (!r.ok) return c.json({ error: r.error }, 400)
  if (await nomRepetit(c, r.dades)) return c.json({ error: NOM_REPETIT }, 409)

  const id = await tipusPecaRepo.crea(c.get('sql'), c.get('entitat').id, r.dades)
  return c.json({ id }, 201)
})

// Un tipus de peça amb els seus atributs. El poden veure tots els membres.
tipusPeca.get('/:tipusId', async (c) => {
  const tipusId = llegeixId(c.req.param('tipusId'))
  if (tipusId === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const tipus = await tipusPecaRepo.detall(c.get('sql'), c.get('entitat').id, tipusId)
  if (!tipus) return c.json({ error: NO_TROBAT }, 404)
  return c.json(tipus)
})

// Desa un tipus de peça sencer (només administradors). Els atributs que falten s'esborren amb els seus
// valors, els que tenen id canvien de nom i els nous es creen. Retorna el tipus ja desat.
tipusPeca.put('/:tipusId', nomesAdmin, async (c) => {
  const tipusId = llegeixId(c.req.param('tipusId'))
  if (tipusId === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const cos = await llegeixCos(c)
  if (cos === undefined) return c.json({ error: 'Cos de la petició no vàlid' }, 400)

  const sql = c.get('sql')
  const entitatId = c.get('entitat').id
  const actual = await tipusPecaRepo.detall(sql, entitatId, tipusId)
  if (!actual) return c.json({ error: NO_TROBAT }, 404)

  const r = validaTipusPeca(cos, actual.atributs)
  if (!r.ok) return c.json({ error: r.error }, 400)
  if (await nomRepetit(c, r.dades, tipusId)) return c.json({ error: NOM_REPETIT }, 409)

  if (!(await tipusPecaRepo.desa(sql, entitatId, tipusId, r.dades))) {
    return c.json({ error: NO_TROBAT }, 404)
  }
  return c.json(await tipusPecaRepo.detall(sql, entitatId, tipusId))
})

// Elimina un tipus de peça (només administradors). No es pot si alguna peça de roba és d'aquest tipus.
tipusPeca.delete('/:tipusId', nomesAdmin, async (c) => {
  const tipusId = llegeixId(c.req.param('tipusId'))
  if (tipusId === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const r = await tipusPecaRepo.elimina(c.get('sql'), c.get('entitat').id, tipusId)
  if (r.ok) return c.body(null, 204)
  return r.motiu === 'no_trobat'
    ? c.json({ error: NO_TROBAT }, 404)
    : c.json(
        { error: "No es pot eliminar perquè hi ha peces de roba d'aquest tipus. Primer s'han d'eliminar o canviar-les de tipus." },
        409
      )
})

// Llista de les peces de roba de l'inventari. La poden veure tots els membres.
peces.get('/', async (c) => {
  return c.json(await pecaRepo.llista(c.get('sql'), c.get('entitat').id))
})
