# AIIT university-specific fee configuration

## Financial rule

Every approved fee belongs to one exact `(course_id, university_id)` pair. A universal course fee cannot be used for student checkout. `fee_configurations.university_id` is NOT NULL, and fee lookup never substitutes another university or a NULL/default price.

One generic course (for example BCA) can have separate prices for CVRU, RNTU, AISECT and SDMIT. The course row can remain university-neutral. If a course is already explicitly bound to a university, the admin cannot configure it under a different university; duplicate the course as a separate authorized offering where appropriate.

Admissions require explicit university selection. Payment plans refer to immutable configuration versions and preserve historical contracted prices even when a future price version is approved. Student course assignment must record both a course and university.

## SDMIT

Added the exact requested abbreviation `SDMIT` as a university-dropdown entry. Its full legal identity and fee schedule are unspecified; no affiliation or tuition prices have been inferred from the abbreviation.

## Source data caveat

A previously saved `AIIT_Course_Master_Database.xlsx` contains 506 historical/source-listed course entries, of which 350 have some source fee value, but all 506 have `PENDING VERIFICATION` status and the workbook contains no SDMIT entries. The columns `Total / Listed Fee (Source INR)`, `College / AIIT Fee (Source INR)`, `Discount`, and `Net / Payable Fee (Source INR)` are distinct concepts and **must not** be treated as interchangeable approved AIIT selling prices. Consequently, those numbers have not been automatically activated as payable tuition or imported as final prices. Finance must supply approved university-course fee amounts and the actual semester/instalment schedule.

## Setup

1. In the AIIT admin dashboard, open Payments → University-wise Course Fee Configuration.
2. Choose the university, then the course.
3. Enter the university-approved original course fee, actual installment count, matching amounts/due dates and an approval reference; save a version.
4. The applicant fee portal will use only this exact university/course combination with an effective configuration. Where none exists, payment remains blocked with a configuration message.
5. The admissions page can display an approved price after a university and course are selected; it does not display a fabricated or universal price.
6. Verify matching fees for two universities offering the same course, nonmatching fee rejection, fee-version preservation, and unauthorized-course/university API access.

## Deployment

Apply `drizzle/0009_university_fees.sql` before the new code. It refuses to proceed if any unscoped fee configurations exist and does not delete financial records. The migration also adds the SDMIT label if it is not already present. Run `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`, then verify production.
