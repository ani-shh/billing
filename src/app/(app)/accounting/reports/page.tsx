"use client";
import Link from "next/link";

const reports = [
  { href: "/accounting/reports/trial-balance", title: "Trial Balance", desc: "All account balances — debits must equal credits", icon: "M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" },
  { href: "/accounting/reports/profit-loss", title: "Profit & Loss", desc: "Revenue minus expenses for a period", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
  { href: "/accounting/reports/balance-sheet", title: "Balance Sheet", desc: "Assets = Liabilities + Equity as of a date", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
];

export default function ReportsPage() {
  return (
    <div>
      <div className="mb-6"><h1 className="text-xl font-semibold text-gray-900">Financial Reports</h1><p className="text-sm text-gray-500 mt-0.5">Key financial statements for your business</p></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.map((r) => (
          <Link key={r.href} href={r.href} className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-all group">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center mb-3 group-hover:bg-teal-100 transition-colors">
              <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={r.icon} /></svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">{r.title}</h3>
            <p className="text-xs text-gray-500">{r.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
