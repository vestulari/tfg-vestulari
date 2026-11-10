import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createMiddleware } from 'hono/factory'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import postgres from 'postgres'

type Env = {
  Bindings: { SUPABASE_URL: string; DATABASE_URL: string }  // Variables d'entorn
  Variables: { userId: string }     // Dades
}

const app = new Hono<Env>()

// Dominis disponibles
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed =
        origin === 'http://localhost:5173' ||
        origin === 'https://vestulari.cat' ||
        origin === 'https://tfg-vestulari.pages.dev' ||
        origin.endsWith('.tfg-vestulari.pages.dev')
      return allowed ? origin : null
    },
    allowHeaders: ['Authorization', 'Content-Type'],
  })
)

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined

// Creador per verificar el token JWT de Supabase.
// Si el token és vàlid, afegeix l'ID d'usuari a les dades de la sol·licitud.
const auth = createMiddleware<Env>(async (c, next) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Falta el token' }, 401)
  }
  jwks ??= createRemoteJWKSet(
    new URL(`${c.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
  )
  try {
    const { payload } = await jwtVerify(header.slice(7), jwks, {
      issuer: `${c.env.SUPABASE_URL}/auth/v1`,
      audience: 'authenticated',
    })
    c.set('userId', payload.sub as string)
    await next()
  } catch {
    return c.json({ error: 'Token no vàlid' }, 401)
  }
})

app.get('/health', (c) => c.json({ ok: true }))

app.get('/me', auth, (c) => c.json({ userId: c.get('userId') }))

app.get('/db-check', auth, async (c) => {
  const sql = postgres(c.env.DATABASE_URL, { max: 1, prepare: false })
  try {
    const [row] = await sql`select now() as now`
    return c.json({ ok: true, now: row.now })
  } finally {
    c.executionCtx.waitUntil(sql.end())
  }
})

export default app