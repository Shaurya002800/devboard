require('dotenv').config()
const { Pool } = require('pg')
const { attachDatabasePool } = require('@vercel/functions')

if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required in production')
}

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://shaurya@localhost:5432/devboard',
  // Let the connection URL select TLS (Neon supplies sslmode=require).
  max: 5,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 10000,
})

if (process.env.VERCEL) attachDatabasePool(pool)

pool.on('error', (err) => {
  console.error('Postgres pool error:', err)
})

async function transaction(work) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await work(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  transaction,
  close: () => pool.end(),
}
