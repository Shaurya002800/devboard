const router = require('express').Router()
const db = require('../db')
const auth = require('../middleware/auth')
const { uuid, text, idParam } = require('../middleware/validation')
router.param('id', idParam)

function fail(status, message) {
  throw Object.assign(new Error(message), { status })
}

router.post('/', auth, async (req, res, next) => {
  try {
    const projectId = uuid(req.body.project_id, 'Project ID')
    const pitch = text(req.body.pitch, 'Pitch', 10000)
    const application = await db.transaction(async (client) => {
      // Every application mutation locks the project first, serializing reviews and submissions.
      const {
        rows: [project],
      } = await client.query(
        'SELECT id, poster_id, status FROM projects WHERE id = $1 FOR UPDATE',
        [projectId]
      )
      if (!project) fail(404, 'Project not found')
      if (project.poster_id === req.user.id)
        fail(403, 'You cannot apply to your own project')
      if (project.status !== 'open')
        fail(400, 'This project is no longer accepting applications')
      const result = await client.query(
        'INSERT INTO applications (project_id, applicant_id, pitch) VALUES ($1, $2, $3) RETURNING *',
        [projectId, req.user.id, pitch]
      )
      return result.rows[0]
    })
    res.status(201).json(application)
  } catch (error) {
    if (error.code === '23505')
      return res
        .status(409)
        .json({ error: 'You have already applied to this project' })
    next(error)
  }
})

router.get('/mine', auth, async (req, res, next) => {
  try {
    const result = await db.query(
      `
        SELECT
          a.*,
          p.title AS project_title,
          p.status AS project_status,
          p.deadline,
          u.name AS poster_name
        FROM applications a
        JOIN projects p ON p.id = a.project_id
        JOIN users u ON u.id = p.poster_id
        WHERE a.applicant_id = $1
        ORDER BY a.created_at DESC
      `,
      [req.user.id]
    )

    res.json(result.rows)
  } catch (error) {
    next(error)
  }
})

router.get('/project/:id', auth, async (req, res, next) => {
  try {
    const projectResult = await db.query(
      'SELECT id, poster_id FROM projects WHERE id = $1',
      [req.params.id]
    )
    const project = projectResult.rows[0]

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.poster_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: 'Only the project owner can view applicants' })
    }

    const result = await db.query(
      `
        SELECT
          a.*,
          u.name,
          u.email,
          u.bio
        FROM applications a
        JOIN users u ON u.id = a.applicant_id
        WHERE a.project_id = $1
        ORDER BY a.created_at DESC
      `,
      [req.params.id]
    )

    res.json(result.rows)
  } catch (error) {
    next(error)
  }
})

router.patch('/:id', auth, async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['accepted', 'rejected'].includes(status))
      fail(400, 'Status must be accepted or rejected')

    const application = await db.transaction(async (client) => {
      const {
        rows: [project],
      } = await client.query(
        `SELECT p.id, p.poster_id, p.status FROM projects p
         JOIN applications a ON a.project_id = p.id WHERE a.id = $1 FOR UPDATE OF p`,
        [req.params.id]
      )
      if (!project) fail(404, 'Application not found')
      if (project.poster_id !== req.user.id)
        fail(403, 'Only the project owner can review applications')
      const {
        rows: [current],
      } = await client.query('SELECT * FROM applications WHERE id = $1', [
        req.params.id,
      ])
      if (current.status === status) return current

      if (status === 'accepted') {
        if (project.status === 'closed')
          fail(409, 'Reopen the project before accepting an application')
        const accepted = await client.query(
          "SELECT id FROM applications WHERE project_id = $1 AND status = 'accepted' AND id <> $2",
          [project.id, current.id]
        )
        if (accepted.rows.length)
          fail(409, 'This project already has an accepted application')
      }

      const result = await client.query(
        'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
        [status, current.id]
      )
      if (status === 'accepted') {
        await client.query(
          "UPDATE projects SET status = 'in_progress' WHERE id = $1",
          [project.id]
        )
        await client.query(
          "UPDATE applications SET status = 'rejected' WHERE project_id = $1 AND id <> $2 AND status = 'pending'",
          [project.id, current.id]
        )
      } else if (
        current.status === 'accepted' &&
        project.status === 'in_progress'
      ) {
        await client.query(
          `UPDATE projects SET status = 'open' WHERE id = $1
           AND NOT EXISTS (SELECT 1 FROM applications WHERE project_id = $1 AND status = 'accepted')`,
          [project.id]
        )
      }
      return result.rows[0]
    })
    res.json(application)
  } catch (error) {
    next(error)
  }
})

module.exports = router
