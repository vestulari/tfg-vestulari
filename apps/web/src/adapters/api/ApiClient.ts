// Creador del client de l'API.
// Es dedica a fer les crides a l'API i afegir el token d'autentificació.

import { supabase } from '../../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('Falta VITE_API_URL')
}

// Què es vol fer amb la imatge en desar unes dades: posar-ne una de nova, treure la que hi ha, o res (null)
export type CanviImatge = File | 'treu' | null

// Prepara el cos d'una petició que desa dades i, si cal, la imatge, tot en una sola crida.
// Sense canvi d'imatge és JSON normal. Amb canvi, és un formulari amb les dades (JSON) i la imatge,
// o amb treuImatge per treure-la.
export function cosAmbImatge(dades: unknown, imatge: CanviImatge): BodyInit {
  if (imatge === null) return JSON.stringify(dades)
  const cos = new FormData()
  cos.append('dades', JSON.stringify(dades))
  if (imatge === 'treu') cos.append('treuImatge', '1')
  else cos.append('imatge', imatge)
  return cos
}

// Error d'una crida a l'API: porta el codi HTTP i el missatge que ha enviat el servidor
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Fa una crida a l'API amb el token de la sessió. Respecta les capçaleres que li passin.
// Si el cos és un FormData (per pujar fitxers), el Content-Type el posa el navegador.
// Si la resposta és un error, llença un ApiError.
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await crida(path, init)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

// Com api(), però la resposta és un fitxer (per exemple, una imatge) en lloc de JSON
export async function apiFitxer(path: string): Promise<Blob> {
  return (await crida(path)).blob()
}

// Fa la petició amb el token i, si la resposta és un error, llença un ApiError amb el missatge del servidor
async function crida(path: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const headers = new Headers(init.headers)
  if (init.body !== undefined && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_URL}${path}`, { ...init, headers })

  if (!res.ok) {
    let missatge = res.statusText || 'Error'
    try {
      const cos = (await res.json()) as { error?: unknown }
      if (typeof cos.error === 'string') missatge = cos.error
    } catch {
      // la resposta no era JSON
    }
    throw new ApiError(res.status, missatge)
  }
  return res
}