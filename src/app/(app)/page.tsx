"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

interface SalesBreakdown { inside: number; export: number; total: number; }
interface MonthlyTrend { month: string; inside_sales: number; export_sales: number; total: number; }

interface DashboardData {
  totalRevenue: number;
  totalOutstanding: number;
  totalOverdue: number;
  invoiceCount: number;
  lowStockCount: number;
  sales: { weekly: SalesBreakdown; monthly: SalesBreakdown; quarterly: SalesBreakdown; yearly: SalesBreakdown; };
  monthlyTrend: MonthlyTrend[];
  recentInvoices: Array<{
    id: string; invoice_code: string; customer_name: string; invoice_date: string; grand_total: number; status: string; is_export: number;
  }>;
}

function fmt(n: number) {
  return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtShort(n: number) {
  if (n >= 100000) return `Rs. ${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `Rs. ${(n / 1000).toFixed(1)}K`;
  return `Rs. ${n.toFixed(0)}`;
}

const PERIODS = { weekly: "This Week", monthly: "This Month", quarterly: "This Quarter", yearly: "This Year" } as const;
type Period = keyof typeof PERIODS;

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("monthly");

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96 text-gray-400">Loading dashboard...</div>;
  if (!data) return <div className="flex items-center justify-center h-96 text-red-400">Failed to load</div>;

  const sales = data.sales[period];
  const insidePct = sales.total > 0 ? (sales.inside / sales.total) * 100 : 0;
  const exportPct = sales.total > 0 ? (sales.export / sales.total) * 100 : 0;
  const trendMax = Math.max(...data.monthlyTrend.map((m) => m.total), 1);

  function dateFrom(p: Period): string {
    const d = new Date();
    if (p === "weekly") d.setDate(d.getDate() - 7);
    else if (p === "monthly") d.setMonth(d.getMonth() - 1);
    else if (p === "quarterly") d.setMonth(d.getMonth() - 3);
    else d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  }
  function sLink(p: Period, type?: "inside" | "export") {
    const params = new URLSearchParams({ date_from: dateFrom(p), period: PERIODS[p] });
    if (type === "inside") params.set("is_export", "0");
    else if (type === "export") params.set("is_export", "1");
    return `/invoices?${params}`;
  }

  const cards = [
    { label: "Total Revenue", value: fmt(data.totalRevenue), icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-emerald-600", bg: "bg-emerald-50", href: "/invoices?status=paid" },
    { label: "Outstanding", value: fmt(data.totalOutstanding), icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-blue-600", bg: "bg-blue-50", href: "/invoices?status=sent" },
    { label: "Overdue", value: fmt(data.totalOverdue), icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z", color: "text-red-600", bg: "bg-red-50", href: "/invoices?status=overdue" },
    { label: "Invoices", value: data.invoiceCount.toString(), icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "text-gray-700", bg: "bg-gray-50", href: "/invoices" },
    { label: "Low Stock", value: data.lowStockCount.toString(), icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "text-amber-600", bg: "bg-amber-50", href: "/inventory?low_stock=true" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Overview of your business performance</p>
        </div>
        <Link href="/invoices/new" className="inline-flex items-center gap-2 bg-teal-700 text-white px-4 py-2.5 rounded-lg hover:bg-teal-800 transition-colors text-sm font-medium shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Invoice
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{c.label}</span>
              <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                <svg className={`w-4 h-4 ${c.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.icon} />
                </svg>
              </div>
            </div>
            <p className={`text-lg font-semibold ${c.color} group-hover:opacity-80 transition-opacity`}>{c.value}</p>
          </Link>
        ))}
      </div>

      {/* Sales + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
        {/* Sales Overview — 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Sales Overview</h2>
            <div className="flex bg-gray-100 rounded-md p-0.5 gap-0.5">
              {(Object.keys(PERIODS) as Period[]).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                    period === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}>
                  {p === "weekly" ? "W" : p === "monthly" ? "M" : p === "quarterly" ? "Q" : "Y"}
                </button>
              ))}
            </div>
          </div>

          <Link href={sLink(period)} className="block mb-5 group">
            <p className="text-xs text-gray-500 mb-0.5">{PERIODS[period]}</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums group-hover:text-teal-700 transition-colors">{fmt(sales.total)}</p>
          </Link>

          <div className="space-y-3">
            <Link href={sLink(period, "inside")} className="block p-3 rounded-lg hover:bg-gray-50 transition-colors -mx-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                  <span className="text-sm text-gray-700">Inside Sales</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">{fmt(sales.inside)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-teal-600 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${insidePct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1 tabular-nums">{insidePct.toFixed(1)}%</p>
            </Link>

            <Link href={sLink(period, "export")} className="block p-3 rounded-lg hover:bg-gray-50 transition-colors -mx-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-sm text-gray-700">Export Sales</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 tabular-nums">{fmt(sales.export)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-indigo-500 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${exportPct}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1 tabular-nums">{exportPct.toFixed(1)}%</p>
            </Link>
          </div>
        </div>

        {/* Monthly Trend — 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Monthly Trend</h2>
          {data.monthlyTrend.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No data</div>
          ) : (
            <div className="space-y-2.5">
              {data.monthlyTrend.map((m) => {
                const label = new Date(m.month + "-01").toLocaleDateString("en", { month: "short", year: "2-digit" });
                return (
                  <div key={m.month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600 w-14">{label}</span>
                      <span className="text-xs text-gray-400 tabular-nums">{fmtShort(m.total)}</span>
                    </div>
                    <div className="flex h-4 rounded bg-gray-100 overflow-hidden">
                      {m.inside_sales > 0 && <div className="bg-teal-600 transition-all" style={{ width: `${(m.inside_sales / trendMax) * 100}%` }} />}
                      {m.export_sales > 0 && <div className="bg-indigo-500 transition-all" style={{ width: `${(m.export_sales / trendMax) * 100}%` }} />}
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-4 pt-2 mt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-teal-600" /><span className="text-xs text-gray-500">Inside</span></div>
                <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="text-xs text-gray-500">Export</span></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sales Summary Table */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Sales Summary</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Inside</th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Export</th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(PERIODS) as Period[]).map((p) => {
              const s = data.sales[p];
              return (
                <tr key={p} className={`border-b border-gray-50 hover:bg-gray-50/50 ${p === period ? "bg-teal-50/30" : ""}`}>
                  <td className="px-5 py-3 text-sm font-medium"><Link href={sLink(p)} className="text-gray-800 hover:text-teal-700">{PERIODS[p]}</Link></td>
                  <td className="px-5 py-3 text-sm text-right"><Link href={sLink(p, "inside")} className="text-teal-700 hover:underline tabular-nums">{fmt(s.inside)}</Link></td>
                  <td className="px-5 py-3 text-sm text-right"><Link href={sLink(p, "export")} className="text-indigo-600 hover:underline tabular-nums">{fmt(s.export)}</Link></td>
                  <td className="px-5 py-3 text-sm text-right font-semibold"><Link href={sLink(p)} className="text-gray-900 hover:text-teal-700 tabular-nums">{fmt(s.total)}</Link></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">Recent Invoices</h2>
          <Link href="/invoices" className="text-xs text-teal-600 hover:text-teal-800 font-medium">View All</Link>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-5 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-5 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.recentInvoices.map((inv) => (
              <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3 text-sm"><Link href={`/invoices/${inv.id}`} className="font-medium text-teal-700 hover:text-teal-900">{inv.invoice_code}</Link></td>
                <td className="px-5 py-3 text-sm text-gray-700">{inv.customer_name}</td>
                <td className="px-5 py-3 text-sm text-gray-500 tabular-nums">{inv.invoice_date}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${inv.is_export ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-teal-50 text-teal-700 border border-teal-200"}`}>
                    {inv.is_export ? "Export" : "Inside"}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-right font-medium text-gray-900 tabular-nums">{fmt(inv.grand_total)}</td>
                <td className="px-5 py-3"><StatusBadge status={inv.status} /></td>
              </tr>
            ))}
            {data.recentInvoices.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">No invoices yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
