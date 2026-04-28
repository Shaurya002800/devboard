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
app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/projects', require('./routes/projects'))
app.use('/api/applications', require('./routes/applications'))

app.get('/', (req, res) => res.json({ status: 'DevBoard API running' }))

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use((err, req, res, next) => {
  console.error(err)

  if (res.headersSent) {
    return next(err)
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server on port ${PORT}`))
