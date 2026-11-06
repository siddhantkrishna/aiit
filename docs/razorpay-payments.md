# AIIT verified fee payments

## Architecture and audit

The existing college app remains Next.js / Drizzle / PostgreSQL. The original `payments` table, student fee columns and application screenshot fields are preserved as historical records. New collections use the `fee_*` ledger. Nothing in the old archive is silently promoted to verified Razorpay revenue.

The shared `documents` bucket must be private. Admission documents, historical payment screenshots and recruitment resumes are served to authenticated administrators using five-minute signed URLs; stored references and files are preserved.

The audit found manual UPI/reference submissions, no gateway verification, independent writable student balances, OR-combined payment filters, and a Drizzle mismatch: production `students.application_id` is a text admission reference, not an integer. The new enrollment path validates that reference, matching mobile and date of birth, and prevents duplicate enrollment links. New financial APIs validate authorization inside each handler; the proxy is an additional check. Admin verification rejects student/applicant JWTs.

Changed areas: admission form and submission API; fee calculation, provider, ownership, reconciliation, reporting and receipt modules in `src/lib/fees`; public payment routes in `src/app/api/fees`; admin payment routes; shared fee panels; applicant and student profiles; Payments, Accounting, Reports and overview totals; schema and migration; tests; environment example; font assets and their license. Existing request effects received small React transition fixes so lint can pass. Next.js and Zod were updated for security advisories; no unrelated application features were added.

## Database deployment

1. Take the normal Supabase backup/snapshot. Confirm this is the database attached to Vercel project `aiit`.
2. Apply `drizzle/0006_verified_fees.sql` once, after existing migrations, as the database owner using Supabase SQL Editor or a trusted migration session. Do not use `drizzle-kit push` against production.
3. The migration is additive and transactional. It creates ten ledger/access/audit tables, constraints and indexes, enables RLS and revokes browser/Data API access. It adds a unique index on non-null student application references and a NOT VALID foreign key: old orphan references are preserved, while new references must be valid. If existing duplicate links prevent the index, the migration rolls back; resolve them with admissions before retrying. Do not delete financial records to make a migration pass.
4. Existing courses require explicit fee configuration before checkout. No fees or semester counts are inferred from free-text fee descriptions. Configurations are versioned, scoped to a course and optionally university, and effective-dated. Existing plans keep their configuration snapshot.
5. No historical records or balances are rewritten. Accounts must import verified historical amounts as explicitly labeled opening credits, with unique source references, then complete the historical review. Opening credits reduce receivables but are excluded from new collections.

`npm test` provisions disposable PostgreSQL on loopback and applies this exact migration. It never reads `DATABASE_URL`. `embedded-postgres` is a development-only dependency; its platform binary is needed for the test suite.

## Razorpay and Vercel setup

Follow the official [Node integration](https://razorpay.com/docs/payments/server-integration/nodejs/integration-steps), [Orders API](https://razorpay.com/docs/api/orders/create), and [webhook verification](https://razorpay.com/docs/webhooks/validate-test) documentation.

1. Open the [Razorpay Dashboard](https://dashboard.razorpay.com/), select **Test Mode**, then **Account & Settings → API Keys → Generate Test Key**. Save the key ID and secret directly into the environment manager; never put them in chat, Git, screenshots or browser code.
2. In **Vercel → aiit → Settings → Environment Variables**, configure these server-only values for the environment under test:

   | Variable | Value/source |
   | --- | --- |
   | `RAZORPAY_KEY_ID` | Test key ID from Razorpay |
   | `RAZORPAY_KEY_SECRET` | Matching test API secret |
   | `RAZORPAY_WEBHOOK_SECRET` | Strong independent secret chosen when creating the webhook |
   | `RAZORPAY_LIVE_ENABLED` | `false` until test sign-off and account activation |
   | `DATABASE_URL` | Existing PostgreSQL connection; keep the existing value |
   | `JWT_SECRET` | Existing session secret; keep the existing value |
   | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Existing server storage configuration for admission documents |

   None of the gateway secrets use `NEXT_PUBLIC_`. The key ID is returned to an authorized checkout as required by Standard Checkout. Redeploy after environment changes. Configure Preview separately if testing on a preview host; keep Test and Live payment databases isolated.
3. Enable **automatic capture** in Razorpay payment capture settings. An authorized payment alone never counts as collection and cannot produce a paid receipt.
4. In **Account & Settings → Webhooks**, create an HTTPS webhook for the deployment being tested:

   `https://www.aiitcollege.in/api/fees/webhook`

   Use the matching preview/staging hostname when testing elsewhere. Preview deployment protection must permit Razorpay to reach this route; a Vercel login page is not a successful webhook response. Set the webhook secret to the same value as `RAZORPAY_WEBHOOK_SECRET`.
5. Subscribe to `payment.authorized`, `payment.captured`, `payment.failed`, `order.paid`, `refund.created`, `refund.processed`, `refund.failed`. Test and Live webhook settings and secrets are separate. Enable delivery failure alerts in Razorpay.
6. In `/admin/dashboard/payments`, open **Course fee & semester configuration**. Select the existing course and university scope, enter the approved original fee, actual semester count, exact installment amounts, due dates, effective date and approval reason. The installment sum must match the course fee exactly. No production fee configuration is seeded by this change.

## Complete test-mode acceptance flow

Use an isolated test database and Razorpay Test Mode first. Do not create synthetic financial records in the production database.

1. Submit admission with a configured course and no payment screenshot. Confirm the Application ID, pending state and private recovery code. Save that code privately.
2. Continue to **My Fees & Payments**, choose **Full payment**, and check original fee, 10% discount and payable. Amounts use integer paise; final payable is rounded half-up to the nearest paise, with the discount as the remainder.
3. Click **Pay now** and use Razorpay's [test payment details](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/#test-integration). Complete the simulated checkout; no real money is collected in Test Mode. Confirm the provider order and payment belong to this account, the payment is captured, a receipt downloads, and the plan reads PAID IN FULL.
4. Check Payments, Accounting and Reports. Net collections and discounts must agree. Review the transaction's Razorpay references, webhook delivery and reconciliation state.
5. For a separate test application choose **Semester-wise**, pay only the first due installment, and confirm later installments remain unpaid. Future installments have no eligible Pay now action. Configure a later due date appropriately to test that semester when due.
6. Close checkout and try a failure. Reopen the portal; the application remains saved and checkout reuses the same outstanding order. Double-click or send repeated order requests: there must be one active order for the obligation. An authorized attempt blocks another checkout until reconciliation resolves it.
7. Sign out, resume with Application ID plus recovery code, then enroll the applicant through a student record with the matching Application ID, mobile and DOB. The student portal must show the same plan and history. Altering a student, obligation, order or receipt identifier must not disclose another account's records.
8. Repeat webhook delivery, send events out of order and temporarily interrupt callback delivery. Use **Check payment confirmation** as the applicant or **Reconcile with Razorpay** in transaction details. Captures and receipts must remain single entries. An invalid webhook signature must return 400 without writing to the ledger.
9. Issue a test refund **in Razorpay**, then reconcile. Only provider-processed refunds reduce the balance; pending/failed refunds do not. Refund details remain visible, and the original receipt reports the current verified refunded amount. A refunded outstanding obligation may use a new order only after the original order is confirmed paid; it never reuses a paid order.
10. Verify CSV export, course/status/plan/semester/date/search filters, student profile balances, and due/overdue reporting. CSV amounts are explicitly in paise. Historical opening credits must not appear as new collections.

## Operations and financial rules

* Application creation uses a browser-generated 256-bit submission/recovery key and database deduplication. Retrying the saved request returns the same application. The code is hashed in the database. A document-upload failure keeps the application and returns a warning; admissions can receive missing documents separately.
* Applicant access requires the private recovery code; public application IDs alone never grant financial access. Existing student sessions retain their established ID/mobile/DOB sign-in. Lost codes and pre-existing applications need an administrator identity check: open the application profile, issue/reset a recovery code with an audit reason, and deliver it privately. Existing sessions expire within eight hours.
* Choosing a plan does not collect funds. An unpaid plan can change before an order exists. Once checkout starts, it is locked because a previously opened Razorpay checkout may still settle. Paid plans cannot switch automatically to the upfront discount. Admins can amend an unpaid semester amount/date only if no order or credit exists for it; every amendment records the old schedule and reason.
* Order reservations are committed before the provider request. A timeout never causes automatic creation of a replacement. An administrator can reconcile an uncertain reservation by its unique receipt reference. If Razorpay cannot confirm an order, keep the reservation and contact provider support rather than risk a second charge.
* Every confirmed capture is fetched from Razorpay, matched against the stored order, currency and outstanding obligation, and applied transactionally. Pending/authorized/failed responses do not issue receipts. Receipt identifiers and provider payment IDs are unique. Raw webhook bodies are HMAC verified; event IDs and body hashes deduplicate deliveries. Current provider state resolves out-of-order payloads.
* Balances are derived from captured transactions less processed refunds plus audited offline credits. Student legacy balance columns are not independently updated. The student fee panel, Payments, Accounting, Reports and dashboard overview use this ledger.
* Reports cover explicitly selected fee plans. A course/student with no configured plan is not silently assigned a receivable. Collections include new verified offline receipts and gateway captures, less refunds attributed to the original collection date. Fees/taxes reported by the provider are separate; the app does not invent settlement fees or tax identities. Manual non-fee accounting entries stay separate from fee collections.
* Only unpaid, due obligations can be checked out, in semester order, for their exact outstanding amount. An upfront discount is unavailable where historical payment activity exists. Imported historical credits require actual evidence and a source reference; choosing “complete historical review” does not create money.
* Refunds are initiated in Razorpay, not fabricated locally. No API permits manually setting a Razorpay transaction to paid. Database or provider failures return a recoverable error, with no sensitive response details logged.

## Safe Live activation

After all acceptance steps pass with Razorpay Test Mode, confirm merchant KYC, approval and activation in the Razorpay Dashboard. Obtain **Live Mode → Account & Settings → API Keys** credentials and create the corresponding Live webhook. Keep Test and Live keys, webhook secrets and databases separate. Reconcile all old test orders before changing environments; existing orders cannot be reused under another key ID.

Set Live credentials in Vercel Production only, keep `RAZORPAY_LIVE_ENABLED=false`, deploy, and verify the correct production database, configurations and webhook endpoint. After documented test-mode sign-off, set `RAZORPAY_LIVE_ENABLED=true` and redeploy. An authorized human should make and verify the first small real payment. This implementation run does not authorize or perform a real-money test, activate a merchant account, or enable live collection.
