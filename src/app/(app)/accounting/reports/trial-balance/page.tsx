"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Row { id: string; code: string; name: string; type: string; total_debit: number; total_credit: number; opening_balance: number; opening_balance_type: string; }
function fmt(n: number) { return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function TrialBalancePage() {
  const [data, setData] = useState<{ as_of: string; accounts: Row[] } | null>(null);
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => { fetch(`/api/reports/trial-balance?as_of=${asOf}`).then((r) => r.json()).then(setData); }, [asOf]);

  const totalDebit = data?.accounts.reduce((s, a) => s + a.total_debit, 0) || 0;
  const totalCredit = data?.accounts.reduce((s, a) => s + a.total_credit, 0) || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/accounting/reports" className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
          <div><h1 className="text-xl font-semibold text-gray-900">Trial Balance</h1><p className="text-sm text-gray-500 mt-0.5">As of {asOf}</p></div>
        </div>
        <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50" />
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Code</th>
            <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Account</th>
            <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500">Type</th>
            <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500">Debit</th>
            <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500">Credit</th>
          </tr></thead>
          <tbody>
            {data?.accounts.filter((a) => a.total_debit > 0 || a.total_credit > 0).map((a) => (
              <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-2.5 font-mono text-teal-700">{a.code}</td>
                <td className="px-5 py-2.5 text-gray-800">{a.name}</td>
                <td className="px-5 py-2.5 text-gray-500 capitalize">{a.type}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{a.total_debit > 0 ? fmt(a.total_debit) : ""}</td>
                <td className="px-5 py-2.5 text-right tabular-nums">{a.total_credit > 0 ? fmt(a.total_credit) : ""}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="border-t-2 border-gray-300 bg-gray-50">
            <td colSpan={3} className="px-5 py-3 text-right font-semibold text-gray-900">Total</td>
            <td className="px-5 py-3 text-right font-semibold tabular-nums">{fmt(totalDebit)}</td>
            <td className="px-5 py-3 text-right font-semibold tabular-nums">{fmt(totalCredit)}</td>
          </tr></tfoot>
        </table>
      </div>
    </div>
  );
}
