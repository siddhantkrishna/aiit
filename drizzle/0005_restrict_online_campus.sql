-- Run after 0002_online_student_services.sql. Browser clients use Next.js APIs; direct Data API access stays blocked.
ALTER TABLE public.online_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.online_classes, public.online_exams, public.online_exam_attempts, public.student_results FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE public.online_classes_id_seq, public.online_exams_id_seq, public.online_exam_attempts_id_seq, public.student_results_id_seq FROM PUBLIC, anon, authenticated;
