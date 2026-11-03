require('./register.cjs');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('node:crypto');
process.env.JWT_SECRET = randomBytes(48).toString('hex');
const { requireAdmin } = require('../src/lib/admin-auth.ts');
const req = token => ({ cookies: { get: () => token ? { value: token } : undefined } });
test('student tokens cannot authorize admin operations', () => {
  assert.equal(requireAdmin(req(jwt.sign({ studentId: '1', role: 'student' }, process.env.JWT_SECRET))), null);
});
test('missing or invalid tokens fail closed', () => {
  assert.equal(requireAdmin(req()), null);
  assert.equal(requireAdmin(req('invalid')), null);
});
