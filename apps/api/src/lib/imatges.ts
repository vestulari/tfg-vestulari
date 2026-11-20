// Imatges guardades a Cloudflare R2.
// Les imatges són privades: es pugen i s'esborren des de l'API (amb el binding IMATGES), i per veure-les
// l'API genera URL temporals signades, amb les quals el navegador les baixa directament de l'R2.

import type { Context } from 'hono'
import { AwsClient } from 'aws4fetch'
import { IMATGE_PERFILS, errorImatge, type TipusImatge } from '@tfg-vestulari/shared'
import type { Bindings, Env } from '../types'

// Les URL es signen amb l'hora arrodonida a l'hora en punt i valen 2 hores. Així, durant una hora,
// la mateixa imatge sempre té la mateixa URL i el navegador la pot reaprofitar de la memòria cau.
// Sempre queda almenys una hora de marge abans no caduqui.
const VALIDESA_SEGONS = 2 * 60 * 60

// Un objecte de la BD amb la clau de la imatge en lloc de la URL (com el retornen els repositoris)
export type AmbClau<T extends { imatgeUrl: string | null }> = Omit<T, 'imatgeUrl'> & {
  imatgeClau: string | null
}

// Retorna la URL temporal per veure una imatge, o null si no n'hi ha
export async function urlImatge(env: Bindings, clau: string | null): Promise<string | null> {
  if (!clau) return null

  const client = new AwsClient({
    accessKeyId: env.R2_ACCESS_KEY,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    service: 's3',
    region: 'auto',
  })

  const url = new URL(`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}/${clau}`)
  url.searchParams.set('X-Amz-Expires', String(VALIDESA_SEGONS))

  const hora = new Date()
  hora.setUTCMinutes(0, 0, 0)
  // Format que demana la signatura: 20261115T120000Z
  const datetime = hora.toISOString().replace(/[:-]|\.\d{3}/g, '')

  const signada = await client.sign(new Request(url), { aws: { signQuery: true, datetime } })
  return signada.url
}

// Canvia la clau de la imatge per la seva URL temporal, per retornar l'objecte al frontend
export async function ambUrl<T extends { imatgeUrl: string | null }>(
  env: Bindings,
  obj: AmbClau<T>
): Promise<T> {
  const { imatgeClau, ...resta } = obj
  return { ...resta, imatgeUrl: await urlImatge(env, imatgeClau) } as unknown as T
}

// Mira els primers bytes del fitxer per saber de quin tipus és de debò.
// Retorna el tipus (image/jpeg, image/png o image/webp), o null si no és cap dels acceptats.
async function tipusReal(fitxer: Blob): Promise<string | null> {
  const b = new Uint8Array(await fitxer.slice(0, 12).arrayBuffer())
  const ascii = (inici: number, fi: number) => String.fromCharCode(...b.slice(inici, fi))

  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp'
  return null
}

// Llegeix la imatge del cos de la petició (un formulari multipart amb el fitxer al camp imatge).
// Abans de llegir res, rebutja els cossos massa grans per al tipus d'imatge (amb marge pel formulari).
// Retorna el fitxer, o la resposta d'error que ha de donar la ruta.
export async function llegeix(
  c: Context<Env>,
  tipusImatge: TipusImatge
): Promise<{ ok: true; fitxer: File } | { ok: false; resposta: Response }> {
  const { midaMax } = IMATGE_PERFILS[tipusImatge]
  const mida = Number(c.req.header('Content-Length') ?? 0)
  if (mida > midaMax + 64 * 1024) {
    return { ok: false, resposta: c.json({ error: 'La imatge és massa gran.' }, 413) }
  }

  let fitxer: unknown
  try {
    fitxer = (await c.req.parseBody()).imatge
  } catch {
    return { ok: false, resposta: c.json({ error: 'Cos de la petició no vàlid' }, 400) }
  }
  if (!(fitxer instanceof File)) {
    return { ok: false, resposta: c.json({ error: 'Cal triar una imatge.' }, 400) }
  }
  return { ok: true, fitxer }
}

// Valida la imatge (ja comprimida pel navegador) i la puja a l'R2 dins de la carpeta indicada
// (per exemple, entitats/3). Cada imatge té una clau nova i aleatòria, així una URL vella mai mostra
// una imatge nova.
export async function desa(
  env: Bindings,
  tipusImatge: TipusImatge,
  carpeta: string,
  fitxer: File
): Promise<{ ok: true; clau: string } | { ok: false; error: string }> {
  const tipus = await tipusReal(fitxer)
  const error = errorImatge(tipus ?? '', fitxer.size, IMATGE_PERFILS[tipusImatge].midaMax)
  if (error) return { ok: false, error }

  const clau = `${carpeta}/${crypto.randomUUID()}`
  await env.IMATGES.put(clau, await fitxer.arrayBuffer(), {
    httpMetadata: { contentType: tipus!, cacheControl: `private, max-age=${VALIDESA_SEGONS}` },
  })
  return { ok: true, clau }
}

// Esborra una imatge. Si falla, només ho apunta: una imatge que sobra no ha de fer fallar la petició.
export async function esborra(env: Bindings, clau: string | null): Promise<void> {
  if (!clau) return
  try {
    await env.IMATGES.delete(clau)
  } catch (e) {
    console.error("No s'ha pogut esborrar la imatge", clau, e)
  }
}

// Esborra totes les imatges d'una carpeta (per exemple, quan s'elimina una entitat).
// Cada list() en retorna 1000 com a màxim, per això es va repetint.
export async function esborraCarpeta(env: Bindings, carpeta: string): Promise<void> {
  try {
    let cursor: string | undefined
    do {
      const llista = await env.IMATGES.list({ prefix: `${carpeta}/`, cursor })
      if (llista.objects.length > 0) await env.IMATGES.delete(llista.objects.map((o) => o.key))
      cursor = llista.truncated ? llista.cursor : undefined
    } while (cursor)
  } catch (e) {
    console.error("No s'han pogut esborrar les imatges de", carpeta, e)
  }
}

// Retorna la imatge mateixa (els bytes) llegida de l'R2, o null si no n'hi ha.
// Serveix perquè el navegador la pugui posar dins d'un PDF: les URL signades de l'R2 no tenen CORS,
// i aquesta resposta, en sortir de l'API, sí.
export async function fitxer(env: Bindings, clau: string | null): Promise<Response | null> {
  if (!clau) return null
  const obj = await env.IMATGES.get(clau)
  if (!obj) return null
  return new Response(obj.body, {
    headers: {
      'Content-Type': obj.httpMetadata?.contentType ?? 'application/octet-stream',
      'Cache-Control': 'private, no-store',
    },
  })
}
