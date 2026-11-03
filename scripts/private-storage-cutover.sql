-- Run in the Supabase Storage project's SQL editor only after backup and approval.
-- Keeps every existing object and path. The private bucket's public URL stops working.
BEGIN;
UPDATE storage.buckets SET public = false WHERE id = 'documents';
DO $policy$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'aiit_documents_server_only') THEN
    CREATE POLICY aiit_documents_server_only ON storage.objects AS RESTRICTIVE
      FOR ALL TO anon, authenticated
      USING (bucket_id <> 'documents') WITH CHECK (bucket_id <> 'documents');
  END IF;
END $policy$;
COMMIT;
-- The service-role client bypasses RLS. Custom AIIT JWTs never access storage directly.
-- Run scripts/verify-private-storage.cjs afterwards; changing the flag alone is not verification.
