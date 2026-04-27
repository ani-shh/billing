"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";

interface BillItem { product_name: string; product_code: string; quantity: number; rate: number; discount: number; tax_rate: number; amount: number; }
interface Bill {
  id: string; bill_code: string; supplier_name: string; supplier_email: string; supplier_phone: string; supplier_address: string;
  bill_date: string; due_date: string; currency: string; warehouse_name: string; status: string; notes: string;
  subtotal: number; discount_total: number; tax_total: number; grand_total: number; items: BillItem[];
}

function formatAmount(n: number) { return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBill = () => { fetch(`/api/bills/${id}`).then((r) => r.json()).then(setBill).finally(() => setLoading(false)); };
  useEffect(() => { fetchBill(); }, [id]);

  const handleMarkReceived = async () => {
    if (!bill) return;
    await fetch(`/api/bills/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...bill, status: "received" }) });
    fetchBill();
  };

  const handleMarkPaid = async () => {
    if (!bill) return;
    await fetch(`/api/bills/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...bill, status: "paid" }) });
    fetchBill();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this bill?")) return;
    await fetch(`/api/bills/${id}`, { method: "DELETE" });
    router.push("/purchase/bills");
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!bill) return <div className="text-center py-20"><p className="text-gray-500 mb-4">Bill not found</p><Link href="/purchase/bills" className="text-teal-600 text-sm">Back to Bills</Link></div>;

  return (
    <div className="max-w-5xl">
      <Link href="/purchase/bills" className="no-print inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 mb-6">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        Back to Bills
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{bill.bill_code}</h1>
              <StatusBadge status={bill.status} />
            </div>
          </div>
          <div className="text-sm text-gray-500 sm:text-right space-y-1">
            <p>Bill Date: <span className="font-medium text-gray-700">{bill.bill_date}</span></p>
            <p>Due Date: <span className="font-medium text-gray-700">{bill.due_date}</span></p>
            <p>Currency: <span className="font-medium text-gray-700">{bill.currency}</span></p>
          </div>
        </div>
      </div>

      {/* Supplier & Warehouse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Supplier</h2>
          <p className="text-base font-medium text-gray-900">{bill.supplier_name}</p>
          {bill.supplier_email && <p className="text-sm text-gray-500">{bill.supplier_email}</p>}
          {bill.supplier_phone && <p className="text-sm text-gray-500">{bill.supplier_phone}</p>}
          {bill.supplier_address && <p className="text-sm text-gray-500">{bill.supplier_address}</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Warehouse</h2>
          <p className="text-base font-medium text-gray-900">{bill.warehouse_name || "-"}</p>
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="px-4 py-3 text-left font-medium text-gray-500">Product</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Qty</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Rate</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Discount</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Tax</th>
            <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {(bill.items || []).map((item, i) => (
              <tr key={i}>
                <td className="px-4 py-3 text-gray-700">{item.product_name || "-"}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3 text-right">{formatAmount(item.rate)}</td>
                <td className="px-4 py-3 text-right">{formatAmount(item.discount)}</td>
                <td className="px-4 py-3 text-right">{item.tax_rate}%</td>
                <td className="px-4 py-3 text-right font-medium">{formatAmount(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatAmount(bill.subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Discount</span><span>- {formatAmount(bill.discount_total)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Tax</span><span>{formatAmount(bill.tax_total)}</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900"><span>Grand Total</span><span>{formatAmount(bill.grand_total)}</span></div>
          </div>
        </div>
      </div>

      {bill.notes && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Notes</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{bill.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="no-print bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-wrap gap-3">
          {bill.status === "draft" && (
            <button onClick={handleMarkReceived} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Mark as Received</button>
          )}
          {(bill.status === "draft" || bill.status === "received") && (
            <button onClick={handleMarkPaid} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Mark as Paid</button>
          )}
          <button onClick={() => window.print()} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Print</button>
          <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}
