// Tipus de l'entorn de Hono: les variables de Cloudflare (Bindings)
// i el que els middlewares afegeixen a cada request (Variables).

import type { EntitatDetallDto } from '@tfg-vestulari/shared'
import type { Sql } from './lib/db'

export type Env = {
  Bindings: { SUPABASE_URL: string; DATABASE_URL: string }
  Variables: {
    userId: string
    email: string | null
    sql: Sql
    // Només a les rutes /entitats/:id/... (el posa el middleware membre)
    entitat: EntitatDetallDto
  }
}
