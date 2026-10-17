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
