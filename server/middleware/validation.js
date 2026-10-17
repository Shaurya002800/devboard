const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function invalid(message) {
  const error = new Error(message)
  error.status = 400
  throw error
}

function text(value, label, max, allowEmpty = false) {
  if (
    typeof value !== 'string' ||
    (!allowEmpty && !value.trim()) ||
    value.length > max
  ) {
    invalid(
      `${label} must be ${allowEmpty ? 'text' : 'non-empty text'} of at most ${max} characters`
    )
  }
  return value.trim()
}

function uuid(value, label = 'ID') {
  if (typeof value !== 'string' || !UUID.test(value))
    invalid(`${label} must be a valid UUID`)
  return value
}

function idParam(req, res, next, value) {
  try {
    uuid(value)
    next()
  } catch (error) {
    next(error)
  }
}

function objectBody(req, res, next) {
  if (
    ['POST', 'PATCH', 'PUT'].includes(req.method) &&
    (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))
  ) {
    return next(
      Object.assign(new Error('A JSON object body is required'), {
        status: 400,
      })
    )
  }
  next()
}

function budget(value, fallback) {
  if (value === undefined) return fallback
  if (value === null || value === '') return null
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    (typeof value === 'string' && !/^\d+$/.test(value)) ||
    !Number.isInteger(Number(value)) ||
    Number(value) < 0 ||
    Number(value) > 2147483647
  ) {
    invalid('Budget must be a whole number between 0 and 2147483647')
  }
  return Number(value)
}

function projectFields(body, previous = {}) {
  const result = { ...previous }
  for (const [key, max] of [
    ['title', 200],
    ['description', 20000],
  ]) {
    if (body[key] !== undefined || previous[key] === undefined)
      result[key] = text(body[key], key, max)
  }
  if (body.tech_stack !== undefined || previous.tech_stack === undefined) {
    const stack =
      typeof body.tech_stack === 'string'
        ? body.tech_stack.split(',')
        : body.tech_stack
    if (!Array.isArray(stack) || !stack.length || stack.length > 30)
      invalid('Tech stack must contain 1 to 30 items')
    result.tech_stack = [
      ...new Set(
        stack.map((item) => text(item, 'Tech stack item', 50).toLowerCase())
      ),
    ]
  }
  result.budget = budget(body.budget, previous.budget ?? null)
  if (body.deadline !== undefined || previous.deadline === undefined) {
    const date = body.deadline
    if (
      typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      date.startsWith('0000') ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date
    ) {
      invalid('Deadline must be a valid date in YYYY-MM-DD format')
    }
    result.deadline = date
  }
  result.status =
    body.status === undefined ? (previous.status ?? 'open') : body.status
  if (!['open', 'closed', 'in_progress'].includes(result.status))
    invalid('Status must be open, in_progress, or closed')
  return result
}

module.exports = {
  invalid,
  text,
  uuid,
  idParam,
  objectBody,
  budget,
  projectFields,
}
