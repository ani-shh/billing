"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Row { code: string; name: string; sub_type: string; balance: number; }
interface PLData { date_from: string; date_to: string; revenue: Row[]; expenses: Row[]; totalRevenue: number; totalExpenses: number; netIncome: number; }
function fmt(n: number) { return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function ProfitLossPage() {
  const [data, setData] = useState<PLData | null>(null);
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => { fetch(`/api/reports/profit-loss?date_from=${dateFrom}&date_to=${dateTo}`).then((r) => r.json()).then(setData); }, [dateFrom, dateTo]);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/accounting/reports" className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
          <h1 className="text-xl font-semibold text-gray-900">Profit & Loss Statement</h1>
        </div>
        <div className="flex gap-2">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50" />
        </div>
      </div>
      {data && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider mb-3">Revenue</h2>
            {data.revenue.filter((r) => r.balance !== 0).map((r) => (
              <div key={r.code} className="flex justify-between py-1.5 text-sm"><span className="text-gray-700">{r.name}</span><span className="tabular-nums text-gray-900">{fmt(r.balance)}</span></div>
            ))}
            <div className="flex justify-between py-2 border-t border-gray-200 mt-2 font-semibold text-sm"><span className="text-gray-900">Total Revenue</span><span className="tabular-nums text-emerald-700">{fmt(data.totalRevenue)}</span></div>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wider mb-3">Expenses</h2>
            {data.expenses.filter((e) => e.balance !== 0).map((e) => (
              <div key={e.code} className="flex justify-between py-1.5 text-sm"><span className="text-gray-700">{e.name}</span><span className="tabular-nums text-gray-900">{fmt(e.balance)}</span></div>
            ))}
            <div className="flex justify-between py-2 border-t border-gray-200 mt-2 font-semibold text-sm"><span className="text-gray-900">Total Expenses</span><span className="tabular-nums text-red-700">{fmt(data.totalExpenses)}</span></div>
          </div>
          <div className="flex justify-between py-3 border-t-2 border-gray-900 font-bold text-lg">
            <span>Net {data.netIncome >= 0 ? "Profit" : "Loss"}</span>
            <span className={`tabular-nums ${data.netIncome >= 0 ? "text-emerald-700" : "text-red-700"}`}>{fmt(Math.abs(data.netIncome))}</span>
          </div>
        </div>
      )}
    </div>
  );
}
