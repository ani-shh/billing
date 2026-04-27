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
  sales: {
    weekly: SalesBreakdown;
    monthly: SalesBreakdown;
    quarterly: SalesBreakdown;
    yearly: SalesBreakdown;
  };
  monthlyTrend: MonthlyTrend[];
  recentInvoices: Array<{
    id: string;
    invoice_code: string;
    customer_name: string;
    invoice_date: string;
    grand_total: number;
    status: string;
    is_export: number;
  }>;
}

function formatAmount(amount: number) {
  return `Rs. ${(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatCompact(amount: number) {
  if (amount >= 100000) return `Rs. ${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `Rs. ${(amount / 1000).toFixed(1)}K`;
  return `Rs. ${amount.toFixed(0)}`;
}

const PERIOD_LABELS = { weekly: "This Week", monthly: "This Month", quarterly: "This Quarter", yearly: "This Year" } as const;
type Period = keyof typeof PERIOD_LABELS;

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<Period>("monthly");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;
  if (!data) return <div className="text-center py-20 text-red-500">Failed to load dashboard</div>;

  const activeSales = data.sales[activePeriod];
  const insidePercent = activeSales.total > 0 ? (activeSales.inside / activeSales.total) * 100 : 0;
  const exportPercent = activeSales.total > 0 ? (activeSales.export / activeSales.total) * 100 : 0;

  // Compute date_from for each period
  function getDateFrom(period: Period): string {
    const d = new Date();
    if (period === "weekly") d.setDate(d.getDate() - 7);
    else if (period === "monthly") d.setMonth(d.getMonth() - 1);
    else if (period === "quarterly") d.setMonth(d.getMonth() - 3);
    else d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().slice(0, 10);
  }

  function salesLink(period: Period, type?: "inside" | "export"): string {
    const params = new URLSearchParams();
    params.set("date_from", getDateFrom(period));
    params.set("period", PERIOD_LABELS[period]);
    if (type === "inside") params.set("is_export", "0");
    else if (type === "export") params.set("is_export", "1");
    return `/invoices?${params.toString()}`;
  }

  // Find max for trend bar chart
  const trendMax = Math.max(...data.monthlyTrend.map((m) => m.total), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <Link href="/invoices/new" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium">
          + New Invoice
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: formatAmount(data.totalRevenue), border: "border-green-500", bg: "bg-green-50", text: "text-green-600", href: "/invoices?status=paid" },
          { label: "Outstanding", value: formatAmount(data.totalOutstanding), border: "border-blue-500", bg: "bg-blue-50", text: "text-blue-600", href: "/invoices?status=sent" },
          { label: "Overdue", value: formatAmount(data.totalOverdue), border: "border-red-500", bg: "bg-red-50", text: "text-red-600", href: "/invoices?status=overdue" },
          { label: "Total Invoices", value: data.invoiceCount.toString(), border: "border-teal-500", bg: "bg-teal-50", text: "text-teal-600", href: "/invoices" },
          { label: "Low Stock Items", value: data.lowStockCount.toString(), border: "border-amber-500", bg: "bg-amber-50", text: "text-amber-600", href: "/inventory?low_stock=true" },
        ].map((card) => (
          <Link key={card.label} href={card.href} className={`${card.bg} rounded-xl p-5 border-l-4 ${card.border} hover:shadow-md transition-shadow cursor-pointer group`}>
            <p className="text-xs text-gray-500 mb-1 group-hover:text-gray-700">{card.label}</p>
            <p className={`text-xl font-bold ${card.text}`}>{card.value}</p>
          </Link>
        ))}
      </div>

      {/* Sales Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Period Sales */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-800">Sales Overview</h2>
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((period) => (
                <button key={period} onClick={() => setActivePeriod(period)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activePeriod === period ? "bg-white text-teal-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}>
                  {period === "weekly" ? "Week" : period === "monthly" ? "Month" : period === "quarterly" ? "Quarter" : "Year"}
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          <Link href={salesLink(activePeriod)} className="block mb-6 group cursor-pointer">
            <p className="text-sm text-gray-500 mb-1">{PERIOD_LABELS[activePeriod]} Total Sales</p>
            <p className="text-3xl font-bold text-gray-900 group-hover:text-teal-700 transition-colors">{formatAmount(activeSales.total)}</p>
          </Link>

          {/* Inside vs Export bars */}
          <div className="space-y-4">
            <Link href={salesLink(activePeriod, "inside")} className="block group cursor-pointer rounded-lg hover:bg-gray-50 p-2 -mx-2 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-teal-500" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-teal-700">Inside Sales</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{formatAmount(activeSales.inside)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-teal-500 h-3 rounded-full transition-all duration-500" style={{ width: `${insidePercent}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{insidePercent.toFixed(1)}% of total</p>
            </Link>

            <Link href={salesLink(activePeriod, "export")} className="block group cursor-pointer rounded-lg hover:bg-gray-50 p-2 -mx-2 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">Export Sales</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{formatAmount(activeSales.export)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div className="bg-indigo-500 h-3 rounded-full transition-all duration-500" style={{ width: `${exportPercent}%` }} />
              </div>
              <p className="text-xs text-gray-400 mt-1">{exportPercent.toFixed(1)}% of total</p>
            </Link>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-5">Monthly Trend</h2>
          {data.monthlyTrend.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data yet</div>
          ) : (
            <div className="space-y-3">
              {data.monthlyTrend.map((m) => {
                const monthName = new Date(m.month + "-01").toLocaleDateString("en", { month: "short", year: "2-digit" });
                const insideW = (m.inside_sales / trendMax) * 100;
                const exportW = (m.export_sales / trendMax) * 100;
                return (
                  <div key={m.month}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600 w-16">{monthName}</span>
                      <span className="text-xs text-gray-500">{formatCompact(m.total)}</span>
                    </div>
                    <div className="flex h-5 rounded-full overflow-hidden bg-gray-100">
                      {m.inside_sales > 0 && (
                        <div className="bg-teal-500 transition-all duration-500" style={{ width: `${insideW}%` }}
                          title={`Inside: ${formatAmount(m.inside_sales)}`} />
                      )}
                      {m.export_sales > 0 && (
                        <div className="bg-indigo-500 transition-all duration-500" style={{ width: `${exportW}%` }}
                          title={`Export: ${formatAmount(m.export_sales)}`} />
                      )}
                    </div>
                  </div>
                );
              })}
              {/* Legend */}
              <div className="flex items-center gap-6 pt-2 border-t border-gray-100 mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-teal-500" />
                  <span className="text-xs text-gray-500">Inside Sales</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-indigo-500" />
                  <span className="text-xs text-gray-500">Export Sales</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Period Comparison Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Sales Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Period</th>
                <th className="px-6 py-3 text-right">Inside Sales</th>
                <th className="px-6 py-3 text-right">Export Sales</th>
                <th className="px-6 py-3 text-right">Total Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(Object.keys(PERIOD_LABELS) as Period[]).map((period) => {
                const s = data.sales[period];
                return (
                  <tr key={period} className={`hover:bg-gray-50 ${period === activePeriod ? "bg-teal-50/50" : ""}`}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      <Link href={salesLink(period)} className="hover:text-teal-700">{PERIOD_LABELS[period]}</Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <Link href={salesLink(period, "inside")} className="text-teal-600 font-medium hover:underline">{formatAmount(s.inside)}</Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <Link href={salesLink(period, "export")} className="text-indigo-600 font-medium hover:underline">{formatAmount(s.export)}</Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-bold">
                      <Link href={salesLink(period)} className="text-gray-900 hover:text-teal-700">{formatAmount(s.total)}</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Recent Invoices</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Invoice</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-teal-600">{inv.invoice_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{inv.customer_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{inv.invoice_date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      inv.is_export ? "bg-indigo-100 text-indigo-700" : "bg-teal-100 text-teal-700"
                    }`}>
                      {inv.is_export ? "Export" : "Inside"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{formatAmount(inv.grand_total)}</td>
                  <td className="px-6 py-4"><StatusBadge status={inv.status} /></td>
                  <td className="px-6 py-4">
                    <Link href={`/invoices/${inv.id}`} className="text-teal-600 hover:text-teal-800 text-sm">View</Link>
                  </td>
                </tr>
              ))}
              {data.recentInvoices.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No invoices yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
