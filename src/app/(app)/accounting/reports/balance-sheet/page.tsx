"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Row { code: string; name: string; sub_type: string; balance: number; }
interface BSData { as_of: string; assets: Row[]; liabilities: Row[]; equity: Row[]; totalAssets: number; totalLiabilities: number; totalEquity: number; }
function fmt(n: number) { return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function BalanceSheetPage() {
  const [data, setData] = useState<BSData | null>(null);
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => { fetch(`/api/reports/balance-sheet?as_of=${asOf}`).then((r) => r.json()).then(setData); }, [asOf]);

  const Section = ({ title, rows, total, color }: { title: string; rows: Row[]; total: number; color: string }) => (
    <div>
      <h2 className={`text-sm font-semibold ${color} uppercase tracking-wider mb-3`}>{title}</h2>
      {rows.filter((r) => r.balance !== 0).map((r) => (
        <div key={r.code} className="flex justify-between py-1.5 text-sm"><span className="text-gray-700">{r.name}</span><span className="tabular-nums text-gray-900">{fmt(r.balance)}</span></div>
      ))}
      <div className="flex justify-between py-2 border-t border-gray-200 mt-2 font-semibold text-sm"><span>Total {title}</span><span className={`tabular-nums ${color}`}>{fmt(total)}</span></div>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/accounting/reports" className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
          <div><h1 className="text-xl font-semibold text-gray-900">Balance Sheet</h1><p className="text-sm text-gray-500 mt-0.5">As of {asOf}</p></div>
        </div>
        <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50" />
      </div>
      {data && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <Section title="Assets" rows={data.assets} total={data.totalAssets} color="text-blue-700" />
          <Section title="Liabilities" rows={data.liabilities} total={data.totalLiabilities} color="text-red-700" />
          <Section title="Equity" rows={data.equity} total={data.totalEquity} color="text-purple-700" />
          <div className="flex justify-between py-3 border-t-2 border-gray-900 font-bold text-sm">
            <span>Liabilities + Equity</span>
            <span className="tabular-nums">{fmt(data.totalLiabilities + data.totalEquity)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
