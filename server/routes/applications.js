const router = require('express').Router()
const db = require('../db')
const auth = require('../middleware/auth')

router.post('/', auth, async (req, res, next) => {
  try {
    const { project_id, pitch } = req.body

    if (!project_id || !pitch?.trim()) {
      return res.status(400).json({ error: 'Project and pitch are required' })
    }

    const projectResult = await db.query(
      'SELECT id, poster_id, status FROM projects WHERE id = $1',
      [project_id]
    )
    const project = projectResult.rows[0]

    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }

    if (project.poster_id === req.user.id) {
      return res
        .status(403)
        .json({ error: 'You cannot apply to your own project' })
    }

    if (project.status !== 'open') {
      return res
        .status(400)
        .json({ error: 'This project is no longer accepting applications' })
    }

    const result = await db.query(
      `
        INSERT INTO applications (project_id, applicant_id, pitch)
        VALUES ($1, $2, $3)
        RETURNING *
      `,
      [project_id, req.user.id, pitch.trim()]
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    if (error.code === '23505') {
      return res
        .status(409)
        .json({ error: 'You have already applied to this project' })
    }

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

    if (!['accepted', 'rejected'].includes(status)) {
      return res
        .status(400)
        .json({ error: 'Status must be accepted or rejected' })
    }

    const applicationResult = await db.query(
      `
        SELECT a.*, p.poster_id, p.id AS project_id
        FROM applications a
        JOIN projects p ON p.id = a.project_id
        WHERE a.id = $1
      `,
      [req.params.id]
    )
    const application = applicationResult.rows[0]

    if (!application) {
      return res.status(404).json({ error: 'Application not found' })
    }

    if (application.poster_id !== req.user.id) {
      return res
        .status(403)
        .json({ error: 'Only the project owner can review applications' })
    }

    const result = await db.query(
      'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
      [status, req.params.id]
    )

    if (status === 'accepted') {
      await db.query(
        `UPDATE projects SET status = 'in_progress' WHERE id = $1`,
        [application.project_id]
      )

      await db.query(
        `
          UPDATE applications
          SET status = 'rejected'
          WHERE project_id = $1 AND id <> $2 AND status = 'pending'
        `,
        [application.project_id, req.params.id]
      )
    }

    if (status === 'rejected') {
      const acceptedApplications = await db.query(
        `
          SELECT COUNT(*)::INT AS accepted_count
          FROM applications
          WHERE project_id = $1 AND status = 'accepted'
        `,
        [application.project_id]
      )

      if ((acceptedApplications.rows[0]?.accepted_count || 0) === 0) {
        await db.query(`UPDATE projects SET status = 'open' WHERE id = $1`, [
          application.project_id,
        ])
      }
    }

    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
})

module.exports = router
