// API REST del vestuari d'una entitat: els tipus de peça (/entitats/:id/tipus-peca), les peces de roba
// (/entitats/:id/peces) i la paleta de colors (/entitats/:id/colors).
// Es munten dins d'entitats.ts, que ja ha comprovat que l'usuari és membre de l'entitat.
// Tot es pot mirar com a membre; crear, canviar i eliminar només ho poden fer els administradors.

import { Hono, type Context } from 'hono'
import {
  mateixNom,
  validaColors,
  validaPeca,
  validaTipusPeca,
  type PecaDetallDto,
  type PecaResumDto,
  type TipusPecaDadesDto,
} from '@tfg-vestulari/shared'
import type { Env } from '../types'
import { nomesAdmin } from '../middleware/entitat'
import { llegeixCos, llegeixId } from '../lib/params'
import * as imatges from '../lib/imatges'
import * as tipusPecaRepo from '../repositories/tipusPecaRepository'
import * as pecaRepo from '../repositories/pecaRepository'
import * as colorRepo from '../repositories/colorRepository'

export const tipusPeca = new Hono<Env>()
export const peces = new Hono<Env>()
export const colors = new Hono<Env>()

const NO_TROBAT = 'Aquest tipus de peça no existeix.'
const NOM_REPETIT = 'Ja hi ha un tipus de peça amb aquest nom.'
const PECA_NO_TROBADA = 'Aquesta peça no existeix.'

// ---------- Tipus de peça ----------

// Diu si un altre tipus de peça de l'entitat ja té aquest nom (sense mirar majúscules ni accents)
async function nomRepetit(c: Context<Env>, d: TipusPecaDadesDto, excepte?: number): Promise<boolean> {
  const tots = await tipusPecaRepo.llista(c.get('sql'), c.get('entitat').id)
  return tots.some((t) => t.id !== excepte && mateixNom(t.nom, d.nom))
}

// Llista dels tipus de peça
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

// Un tipus de peça amb els seus atributs
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
        { error: "No es pot eliminar perquè hi ha peces de roba d'aquest tipus. Primer s'han d'eliminar." },
        409
      )
})

// ---------- Peces de roba ----------

// Llegeix l'id de la peça de la URL. Si no és vàlid, retorna null.
const idPeca = (c: Context<Env>) => llegeixId(c.req.param('pecaId') ?? '')

// Torna a carregar la peça amb la URL de la foto, per respondre
async function detallAmbUrl(c: Context<Env>, id: number): Promise<PecaDetallDto | null> {
  const p = await pecaRepo.detall(c.get('sql'), c.get('entitat').id, id)
  return p && imatges.ambUrl<PecaDetallDto>(c.env, p)
}

// Valida el cos d'una peça amb els atributs del seu tipus i la paleta de l'entitat.
// Retorna les dades, o la resposta d'error. Si fix és un tipus, la peça no en pot canviar.
async function llegeixPeca(c: Context<Env>, fix?: number) {
  const cos = await llegeixCos(c)
  if (cos === undefined) return { ok: false as const, resposta: c.json({ error: 'Cos de la petició no vàlid' }, 400) }

  const tipusId = (cos as { tipusId?: unknown } | null)?.tipusId
  if (typeof tipusId !== 'number' || !Number.isInteger(tipusId)) {
    return { ok: false as const, resposta: c.json({ error: 'Cal triar el tipus de peça.' }, 400) }
  }
  if (fix !== undefined && tipusId !== fix) {
    return { ok: false as const, resposta: c.json({ error: "El tipus d'una peça no es pot canviar." }, 400) }
  }

  const sql = c.get('sql')
  const entitatId = c.get('entitat').id
  const [tipus, paleta] = await Promise.all([
    tipusPecaRepo.detall(sql, entitatId, tipusId),
    colorRepo.llista(sql, entitatId),
  ])
  if (!tipus) return { ok: false as const, resposta: c.json({ error: NO_TROBAT }, 400) }

  const r = validaPeca(cos, tipus.atributs, paleta)
  if (!r.ok) return { ok: false as const, resposta: c.json({ error: r.error }, 400) }
  return { ok: true as const, dades: r.dades }
}

// Llista de les peces de roba de l'inventari, amb la URL de la foto
peces.get('/', async (c) => {
  const llista = await pecaRepo.llista(c.get('sql'), c.get('entitat').id)
  return c.json(await Promise.all(llista.map((p) => imatges.ambUrl<PecaResumDto>(c.env, p))))
})

// Crea una peça nova (només administradors). La foto es puja després, amb PUT /:pecaId/imatge.
peces.post('/', nomesAdmin, async (c) => {
  const r = await llegeixPeca(c)
  if (!r.ok) return r.resposta

  const entitat = c.get('entitat')
  const id = await pecaRepo.crea(c.get('sql'), entitat.id, entitat.perfil.id, r.dades)
  return c.json({ id }, 201)
})

// Detall d'una peça
peces.get('/:pecaId', async (c) => {
  const id = idPeca(c)
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const peca = await detallAmbUrl(c, id)
  return peca ? c.json(peca) : c.json({ error: PECA_NO_TROBADA }, 404)
})

// Edita el nom, la descripció i els valors d'una peça (només administradors). Retorna la peça ja canviada.
peces.put('/:pecaId', nomesAdmin, async (c) => {
  const id = idPeca(c)
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const actual = await pecaRepo.detall(c.get('sql'), c.get('entitat').id, id)
  if (!actual) return c.json({ error: PECA_NO_TROBADA }, 404)

  const r = await llegeixPeca(c, actual.tipusId)
  if (!r.ok) return r.resposta

  if (!(await pecaRepo.edita(c.get('sql'), c.get('entitat').id, id, r.dades))) {
    return c.json({ error: PECA_NO_TROBADA }, 404)
  }
  return c.json(await detallAmbUrl(c, id))
})

// Elimina una peça i la seva foto (només administradors)
peces.delete('/:pecaId', nomesAdmin, async (c) => {
  const id = idPeca(c)
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const vella = await pecaRepo.elimina(c.get('sql'), c.get('entitat').id, id)
  if (vella === undefined) return c.json({ error: PECA_NO_TROBADA }, 404)
  await imatges.esborra(c.env, vella)
  return c.body(null, 204)
})

// Canvia la foto d'una peça (només administradors). El cos és un formulari (multipart/form-data)
// amb el fitxer al camp imatge. Es guarda dins de la carpeta de l'entitat. Retorna la peça ja canviada.
peces.put('/:pecaId/imatge', nomesAdmin, async (c) => {
  const id = idPeca(c)
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const cos = await imatges.llegeix(c, 'vestuari')
  if (!cos.ok) return cos.resposta

  const entitatId = c.get('entitat').id
  const pujada = await imatges.desa(c.env, 'vestuari', `entitats/${entitatId}/peces/${id}`, cos.fitxer)
  if (!pujada.ok) return c.json({ error: pujada.error }, 400)

  // Si no es pot guardar a la BD, la imatge que s'acaba de pujar sobra
  let r: Awaited<ReturnType<typeof pecaRepo.canviaImatge>>
  try {
    r = await pecaRepo.canviaImatge(c.get('sql'), entitatId, id, pujada.clau)
  } catch (e) {
    await imatges.esborra(c.env, pujada.clau)
    throw e
  }
  if (!r.ok) {
    await imatges.esborra(c.env, pujada.clau)
    return c.json({ error: PECA_NO_TROBADA }, 404)
  }
  await imatges.esborra(c.env, r.vella)
  return c.json(await detallAmbUrl(c, id))
})

// Treu la foto d'una peça (només administradors). Retorna la peça ja canviada.
peces.delete('/:pecaId/imatge', nomesAdmin, async (c) => {
  const id = idPeca(c)
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const r = await pecaRepo.canviaImatge(c.get('sql'), c.get('entitat').id, id, null)
  if (!r.ok) return c.json({ error: PECA_NO_TROBADA }, 404)
  await imatges.esborra(c.env, r.vella)
  return c.json(await detallAmbUrl(c, id))
})

// La foto de la peça mateixa (els bytes), per posar-la a la fitxa tècnica
peces.get('/:pecaId/imatge/fitxer', async (c) => {
  const id = idPeca(c)
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const peca = await pecaRepo.detall(c.get('sql'), c.get('entitat').id, id)
  if (!peca) return c.json({ error: PECA_NO_TROBADA }, 404)
  const r = await imatges.fitxer(c.env, peca.imatgeClau)
  return r ?? c.json({ error: 'Aquesta peça no té foto.' }, 404)
})

// ---------- Colors ----------

// La paleta de colors del vestuari
colors.get('/', async (c) => {
  return c.json(await colorRepo.llista(c.get('sql'), c.get('entitat').id))
})

// Desa la paleta sencera (només administradors). No es pot treure un color que faci servir alguna peça.
// Retorna la paleta ja desada.
colors.put('/', nomesAdmin, async (c) => {
  const cos = await llegeixCos(c)
  if (cos === undefined) return c.json({ error: 'Cos de la petició no vàlid' }, 400)

  const sql = c.get('sql')
  const entitatId = c.get('entitat').id
  const r = validaColors(cos, await colorRepo.llista(sql, entitatId))
  if (!r.ok) return c.json({ error: r.error }, 400)

  const desat = await colorRepo.desa(sql, entitatId, r.dades)
  if (!desat.ok) {
    const noms = desat.noms.map((n) => `«${n}»`).join(', ')
    return c.json({ error: `No es pot treure ${desat.noms.length === 1 ? 'el color' : 'els colors'} ${noms} perquè hi ha peces que els fan servir.` }, 409)
  }
  return c.json(await colorRepo.llista(sql, entitatId))
})
