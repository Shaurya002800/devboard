require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://shaurya@localhost:5432/devboard',
  ssl: false,
})

pool.on('error', (err) => {
  console.error('Postgres pool error:', err)
})

module.exports = { query: (text, params) => pool.query(text, params) }
