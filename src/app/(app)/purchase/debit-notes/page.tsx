"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

interface DebitNote { id: string; debit_note_code: string; supplier_name: string; bill_code: string; debit_date: string; grand_total: number; status: string; reason: string; }
function fmt(n: number) { return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function DebitNotesPage() {
  const [notes, setNotes] = useState<DebitNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (status) p.set("status", status);
    fetch(`/api/debit-notes?${p}`).then((r) => r.json()).then(setNotes).finally(() => setLoading(false));
  }, [search, status]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Debit Notes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Issued to suppliers for returns or adjustments</p>
        </div>
        <Link href="/purchase/debit-notes/new" className="inline-flex items-center gap-2 bg-teal-700 text-white px-4 py-2.5 rounded-lg hover:bg-teal-800 transition-colors text-sm font-medium shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Debit Note
        </Link>
      </div>
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Search debit notes..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600">
          <option value="">All Status</option><option value="draft">Draft</option><option value="sent">Sent</option><option value="paid">Applied</option>
        </select>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? <div className="p-10 text-center text-gray-400 text-sm">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr></thead>
            <tbody>
              {notes.map((n) => (
                <tr key={n.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 text-sm font-medium text-teal-700">{n.debit_note_code}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{n.supplier_name}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{n.bill_code || "-"}</td>
                  <td className="px-5 py-3 text-sm text-gray-500 tabular-nums">{n.debit_date}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{n.reason || "-"}</td>
                  <td className="px-5 py-3 text-sm text-right font-medium text-gray-900 tabular-nums">{fmt(n.grand_total)}</td>
                  <td className="px-5 py-3"><StatusBadge status={n.status} /></td>
                  <td className="px-5 py-3"><Link href={`/purchase/debit-notes/${n.id}`} className="text-sm text-teal-600 hover:text-teal-800">View</Link></td>
                </tr>
              ))}
              {notes.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">No debit notes found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
