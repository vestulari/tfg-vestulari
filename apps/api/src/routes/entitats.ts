// API REST de la gestió d'entitats.

import { Hono, type Context } from 'hono'
import {
  validaEntitatEditada,
  validaEntitatNova,
  validaPlantilla,
  type EntitatCreadaDto,
  type EntitatDetallDto,
} from '@tfg-vestulari/shared'
import type { Env } from '../types'
import { auth } from '../middleware/auth'
import { bd } from '../middleware/bd'
import { membre, nomesAdmin } from '../middleware/entitat'
import { llegeixCos } from '../lib/params'
import * as imatges from '../lib/imatges'
import { fabricaEntitat } from '../factories/entitatFactory'
import * as entitatRepo from '../repositories/entitatRepository'
import * as plantillaRepo from '../repositories/plantillaRepository'
import { perfils } from './perfils'
import { colors, peces, tipusPeca } from './vestuari'

export const entitats = new Hono<Env>()

// Totes les rutes d'entitats necessiten l'usuari autenticat i la connexió a la BD.
// Les de /:id, a més, que l'usuari sigui membre de l'entitat (el middleware deixa l'entitat a c.get('entitat')).
// A Hono, '/:id/*' també inclou la mateixa '/:id'.
entitats.use('*', auth, bd)
entitats.use('/:id/*', membre)
entitats.route('/:id/perfils', perfils)
entitats.route('/:id/tipus-peca', tipusPeca)
entitats.route('/:id/peces', peces)
entitats.route('/:id/colors', colors)

// Crea una entitat nova, amb la plantilla de perfil, el perfil del creador i els tipus de peça inicials.
// Si porta imatge (formulari multipart), es puja en la mateixa crida. Si la imatge falla, l'entitat ja
// està creada i la resposta porta un avís.
entitats.post('/', async (c) => {
  const cos = await imatges.llegeixAmbImatge(c, 'entitat')
  if (!cos.ok) return cos.resposta

  const r = validaEntitatNova(cos.dades)
  if (!r.ok) return c.json({ error: r.error }, 400)

  const sql = c.get('sql')
  const id = await entitatRepo.crea(sql, c.get('userId'), fabricaEntitat(r.dades))
  const avis = await imatges.aplicaCanvi(c.env, 'entitat', `entitats/${id}`, cos.canvi, (clau) =>
    entitatRepo.canviaImatge(sql, id, clau)
  )
  const resposta: EntitatCreadaDto = avis ? { id, avis } : { id }
  return c.json(resposta, 201)
})

// Retorna una entitat, amb el perfil que hi té l'usuari i els seus permisos.
// Si l'usuari no n'és membre, el middleware ja ha respost 404, com si l'entitat no existís.
entitats.get('/:id', async (c) => c.json(await imatges.ambUrl<EntitatDetallDto>(c.env, c.get('entitat'))))

// Canvia el nom, la descripció i la data de l'entitat i, si cal, la imatge (posar-ne una de nova o treure-la),
// tot en una sola crida. Només ho poden fer els administradors. Retorna l'entitat ja canviada,
// amb un avís si les dades s'han desat però la imatge no.
entitats.patch('/:id', nomesAdmin, async (c) => {
  const cos = await imatges.llegeixAmbImatge(c, 'entitat')
  if (!cos.ok) return cos.resposta

  const r = validaEntitatEditada(cos.dades)
  if (!r.ok) return c.json({ error: r.error }, 400)

  const sql = c.get('sql')
  const id = c.get('entitat').id
  await entitatRepo.edita(sql, id, r.dades)
  const avis = await imatges.aplicaCanvi(c.env, 'entitat', `entitats/${id}`, cos.canvi, (clau) =>
    entitatRepo.canviaImatge(sql, id, clau)
  )
  const entitat = await detallAmbUrl(c, id)
  return c.json(avis ? { ...entitat, avis } : entitat)
})

// Torna a carregar l'entitat (amb la URL de la imatge) després de canviar-la
async function detallAmbUrl(c: Context<Env>, id: number): Promise<EntitatDetallDto | null> {
  const e = await entitatRepo.detallPerUsuari(c.get('sql'), c.get('userId'), id)
  return e && imatges.ambUrl<EntitatDetallDto>(c.env, e)
}

// La imatge de l'entitat mateixa (els bytes), per posar-la a la fitxa tècnica de les peces. La veuen tots els membres.
entitats.get('/:id/imatge/fitxer', async (c) => {
  const r = await imatges.fitxer(c.env, c.get('entitat').imatgeClau)
  return r ?? c.json({ error: "L'entitat no té imatge." }, 404)
})

// Elimina l'entitat i tot el que hi ha a dins, imatges incloses. Només ho pot fer el creador.
entitats.delete('/:id', async (c) => {
  const entitat = c.get('entitat')
  if (!entitat.perfil.esCreador) {
    return c.json({ error: "Només el creador pot eliminar l'entitat." }, 403)
  }

  await entitatRepo.elimina(c.get('sql'), entitat.id)
  await imatges.esborraCarpeta(c.env, `entitats/${entitat.id}`)
  return c.body(null, 204)
})

// Retorna els altres administradors de l'entitat, a qui el creador pot passar el rol.
entitats.get('/:id/administradors', async (c) => {
  const entitat = c.get('entitat')
  if (!entitat.perfil.esCreador) {
    return c.json({ error: 'Només el creador pot passar el rol de creador.' }, 403)
  }

  return c.json(await entitatRepo.altresAdministradors(c.get('sql'), c.get('userId'), entitat.id))
})

// Passa el rol de creador a un altre administrador. El cos és { perfilId }.
entitats.post('/:id/creador', async (c) => {
  const cos = await llegeixCos(c)
  const perfilId = (cos as { perfilId?: unknown } | undefined)?.perfilId
  if (typeof perfilId !== 'number' || !Number.isInteger(perfilId)) {
    return c.json({ error: 'Cal triar a qui vols passar el rol.' }, 400)
  }

  const r = await entitatRepo.passaCreador(c.get('sql'), c.get('userId'), c.get('entitat').id, perfilId)
  if (!r.ok) {
    return r.motiu === 'no_creador'
      ? c.json({ error: 'Només el creador pot passar el rol de creador.' }, 403)
      : c.json({ error: "El rol només es pot passar a un altre administrador de l'entitat." }, 400)
  }
  return c.body(null, 204)
})

// Desvincula l'usuari de l'entitat. El creador no en pot sortir.
entitats.post('/:id/sortir', async (c) => {
  const r = await entitatRepo.surt(c.get('sql'), c.get('userId'), c.get('entitat').id)
  if (!r.ok) {
    return r.motiu === 'es_creador'
      ? c.json(
          { error: "Com a creador no pots sortir de l'entitat. Primer passa el rol a un altre administrador." },
          409
        )
      : c.json({ error: 'Aquesta entitat no existeix o no hi tens accés.' }, 404)
  }
  return c.body(null, 204)
})

// Retorna els atributs de la plantilla de perfil. La poden veure tots els membres.
entitats.get('/:id/plantilla', async (c) => {
  return c.json(await plantillaRepo.llista(c.get('sql'), c.get('entitat').id))
})

// Desa la plantilla sencera (només administradors). Els atributs que falten s'esborren amb els seus
// valors, els que tenen id canvien de nom i els nous es creen. Retorna la plantilla ja desada.
entitats.put('/:id/plantilla', nomesAdmin, async (c) => {
  const cos = await llegeixCos(c)
  if (cos === undefined) return c.json({ error: 'Cos de la petició no vàlid' }, 400)

  const sql = c.get('sql')
  const id = c.get('entitat').id
  const r = validaPlantilla(cos, await plantillaRepo.llista(sql, id))
  if (!r.ok) return c.json({ error: r.error }, 400)

  await plantillaRepo.desa(sql, id, r.dades)
  return c.json(await plantillaRepo.llista(sql, id))
})
