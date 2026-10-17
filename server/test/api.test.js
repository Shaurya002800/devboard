const { test } = require('node:test')
const assert = require('node:assert/strict')
const { randomUUID } = require('node:crypto')
const { execFileSync } = require('node:child_process')
const { Pool } = require('pg')
const path = require('node:path')

test(
  'API integration and concurrent marketplace decisions',
  { skip: !process.env.TEST_DATABASE_URL },
  async (t) => {
    // Each run owns a fresh schema. No existing application tables are modified.
    const schema = `test_${randomUUID().replaceAll('-', '')}`
    const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL })
    let server, db
    t.after(async () => {
      if (server) await new Promise((resolve) => server.close(resolve))
      if (db) await db.close()
      await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`)
      await admin.end()
    })
    await admin.query(`CREATE SCHEMA ${schema}`)
    const url = new URL(process.env.TEST_DATABASE_URL)
    url.searchParams.set('options', `-c search_path=${schema},public`)
    process.env.DATABASE_URL = url.toString()
    process.env.JWT_SECRET = 'devboard-regression-test-secret-only'
    execFileSync(process.execPath, [path.join(__dirname, '../db/migrate.js')], {
      env: process.env,
    })
    db = require('../db')
    const app = require('../index')
    server = await new Promise((resolve) => {
      const listener = app.listen(0, '127.0.0.1', () => resolve(listener))
    })
    const base = `http://127.0.0.1:${server.address().port}/api`
    async function request(route, method = 'GET', body, token) {
      const response = await fetch(base + route, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      })
      return { status: response.status, data: await response.json() }
    }
    async function account(name) {
      const response = await request('/auth/register', 'POST', {
        name,
        email: `${name}@example.test`,
        password: 'test-password',
      })
      assert.equal(response.status, 201)
      assert.equal(response.data.user.password_hash, undefined)
      return response.data.token
    }
    const owner = await account('owner'),
      first = await account('first'),
      second = await account('second')
    async function project() {
      const response = await request(
        '/projects',
        'POST',
        {
          title: 'Build a tool',
          description: 'Scoped brief',
          tech_stack: ['Node'],
          budget: 0,
          deadline: '2028-01-01',
        },
        owner
      )
      assert.equal(response.status, 201)
      return response.data.id
    }
    async function apply(id, token) {
      const response = await request(
        '/applications',
        'POST',
        { project_id: id, pitch: 'I can build this' },
        token
      )
      assert.equal(response.status, 201)
      return response.data.id
    }
    await t.test(
      'validation, authentication and private applicant access',
      async () => {
        assert.equal((await request('/projects/nope')).status, 400)
        assert.equal((await request('/projects?page=1oops')).status, 400)
        assert.equal((await request('/projects?budget=10oops')).status, 400)
        assert.equal((await request('/projects', 'POST', {})).status, 401)
        assert.equal(
          (await request('/auth/login', 'POST', { email: {}, password: [] }))
            .status,
          400
        )
        assert.equal((await request('/auth/register', 'POST', [])).status, 400)
        assert.equal(
          (
            await request('/auth/register', 'POST', {
              name: 'owner',
              email: 'owner@example.test',
              password: 'test-password',
            })
          ).status,
          409
        )
        const id = await project()
        assert.equal(
          (await request(`/projects/${id}`)).data.poster_email,
          undefined
        )
        assert.equal(
          (
            await request(
              `/applications/project/${id}`,
              'GET',
              undefined,
              first
            )
          ).status,
          403
        )
        assert.equal(
          (
            await request(
              '/applications',
              'POST',
              { project_id: id, pitch: 'Own project' },
              owner
            )
          ).status,
          403
        )
        await apply(id, first)
        assert.equal(
          (
            await request(
              '/applications',
              'POST',
              { project_id: id, pitch: 'Again' },
              first
            )
          ).status,
          409
        )
        assert.equal(
          (
            await request(
              `/projects/${id}`,
              'PATCH',
              { title: 'Changed' },
              first
            )
          ).status,
          403
        )
        assert.equal(
          (
            await request(
              `/projects/${id}`,
              'PATCH',
              { budget: '12abc' },
              owner
            )
          ).status,
          400
        )
      }
    )
    await t.test(
      'concurrent acceptance has one winner and an atomic project update',
      async () => {
        const id = await project()
        const a = await apply(id, first),
          b = await apply(id, second)
        const responses = await Promise.all(
          [a, b].map((value) =>
            request(
              `/applications/${value}`,
              'PATCH',
              { status: 'accepted' },
              owner
            )
          )
        )
        assert.deepEqual(responses.map((r) => r.status).sort(), [200, 409])
        const apps = (
          await request(`/applications/project/${id}`, 'GET', undefined, owner)
        ).data
        assert.equal(apps.filter((a) => a.status === 'accepted').length, 1)
        assert.equal(apps.filter((a) => a.status === 'rejected').length, 1)
        assert.equal(
          (await request(`/projects/${id}`)).data.status,
          'in_progress'
        )
        assert.equal(
          (await request(`/projects/${id}`, 'PATCH', { status: 'open' }, owner))
            .status,
          409
        )
        const winner = apps.find((a) => a.status === 'accepted').id
        assert.equal(
          (
            await request(
              `/applications/${winner}`,
              'PATCH',
              { status: 'accepted' },
              owner
            )
          ).status,
          200
        )
        assert.equal(
          (
            await request(
              `/applications/${winner}`,
              'PATCH',
              { status: 'rejected' },
              owner
            )
          ).status,
          200
        )
        assert.equal((await request(`/projects/${id}`)).data.status, 'open')
      }
    )
    await t.test(
      'rejecting a pending applicant preserves manual closure',
      async () => {
        const id = await project(),
          a = await apply(id, first)
        await request(`/projects/${id}`, 'PATCH', { status: 'closed' }, owner)
        assert.equal(
          (
            await request(
              `/applications/${a}`,
              'PATCH',
              { status: 'accepted' },
              owner
            )
          ).status,
          409
        )
        assert.equal(
          (
            await request(
              `/applications/${a}`,
              'PATCH',
              { status: 'rejected' },
              owner
            )
          ).status,
          200
        )
        assert.equal((await request(`/projects/${id}`)).data.status, 'closed')
      }
    )
    await t.test(
      'a database failure rolls back every acceptance write',
      async () => {
        const id = await project(),
          a = await apply(id, first)
        await db.query(
          `CREATE FUNCTION fail_project_update() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'forced test failure'; END $$`
        )
        await db.query(
          `CREATE TRIGGER fail_update BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION fail_project_update()`
        )
        try {
          const response = await request(
            `/applications/${a}`,
            'PATCH',
            { status: 'accepted' },
            owner
          )
          assert.equal(response.status, 500)
          assert.deepEqual(response.data, { error: 'Internal server error' })
          assert.equal((await request(`/projects/${id}`)).data.status, 'open')
          assert.equal(
            (
              await request(
                `/applications/project/${id}`,
                'GET',
                undefined,
                owner
              )
            ).data[0].status,
            'pending'
          )
        } finally {
          await db.query('DROP TRIGGER fail_update ON projects')
        }
      }
    )
  }
)
