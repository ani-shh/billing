"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";

interface Line { account_code: string; account_name: string; account_type: string; debit: number; credit: number; description: string; }
interface JE { id: string; entry_code: string; entry_date: string; narration: string; reference: string; source_type: string; total_debit: number; total_credit: number; status: string; fiscal_year: string; lines: Line[]; }
function fmt(n: number) { return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function JEDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [je, setJe] = useState<JE | null>(null);
  const fetch_ = () => { fetch(`/api/journal-entries/${id}`).then((r) => r.json()).then(setJe); };
  useEffect(() => { fetch_(); }, [id]);

  const handlePost = async () => { await fetch(`/api/journal-entries/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "posted" }) }); fetch_(); };
  const handleDelete = async () => { if (!confirm("Delete?")) return; const res = await fetch(`/api/journal-entries/${id}`, { method: "DELETE" }); if (res.ok) router.push("/accounting/journal-entries"); else { const d = await res.json(); alert(d.error); } };

  if (!je) return <div className="flex items-center justify-center h-96 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <Link href="/accounting/journal-entries" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 mb-5">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>Back
      </Link>
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
        <div className="flex items-start justify-between">
          <div><div className="flex items-center gap-3 mb-1"><h1 className="text-xl font-semibold text-gray-900">{je.entry_code}</h1><StatusBadge status={je.status} /></div>
            {je.narration && <p className="text-sm text-gray-600 mt-1">{je.narration}</p>}
            {je.reference && <p className="text-sm text-gray-500">Ref: {je.reference}</p>}</div>
          <div className="text-sm text-gray-500 text-right"><p>Date: <span className="font-medium text-gray-700">{je.entry_date}</span></p><p>Source: <span className="capitalize">{je.source_type}</span></p>{je.fiscal_year && <p>FY: {je.fiscal_year}</p>}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Entry Lines</h2>
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100"><tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Code</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Account</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Description</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Debit</th>
            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Credit</th>
          </tr></thead>
          <tbody>
            {je.lines.map((l, i) => (
              <tr key={i} className="border-b border-gray-50">
                <td className="px-3 py-2 font-mono text-teal-700">{l.account_code}</td>
                <td className="px-3 py-2 text-gray-800">{l.account_name}</td>
                <td className="px-3 py-2 text-gray-500">{l.description || "-"}</td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">{l.debit > 0 ? fmt(l.debit) : ""}</td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">{l.credit > 0 ? fmt(l.credit) : ""}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="border-t border-gray-200">
            <td colSpan={3} className="px-3 py-2 text-right text-sm font-semibold">Total</td>
            <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmt(je.total_debit)}</td>
            <td className="px-3 py-2 text-right font-semibold tabular-nums">{fmt(je.total_credit)}</td>
          </tr></tfoot>
        </table>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 flex gap-3">
        {je.status === "draft" && <button onClick={handlePost} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Post Entry</button>}
        {je.status === "draft" && <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Delete</button>}
        <button onClick={() => window.print()} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Print</button>
      </div>
    </div>
  );
}
