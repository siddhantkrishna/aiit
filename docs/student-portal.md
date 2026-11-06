# Unified student portal

Student login: `/student` (existing Student ID, registered mobile, date of birth; 8-hour, HttpOnly SameSite session).

### Features
- Dashboard with enrollment status, next class, notices, service requests and attendance summary
- Printable digital student ID with logo, student ID, enrollment, course, university and status; not represented as a university-issued certificate
- Read-only academic/contact profile; corrections through student services
- Course-scoped published classes and exams; exam attempts remain server-graded
- Staff-marked daily student attendance (no fabricated records)
- Published student-specific results, excluding unpublished marks
- Private documents: PDF/PNG/JPEG under 5 MB, verified by staff; stored in private `documents` bucket with student-bound paths; student/admin downloads require sessions and receive short-lived signed URLs
- Fee plan, independent semester payment options, Razorpay receipts through existing ledger
- Service request submission and status updates through existing student_services, staff status/remarks workflow
- Campus-wide and course notices with publish/unpublish controls

### Staff workflows
Admin dashboard navigation adds Student Attendance, Student Documents and Student Notices. Existing Student Services now supports student-facing responses and status changes.

### Security
- Student-facing requests use the authenticated cookie identity; there is no client-provided student ID for queries or writes.
- Admin routes for classes, exams, student results, notices, document review, services and attendance now enforce admin authentication.
- Online exams must match the enrolled course or be campus-wide; correct answers are never returned in student exam API responses.
- Requests to mutate records reject foreign origins. Document uploads check size, MIME and byte signatures and use non-guessable storage keys.
- Neither attendance nor results are generated from demonstration data. No fabricated marks, certificates or payments are created.
- **Known authentication limitation:** Existing student verification uses ID+mobile+date of birth. For a production institution, upgrade to an OTP or password plus account-recovery security and rate limiting before broad rollout.
- **Photo:** The ID uses a staff-verified student photograph when available and otherwise uses initials; photographs must be JPEG or PNG.

Migration `drizzle/0012_student_portal.sql` creates `student_attendance` and `student_notices` with RLS and denies anonymous/authenticated direct database access. All other existing tables are reused and existing records preserved.
