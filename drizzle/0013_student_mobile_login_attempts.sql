-- Bound unauthenticated attempts at student portal login by a one-way
-- HMAC of the supplied registered mobile number; no raw PII is persisted here.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TABLE IF NOT EXISTS public.student_login_attempts (
  scope_hash varchar(64) PRIMARY KEY,
  failed_count integer NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_login_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.student_login_attempts FROM PUBLIC,anon,authenticated;
CREATE INDEX IF NOT EXISTS student_login_attempts_updated_at_idx ON public.student_login_attempts(updated_at);
COMMIT;
