// Crides API REST a /me. Crida base de tot el que estigui relacionat amb l'usuari autenticat.

import { Hono, type Context } from 'hono'
import { errorNom, type EntitatResumDto, type UsuariDto } from '@tfg-vestulari/shared'
import type { Env } from '../types'
import { auth } from '../middleware/auth'
import { bd } from '../middleware/bd'
import { invitacions } from './invitacions'
import * as imatges from '../lib/imatges'
import * as usuariRepo from '../repositories/usuariRepository'
import * as entitatRepo from '../repositories/entitatRepository'
import * as invitacioRepo from '../repositories/invitacioRepository'

export const me = new Hono<Env>()

// Afegeix el middleware d'autenticació i de base de dades.
// Aqui s'especifiquen totes les rutes que neixen de /me
me.use('*', auth, bd)
me.route('/invitacions', invitacions)

// Junta les dades de l'usuari (amb la URL de la seva foto) i el nombre d'invitacions pendents
async function carregaUsuari(c: Context<Env>): Promise<UsuariDto | null> {
  const sql = c.get('sql')
  const userId = c.get('userId')

  const [usuari, pendents] = await Promise.all([
    usuariRepo.troba(sql, userId),
    invitacioRepo.comptaPendents(sql, userId),
  ])
  if (!usuari) return null

  return {
    id: userId,
    nom: usuari.nom,
    imatgeUrl: await imatges.urlImatge(c.env, usuari.imatge_clau),
    email: c.get('email'),
    invitacionsPendents: pendents,
  }
}

// Retorna les dades de l'usuari autenticat i el nombre d'invitacions pendents
me.get('/', async (c) => {
  const dto = await carregaUsuari(c)
  if (!dto) return c.json({ error: 'Usuari no trobat' }, 404)
  return c.json(dto)
})

// Només es pot canviar el nom d'un mateix: l'identificador ve del token, no del cos.
me.patch('/', async (c) => {
  let cos: unknown
  try {
    cos = await c.req.json()
  } catch {
    return c.json({ error: 'Cos de la petició no vàlid' }, 400)
  }

  const nom = (cos as { nom?: unknown } | null)?.nom
  if (typeof nom !== 'string') return c.json({ error: 'Falta el nom' }, 400)

  const error = errorNom(nom)
  if (error) return c.json({ error }, 400)

  const fet = await usuariRepo.canviaNom(c.get('sql'), c.get('userId'), nom)
  if (!fet) return c.json({ error: 'Usuari no trobat' }, 404)

  const dto = await carregaUsuari(c)
  if (!dto) return c.json({ error: 'Usuari no trobat' }, 404)
  return c.json(dto)
})

// Canvia la foto de l'usuari. El cos és un formulari (multipart/form-data) amb el fitxer al camp imatge.
// Retorna l'usuari ja canviat.
me.put('/imatge', async (c) => {
  const cos = await imatges.llegeix(c, 'usuari')
  if (!cos.ok) return cos.resposta

  const userId = c.get('userId')
  const r = await imatges.desa(c.env, 'usuari', `usuaris/${userId}`, cos.fitxer)
  if (!r.ok) return c.json({ error: r.error }, 400)

  // Si no es pot guardar a la BD, la foto que s'acaba de pujar sobra
  let vella: string | null
  try {
    vella = await usuariRepo.canviaImatge(c.get('sql'), userId, r.clau)
  } catch (e) {
    await imatges.esborra(c.env, r.clau)
    throw e
  }
  await imatges.esborra(c.env, vella)

  const dto = await carregaUsuari(c)
  if (!dto) return c.json({ error: 'Usuari no trobat' }, 404)
  return c.json(dto)
})

// Treu la foto de l'usuari (es tornarà a veure la inicial). Retorna l'usuari ja canviat.
me.delete('/imatge', async (c) => {
  const vella = await usuariRepo.canviaImatge(c.get('sql'), c.get('userId'), null)
  await imatges.esborra(c.env, vella)

  const dto = await carregaUsuari(c)
  if (!dto) return c.json({ error: 'Usuari no trobat' }, 404)
  return c.json(dto)
})

// Retorna la llista d'entitats a les que l'usuari té algun perfil assignat, amb les URL de les imatges
me.get('/entitats', async (c) => {
  const entitats = await entitatRepo.llistaPerUsuari(c.get('sql'), c.get('userId'))
  return c.json(await Promise.all(entitats.map((e) => imatges.ambUrl<EntitatResumDto>(c.env, e))))
})

