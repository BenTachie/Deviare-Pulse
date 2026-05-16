require('dotenv').config()
const app  = require('./app')

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`[pulse-backend] running on http://localhost:${PORT}`)
})
