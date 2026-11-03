const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
let seedCalls = 0;
let queries = 0;
let databaseFails = false;
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === '@/db') return { db: { execute: async () => { queries++; if (databaseFails) throw new Error('private database details'); return { rows: [{ ok: 1 }] }; } } };
  if (name === '@/db/seed') return { seedDatabase: async () => { seedCalls++; } };
  return originalLoad.call(this, name, ...args);
};
require.extensions['.ts'] = function (module, filename) {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2021, esModuleInterop: true }, fileName: filename,
  }).outputText, filename);
};
const seedRoute = require('../src/app/api/seed/route.ts');
const healthRoute = require('../src/app/api/health/route.ts');
test('public seed endpoint returns Gone without touching data or seeding', async () => {
  const response = await seedRoute.POST();
  assert.equal(response.status, 410); assert.equal(queries, 0); assert.equal(seedCalls, 0);
});
test('health checks execute only a connectivity query and never seed', async () => {
  queries = 0; seedCalls = 0;
  const response = await healthRoute.GET();
  assert.equal(response.status, 200); assert.equal(queries, 1); assert.equal(seedCalls, 0);
});
test('failed health checks return a safe unavailable response', async () => {
  databaseFails = true;
  const response = await healthRoute.GET();
  assert.equal(response.status, 503); assert.equal(JSON.stringify(await response.json()).includes('private database details'), false);
  databaseFails = false;
});
test('seed helper is disabled and contains no database writes or literal password hashing', async () => {
  const source = fs.readFileSync(require.resolve('../src/db/seed.ts'), 'utf8');
  assert.ok(!/\bdb\.(insert|update|delete)|bcrypt\.hash\(\s*["']/.test(source), 'Seed helper must not write data or embed credentials');
  const { seedDatabase } = require('../src/db/seed.ts');
  await assert.rejects(() => seedDatabase(), /disabled/i);
});
test('review branches cannot trigger Vercel Git deployments', () => {
  const rules = JSON.parse(fs.readFileSync('vercel.json', 'utf8')).git.deploymentEnabled;
  assert.equal(rules['codex/disable-production-seeding'], false);
  assert.equal(rules['codex/secure-college-operations'], false);
  assert.equal(Object.hasOwn(rules, 'main'), false);
});
