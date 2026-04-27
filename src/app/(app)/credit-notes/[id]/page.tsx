"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";

interface Item { product_name: string; quantity: number; rate: number; tax_rate: number; amount: number; }
interface CN { id: string; credit_note_code: string; customer_name: string; customer_email: string; customer_phone: string; invoice_code: string; credit_date: string; reference_no: string; reason: string; subtotal: number; tax_total: number; grand_total: number; status: string; notes: string; items: Item[]; }
function fmt(n: number) { return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function CreditNoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [cn, setCn] = useState<CN | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_ = () => { fetch(`/api/credit-notes/${id}`).then((r) => r.json()).then(setCn).finally(() => setLoading(false)); };
  useEffect(() => { fetch_(); }, [id]);

  const updateStatus = async (status: string) => { if (!cn) return; await fetch(`/api/credit-notes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...cn, status }) }); fetch_(); };
  const handleDelete = async () => { if (!confirm("Delete this credit note?")) return; await fetch(`/api/credit-notes/${id}`, { method: "DELETE" }); router.push("/credit-notes"); };

  if (loading) return <div className="flex items-center justify-center h-96 text-gray-400">Loading...</div>;
  if (!cn) return <div className="text-center py-20"><p className="text-gray-500 mb-4">Not found</p><Link href="/credit-notes" className="text-teal-600 text-sm">Back</Link></div>;

  return (
    <div className="max-w-4xl">
      <Link href="/credit-notes" className="no-print inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 mb-5">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>Back to Credit Notes
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
        <div className="flex items-start justify-between">
          <div><div className="flex items-center gap-3 mb-1"><h1 className="text-xl font-semibold text-gray-900">{cn.credit_note_code}</h1><StatusBadge status={cn.status} /></div>
            {cn.invoice_code && <p className="text-sm text-gray-500">Against: {cn.invoice_code}</p>}
            {cn.reason && <p className="text-sm text-gray-500 mt-1">Reason: {cn.reason}</p>}</div>
          <div className="text-sm text-gray-500 text-right"><p>Date: <span className="font-medium text-gray-700">{cn.credit_date}</span></p>{cn.reference_no && <p>Ref: {cn.reference_no}</p>}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Customer</h2>
        <p className="text-sm font-medium text-gray-900">{cn.customer_name}</p>
        {cn.customer_email && <p className="text-sm text-gray-500">{cn.customer_email}</p>}
        {cn.customer_phone && <p className="text-sm text-gray-500">{cn.customer_phone}</p>}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Items</h2>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100"><tr><th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th><th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qty</th><th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Rate</th><th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Tax</th><th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Amount</th></tr></thead>
          <tbody>{(cn.items || []).map((i, idx) => (<tr key={idx} className="border-b border-gray-50"><td className="px-3 py-2 text-gray-700">{i.product_name || "-"}</td><td className="px-3 py-2 text-right">{i.quantity}</td><td className="px-3 py-2 text-right">{fmt(i.rate)}</td><td className="px-3 py-2 text-right">{i.tax_rate}%</td><td className="px-3 py-2 text-right font-medium tabular-nums">{fmt(i.amount)}</td></tr>))}</tbody>
        </table>
        <div className="mt-3 flex justify-end"><div className="w-64 space-y-1.5 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="tabular-nums">{fmt(cn.subtotal)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Tax</span><span className="tabular-nums">{fmt(cn.tax_total)}</span></div>
          <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900"><span>Total Credit</span><span className="tabular-nums">{fmt(cn.grand_total)}</span></div>
        </div></div>
      </div>

      {cn.notes && <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5"><h2 className="text-sm font-semibold text-gray-900 mb-2">Notes</h2><p className="text-sm text-gray-600">{cn.notes}</p></div>}

      <div className="no-print bg-white rounded-lg border border-gray-200 p-5 flex flex-wrap gap-3">
        {cn.status === "draft" && <button onClick={() => updateStatus("sent")} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Send</button>}
        {cn.status === "sent" && <button onClick={() => updateStatus("paid")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Mark Applied</button>}
        <button onClick={() => window.print()} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Print</button>
        <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Delete</button>
      </div>
    </div>
  );
}
