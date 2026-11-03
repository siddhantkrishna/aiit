// Installs the test-only PostgreSQL engine in a disposable directory, never in the app.
const { mkdtempSync, readdirSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const assert = require('node:assert/strict');
const directory = mkdtempSync(path.join(tmpdir(), 'aiit-tests-'));
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}
try {
  run('npm', ['install', '--prefix', directory, '--no-save', '--ignore-scripts', '@electric-sql/pglite@0.5.14']);
  const schemaDirectory = path.join(directory, 'schema');
  run(process.execPath, [path.join(path.dirname(require.resolve('drizzle-kit')), 'bin.cjs'), 'generate', '--dialect', 'postgresql', '--schema', './src/db/schema.ts', '--out', schemaDirectory]);
  const sqlFiles = readdirSync(schemaDirectory).filter(file => file.endsWith('.sql'));
  assert.equal(sqlFiles.length, 1, 'A fresh isolated schema must contain exactly one migration');
  const testFiles = readdirSync('tests').filter(file => file.endsWith('.test.cjs')).map(file => path.join('tests', file));
  run(process.execPath, ['--test', ...testFiles], { env: { ...process.env, NODE_PATH: [path.join(directory, 'node_modules'), process.env.NODE_PATH].filter(Boolean).join(path.delimiter), AIIT_TEST_PGLITE_MODULE: path.join(directory, 'node_modules/@electric-sql/pglite'), AIIT_TEST_SCHEMA: path.join(schemaDirectory, sqlFiles[0]) } });
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { rmSync(directory, { recursive: true, force: true }); }
