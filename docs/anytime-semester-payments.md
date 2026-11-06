# Anytime semester payments

AIIT supports **payment of any unpaid semester at any time, in any order**, without due dates or prerequisites to clear earlier semesters first.

- Semester payment options show only the amount, paid/remaining balance, Paid/Unpaid status, and Pay button. A student may pay Semester 2 before Semester 1.
- Admin university-course fee setup needs only the approved total, semester count and amounts. An effective date for new price versions is recorded by the server for audit (not a payment deadline).
- A 10% full-upfront discount remains available on the full-payment plan before checkout; no discount is applied to individual semesters.
- Outstanding amounts are derived from verified Razorpay captures and audited offline credits. Each installment has a separate Razorpay order, with existing idempotency, ownership, signature and reconciliation safeguards retained.
- Previous due-date records remain in the database **for historical reference only**. They are not displayed in the student experience, do not classify balances as "Overdue", and do not restrict checkout.
- Migration `drizzle/0011_anytime_semester_payments.sql` replaces the fee schedule validation function to require semester number and amount but no date, and makes the obligation due-date column nullable. This is additive/non-destructive to fee and transaction records.
- Reports still contain transaction date filters for financial audits. A transaction date is not an installment deadline.

Verification: create a 2+ semester plan, check that any unpaid semester has Pay Now, select and capture the later semester first, confirm the earlier one remains Unpaid/payable, verify receipt and paid totals, ensure repeat order requests and unauthorized users cannot duplicate/alter payments. Confirm old contracts with a due date in the future also remain payable.
