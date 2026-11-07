import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed =
        origin === 'http://localhost:5173' ||
        origin === 'https://tfg-vestulari.pages.dev' ||
        origin.endsWith('.tfg-vestulari.pages.dev')
      return allowed ? origin : null
    },
  })
)

app.get('/health', (c) =>
  c.json({ ok: true, time: new Date().toISOString() })
)

export default app