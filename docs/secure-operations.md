# Secure AIIT operations

This branch preserves the Next.js/React/Tailwind application, PostgreSQL/Drizzle tables, branding, admission fields, public routes, recruitment, online classes, exams and results. It adds no production package or service. No production migration, storage policy, environment value or existing record was changed during implementation.

## Implemented

- Admin JWTs require the admin role, issuer and audience. Every private route checks authorization; the proxy also protects dashboard pages. It is placed at `src/proxy.ts`, alongside `src/app`, so Next.js actually includes it in the build. Old sessions must sign in again. Student JWTs cannot authorize admin routes.
- `/api/seed` returns 410. Health checks only check connectivity. The optional seed function inserts an environment-provided admin once and never changes existing passwords or inserts sample courses/universities.
- Public submissions/authentication use shared PostgreSQL rate limits. Login also limits attempts by account. Mutations reject cross-site browser requests. Input schemas, date/amount validation and upload type/signature/size checks run on the server.
- Admission requires an active centre, a verified course, its actual university/study mode, passport photo, Aadhaar and 10th marksheet. Highest qualification and applicable required higher marksheets/supporting documents are captured; reviewers can request missing documents with a due date. The server generates an unpredictable application number and returns Pending confirmation.
- Status checks require application number, registered mobile and date of birth via POST. Responses omit personal records, document paths and internal remarks. Application number alone cannot authorize screenshot uploads; those require the submission's short-lived HttpOnly cookie or an admin session. After its two-hour upload window, the applicant contacts the office.
- Reviews save detailed and legacy statuses together, document/applicant verification, internal remarks, next action and history. Approval requires verification and creates/links one student under a transaction and identity lock. Ambiguous legacy matches stop for manual review. Applications and catalogue entries are retained; catalogue DELETE deactivates.
- Student detail brings together parents, course/university/centre, documents, agreed fees, payments, university submission/enrollment/action, exam/admit card/results/certificate status and services. Additional private documents can be uploaded and reviewed. Fees are set by the owner, never inferred from unverified catalogue amounts.
- The existing result/exam/fee services require a random owner-issued access code as well as student details. Only its bcrypt hash is stored. Codes appear once to the owner; replacement revokes previous codes and sessions. No full student dashboard or new identity provider was added.
- All payment entries start PENDING. An admin explicitly verifies against bank/cash evidence. Verification, balance adjustment and accounting posting happen together; repeats do not credit twice. Duplicate verified non-cash references are blocked. Refunds reverse the balance/posting and prevent receipt download. Existing balances are preserved; inconsistent legacy balances/duplicate ledger entries stop for reconciliation.
- Verified payments have downloadable PDF receipts. Receipts use ASCII student/application identifiers and INR; multilingual receipt text needs an embedded Unicode font. A screenshot is evidence, never verification.
- Staff, tasks, enquiries, services, attendance and accounting now have add/update forms on their existing screens. Tasks require an assignee and due date. Enquiries support New → Contacted → Interested → Follow-up → Applied → Admitted/Closed, with staff and follow-up dates. Older Converted/Lost values remain available.
- Attendance records support same-day check-in/out, derived working hours, manually recorded late minutes and leave. One employee/date record is updated instead of duplicating it. No hardware integration is claimed.
- Dashboard links lead to today's enquiries, pending applications, active students, this month's admissions/verified collections, pending fees, overdue follow-ups, university work, attendance, tasks and services. India time is explicit. Reports read source tables and exclude unverified collections/void ledger entries.
- Public course search and catalogue/affiliation/study-mode listings publish verified records only, including the homepage. No relationship was automatically marked verified.

## Production setup — approval required before applying

The read-only preflight found the existing `documents` bucket **public**. Private-storage cutover has **not** been completed or verified. Strict database TLS validation returned `SELF_SIGNED_CERT_IN_CHAIN`. Do not merge/deploy this branch until the following steps are complete.

1. Back up PostgreSQL and inventory the Storage bucket. Keep a record of object counts/paths privately. Review the current application runtime database role: it must own the application tables or have BYPASSRLS. Explicit table grants alone do not bypass RLS.
2. Configure `DATABASE_CA_CERT` with the database provider's independently trusted CA certificate (PEM, real newlines or literal `\n`), if needed. Keep certificate verification enabled. Do not copy a certificate from an unverified connection and assume it is trusted. Existing environment-variable values are not edited by this branch.
3. Run `node scripts/inspect-production.cjs`. It reads schema coverage, duplicate-student counts, configured centre codes and bucket visibility without printing records or credentials. Confirm that the existing tables match the Drizzle schema; apply the previous recruitment/online-services migrations if they have never been installed. Review legacy duplicates without deleting records.
4. Review/apply `drizzle/0004_secure_operations.sql` to the application database in an approved maintenance window. It adds application qualification, student processing/access-code fields, staff responsibilities, a rate-limit table and indexes; enables RLS and revokes browser-role Data API access to application tables/report views. The server accesses data through its authorized PostgreSQL connection. This migration neither deletes nor rewrites existing business records. It is tested for repeat application on an isolated database; no production execution occurred.
5. In the **Supabase Storage project**, review/apply `scripts/private-storage-cutover.sql`. It changes `documents` to private and adds a restrictive policy denying direct `anon`/`authenticated` access to that bucket, without deleting/moving objects or affecting other buckets. The server service-role client signs authorized reads for 120 seconds. Older public URL strings in the database remain intact and are normalized by the server when signing.
6. Supply the project's public anonymous JWT key as `SUPABASE_ANON_KEY` for verification only. Run `node scripts/verify-private-storage.cjs`. It checks every referenced object: private bucket, public and anonymous reads denied, signed reads working. It fails if an object is missing, a URL uses another origin/bucket, or no objects were tested. It does not change data or print signed URLs. Verify an expired link is denied after two minutes too. Review Storage access logs/cached public URLs under Supabase's CDN policy; earlier public exposure cannot be undone by application code.
7. Rotate the previously hardcoded admin password through a controlled database/password-hashing procedure and review access logs. Set a strong JWT secret if the current secret was ever exposed; never paste credentials into commits or chat. No existing password was changed by this branch. Initial provisioning alone may use `INITIAL_ADMIN_EMAIL` and `INITIAL_ADMIN_PASSWORD` (16+ characters, at most 72 UTF-8 bytes); it never resets an existing account.
8. Confirm Gharghoda and Tamnar are the intended ACTIVE records in `centres`. Review course/university authorization, permitted modes and fees before marking records VERIFIED. Previously enabled but unverified listings stay in the database and are withheld from publication.
9. In an isolated preview using a non-production database/storage project, walk admission → private upload → Pending → review/request documents → approval → student → registration/offline payment → verification → PDF receipt. Then test leads, task assignment, attendance and services. Check a student service with a newly issued code and check revocation on code replacement.
10. Confirm UPI ID, payee and the existing QR image through an authorized institutional record. This branch preserves those configured payment details and adds no gateway. After review, approve production cutover separately. Do not undo privacy controls merely to make an old code version work; the old version expects public document URLs and is unsafe after cutover.

## Checks

```sh
npm test
npm run test:integration
npm run typecheck
npm run build
npm run lint
```

`npm test` runs security/validation tests without database credentials and explicitly skips the isolated-database suite. `test:integration` downloads pinned PGlite 0.5.14 into a disposable temporary directory, generates a fresh schema there, exercises additive upgrades and workflows using actual PostgreSQL semantics, then removes it. Supabase uploads/signing are stubbed in that suite. No test touches production records. The test-only engine is not an application dependency.

The PDF sample was parsed and rendered for visual inspection. Production schema/storage/browser flows must still be checked after the approved setup above. Repository lint has existing React-effect and markup violations; they are separate from TypeScript/build success and are not suppressed by this branch.

## Maintenance and practical limits

- Delete expired `api_rate_limits` rows periodically with an approved maintenance query, e.g. `DELETE FROM api_rate_limits WHERE expires_at < now() - interval '1 day'`. This table contains hashes, not raw account identifiers/IPs. Limit counters are shared across Vercel instances. Use a trustworthy reverse-proxy IP header when self-hosting; Vercel's own forwarded-IP header is used on Vercel.
- Files are limited to 3MB each and admission files to 4MB combined, leaving room for multipart fields under Vercel's request limit. Recruitment retains PDF/DOC/DOCX support with type/signature validation; existing storage objects remain intact. Larger uploads need a separate authorized direct-upload flow.
- Approval deduplicates by application and mobile + DOB + course. Ambiguous legacy rows require review; none are automatically merged/deleted. Students approved through the new workflow have their parents' names copied. Historical parent names/documents remain on their original application until reviewed.
- Existing verified financial records and opening balances are not silently rebuilt. The owner must reconcile discrepancies and unlinked legacy income entries before relying on historical totals. New verified payments get linked postings; manual entries must not duplicate a payment already recorded in Payments.
- Bank payment evidence, university authorizations, hardware, historical data accuracy and production connectivity cannot be proved by isolated tests. No SMS/OTP provider, payment gateway, biometric device or additional infrastructure was introduced.

## Verification recorded for this branch

- `npm run test:integration`: **25 passed, zero failures/skips**, including all 51 private admin handlers' unauthenticated checks, real PostgreSQL workflow transactions and the non-destructive storage-policy simulation.
- `npm run typecheck`: passed. `npm run build`: passed with Next.js recognizing Proxy (Middleware).
- Built-server smoke checks: private APIs 401; dashboard 307 to login; obsolete unverified status GET 405; seed POST 410; cross-site admission POST 403.
- Browser: admission and status forms inspected at 390px width; automated WCAG A/AA checks found zero violations. One admission audit item remained for manual assessment. Shared map labels and admission input/label associations were fixed.
- `npm run lint`: still fails with **22 existing errors and 10 warnings** (initial baseline: 24 errors/10 warnings), primarily React-effect loading patterns and existing markup. No lint rules were disabled.
- Live read-only integration preflight: documents bucket still public; database certificate validation failed. No production cutover or authenticated production workflow is claimed.
