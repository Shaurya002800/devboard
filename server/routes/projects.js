const router = require('express').Router()
const db = require('../db')
const auth = require('../middleware/auth')
const optionalAuth = require('../middleware/optional-auth')

const {
  projectFields,
  idParam,
  budget: validateBudget,
  invalid,
} = require('../middleware/validation')
router.param('id', idParam)

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { stack, budget, page = '1', limit = '6', mine = 'false' } = req.query
    const values = []
    const conditions = []

    if (
      ![page, limit].every(
        (value) =>
          typeof value === 'string' &&
          /^\d+$/.test(value) &&
          Number.isSafeInteger(Number(value)) &&
          Number(value) > 0
      )
    )
      invalid('Page and limit must be positive integers')
    const pageNumber = Number(page)
    const pageSize = Math.min(Number(limit), 24)
    if (!Number.isSafeInteger(pageNumber * pageSize))
      invalid('Page is too large')
    if (stack !== undefined && typeof stack !== 'string')
      invalid('Stack must be text')
    if (!['true', 'false'].includes(mine)) invalid('Mine must be true or false')

    if (stack) {
      values.push(String(stack).trim().toLowerCase())
      conditions.push(`$${values.length} = ANY (p.tech_stack)`)
    }

    if (budget) {
      values.push(validateBudget(budget, null))
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
      ORDER BY p.created_at DESC, p.id DESC
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
      tech_stack: normalizedTechStack,
      budget: normalizedBudget,
      deadline,
      status,
    } = projectFields(req.body)

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
    const updated = await db.transaction(async (client) => {
      const projectResult = await client.query(
        'SELECT * FROM projects WHERE id = $1 FOR UPDATE',
        [req.params.id]
      )
      const project = projectResult.rows[0]

      if (!project) {
        throw Object.assign(new Error('Project not found'), { status: 404 })
      }

      if (project.poster_id !== req.user.id) {
        throw Object.assign(
          new Error('Only the project owner can edit this project'),
          { status: 403 }
        )
      }

      const updatedFields = projectFields(req.body, project)

      if (updatedFields.status === 'open') {
        const accepted = await client.query(
          "SELECT id FROM applications WHERE project_id = $1 AND status = 'accepted'",
          [project.id]
        )
        if (accepted.rows.length)
          throw Object.assign(
            new Error(
              'Reject the accepted application before reopening this project'
            ),
            { status: 409 }
          )
      }
      const result = await client.query(
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

      return result.rows[0]
    })
    res.json(updated)
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
