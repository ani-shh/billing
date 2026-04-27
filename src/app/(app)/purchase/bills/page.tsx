"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

interface Bill { id: string; bill_code: string; supplier_name: string; bill_date: string; due_date: string; grand_total: number; status: string; }

function formatAmount(n: number) { return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    fetch(`/api/bills?${params}`).then((r) => r.json()).then(setBills).finally(() => setLoading(false));
  }, [search, status]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Bills</h1>
        <Link href="/purchase/bills/new" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">+ New Bill</Link>
      </div>
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search bills..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Status</option><option value="draft">Draft</option><option value="received">Received</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">Bill Code</th><th className="px-6 py-3">Supplier</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Due Date</th><th className="px-6 py-3 text-right">Amount</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {bills.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-teal-600">{b.bill_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{b.supplier_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{b.bill_date}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{b.due_date}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">{formatAmount(b.grand_total)}</td>
                  <td className="px-6 py-4"><StatusBadge status={b.status} /></td>
                  <td className="px-6 py-4"><Link href={`/purchase/bills/${b.id}`} className="text-teal-600 hover:text-teal-800 text-sm">View</Link></td>
                </tr>
              ))}
              {bills.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No bills found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
