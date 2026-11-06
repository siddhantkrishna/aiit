-- Additive attendance upgrade. Existing attendance values and duplicate indexes are preserved.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.staff_attendance
 ADD COLUMN IF NOT EXISTS shift_start time,
 ADD COLUMN IF NOT EXISTS notes text,
 ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS marked_by integer,
 ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;
-- Fail safely instead of deleting any conflicting historical records.
CREATE UNIQUE INDEX IF NOT EXISTS staff_attendance_staff_date_unique ON public.staff_attendance(staff_id,attendance_date);
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.staff_attendance'::regclass AND conname='staff_attendance_staff_id_fkey') THEN
  ALTER TABLE public.staff_attendance ADD CONSTRAINT staff_attendance_staff_id_fkey FOREIGN KEY(staff_id) REFERENCES public.staff(id) NOT VALID;
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.staff_attendance'::regclass AND conname='attendance_values_valid') THEN
  ALTER TABLE public.staff_attendance ADD CONSTRAINT attendance_values_valid CHECK (
   leave_status IN ('PRESENT','ABSENT','HALF DAY','LEAVE') AND version > 0 AND late_minutes >= 0
   AND (working_hours IS NULL OR working_hours BETWEEN 0 AND 24)
   AND (check_out IS NULL OR (check_in IS NOT NULL AND check_out > check_in AND check_out <= check_in + interval '24 hours'))
   AND (check_in IS NULL OR (check_in AT TIME ZONE 'Asia/Kolkata')::date=attendance_date)
   AND (leave_status NOT IN ('ABSENT','LEAVE') OR (check_in IS NULL AND check_out IS NULL))
   AND (notes IS NULL OR length(notes)<=1000)
  ) NOT VALID;
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.staff_attendance'::regclass AND conname='attendance_hours_calculated') THEN
  ALTER TABLE public.staff_attendance ADD CONSTRAINT attendance_hours_calculated CHECK (
   working_hours IS NOT DISTINCT FROM CASE WHEN check_in IS NOT NULL AND check_out IS NOT NULL
    THEN round(extract(epoch FROM (check_out-check_in))/3600,2) ELSE NULL END
  ) NOT VALID;
 END IF;
END $$;
-- New attendance endpoints use the server connection; no browser Data API access is needed.
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.staff_attendance FROM PUBLIC,anon,authenticated;
COMMIT;
