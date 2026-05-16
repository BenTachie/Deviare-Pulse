const express         = require('express')
const cors            = require('cors')
const morgan          = require('morgan')
const emailRoutes     = require('./src/routes/emailRoutes')
const scheduleRoutes  = require('./src/routes/scheduleRoutes')

const app = express()

/* ── CORS ──────────────────────────────────────────────────────────── */
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())

app.use(cors({
  origin (origin, cb) {
    // allow requests with no origin (curl, Postman)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

/* ── Body / logging ────────────────────────────────────────────────── */
app.use(express.json({ limit: '2mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

/* ── Health ─────────────────────────────────────────────────────────── */
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

/* ── API routes ─────────────────────────────────────────────────────── */
app.use('/api/email',     emailRoutes)
app.use('/api/schedules', scheduleRoutes)

/* ── Global error handler ───────────────────────────────────────────── */
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[error]', err.message)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

module.exports = app
