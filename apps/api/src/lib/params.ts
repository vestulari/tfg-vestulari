// Ajudes per llegir el que arriba a les rutes: els paràmetres de la URL i el cos.

import type { Context } from 'hono'
import type { Env } from '../types'

// Llegeix un identificador numèric de la URL. Retorna null si no és un enter positiu.
export function llegeixId(valor: string): number | null {
  const n = Number(valor)
  return Number.isInteger(n) && n > 0 ? n : null
}

// Llegeix el cos JSON de la petició. Retorna undefined si no és JSON.
export async function llegeixCos(c: Context<Env>): Promise<unknown> {
  try {
    return await c.req.json()
  } catch {
    return undefined
  }
}
