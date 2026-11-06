# AIIT offline receiving

This module is a staff-attested offline collection register. The record is not a Razorpay transaction.

## Activation

1. Back up the production AIIT Supabase database.
2. Run `drizzle/0008_offline_receiving.sql` as a privileged database migration. It is additive and creates only new tables.
3. Verify new tables have RLS enabled and are not granted to anon/authenticated roles.
4. Add real staff members through Staff Management. DEMO staff are blocked from actual money handling.
5. Configure the course fee and a semester fee plan before recording TUITION. SERVICE collections are independent and do not change tuition balances.
6. Test with synthetic data inside a rolled-back transaction. Never seed fake collections into production.

## Notifications

To send automatic emails configure `RESEND_API_KEY` and `AIIT_RECEIPT_FROM_EMAIL` with a verified sending domain.
To send Indian SMS configure `MSG91_AUTH_KEY` and `MSG91_RECEIPT_TEMPLATE_ID`, using an approved DLT service template whose VAR1 is the receipt number, VAR2 is amount INR, VAR3 is student name.
Provider acceptance does **not** mean confirmed delivery. Missing configuration leaves a visible unconfigured status; failed notifications can be retried.
Official references: https://resend.com/aws-lambda ; https://docs.msg91.com/sms/send-sms ; https://www.trai.gov.in/advice-to-senders

## Financial integrity

* The generated receipt number and the client UUID prevent accidental duplicate submission. Duplicate UPI/bank/cheque references are rejected.
* TUITION receipt + `fee_offline_credits` insert happen in one database transaction. Existing tuition reports and student balances include that credit once.
* SERVICE receipts do not affect fee obligations; they are tracked separately in Offline Receiving totals.
* Funds must actually have been received; the admin records the staff receiver and payer contact, with an audit note.
* Original receipt rows are immutable from the website. Corrections require separate controlled finance review.
* Online Razorpay orders must be reconciled before a conflicting offline credit can be entered.

## Staff identity

Receiver identity is the **selected staff record plus logged-in administrator session**, not a biometric check. No Face ID verification is implemented or claimed. Production Face ID would require staff-specific WebAuthn/passkey enrollment and verification; do not collect raw face images/templates.

## Verification

Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`. Test source matching, fee-plan requirement, balance limit, idempotency, SMS/email provider failures, unauthorized use, and PDF retrieval before merging.
