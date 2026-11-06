# AIIT uploaded university fee lists — 6 November 2026

## Imported original files

- `CVRU FEES STRUCTURE.xlsx` → worksheet `IODE` rows 3–13: 11 entries.
- `CVRU FEES STRUCTURE.xlsx` → worksheet `PRIVATE` rows 4–36: 33 annual fee entries.
- `CVRU FEES STRUCTURE.xlsx` → worksheet `PRIVATE` rows 40–50: 11 additional IODE entries.
- `SDMIT FEES.xlsx` → worksheet `Sheet1` rows 3–13: 11 entries.

**Total: 66 line items, 55 CVRU and 11 SDMIT.** Every listed total was checked against the sum of the available source components. No discrepancies in the arithmetic.

The additive migration `drizzle/0010_import_uploaded_fee_lists.sql` preserves original file name, sheet, row number, course name, fee period, source components (including negative discounts), duration/eligibility when provided, and listed price in integer paise. It does not insert into `fee_configurations` or create payable obligations.

## Why these source totals cannot all become automatic Razorpay charges

1. CVRU's **PRIVATE** sheet specifically labels column H `TOTAL FEES PER YEAR`, not a whole-program price. Treating this as a three-year bachelor's total would undercharge the college and falsely mark the course fully paid.
2. CVRU's `IODE` sheet and second `IODE` subsection of `PRIVATE` list the same 11 course names. Ten totals differ by ₹1,500, and even the matching BA total uses different component meanings. The source does not say which is authoritative.
3. The PRIVATE sheet lists **MA POLITICAL SCIENCE** twice with different totals (₹14,800 and ₹18,600), without identifiers that resolve the variant. It also contains an MA ENGLISH EARLYBIRD variant.
4. SDMIT lists full-looking course totals but **no installment count, allocation, or due dates**. The existing tuition contract requires an exact approved installment schedule; guessing a schedule would change how much the student can pay and when.
5. CVRU IODE provides only two semester columns but no stated total program duration for each offering in these files.
6. The current application's **10% upfront discount** operates on approved `fee_configurations.original_amount`; it would be wrong to silently apply that discount to an annual figure or an unverified variant.

## Safe activation procedure

1. Open Admin → Payments → **Uploaded university fee price lists** and inspect all 66 source rows, filtered by university and mode.
2. Resolve the CVRU IODE conflicts and annual/multi-year program totals with the authorised accounts team. Preserve program variant (IODE, PRIVATE, earlybird) as a distinct course offering wherever two variants have different prices.
3. Confirm whether SDMIT programs have one or multiple installments; provide corresponding amounts and due dates.
4. In **University-wise Course Fee Configuration**, select the correct university and course offering. Enter the **approved whole-course fee** plus an installment schedule that sums precisely to that fee; record the approval circular or equivalent authorization.
5. Saving the approved version automatically makes that exact university–course pair eligible for plan selection. It never re-prices previous student contracts. Do not create a generic/default price.

This import intentionally stores all actual figures **without activating or conflating them**. No fictitious fees, new payments, or fee receipts were created.

## Verification

- Uploaded source arithmetic: 66 of 66 totals match component sums.
- Check database rows grouped by `university_id`, `source_file`, `source_sheet` and `fee_basis`.
- Verify `fee_configurations` remains unchanged after import.
- Ensure `university_fee_sources` RLS is enabled and direct `anon`/`authenticated` access is revoked.
- Confirm admin-only API and UI, Vercel Preview build, and then production deployment.
