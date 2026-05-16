require('dotenv').config()

if (!process.env.SENDGRID_API_KEY) {
  console.error('[pulse-backend] FATAL: SENDGRID_API_KEY is not set.')
  console.error('  Copy backend/.env.example → backend/.env and fill in your key.')
  process.exit(1)
}

const app  = require('./app')
const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`[pulse-backend] running on http://localhost:${PORT}`)
})
