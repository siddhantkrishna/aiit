-- Idempotent, explicitly labeled demonstration records. Run manually only in a demo-enabled AIIT environment.
BEGIN;
INSERT INTO public.staff (employee_id,name,role,department,status) VALUES
  ('DEMO-EMP-001', 'DEMO — Computer Science Faculty', 'Instructor', 'Academics', 'ACTIVE'),
  ('DEMO-EMP-002', 'DEMO — Digital Skills Faculty', 'Instructor', 'Academics', 'ACTIVE'),
  ('DEMO-EMP-003', 'DEMO — Student Support Coordinator', 'Coordinator', 'Student Services', 'ACTIVE')
ON CONFLICT (employee_id) DO NOTHING;

INSERT INTO public.online_classes (title,description,instructor,scheduled_at,duration_minutes,status,enabled)
SELECT 'DEMO — Introduction to Computers', 'Demonstration lesson. No live meeting is scheduled; this listing is for testing the digital campus.', 'DEMO — Computer Science Faculty', '2026-11-12 17:00:00', 60, 'SCHEDULED', true
WHERE NOT EXISTS (SELECT 1 FROM public.online_classes WHERE title = 'DEMO — Introduction to Computers');

INSERT INTO public.online_classes (title,description,instructor,scheduled_at,duration_minutes,status,enabled)
SELECT 'DEMO — Getting Started with Python', 'Sample online class for testing the AIIT scheduling workflow. Not a real live session.', 'DEMO — Digital Skills Faculty', '2026-11-13 17:00:00', 60, 'SCHEDULED', true
WHERE NOT EXISTS (SELECT 1 FROM public.online_classes WHERE title = 'DEMO — Getting Started with Python');

INSERT INTO public.online_classes (title,description,instructor,scheduled_at,duration_minutes,status,enabled)
SELECT 'DEMO — Internet and Cyber Safety', 'Sample digital literacy class. This is demonstration content, not an instructor booking.', 'DEMO — Digital Skills Faculty', '2026-11-14 17:00:00', 60, 'SCHEDULED', true
WHERE NOT EXISTS (SELECT 1 FROM public.online_classes WHERE title = 'DEMO — Internet and Cyber Safety');

INSERT INTO public.online_exams (exam_code,title,instructions,duration_minutes,total_marks,passing_marks,questions,published)
VALUES ('DEMO-COMPUTERS-01', 'DEMO — Computer Fundamentals', 'DEMO ONLY — Practice questions. No official grading or certification.', 20, 5, 3, '[{"id":"q1","question":"What does CPU stand for?","options":["Central Processing Unit","Computer Power Unit","Control Program Unit","Central Printing Unit"],"correctAnswer":0,"marks":1},{"id":"q2","question":"Which component is used for temporary working memory?","options":["SSD","RAM","Monitor","Keyboard"],"correctAnswer":1,"marks":1},{"id":"q3","question":"Which device is typically used to enter text?","options":["Printer","Speaker","Keyboard","Projector"],"correctAnswer":2,"marks":1},{"id":"q4","question":"Which of these is an operating system?","options":["Windows","Google Chrome","Microsoft Word","PDF"],"correctAnswer":0,"marks":1},{"id":"q5","question":"What does URL identify?","options":["A webpage address","A battery type","A cable connector","An image format"],"correctAnswer":0,"marks":1}]'::jsonb, true)
ON CONFLICT (exam_code) DO NOTHING;

INSERT INTO public.online_exams (exam_code,title,instructions,duration_minutes,total_marks,passing_marks,questions,published)
VALUES ('DEMO-WEB-01', 'DEMO — Internet & Web Basics', 'DEMO ONLY — Practice questions. No official grading or certification.', 20, 5, 3, '[{"id":"q1","question":"What does HTTPS indicate?","options":["An encrypted web connection","An offline website","A file size","A Wi-Fi network name"],"correctAnswer":0,"marks":1},{"id":"q2","question":"Which application opens websites?","options":["Web browser","Spreadsheet","File compressor","Calculator"],"correctAnswer":0,"marks":1},{"id":"q3","question":"What should you do with a suspicious link?","options":["Open it immediately","Verify the sender and URL","Forward it to everyone","Provide your password"],"correctAnswer":1,"marks":1},{"id":"q4","question":"What is two-factor authentication?","options":["Two independent verification steps","Two browsers","Two passwords stored publicly","Two monitors"],"correctAnswer":0,"marks":1},{"id":"q5","question":"Which information should never be shared in a chat?","options":["A public webpage link","Your one-time login code","A school timetable","A weather forecast"],"correctAnswer":1,"marks":1}]'::jsonb, true)
ON CONFLICT (exam_code) DO NOTHING;

INSERT INTO public.online_exams (exam_code,title,instructions,duration_minutes,total_marks,passing_marks,questions,published)
VALUES ('DEMO-PYTHON-01', 'DEMO — Introduction to Python', 'DEMO ONLY — Practice questions. No official grading or certification.', 20, 5, 3, '[{"id":"q1","question":"Which symbol starts a comment in Python?","options":["#","//","<!--","%"],"correctAnswer":0,"marks":1},{"id":"q2","question":"Which expression prints text?","options":["show(''Hi'')","print(''Hi'')","echo(''Hi'')","write(''Hi'')"],"correctAnswer":1,"marks":1},{"id":"q3","question":"What is the value of 2 + 3?","options":["23","6","5","1"],"correctAnswer":2,"marks":1},{"id":"q4","question":"Which type stores True or False?","options":["string","integer","boolean","list"],"correctAnswer":2,"marks":1},{"id":"q5","question":"What does len(''cat'') return?","options":["2","3","4","0"],"correctAnswer":1,"marks":1}]'::jsonb, true)
ON CONFLICT (exam_code) DO NOTHING;

COMMIT;
