module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err)

  const status =
    Number.isInteger(err.status) && err.status >= 400 && err.status < 600
      ? err.status
      : 500
  if (status >= 500) console.error(err)
  res.status(status).json({
    error: status >= 500 ? 'Internal server error' : err.message,
  })
}
