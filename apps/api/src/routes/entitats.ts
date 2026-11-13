// API REST de la gestió d'entitats.

import { Hono, type Context } from 'hono'
import {
  validaEntitatEditada,
  validaEntitatNova,
  type EntitatCreadaDto,
} from '@tfg-vestulari/shared'
import type { Env } from '../types'
import { auth } from '../middleware/auth'
import { bd } from '../middleware/bd'
import { llegeixId } from '../lib/params'
import * as entitatRepo from '../repositories/entitatRepository'

export const entitats = new Hono<Env>()

// Totes les rutes d'entitats necessiten l'usuari autenticat i la connexió a la BD
entitats.use('*', auth, bd)

// Llegeix el cos JSON de la petició. Retorna undefined si no és JSON.
async function llegeixCos(c: Context<Env>): Promise<unknown> {
  try {
    return await c.req.json()
  } catch {
    return undefined
  }
}

const NO_TROBADA = "Aquesta entitat no existeix o no hi tens accés."

// Crea una entitat nova, amb la plantilla de perfil i el perfil del creador.
entitats.post('/', async (c) => {
  const cos = await llegeixCos(c)
  if (cos === undefined) return c.json({ error: 'Cos de la petició no vàlid' }, 400)

  const r = validaEntitatNova(cos)
  if (!r.ok) return c.json({ error: r.error }, 400)

  const id = await entitatRepo.crea(c.get('sql'), c.get('userId'), r.dades)
  const resposta: EntitatCreadaDto = { id }
  return c.json(resposta, 201)
})

// Retorna una entitat, amb el perfil que hi té l'usuari i els seus permisos.
// Si l'usuari no n'és membre, respon 404, com si l'entitat no existís.
entitats.get('/:id', async (c) => {
  const id = llegeixId(c.req.param('id'))
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const entitat = await entitatRepo.detallPerUsuari(c.get('sql'), c.get('userId'), id)
  if (!entitat) return c.json({ error: NO_TROBADA }, 404)
  return c.json(entitat)
})

// Canvia el nom, la descripció i la data de l'entitat. Només ho poden fer els administradors.
// Retorna l'entitat ja canviada.
entitats.patch('/:id', async (c) => {
  const id = llegeixId(c.req.param('id'))
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const cos = await llegeixCos(c)
  if (cos === undefined) return c.json({ error: 'Cos de la petició no vàlid' }, 400)

  const sql = c.get('sql')
  const userId = c.get('userId')
  const entitat = await entitatRepo.detallPerUsuari(sql, userId, id)
  if (!entitat) return c.json({ error: NO_TROBADA }, 404)
  if (!entitat.perfil.esAdministrador) {
    return c.json({ error: "Només els administradors poden canviar les dades de l'entitat." }, 403)
  }

  const r = validaEntitatEditada(cos)
  if (!r.ok) return c.json({ error: r.error }, 400)

  await entitatRepo.edita(sql, id, r.dades)
  return c.json(await entitatRepo.detallPerUsuari(sql, userId, id))
})

// Elimina l'entitat i tot el que hi ha a dins. Només ho pot fer el creador.
entitats.delete('/:id', async (c) => {
  const id = llegeixId(c.req.param('id'))
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const sql = c.get('sql')
  const entitat = await entitatRepo.detallPerUsuari(sql, c.get('userId'), id)
  if (!entitat) return c.json({ error: NO_TROBADA }, 404)
  if (!entitat.perfil.esCreador) {
    return c.json({ error: "Només el creador pot eliminar l'entitat." }, 403)
  }

  await entitatRepo.elimina(sql, id)
  return c.body(null, 204)
})

// Retorna els altres administradors de l'entitat, a qui el creador pot passar el rol.
entitats.get('/:id/administradors', async (c) => {
  const id = llegeixId(c.req.param('id'))
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const sql = c.get('sql')
  const userId = c.get('userId')
  const entitat = await entitatRepo.detallPerUsuari(sql, userId, id)
  if (!entitat) return c.json({ error: NO_TROBADA }, 404)
  if (!entitat.perfil.esCreador) {
    return c.json({ error: 'Només el creador pot passar el rol de creador.' }, 403)
  }

  return c.json(await entitatRepo.altresAdministradors(sql, userId, id))
})

// Passa el rol de creador a un altre administrador. El cos és { perfilId }.
entitats.post('/:id/creador', async (c) => {
  const id = llegeixId(c.req.param('id'))
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const cos = await llegeixCos(c)
  const perfilId = (cos as { perfilId?: unknown } | undefined)?.perfilId
  if (typeof perfilId !== 'number' || !Number.isInteger(perfilId)) {
    return c.json({ error: 'Cal triar a qui vols passar el rol.' }, 400)
  }

  const sql = c.get('sql')
  const userId = c.get('userId')
  const entitat = await entitatRepo.detallPerUsuari(sql, userId, id)
  if (!entitat) return c.json({ error: NO_TROBADA }, 404)

  const r = await entitatRepo.passaCreador(sql, userId, id, perfilId)
  if (!r.ok) {
    return r.motiu === 'no_creador'
      ? c.json({ error: 'Només el creador pot passar el rol de creador.' }, 403)
      : c.json({ error: "El rol només es pot passar a un altre administrador de l'entitat." }, 400)
  }
  return c.body(null, 204)
})

// Desvincula l'usuari de l'entitat. El creador no en pot sortir.
entitats.post('/:id/sortir', async (c) => {
  const id = llegeixId(c.req.param('id'))
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const r = await entitatRepo.surt(c.get('sql'), c.get('userId'), id)
  if (!r.ok) {
    return r.motiu === 'es_creador'
      ? c.json(
          { error: "Com a creador no pots sortir de l'entitat. Primer passa el rol a un altre administrador." },
          409
        )
      : c.json({ error: NO_TROBADA }, 404)
  }
  return c.body(null, 204)
})
