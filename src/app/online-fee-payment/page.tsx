import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FeePanel from "@/components/FeePanel";
export default function OnlineFeePaymentPage() {
  return <><Navbar /><main className="min-h-screen bg-slate-50"><div className="mx-auto max-w-6xl space-y-6 px-4 py-12"><header><p className="text-sm font-semibold text-blue-700">AIIT College / Student portal</p><h1 className="mt-2 text-3xl font-bold text-slate-900">My Fees &amp; Payments</h1><p className="mt-3 text-slate-600">Choose your fee plan, pay securely through Razorpay, and download verified receipts.</p></header><FeePanel /></div></main><Footer /></>;
}
