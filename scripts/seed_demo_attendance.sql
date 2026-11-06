-- Run AFTER drizzle/0007_staff_attendance.sql. Demo only; no real staff or existing records are overwritten.
BEGIN;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.staff WHERE employee_id IN ('DEMO-EMP-001','DEMO-EMP-002','DEMO-EMP-003'))<>3 THEN
  RAISE EXCEPTION 'The three existing DEMO employees are required. No employees or attendance have been created.';
 END IF;
END $$;
WITH samples(employee_id,day,status,start_time,end_time) AS (VALUES
 ('DEMO-EMP-001','2026-10-26','PRESENT','09:00','17:00'),
 ('DEMO-EMP-001','2026-10-27','PRESENT','09:20','17:15'),
 ('DEMO-EMP-001','2026-10-28','HALF DAY','09:00','13:00'),
 ('DEMO-EMP-001','2026-10-29','LEAVE',NULL,NULL),
 ('DEMO-EMP-001','2026-10-30','PRESENT','08:55','17:05'),
 ('DEMO-EMP-002','2026-10-26','PRESENT','09:05','17:00'),
 ('DEMO-EMP-002','2026-10-27','ABSENT',NULL,NULL),
 ('DEMO-EMP-002','2026-10-28','PRESENT','09:00','17:00'),
 ('DEMO-EMP-002','2026-10-29','PRESENT','09:35','17:30'),
 ('DEMO-EMP-002','2026-10-30','HALF DAY','09:00','13:00'),
 ('DEMO-EMP-003','2026-10-26','LEAVE',NULL,NULL),
 ('DEMO-EMP-003','2026-10-27','PRESENT','09:00','17:00'),
 ('DEMO-EMP-003','2026-10-28','PRESENT','09:10','17:00'),
 ('DEMO-EMP-003','2026-10-29','PRESENT','09:00','17:00'),
 ('DEMO-EMP-003','2026-10-30','ABSENT',NULL,NULL)
), prepared AS (
 SELECT s.id,s.centre_id,x.day::date attendance_date,x.status,
  CASE WHEN start_time IS NOT NULL THEN (x.day::date+start_time::time) AT TIME ZONE 'Asia/Kolkata' END check_in,
  CASE WHEN end_time IS NOT NULL THEN (x.day::date+end_time::time) AT TIME ZONE 'Asia/Kolkata' END check_out
 FROM samples x JOIN public.staff s ON s.employee_id=x.employee_id
)
INSERT INTO public.staff_attendance(staff_id,centre_id,attendance_date,leave_status,check_in,check_out,shift_start,working_hours,late_minutes,is_demo,notes)
SELECT id,centre_id,attendance_date,status,check_in,check_out,'09:00',
 CASE WHEN check_out IS NOT NULL THEN round(extract(epoch FROM(check_out-check_in))/3600,2) END,
 CASE WHEN check_in IS NOT NULL THEN greatest(0,floor(extract(epoch FROM(check_in-((attendance_date+time '09:00') AT TIME ZONE 'Asia/Kolkata')))/60))::int ELSE 0 END,
 true,'DEMO — Attendance workflow example. Excluded from official reports.'
FROM prepared ON CONFLICT(staff_id,attendance_date) DO NOTHING;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.staff_attendance a JOIN public.staff s ON s.id=a.staff_id
  WHERE s.employee_id IN ('DEMO-EMP-001','DEMO-EMP-002','DEMO-EMP-003') AND a.attendance_date BETWEEN '2026-10-26' AND '2026-10-30' AND a.is_demo) <> 15 THEN
  RAISE EXCEPTION 'Existing attendance conflicts with the demo week. Nothing has been overwritten.';
 END IF;
END $$;
COMMIT;
