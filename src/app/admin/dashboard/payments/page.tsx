import FeeReport from "@/components/FeeReport";
import OfflineReceiving from "@/components/OfflineReceiving";
import FeeConfiguration from "@/components/FeeConfiguration";
import FeeSourceBook from "@/components/FeeSourceBook";
export default function PaymentsPage() {
  return <div className="space-y-6"><header><p className="text-sm font-semibold uppercase tracking-wider text-blue-700">Finance</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Payments</h1><p className="mt-2 text-slate-600">Verified collections, fee plans, outstanding semesters and receipts.</p></header><FeeConfiguration /><FeeSourceBook /><OfflineReceiving /><FeeReport detailed /></div>;
}
