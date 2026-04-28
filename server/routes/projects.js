const router = require('express').Router()
const db = require('../db')
const auth = require('../middleware/auth')
const optionalAuth = require('../middleware/optional-auth')

function normalizeTechStack(techStack) {
  if (Array.isArray(techStack)) {
    return techStack
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean)
  }

  if (typeof techStack === 'string') {
    return techStack
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  }

  return []
}

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { stack, budget, page = '1', limit = '6', mine = 'false' } = req.query
    const values = []
    const conditions = []

    const pageNumber = Math.max(Number.parseInt(page, 10) || 1, 1)
    const pageSize = Math.min(Math.max(Number.parseInt(limit, 10) || 6, 1), 24)

    if (stack) {
      values.push(String(stack).trim().toLowerCase())
      conditions.push(`$${values.length} = ANY (p.tech_stack)`)
    }

    if (budget) {
      values.push(Number.parseInt(budget, 10) || 0)
      conditions.push(`p.budget <= $${values.length}`)
    }

    if (mine === 'true') {
      if (!req.user) {
        return res
          .status(401)
          .json({ error: 'Authentication required to view your projects' })
      }

      values.push(req.user.id)
      conditions.push(`p.poster_id = $${values.length}`)
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : ''
    const offset = (pageNumber - 1) * pageSize

    values.push(pageSize)
    values.push(offset)

    const projectsQuery = `
      SELECT
        p.*,
        u.name AS poster_name,
        u.bio AS poster_bio,
        COUNT(a.id)::INT AS applicant_count
      FROM projects p
      JOIN users u ON u.id = p.poster_id
      LEFT JOIN applications a ON a.project_id = p.id
      ${whereClause}
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
      LIMIT $${values.length - 1}
      OFFSET $${values.length}
    `

    const countValues = values.slice(0, values.length - 2)
    const countQuery = `
      SELECT COUNT(*)::INT AS total
      FROM projects p
      ${whereClause}
    `

    const [projectsResult, countResult] = await Promise.all([
      db.query(projectsQuery, values),
      db.query(countQuery, countValues),
    ])

    res.json({
      data: projectsResult.rows,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: countResult.rows[0]?.total || 0,
        hasMore:
          offset + projectsResult.rows.length <
          (countResult.rows[0]?.total || 0),
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const result = await db.query(
      `
        SELECT
          p.*,
          u.name AS poster_name,
          u.bio AS poster_bio,
          u.email AS poster_email,
          COUNT(a.id)::INT AS applicant_count
        FROM projects p
        JOIN users u ON u.id = p.poster_id
        LEFT JOIN applications a ON a.project_id = p.id
        WHERE p.id = $1
        GROUP BY p.id, u.id
      `,
      [req.params.id]
    )

    const project = result.rows[0]

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    res.json(project)
  } catch (error) {
    next(error)
  }
})

router.post('/', auth, async (req, res, next) => {
  try {
    const {
      title,
      description,
      tech_stack,
      budget,
      deadline,
      status = 'open',
    } = req.body
    const normalizedTechStack = normalizeTechStack(tech_stack)
    const normalizedBudget = normalizeBudget(budget, null)

    if (!title || !description || !normalizedTechStack.length || !deadline) {
      return res.status(400).json({
        error: 'Title, description, tech stack, and deadline are required',
      })
    }

    if (normalizedBudget !== null && normalizedBudget < 0) {
      return res.status(400).json({ error: 'Budget must be a positive number' })
    }

    if (!['open', 'closed', 'in_progress'].includes(status)) {
      return res
        .status(400)
        .json({ error: 'Status must be open, in_progress, or closed' })
    }

    const result = await db.query(
      `
        INSERT INTO projects (poster_id, title, description, tech_stack, budget, deadline, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [
        req.user.id,
        title.trim(),
        description.trim(),
        normalizedTechStack,
        normalizedBudget,
        deadline,
        status,
      ]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

router.patch('/:id', auth, async (req, res, next) => {
  try {
    const projectResult = await db.query(
      'SELECT * FROM projects WHERE id = $1',
      [req.params.id]
    )
    const project = projectResult.rows[0]

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.poster_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: 'Only the project owner can edit this project' })
    }

    const updatedFields = {
      title: req.body.title?.trim() || project.title,
      description: req.body.description?.trim() || project.description,
      tech_stack: req.body.tech_stack
        ? normalizeTechStack(req.body.tech_stack)
        : project.tech_stack,
      budget: normalizeBudget(req.body.budget, project.budget),
      deadline: req.body.deadline || project.deadline,
      status: req.body.status || project.status,
    }

    if (!updatedFields.tech_stack.length) {
      return res
        .status(400)
        .json({ error: 'Tech stack must contain at least one item' })
    }

    if (updatedFields.budget !== null && updatedFields.budget < 0) {
      return res.status(400).json({ error: 'Budget must be a positive number' })
    }

    if (!['open', 'closed', 'in_progress'].includes(updatedFields.status)) {
      return res
        .status(400)
        .json({ error: 'Status must be open, in_progress, or closed' })
    }

    const result = await db.query(
      `
        UPDATE projects
        SET title = $1, description = $2, tech_stack = $3, budget = $4, deadline = $5, status = $6
        WHERE id = $7
        RETURNING *
      `,
      [
        updatedFields.title,
        updatedFields.description,
        updatedFields.tech_stack,
        updatedFields.budget,
        updatedFields.deadline,
        updatedFields.status,
        req.params.id,
      ]
    )

    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const result = await db.query(
      'DELETE FROM projects WHERE id = $1 AND poster_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    )

    if (!result.rows[0]) {
      return res
        .status(404)
        .json({ error: 'Project not found or you do not have access' })
    }

    res.json({ message: 'Project deleted successfully' })
  } catch (error) {
    next(error)
  }
})

module.exports = router

function normalizeBudget(value, fallbackValue) {
  if (value === undefined) {
    return fallbackValue
  }

  if (value === null || value === '') {
    return null
  }

  const parsedValue = Number.parseInt(value, 10)

  if (Number.isNaN(parsedValue)) {
    return fallbackValue
  }

  return parsedValue
}
