// Tipus de l'entorn de Hono: les variables de Cloudflare (Bindings)
// i el que els middlewares afegeixen a cada request (Variables).

import type { Sql } from './lib/db'

export type Env = {
  Bindings: { SUPABASE_URL: string; DATABASE_URL: string }
  Variables: { userId: string; email: string | null; sql: Sql }
}
