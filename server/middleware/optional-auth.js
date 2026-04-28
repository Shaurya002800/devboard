const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  if (scheme === 'Bearer' && token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      return res.status(401).json({ error: 'Invalid token' })
    }
  }

  next()
}
