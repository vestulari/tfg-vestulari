// Punt d'entrada de l'API.
// Configura el CORS i el control d'errors, i munta totes les rutes.

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import postgres from 'postgres'
import type { Env } from './types'
import { me } from './routes/me'
import { entitats } from './routes/entitats'

const app = new Hono<Env>()

// Només es pot cridar l'API des de les webs de Vestulari (i des de local)
app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed =
        origin === 'http://localhost:5173' ||
        origin === 'https://tfg-vestulari.pages.dev' ||
        origin === 'https://vestulari.cat' ||
        origin.endsWith('.tfg-vestulari.pages.dev')
      return allowed ? origin : null
    },
    allowHeaders: ['Authorization', 'Content-Type'],
  })
)

// Control d'errors global: tot error que no s'hagi controlat acaba aquí!
// Els errors de la BD es tradueixen a un missatge entenedor, i sempre es respon en JSON.
app.onError((err, c) => {
  if (err instanceof HTTPException) return err.getResponse()
  if (err instanceof postgres.PostgresError) {
    console.error('Error de BD', err.code, err.message)
    if (err.code === '23505') return c.json({ error: 'Aquestes dades ja existeixen.' }, 409)
    // check, not null, tipus invàlid, clau forana
    if (['23514', '23502', '22P02', '23503'].includes(err.code)) {
      return c.json({ error: 'Les dades no són vàlides.' }, 400)
    }
  } else {
    console.error(err)
  }
  return c.json({ error: 'Error intern del servidor.' }, 500)
})

// Per comprovar que l'API està viva
app.get('/health',(c) => c.json({ ok: true }))
app.route('/me', me)
app.route('/entitats', entitats)

export default app
