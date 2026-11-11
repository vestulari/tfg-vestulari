import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env } from './types'
import { me } from './routes/me'

const app = new Hono<Env>()

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

app.get('/health', (c) => c.json({ ok: true }))
app.route('/me', me)

export default app
