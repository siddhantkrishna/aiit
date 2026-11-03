// Read-only verification. Does not print document paths, content, signed URLs, or secrets.
require('dotenv').config({ path: '.env.local', quiet: true });
const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
(async () => {
  if (!process.env.SUPABASE_ANON_KEY) throw new Error('SUPABASE_ANON_KEY is required to verify anonymous policy denial.');
  const storage = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const bucket = await storage.storage.getBucket('documents');
  if (bucket.error || !bucket.data || bucket.data.public) throw new Error('Documents bucket is missing or still public.');
  const url = new URL(process.env.DATABASE_URL);
  for (const key of ['sslmode','sslcert','sslkey','sslrootcert']) url.searchParams.delete(key);
  const client = new Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: true, ...(process.env.DATABASE_CA_CERT ? { ca: process.env.DATABASE_CA_CERT.replace(/\\n/g, '\n') } : {}) }, connectionTimeoutMillis: 10000 });
  try {
    await client.connect();
    await client.query('BEGIN READ ONLY');
    const result = await client.query(`select file_path as path from documents union select payment_screenshot_path from applications where payment_screenshot_path is not null union select resume_path from vacancy_applications where resume_path is not null union select storage_path from student_documents where storage_path is not null union select proof_path from payments where proof_path is not null union select admit_card_path from students where admit_card_path is not null`);
    await client.query('ROLLBACK');
    let verified = 0;
    for (const row of result.rows) {
      let objectPath = row.path;
      if (/^https?:\/\//.test(objectPath)) {
        const old = new URL(objectPath); const prefix = '/storage/v1/object/public/documents/';
        if (old.origin !== new URL(process.env.SUPABASE_URL).origin || !old.pathname.startsWith(prefix)) throw new Error('An existing document uses an unsupported origin or bucket; preserve and review it.');
        objectPath = decodeURIComponent(old.pathname.slice(prefix.length));
      }
      if (!objectPath || objectPath.startsWith('/') || objectPath.split('/').includes('..')) throw new Error('An existing object path needs review.');
      const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
      const base = `${process.env.SUPABASE_URL}/storage/v1/object`;
      for (const [kind, headers] of [['public', {}], ['authenticated', { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}` }]]) {
        const response = await fetch(`${base}/${kind}/documents/${encodedPath}`, { method: 'HEAD', headers, signal: AbortSignal.timeout(15000) });
        if (![400,401,403,404].includes(response.status)) throw new Error('Anonymous denial could not be verified for an existing document.');
      }
      const signed = await storage.storage.from('documents').createSignedUrl(objectPath, 120);
      if (signed.error || !signed.data) throw new Error('Could not sign an existing document.');
      const response = await fetch(signed.data.signedUrl, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error('Authorized access failed for an existing document.');
      verified++;
    }
    if (!verified) throw new Error('No referenced objects to verify. Upload a test document through the authorized admin form and retry.');
    console.log(`Verified ${verified} referenced objects: bucket private, anonymous reads denied, authorized signed reads succeed.`);
    console.log('Also confirm the expired link is denied after two minutes, then check the owner workflow in the preview.');
  } finally { await client.end().catch(() => {}); }
})().catch(() => { console.error('Private storage verification did not complete. Check the CA, bucket policies, object references and anonymous key; no data was changed.'); process.exitCode = 1; });
