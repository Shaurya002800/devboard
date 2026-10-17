const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const db = require('../db')
const auth = require('../middleware/auth')
const { text, invalid } = require('../middleware/validation')

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    }
  )
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    bio: user.bio,
    created_at: user.created_at,
  }
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, bio = '' } = req.body

    text(name, 'Name', 100)
    text(bio, 'Bio', 2000, true)
    text(email, 'Email', 254)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      invalid('Email must be a valid address')
    if (typeof password !== 'string' || Buffer.byteLength(password) > 72)
      invalid('Password must be text of at most 72 bytes')

    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: 'Name, email, and password are required' })
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: 'Password must be at least 8 characters' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    )

    if (existingUser.rows[0]) {
      return res
        .status(409)
        .json({ error: 'An account with that email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const result = await db.query(
      `
        INSERT INTO users (name, email, password_hash, bio)
        VALUES ($1, $2, $3, $4)
        RETURNING id, email, name, bio, created_at
      `,
      [name.trim(), normalizedEmail, passwordHash, bio.trim()]
    )

    const user = result.rows[0]

    res.status(201).json({
      token: signToken(user),
      user: sanitizeUser(user),
    })
  } catch (error) {
    if (error.code === '23505')
      return res
        .status(409)
        .json({ error: 'An account with that email already exists' })
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    text(email, 'Email', 254)
    if (typeof password !== 'string' || Buffer.byteLength(password) > 72)
      invalid('Password must be text of at most 72 bytes')

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const result = await db.query(
      `
        SELECT id, email, name, bio, created_at, password_hash
        FROM users
        WHERE email = $1
      `,
      [normalizedEmail]
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    res.json({
      token: signToken(user),
      user: sanitizeUser(user),
    })
  } catch (error) {
    next(error)
  }
})

router.get('/me', auth, async (req, res, next) => {
  try {
    const result = await db.query(
      `
        SELECT id, email, name, bio, created_at
        FROM users
        WHERE id = $1
      `,
      [req.user.id]
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ user: sanitizeUser(user) })
  } catch (error) {
    next(error)
  }
})

module.exports = router
