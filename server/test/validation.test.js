const { test } = require('node:test')
const assert = require('node:assert/strict')
const { projectFields, budget, uuid } = require('../middleware/validation')
const errorHandler = require('../middleware/error')
const valid = {
  title: ' Project ',
  description: 'Brief',
  tech_stack: ['React', 'react'],
  deadline: '2028-02-29',
  budget: 0,
}

test('project normalization preserves zero and deduplicates stack', () => {
  const result = projectFields(valid)
  assert.equal(result.title, 'Project')
  assert.equal(result.budget, 0)
  assert.deepEqual(result.tech_stack, ['react'])
  assert.equal(
    projectFields({ title: 'Updated' }, result).deadline,
    valid.deadline
  )
})

test('malformed project fields are rejected rather than coerced', () => {
  for (const patch of [
    { title: {} },
    { title: ' ' },
    { description: 1 },
    { tech_stack: [null] },
    { tech_stack: [] },
    { deadline: '2027-02-29' },
    { deadline: '2026-04-31' },
    { status: null },
  ]) {
    assert.throws(() => projectFields({ ...valid, ...patch }), { status: 400 })
  }
  for (const value of ['12abc', 1.5, -1, {}, true, ' ', 2147483648])
    assert.throws(() => budget(value, null), { status: 400 })
  assert.throws(() => uuid('not-an-id'), { status: 400 })
})

test('unexpected errors never expose implementation details', (t) => {
  t.mock.method(console, 'error', () => {})
  let status, body
  errorHandler(
    new Error('password_hash SQL connection details'),
    {},
    {
      status(value) {
        status = value
        return this
      },
      json(value) {
        body = value
      },
    },
    () => {}
  )
  assert.equal(status, 500)
  assert.deepEqual(body, { error: 'Internal server error' })
})
