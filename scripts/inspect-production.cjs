// Read-only preflight: print schema coverage and security counts, never records or secrets.
require('dotenv').config({ path: '.env.local', quiet: true });
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
(async () => {
  const url = new URL(process.env.DATABASE_URL);
  for (const key of ['sslmode','sslcert','sslkey','sslrootcert']) url.searchParams.delete(key);
  const client = new Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: true, ...(process.env.DATABASE_CA_CERT ? { ca: process.env.DATABASE_CA_CERT.replace(/\\n/g, '\n') } : {}) }, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await client.query('BEGIN READ ONLY');
    const columns = await client.query("select table_name, column_name from information_schema.columns where table_schema='public' and table_name in ('applications','students','payments','staff','application_status_history','api_rate_limits','centres')");
    const grouped = {};
    for (const row of columns.rows) (grouped[row.table_name] ||= []).push(row.column_name);
    console.log(JSON.stringify({ schema: grouped }));
    const duplicates = await client.query('select count(*)::int as groups from (select application_id from students where application_id is not null group by application_id having count(*) > 1) d');
    console.log(JSON.stringify({ duplicateStudentApplicationGroups: duplicates.rows[0].groups }));
    const centres = await client.query("select code, status from centres where upper(code) in ('GHARGHODA','TAMNAR')");
    console.log(JSON.stringify({ configuredCentres: centres.rows }));
    await client.query('ROLLBACK');
  } catch (error) { console.log(JSON.stringify({ databasePreflight: 'unavailable', code: error.code || 'connection_error' })); process.exitCode = 1; }
  finally { await client.end().catch(() => {}); }
  try {
    const storage = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await storage.storage.getBucket('documents');
    if (error) throw error;
    console.log(JSON.stringify({ documentsBucketExists: !!data, documentsBucketPublic: data?.public }));
  } catch { console.log(JSON.stringify({ storagePreflight: 'unavailable' })); process.exitCode = 1; }
})();
