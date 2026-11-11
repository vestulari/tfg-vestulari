// Middle ware de la base de dades.
// Obre la connexió amb la base de dades i l'afegeix a la request.

import { createMiddleware } from 'hono/factory'
import { obreConnexio } from '../lib/db'
import type { Env } from '../types'

export const bd = createMiddleware<Env>(async (c, next) => {
  const sql = obreConnexio(c.env.DATABASE_URL)
  c.set('sql', sql)
  try {
    await next()
  } finally {
    c.executionCtx.waitUntil(sql.end())
  }
})
