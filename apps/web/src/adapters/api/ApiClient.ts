// Creador del client de l'API.
// Es dedica a fer les crides a l'API i afegir el token d'autentificació.

import { supabase } from '../../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL

if (!API_URL) {
  throw new Error('Falta VITE_API_URL')
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