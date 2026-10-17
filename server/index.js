const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
)
app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))
app.use(require('./middleware/validation').objectBody)

app.use('/api/auth', require('./routes/auth'))
app.use('/api/projects', require('./routes/projects'))
app.use('/api/applications', require('./routes/applications'))

app.get('/', (req, res) => res.json({ status: 'DevBoard API running' }))

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use(require('./middleware/error'))

module.exports = app

const PORT = process.env.PORT || 5000
if (require.main === module) {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is required')
  app.listen(PORT, () => console.log(`Server on port ${PORT}`))
}
