-- Review and apply once with a database backup; never run automatically at startup.
BEGIN;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS qualification text;
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS access_code_hash text,
  ADD COLUMN IF NOT EXISTS father_name varchar(255),
  ADD COLUMN IF NOT EXISTS mother_name varchar(255),
  ADD COLUMN IF NOT EXISTS university_status varchar(50) DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS university_submitted_at date,
  ADD COLUMN IF NOT EXISTS university_next_action text,
  ADD COLUMN IF NOT EXISTS required_documents text,
  ADD COLUMN IF NOT EXISTS admit_card_path text;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS responsibilities text;
CREATE TABLE IF NOT EXISTS api_rate_limits (
  key text PRIMARY KEY,
  attempts integer NOT NULL,
  expires_at timestamptz NOT NULL
);
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON api_rate_limits FROM PUBLIC;
CREATE INDEX IF NOT EXISTS api_rate_limits_expiry_idx ON api_rate_limits(expires_at);
CREATE INDEX IF NOT EXISTS students_application_idx ON students(application_id);
CREATE INDEX IF NOT EXISTS students_identity_idx ON students(mobile, dob, course_id);
CREATE INDEX IF NOT EXISTS application_history_application_idx ON application_status_history(application_id, changed_at);
CREATE INDEX IF NOT EXISTS payments_student_status_idx ON payments(student_id, payment_status);
CREATE INDEX IF NOT EXISTS attendance_staff_date_idx ON staff_attendance(staff_id, attendance_date);
CREATE INDEX IF NOT EXISTS leads_followup_idx ON leads(next_follow_up_at);
-- All browser access uses the Next.js API. Custom JWTs do not authorize Supabase's Data API.
-- The server database role must own these tables or have BYPASSRLS; grants alone do not bypass RLS.
DO $security$
DECLARE table_name text; client_role text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['universities', 'courses', 'centres', 'leads', 'lead_follow_ups', 'university_programs', 'applications', 'application_status_history', 'documents', 'students', 'student_documents', 'payments', 'student_services', 'staff', 'staff_tasks', 'staff_attendance', 'staff_roles', 'staff_sops', 'staff_training_programs', 'staff_training_records', 'performance_reviews', 'incentive_rules', 'staff_incentives', 'marketing_campaigns', 'marketing_activities', 'sales_targets', 'accounting_transactions', 'expenses', 'financial_controls', 'financial_control_logs', 'job_openings', 'job_applicants', 'replication_templates', 'replication_instances', 'vacancies', 'vacancy_applications', 'admin', 'online_classes', 'online_exams', 'online_exam_attempts', 'student_results', 'api_rate_limits'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', table_name);
    FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, client_role);
      END IF;
    END LOOP;
  END LOOP;
  FOREACH table_name IN ARRAY ARRAY['management_daily_summary', 'management_monthly_summary', 'management_centre_performance'] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC', table_name);
      FOREACH client_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = client_role) THEN
          EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I', table_name, client_role);
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END $security$;
COMMIT;
