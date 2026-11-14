// API REST dels perfils d'una entitat (/entitats/:id/perfils).
// Es munta dins d'entitats.ts, que ja ha comprovat que l'usuari és membre de l'entitat.

import { Hono } from 'hono'
import { errorCorreu, validaPerfil, type ComparticioDto } from '@tfg-vestulari/shared'
import type { Env } from '../types'
import { nomesAdmin } from '../middleware/entitat'
import { llegeixCos, llegeixId } from '../lib/params'
import * as perfilRepo from '../repositories/perfilRepository'
import * as plantillaRepo from '../repositories/plantillaRepository'

export const perfils = new Hono<Env>()

// Missatges d'error per a cada motiu
const MISSATGES: Record<perfilRepo.MotiuPerfil, string> = {
  no_trobat: 'Aquest perfil no existeix.',
  creador_admin: "Al perfil del creador no se li pot treure el rol d'administrador.",
  ja_compartit: 'Aquest perfil ja està compartit amb un usuari.',
  perfil_amb_invitacio: 'Aquest perfil ja té una invitació pendent. Cancel·la-la abans d\'enviar-ne una altra.',
  ja_membre: "Aquest usuari ja forma part de l'entitat.",
  ja_convidat: "Aquest usuari ja té una invitació pendent d'aquesta entitat.",
  es_creador: 'No es pot descompartir el perfil del creador.',
  es_meu: "No pots descompartir el teu propi perfil. Per sortir de l'entitat, ves a Configuració.",
}

// Llista de tots els perfils de l'entitat (només administradors)
perfils.get('/', nomesAdmin, async (c) => {
  return c.json(await perfilRepo.llista(c.get('sql'), c.get('entitat').id))
})

// Crea un perfil nou, encara sense usuari (només administradors)
perfils.post('/', nomesAdmin, async (c) => {
  const cos = await llegeixCos(c)
  if (cos === undefined) return c.json({ error: 'Cos de la petició no vàlid' }, 400)

  const sql = c.get('sql')
  const entitatId = c.get('entitat').id
  const r = validaPerfil(cos, await plantillaRepo.llista(sql, entitatId))
  if (!r.ok) return c.json({ error: r.error }, 400)

  const id = await perfilRepo.crea(sql, entitatId, r.dades)
  return c.json({ id }, 201)
})

// Detall d'un perfil. Els administradors poden veure'ls tots; la resta, només el seu.
perfils.get('/:perfilId', async (c) => {
  const perfilId = llegeixId(c.req.param('perfilId'))
  if (perfilId === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const entitat = c.get('entitat')
  const esAdmin = entitat.perfil.esAdministrador
  if (!esAdmin && perfilId !== entitat.perfil.id) {
    return c.json({ error: MISSATGES.no_trobat }, 404)
  }

  const perfil = await perfilRepo.detall(c.get('sql'), c.get('userId'), entitat.id, perfilId)
  if (!perfil) return c.json({ error: MISSATGES.no_trobat }, 404)
  // Les invitacions només les gestionen els administradors
  return c.json(esAdmin ? perfil : { ...perfil, invitacio: null })
})

// Edita un perfil (només administradors)
perfils.put('/:perfilId', nomesAdmin, async (c) => {
  const perfilId = llegeixId(c.req.param('perfilId'))
  if (perfilId === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const cos = await llegeixCos(c)
  if (cos === undefined) return c.json({ error: 'Cos de la petició no vàlid' }, 400)

  const sql = c.get('sql')
  const entitatId = c.get('entitat').id
  const r = validaPerfil(cos, await plantillaRepo.llista(sql, entitatId))
  if (!r.ok) return c.json({ error: r.error }, 400)

  const res = await perfilRepo.edita(sql, entitatId, perfilId, r.dades)
  if (!res.ok) return c.json({ error: MISSATGES[res.motiu] }, res.motiu === 'no_trobat' ? 404 : 409)
  return c.body(null, 204)
})

// Comparteix un perfil: envia una invitació al correu que diuen (només administradors).
// Si el correu no té compte a Vestulari, no s'envia res i es diu a la resposta.
perfils.post('/:perfilId/invitacio', nomesAdmin, async (c) => {
  const perfilId = llegeixId(c.req.param('perfilId'))
  if (perfilId === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const email = (await llegeixCos(c) as { email?: unknown } | undefined)?.email
  if (typeof email !== 'string') return c.json({ error: 'Cal escriure un correu.' }, 400)
  const errEmail = errorCorreu(email)
  if (errEmail) return c.json({ error: errEmail }, 400)

  const r = await perfilRepo.comparteix(c.get('sql'), c.get('entitat').id, perfilId, email.trim())
  if (r.ok) {
    const resposta: ComparticioDto = { enviada: true, missatge: `S'ha enviat la invitació a ${email.trim()}.` }
    return c.json(resposta, 201)
  }
  if (r.motiu === 'sense_compte') {
    const resposta: ComparticioDto = {
      enviada: false,
      missatge: 'Aquest correu no té cap compte a Vestulari, així que no s\'ha enviat cap invitació.',
    }
    return c.json(resposta)
  }
  return c.json({ error: MISSATGES[r.motiu] }, r.motiu === 'no_trobat' ? 404 : 409)
})

// Cancel·la la invitació pendent d'un perfil (només administradors)
perfils.delete('/:perfilId/invitacio', nomesAdmin, async (c) => {
  const perfilId = llegeixId(c.req.param('perfilId'))
  if (perfilId === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const fet = await perfilRepo.cancelaInvitacio(c.get('sql'), c.get('entitat').id, perfilId)
  if (!fet) return c.json({ error: 'Aquest perfil no té cap invitació pendent.' }, 404)
  return c.body(null, 204)
})

// Descomparteix un perfil: li treu l'usuari (només administradors)
perfils.delete('/:perfilId/usuari', nomesAdmin, async (c) => {
  const perfilId = llegeixId(c.req.param('perfilId'))
  if (perfilId === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const r = await perfilRepo.descomparteix(c.get('sql'), c.get('userId'), c.get('entitat').id, perfilId)
  if (!r.ok) return c.json({ error: MISSATGES[r.motiu] }, r.motiu === 'no_trobat' ? 404 : 409)
  return c.body(null, 204)
})
