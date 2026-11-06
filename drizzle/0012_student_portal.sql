BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TABLE IF NOT EXISTS public.student_attendance (
  id bigserial PRIMARY KEY,
  student_id bigint NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status varchar(16) NOT NULL CHECK(status IN ('PRESENT','ABSENT','LATE','EXCUSED')),
  notes text,
  marked_by bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id,attendance_date)
);
CREATE INDEX IF NOT EXISTS student_attendance_date_idx ON public.student_attendance(attendance_date);
CREATE TABLE IF NOT EXISTS public.student_notices (
  id bigserial PRIMARY KEY,
  title varchar(200) NOT NULL,
  body text NOT NULL,
  course_id integer REFERENCES public.courses(id),
  published boolean NOT NULL DEFAULT true,
  posted_at timestamptz NOT NULL DEFAULT now(),
  created_by bigint,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS student_notices_course_idx ON public.student_notices(course_id,published,posted_at DESC);
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.student_attendance,public.student_notices FROM PUBLIC,anon,authenticated;
REVOKE ALL ON SEQUENCE public.student_attendance_id_seq,public.student_notices_id_seq FROM PUBLIC,anon,authenticated;
COMMIT;