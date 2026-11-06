-- Additive only. Run once after 0005, as the application database owner.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE UNIQUE INDEX students_application_unique ON public.students(application_id) WHERE application_id IS NOT NULL;
ALTER TABLE public.students ADD CONSTRAINT students_application_ref_fk FOREIGN KEY (application_id) REFERENCES public.applications(application_id) NOT VALID;
CREATE FUNCTION public.fee_schedule_valid(total integer, semesters integer, schedule jsonb)
RETURNS boolean LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = pg_catalog AS $$
DECLARE item jsonb; n integer := 0; fee bigint := 0; summed bigint := 0; due date; previous date;
BEGIN
 IF jsonb_typeof(schedule) <> 'array' OR jsonb_array_length(schedule) <> semesters THEN RETURN false; END IF;
 FOR item IN SELECT jsonb_array_elements(schedule) LOOP
  n := n+1;
  IF NOT (item ?& ARRAY['semester','amount','dueDate']) THEN RETURN false; END IF;
  IF jsonb_typeof(item->'amount') <> 'number' OR (item->>'amount')::numeric <> trunc((item->>'amount')::numeric) THEN RETURN false; END IF;
  IF jsonb_typeof(item->'semester') IS DISTINCT FROM 'number' OR jsonb_typeof(item->'dueDate') IS DISTINCT FROM 'string' THEN RETURN false; END IF;
  fee := (item->>'amount')::bigint;
  IF (item->>'semester')::integer <> n OR fee < 100 OR fee > 1000000000 OR NOT (item->>'dueDate' ~ '^\d{4}-\d{2}-\d{2}$') THEN RETURN false; END IF;
  due := (item->>'dueDate')::date;
  IF previous IS NOT NULL AND due < previous THEN RETURN false; END IF;
  previous := due; summed := summed+fee;
 END LOOP;
 RETURN summed = total;
EXCEPTION WHEN others THEN RETURN false;
END $$;
REVOKE ALL ON FUNCTION public.fee_schedule_valid(integer,integer,jsonb) FROM PUBLIC, anon, authenticated;
CREATE TABLE public.fee_configurations (
 id serial PRIMARY KEY, course_id integer NOT NULL REFERENCES public.courses(id),
 university_id integer REFERENCES public.universities(id), original_amount integer NOT NULL,
 semesters integer NOT NULL, schedule jsonb NOT NULL, effective_from date NOT NULL,
 created_by integer NOT NULL, reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT fee_config_amount CHECK (original_amount > 0 AND original_amount <= 1000000000 AND semesters BETWEEN 1 AND 24),
 CONSTRAINT fee_config_schedule CHECK(public.fee_schedule_valid(original_amount,semesters,schedule))
);
CREATE INDEX fee_config_course_idx ON public.fee_configurations(course_id,effective_from);
CREATE TABLE public.fee_access (
 application_id integer PRIMARY KEY REFERENCES public.applications(id), recovery_hash text NOT NULL UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.fee_plans (
 id serial PRIMARY KEY, application_id integer UNIQUE REFERENCES public.applications(id),
 student_id bigint UNIQUE REFERENCES public.students(id), course_id integer NOT NULL REFERENCES public.courses(id),
 configuration_id integer NOT NULL REFERENCES public.fee_configurations(id), kind text NOT NULL,
 legacy_reviewed boolean NOT NULL DEFAULT false,
 original_amount integer NOT NULL, discount integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT fee_plan_owner CHECK (application_id IS NOT NULL OR student_id IS NOT NULL),
 CONSTRAINT fee_plan_kind CHECK (kind IN ('full','semester')),
 CONSTRAINT fee_plan_money CHECK (original_amount > 0 AND discount BETWEEN 0 AND original_amount)
);
CREATE TABLE public.fee_obligations (
 id serial PRIMARY KEY, plan_id integer NOT NULL REFERENCES public.fee_plans(id),
 semester integer NOT NULL, amount integer NOT NULL, due_date date NOT NULL,
 CONSTRAINT fee_obligation_money CHECK (amount > 0 AND amount <= 1000000000 AND semester BETWEEN 0 AND 24)
);
CREATE UNIQUE INDEX fee_obligation_semester_idx ON public.fee_obligations(plan_id,semester);
CREATE TABLE public.fee_orders (
 id text PRIMARY KEY, obligation_id integer NOT NULL REFERENCES public.fee_obligations(id),
 razorpay_order_id text UNIQUE, key_id text NOT NULL, amount integer NOT NULL,
 currency text NOT NULL DEFAULT 'INR', status text NOT NULL DEFAULT 'creating',
 reconciled_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT fee_order_money CHECK (amount > 0 AND currency = 'INR')
);
CREATE UNIQUE INDEX fee_active_obligation_idx ON public.fee_orders(obligation_id) WHERE status <> 'paid';
CREATE INDEX fee_order_obligation_idx ON public.fee_orders(obligation_id);
CREATE TABLE public.fee_transactions (
 id serial PRIMARY KEY, order_id text NOT NULL REFERENCES public.fee_orders(id),
 razorpay_payment_id text NOT NULL UNIQUE, amount integer NOT NULL, refunded integer NOT NULL DEFAULT 0,
 gateway_fee integer, gateway_tax integer, currency text NOT NULL DEFAULT 'INR', status text NOT NULL,
 method text, failure_code text, refund_status jsonb, captured_at timestamptz,
 updated_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT fee_transaction_money CHECK (amount > 0 AND refunded BETWEEN 0 AND amount AND currency = 'INR'),
 CONSTRAINT fee_transaction_status CHECK (status IN ('created','authorized','captured','failed','refunded'))
);
CREATE UNIQUE INDEX fee_capture_order_idx ON public.fee_transactions(order_id) WHERE captured_at IS NOT NULL;
CREATE INDEX fee_transaction_order_idx ON public.fee_transactions(order_id);
CREATE INDEX fee_transaction_date_idx ON public.fee_transactions(captured_at);
CREATE TABLE public.fee_receipts (
 id text PRIMARY KEY, transaction_id integer NOT NULL UNIQUE REFERENCES public.fee_transactions(id),
 snapshot jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.fee_webhooks (
 event_id text PRIMARY KEY, body_hash text NOT NULL UNIQUE, event text NOT NULL, order_id text,
 status text NOT NULL, attempts integer NOT NULL DEFAULT 1, processed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fee_webhook_order_idx ON public.fee_webhooks(order_id);
CREATE TABLE public.fee_audit (
 id serial PRIMARY KEY, plan_id integer REFERENCES public.fee_plans(id), admin_id integer NOT NULL,
 action text NOT NULL, reason text NOT NULL, details jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fee_audit_plan_idx ON public.fee_audit(plan_id);
CREATE TABLE public.fee_offline_credits (
 id serial PRIMARY KEY, obligation_id integer NOT NULL REFERENCES public.fee_obligations(id),
 amount integer NOT NULL CHECK(amount > 0), reference text NOT NULL UNIQUE, reason text NOT NULL,
 admin_id integer NOT NULL, received_at date NOT NULL, legacy boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX fee_offline_obligation_idx ON public.fee_offline_credits(obligation_id);
-- Only server-side Drizzle access: no browser/Data API policies.
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['fee_configurations','fee_access','fee_plans','fee_obligations','fee_orders','fee_transactions','fee_receipts','fee_webhooks','fee_audit','fee_offline_credits'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated',t);
 END LOOP;
END $$;
REVOKE ALL ON SEQUENCE public.fee_configurations_id_seq, public.fee_plans_id_seq, public.fee_obligations_id_seq, public.fee_transactions_id_seq, public.fee_audit_id_seq, public.fee_offline_credits_id_seq FROM PUBLIC, anon, authenticated;
COMMIT;
