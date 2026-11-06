import { sql } from "drizzle-orm";
import { db } from "@/db";
import { indiaDate } from "./rules";

export type FeeRow = {
  id: string; orderId: string | null; receiptId: string | null; offlineReceiptId: number | null; planId: number; obligationId: number; studentId: number | null; applicationId: number | null;
  centreId: number | null; name: string; studentRef: string; applicationRef: string; courseId: number; course: string; plan: string; semester: number;
  original: number; discount: number; amount: number; refunded: number; gatewayFee: number | null; gatewayTax: number | null;
  status: string; method: string; razorpayOrderId: string | null; razorpayPaymentId: string | null; date: string; captured: boolean; legacy: boolean;
};
export type FeeBalance = { planId: number; name: string; studentRef: string; applicationRef: string; courseId: number; course: string; plan: string; semester: number; amount: number; paid: number; outstanding: number; dueDate: string | null };
function matches(row: { name: string; studentRef: string; applicationRef: string; courseId: number; plan: string; semester: number }, params: URLSearchParams) {
  const query = params.get("search")?.trim().toLowerCase();
  const values = Object.values(row).join(" ").toLowerCase();
  return (!query || values.includes(query)) && (!params.get("course") || String(row.courseId) === params.get("course")) && (!params.get("plan") || row.plan === params.get("plan")) && (!params.get("semester") || String(row.semester) === params.get("semester"));
}
export async function feeReport(params = new URLSearchParams()) {
  // One statement gives collections and receivables the same MVCC snapshot.
  const result = await db.execute(sql`
    with credits as (
      select o.obligation_id, sum(case when t.captured_at is not null then t.amount-t.refunded else 0 end)::bigint paid
      from fee_orders o left join fee_transactions t on t.order_id=o.id group by o.obligation_id
    ), offline as (select obligation_id,sum(amount)::bigint paid from fee_offline_credits group by obligation_id),
    owners as (
      select p.*, coalesce(a.first_name,s.first_name,'') || ' ' || coalesce(a.last_name,s.last_name,'') as name,
      coalesce(a.centre_id,s.centre_id) as centre_id,coalesce(s.student_id,'') as student_ref,coalesce(a.application_id,'') as application_ref,c.name as course
      from fee_plans p left join applications a on a.id=p.application_id
      left join students s on s.id=p.student_id join courses c on c.id=p.course_id
    ), balances as (
      select p.id as "planId",p.name,p.student_ref as "studentRef",p.application_ref as "applicationRef",p.course_id as "courseId",p.course,p.kind as plan,
      b.semester,b.amount,(coalesce(cr.paid,0)+coalesce(oc.paid,0)) as paid,
      greatest(0,b.amount-coalesce(cr.paid,0)-coalesce(oc.paid,0)) as outstanding,b.due_date::text as "dueDate"
      from owners p join fee_obligations b on b.plan_id=p.id left join credits cr on cr.obligation_id=b.id left join offline oc on oc.obligation_id=b.id
    ), rows as (
      select coalesce(t.razorpay_payment_id,o.id) as id,o.id as "orderId",r.id as "receiptId",null::bigint as "offlineReceiptId",p.id as "planId",b.id as "obligationId",p.student_id as "studentId",p.application_id as "applicationId",
      p.centre_id as "centreId",p.name,p.student_ref as "studentRef",p.application_ref as "applicationRef",p.course_id as "courseId",p.course,p.kind as plan,b.semester,p.original_amount as original,p.discount,
      coalesce(t.amount,o.amount) as amount,coalesce(t.refunded,0) as refunded,t.gateway_fee as "gatewayFee",t.gateway_tax as "gatewayTax",
      coalesce(t.status,case when o.status in ('creating','uncertain') then o.status else 'pending' end) as status,coalesce(t.method,'') as method,
      o.razorpay_order_id as "razorpayOrderId",t.razorpay_payment_id as "razorpayPaymentId",coalesce(t.captured_at,t.created_at,o.created_at) as date,
      (t.captured_at is not null) as captured,false as legacy
      from owners p join fee_obligations b on b.plan_id=p.id join fee_orders o on o.obligation_id=b.id
      left join fee_transactions t on t.order_id=o.id left join fee_receipts r on r.transaction_id=t.id
      union all
      select 'OFF-'||x.id,null,rr.receipt_no,rr.id,p.id,b.id,p.student_id,p.application_id,p.centre_id,p.name,p.student_ref,p.application_ref,p.course_id,p.course,p.kind,b.semester,p.original_amount,p.discount,
      x.amount,0,null,null,case when x.legacy then 'opening' else 'offline' end,'OFFLINE',null,null,x.received_at::timestamp at time zone 'Asia/Kolkata',true,x.legacy
      from owners p join fee_obligations b on b.plan_id=p.id join fee_offline_credits x on x.obligation_id=b.id
      left join offline_receipts rr on rr.fee_credit_id=x.id
    ) select coalesce((select jsonb_agg(rows order by date desc) from rows),'[]'::jsonb) as rows,
      coalesce((select jsonb_agg(balances) from balances),'[]'::jsonb) as balances,
      (select count(*)::int from payments) as "legacyRecords"
  `);
  const source = result.rows[0];
  const allRows = (source.rows as FeeRow[]).map(r => ({ ...r, studentId: r.studentId === null ? null : Number(r.studentId) }));
  const rows = allRows.filter(r => matches(r, params) && (!params.get("status") || r.status === params.get("status")) && (!params.get("from") || indiaDate(new Date(r.date)) >= params.get("from")!) && (!params.get("to") || indiaDate(new Date(r.date)) <= params.get("to")!));
  const balances = (source.balances as FeeBalance[]).map(r => ({ ...r, paid: Number(r.paid), outstanding: Number(r.outstanding) })).filter(r => matches(r, params));
  const today = indiaDate();
  const verified = rows.filter(r => r.captured && !r.legacy);
  const collected = (subset: FeeRow[]) => subset.reduce((s, r) => s + r.amount - r.refunded, 0);
  const discounts = [...new Map(verified.map(r => [r.planId, r.discount])).values()].reduce((s, x) => s + x, 0);
  const group = (key: (r: FeeRow) => string) => {
    const groups = new Map<string, { label: string; collected: number; refunds: number; count: number }>();
    for (const row of verified) {
      const label = key(row); const g = groups.get(label) || { label, collected: 0, refunds: 0, count: 0 };
      g.collected += row.amount - row.refunded; g.refunds += row.refunded; g.count++; groups.set(label, g);
    }
    return [...groups.values()].sort((a,b) => b.label.localeCompare(a.label));
  };
  return { rows, balances, legacyRecords: Number(source.legacyRecords),
    summary: { collected: collected(verified), gross: verified.reduce((s,r) => s+r.amount,0), today: collected(verified.filter(r => indiaDate(new Date(r.date)) === today)), month: collected(verified.filter(r => indiaDate(new Date(r.date)).slice(0,7) === today.slice(0,7))),
      outstanding: balances.reduce((s,r) => s+r.outstanding,0),
      full: verified.filter(r => r.plan === "full").length, semester: verified.filter(r => r.plan === "semester").length,
      failedPending: rows.filter(r => !r.captured).length, refunds: verified.reduce((s,r) => s+r.refunded,0), discounts,
      gatewayFees: verified.reduce((s,r) => s+(r.gatewayFee || 0),0), gatewayTax: verified.reduce((s,r) => s+(r.gatewayTax || 0),0), openingCredits: rows.filter(r => r.legacy).reduce((s,r) => s+r.amount,0) },
    groups: { daily: group(r => indiaDate(new Date(r.date))), monthly: group(r => indiaDate(new Date(r.date)).slice(0,7)), courses: group(r => r.course), semesters: group(r => `${r.course} / ${r.semester || "Full"}`), plans: group(r => r.plan), centres: group(r => String(r.centreId || 0)) } };
}
export type FeeReport = Awaited<ReturnType<typeof feeReport>>;
