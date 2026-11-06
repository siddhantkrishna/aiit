-- Additive offline receiving audit. Existing Razorpay and historical credit tables are unchanged.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TABLE IF NOT EXISTS public.offline_receipts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  receipt_no varchar(60) NOT NULL UNIQUE,
  request_key uuid NOT NULL UNIQUE,
  application_id integer REFERENCES public.applications(id),
  student_id bigint REFERENCES public.students(id),
  course_id integer REFERENCES public.courses(id),
  centre_id integer REFERENCES public.centres(id),
  fee_credit_id integer UNIQUE REFERENCES public.fee_offline_credits(id),
  purpose_type varchar(25) NOT NULL CHECK (purpose_type IN ('TUITION','SERVICE')),
  purpose_name varchar(255) NOT NULL,
  student_name varchar(255) NOT NULL,
  father_name varchar(255),
  mother_name varchar(255),
  student_mobile varchar(20),
  student_email varchar(255),
  payer_name varchar(255) NOT NULL,
  payer_relation varchar(32) NOT NULL,
  payer_mobile varchar(20) NOT NULL,
  payer_email varchar(255),
  receiver_staff_id bigint NOT NULL REFERENCES public.staff(id),
  receiver_name varchar(255) NOT NULL,
  receiver_role varchar(100),
  receiver_department varchar(100),
  receiver_mobile varchar(30),
  receiver_email varchar(255),
  receiver_father_name varchar(255),
  receiver_mother_name varchar(255),
  recorded_by_admin_id integer NOT NULL REFERENCES public.admin(id),
  amount_paise integer NOT NULL CHECK(amount_paise > 0 AND amount_paise <= 1000000000),
  payment_method varchar(24) NOT NULL CHECK(payment_method IN ('CASH','UPI','BANK_TRANSFER','CHEQUE','OTHER')),
  payment_reference varchar(255),
  notes text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT offline_receipt_requires_owner CHECK (application_id IS NOT NULL OR student_id IS NOT NULL),
  CONSTRAINT offline_receipt_credit_scope CHECK (
    (purpose_type = 'TUITION' AND fee_credit_id IS NOT NULL) OR
    (purpose_type = 'SERVICE' AND fee_credit_id IS NULL)
  ),
  CONSTRAINT offline_receipt_reference_required CHECK (payment_method = 'CASH' OR length(trim(coalesce(payment_reference,''))) >= 5)
);
CREATE UNIQUE INDEX IF NOT EXISTS offline_receipt_payment_reference_idx ON public.offline_receipts(payment_method,payment_reference)
  WHERE payment_reference IS NOT NULL AND payment_method <> 'CASH';
CREATE INDEX IF NOT EXISTS offline_receipt_received_idx ON public.offline_receipts(received_at DESC);
CREATE INDEX IF NOT EXISTS offline_receipt_student_idx ON public.offline_receipts(student_id);
CREATE INDEX IF NOT EXISTS offline_receipt_application_idx ON public.offline_receipts(application_id);
CREATE TABLE IF NOT EXISTS public.offline_receipt_notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  receipt_id bigint NOT NULL REFERENCES public.offline_receipts(id),
  channel varchar(12) NOT NULL CHECK(channel IN ('SMS','EMAIL')),
  recipient_type varchar(12) NOT NULL CHECK(recipient_type IN ('PAYER','STUDENT')),
  destination varchar(255) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','sending','accepted','failed','unconfigured')),
  attempts integer NOT NULL DEFAULT 0,
  last_error varchar(255),
  provider_reference varchar(255),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(receipt_id,channel,destination)
);
CREATE INDEX IF NOT EXISTS offline_notification_retry_idx ON public.offline_receipt_notifications(status,receipt_id);
ALTER TABLE public.offline_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_receipt_notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.offline_receipts, public.offline_receipt_notifications FROM PUBLIC,anon,authenticated;
REVOKE ALL ON SEQUENCE public.offline_receipts_id_seq, public.offline_receipt_notifications_id_seq FROM PUBLIC,anon,authenticated;
COMMIT;
