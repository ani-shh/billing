"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Payment {
  id: string;
  invoice_code: string;
  customer_name: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference: string;
  invoice_total: number;
}

function formatAmount(n: number) {
  return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/payments")
      .then((r) => r.json())
      .then(setPayments)
      .finally(() => setLoading(false));
  }, []);

  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <div className="bg-green-50 rounded-lg px-4 py-2 border border-green-200">
          <span className="text-sm text-gray-500">Total Received: </span>
          <span className="text-sm font-bold text-green-600">{formatAmount(totalReceived)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Invoice</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{p.payment_date}</td>
                  <td className="px-6 py-4 text-sm font-medium text-teal-600">
                    <Link href={`/invoices/${p.id}`}>{p.invoice_code}</Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{p.customer_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{p.payment_method?.replace("_", " ")}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.reference || "-"}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium text-green-600">{formatAmount(p.amount)}</td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No payments recorded</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
