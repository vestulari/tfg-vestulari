// Creador del client de l'API.
// Es dedica a fer les crides a l'API i afegir el token d'autentificació.

import { supabase } from '../../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!res.ok) throw new ApiError(res.status, await res.text())
  return (await res.json()) as T
}