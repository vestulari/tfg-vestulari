// Middelwares de autenticació i autorització.
// Es dediquen sobretot a mirar que el token JWT sigui vàlid, afegint-ho a la request

import { createMiddleware } from 'hono/factory'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'
import type { Env } from '../types'

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined

export const auth = createMiddleware<Env>(async (c, next) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Falta el token' }, 401)
  }

  jwks ??= createRemoteJWKSet(
    new URL(`${c.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
  )

  let payload: JWTPayload
  try {
    const result = await jwtVerify(header.slice(7), jwks, {
      issuer: `${c.env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    })
    payload = result.payload
  } catch {
    return c.json({ error: 'Token no vàlid' }, 401)
  }

  if (!payload.sub) return c.json({ error: 'Token no vàlid' }, 401)

  c.set('userId', payload.sub)
  c.set('email', typeof payload.email === 'string' ? payload.email : null)
  await next()
})
