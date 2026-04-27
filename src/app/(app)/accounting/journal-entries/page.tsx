"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

interface JE { id: string; entry_code: string; entry_date: string; narration: string; total_debit: number; total_credit: number; status: string; source_type: string; fiscal_year: string; }
function fmt(n: number) { return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function JournalEntriesPage() {
  const [entries, setEntries] = useState<JE[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    fetch(`/api/journal-entries?${p}`).then((r) => r.json()).then(setEntries).finally(() => setLoading(false));
  }, [status]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold text-gray-900">Journal Entries</h1><p className="text-sm text-gray-500 mt-0.5">Double-entry bookkeeping records</p></div>
        <Link href="/accounting/journal-entries/new" className="inline-flex items-center gap-2 bg-teal-700 text-white px-4 py-2.5 rounded-lg hover:bg-teal-800 text-sm font-medium shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>New Entry
        </Link>
      </div>
      <div className="mb-5">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50">
          <option value="">All Status</option><option value="draft">Draft</option><option value="posted">Posted</option><option value="reversed">Reversed</option>
        </select>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? <div className="p-10 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="border-b border-gray-100">
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Narration</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Debit</th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Credit</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-sm font-medium text-teal-700">{e.entry_code}</td>
                  <td className="px-5 py-3 text-sm text-gray-500 tabular-nums">{e.entry_date}</td>
                  <td className="px-5 py-3 text-sm text-gray-700 max-w-xs truncate">{e.narration || "-"}</td>
                  <td className="px-5 py-3 text-sm"><span className="capitalize text-gray-500">{e.source_type}</span></td>
                  <td className="px-5 py-3 text-sm text-right font-medium tabular-nums">{fmt(e.total_debit)}</td>
                  <td className="px-5 py-3 text-sm text-right font-medium tabular-nums">{fmt(e.total_credit)}</td>
                  <td className="px-5 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-5 py-3"><Link href={`/accounting/journal-entries/${e.id}`} className="text-teal-600 hover:text-teal-800 text-sm">View</Link></td>
                </tr>
              ))}
              {entries.length === 0 && <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400 text-sm">No journal entries</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
