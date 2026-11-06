# Staff attendance

This PR replaces the attendance API and dashboard and adds attendance history to `/admin/dashboard/staff/[id]`. It uses the existing `staff` and `staff_attendance` tables, admin sessions, Drizzle and Next.js route handlers. It adds no packages and changes no Razorpay code. The source checkout remains on its Razorpay branch; attendance work is in a separate worktree and branch.

## Audit findings

Production inspection found three existing demo staff, zero attendance records, unique employee/date constraints, a staff foreign key and RLS. Production `check_in`, `check_out` and `created_at` are `timestamptz`; the old Drizzle declaration incorrectly used plain timestamps. The search failed with PostgreSQL error 42883 because it applied `ILIKE` directly to a date. Other filters were combined with OR, the API trusted supplied hours/late minutes, and there was no edit or marking interface.

The replacement casts dates to text only for free-text search, joins employee names/IDs/departments, combines filters with AND, and validates authorization in every handler. The roster includes unmarked employees; missing attendance is never silently classified as absence.

## Database rollout

No attendance schema changes or demo records were applied to production while preparing this PR. Before deploying the attendance branch:

1. Run `drizzle/0007_staff_attendance.sql` as the application database owner. It adds scheduled start, notes, demo flag, recorder, modification timestamp and optimistic version fields. Existing values and indexes are preserved. Checks/FK use NOT VALID where necessary so historical inconsistencies are preserved, while new writes must comply. The existing employee/date uniqueness is reused. The migration is transactional and repeatable; duplicate historical days cause a safe failure, never deletion. No existing timestamp values are reinterpreted.
2. Deploy the reviewed attendance branch after the migration. For a preview, use a migrated test database, not an unmigrated shared production connection. Keep these SQL scripts with the reviewed release; do not use schema push against production.
3. Once the new UI/API is active, run `scripts/seed_demo_attendance.sql` to add exactly 15 examples for 26–30 October 2026, linked by `DEMO-EMP-001`, `DEMO-EMP-002` and `DEMO-EMP-003`. These employees already exist in production. The script creates no staff, does not overwrite an existing day, and is safe to rerun. Missing demo employees or conflicting dates abort the transaction. Every inserted row has `is_demo=true` and a DEMO note. Seeding after deployment keeps examples labeled and excluded from official totals from their first appearance.

`staff_attendance` stays inaccessible to browser Data API roles. Server handlers use the existing database connection and admin session.

## Workflow

* Open `/admin/dashboard/attendance`. Set the India attendance day and employee/department/status/record-scope filters. Apply filters or refresh; the daily roster shows every matching employee whose joining date is not later than the selected day, including unmarked staff.
* Choose Present, Absent, Half Day or Leave for a person and save. Check-in/out are optional when marking presence; missing hours remain blank. Absent/Leave clears time inputs. Notes are optional.
* Select staff, apply a bulk status and choose Save selected. A batch supports up to 250 rows and is transactional: invalid or stale data rolls back the whole batch. Existing rows carry their ID and version; new rows never silently overwrite attendance.
* Set the actual scheduled start for each employee. The editor suggests 09:00, which is visible and editable rather than a hidden lateness policy. Lateness is whole minutes after scheduled start, never negative. Late is a separate flag, so a late arrival can still be Present or Half Day.
* Enter check-in and check-out as India local date/times, or use Check in now / Check out now for today. Clock actions use the server time and saved attendance. Save edited fields before using the clock actions. A missing check-in or repeated check-out is rejected.
* Check-out may be on the next date, up to 24 hours after check-in. Working hours are the elapsed duration rounded half-up to two decimals; breaks/overtime/payroll rules are not inferred. Future dates/times, impossible dates, pre-employment records and reversed shifts are rejected.
* History & exports supports date range, employee name/ID, department, status (including Late) and record scope. Edit loads the existing day/person back into the roster. Official daily/monthly cards respect the selected employee/department/status filters and always exclude DEMO identities and flags. Separate CSV actions export official or explicitly labeled demo records, with India timestamps and formula-safe cells.
* Click a staff name from Staff or Attendance to open the staff profile and its filtered attendance history/monthly statistics.
* View DEMO records opens the seeded period. The examples have nine Present days, two Absent days, two Half Days, two Leave days and four late arrivals. Their total 79.76 example working hours never enter official totals or the official CSV. Marking any existing demo employee automatically creates a DEMO record regardless of a submitted demo flag.

## Verification

`npm test` includes disposable PostgreSQL integration tests for the exact migration and seed, date search and AND filters, all statuses, bulk rollback, duplicate/concurrent creates, optimistic edits, server clock actions, timezone conversion, overnight shifts, calculations, constraints, authentication, exports and demo exclusion. These tests never load production credentials or connect to `DATABASE_URL`. The existing payment tests remain unchanged.

Run `npm test`, `npm run lint`, `npm run typecheck` and `npm run build`. The only lint warnings remaining are existing dependency warnings outside the attendance implementation. Local browser checks use a separate PostgreSQL cluster with test-only employees and the same three demo employee identifiers; they do not create official attendance in production.
