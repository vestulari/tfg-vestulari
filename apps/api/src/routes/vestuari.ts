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

// Llista dels tipus de peça, cadascun amb els seus atributs.
// Així el frontend en té prou amb una crida per a tot el vestuari, i no n'ha de demanar cap detall.
tipusPeca.get('/', async (c) => {
  return c.json(await tipusPecaRepo.llistaAmbAtributs(c.get('sql'), c.get('entitat').id))
})

// Crea un tipus de peça nou (només administradors). Retorna el tipus ja creat, amb els atributs.
tipusPeca.post('/', nomesAdmin, async (c) => {
  const cos = await llegeixCos(c)
  if (cos === undefined) return c.json({ error: 'Cos de la petició no vàlid' }, 400)

  const r = validaTipusPeca(cos, [])
  if (!r.ok) return c.json({ error: r.error }, 400)
  if (await nomRepetit(c, r.dades)) return c.json({ error: NOM_REPETIT }, 409)

  const id = await tipusPecaRepo.crea(c.get('sql'), c.get('entitat').id, r.dades)
  return c.json(await tipusPecaRepo.detall(c.get('sql'), c.get('entitat').id, id), 201)
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

// Valida les dades d'una peça (ja llegides del cos) amb els atributs del seu tipus i la paleta de l'entitat.
// Retorna les dades, o la resposta d'error. Si fix és un tipus, la peça no en pot canviar.
async function validaDadesPeca(c: Context<Env>, cos: unknown, fix?: number) {
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

// Posa la foto nova a una peça (o la treu, amb null) i retorna la clau de la que tenia
async function guardaClauPeca(c: Context<Env>, id: number, clau: string | null): Promise<string | null> {
  const r = await pecaRepo.canviaImatge(c.get('sql'), c.get('entitat').id, id, clau)
  return r.ok ? r.vella : null
}

// Respon amb la peça desada i, si la foto no s'ha pogut pujar, amb l'avís
async function respostaPeca(c: Context<Env>, id: number, avis: string | null, estat: 200 | 201) {
  const peca = await detallAmbUrl(c, id)
  return c.json(avis ? { ...peca, avis } : peca, estat)
}

// Crea una peça nova (només administradors). Si porta foto (formulari multipart), es puja en la mateixa crida,
// dins de la carpeta de l'entitat. Retorna la peça ja creada, amb un avís si la foto no s'ha pogut pujar.
peces.post('/', nomesAdmin, async (c) => {
  const cos = await imatges.llegeixAmbImatge(c, 'vestuari')
  if (!cos.ok) return cos.resposta
  const r = await validaDadesPeca(c, cos.dades)
  if (!r.ok) return r.resposta

  const entitat = c.get('entitat')
  const id = await pecaRepo.crea(c.get('sql'), entitat.id, entitat.perfil.id, r.dades)
  const avis = await imatges.aplicaCanvi(c.env, 'vestuari', `entitats/${entitat.id}/peces/${id}`, cos.canvi, (clau) =>
    guardaClauPeca(c, id, clau)
  )
  return respostaPeca(c, id, avis, 201)
})

// Detall d'una peça
peces.get('/:pecaId', async (c) => {
  const id = idPeca(c)
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const peca = await detallAmbUrl(c, id)
  return peca ? c.json(peca) : c.json({ error: PECA_NO_TROBADA }, 404)
})

// Edita el nom, la descripció i els valors d'una peça i, si cal, la foto (posar-ne una de nova o treure-la),
// tot en una sola crida (només administradors). Retorna la peça ja canviada, amb un avís si la foto no s'ha pogut pujar.
peces.put('/:pecaId', nomesAdmin, async (c) => {
  const id = idPeca(c)
  if (id === null) return c.json({ error: 'Identificador no vàlid' }, 400)

  const entitatId = c.get('entitat').id
  const actual = await pecaRepo.detall(c.get('sql'), entitatId, id)
  if (!actual) return c.json({ error: PECA_NO_TROBADA }, 404)

  const cos = await imatges.llegeixAmbImatge(c, 'vestuari')
  if (!cos.ok) return cos.resposta
  const r = await validaDadesPeca(c, cos.dades, actual.tipusId)
  if (!r.ok) return r.resposta

  if (!(await pecaRepo.edita(c.get('sql'), entitatId, id, r.dades))) {
    return c.json({ error: PECA_NO_TROBADA }, 404)
  }
  const avis = await imatges.aplicaCanvi(c.env, 'vestuari', `entitats/${entitatId}/peces/${id}`, cos.canvi, (clau) =>
    guardaClauPeca(c, id, clau)
  )
  return respostaPeca(c, id, avis, 200)
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
