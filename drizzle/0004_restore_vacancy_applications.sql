-- Reproducible, additive schema repair for missing job application records.
-- Restored in the AIIT production Supabase database on 2026-10-27.
-- Public API clients must never be able to read applicant contact details.
CREATE TABLE IF NOT EXISTS public.vacancy_applications (
  id SERIAL PRIMARY KEY,
  application_id VARCHAR(50) NOT NULL UNIQUE,
  vacancy_id INTEGER NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  mobile VARCHAR(15) NOT NULL,
  email VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  qualification TEXT,
  experience TEXT,
  resume_path TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  declaration BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vacancy_applications_created_at_idx
  ON public.vacancy_applications (created_at DESC);
CREATE INDEX IF NOT EXISTS vacancy_applications_vacancy_id_idx
  ON public.vacancy_applications (vacancy_id);
ALTER TABLE public.vacancy_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.vacancy_applications FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.vacancy_applications_id_seq FROM PUBLIC, anon, authenticated;
