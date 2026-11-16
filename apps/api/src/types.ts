// Tipus de l'entorn de Hono: les variables de Cloudflare (Bindings)
// i el que els middlewares afegeixen a cada request (Variables).

import type { Sql } from './lib/db'
import type { EntitatMembre } from './repositories/entitatRepository'

// Les variables i els secrets del Worker (en local, surten de .dev.vars).
// IMATGES és el bucket d'R2, i les variables R2_* serveixen per signar les URL de les imatges.
export type Bindings = {
  SUPABASE_URL: string
  DATABASE_URL: string
  IMATGES: R2Bucket
  R2_ACCOUNT_ID: string
  R2_ACCESS_KEY: string
  R2_SECRET_ACCESS_KEY: string
  R2_BUCKET: string
}

export type Env = {
  Bindings: Bindings
  Variables: {
    userId: string
    email: string | null
    sql: Sql
    // Només a les rutes /entitats/:id/... (el posa el middleware membre).
    // Porta la clau de la imatge, no la URL: la URL només es signa quan es retorna l'entitat.
    entitat: EntitatMembre
  }
}
