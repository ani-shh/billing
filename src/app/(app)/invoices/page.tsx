"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

interface Invoice {
  id: string;
  invoice_code: string;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  grand_total: number;
  status: string;
}

function formatAmount(amount: number): string {
  return `Rs. ${(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [loading, setLoading] = useState(true);

  // URL-driven filters from dashboard clicks
  const isExportParam = searchParams.get("is_export") || "";
  const dateFromParam = searchParams.get("date_from") || "";
  const periodLabel = searchParams.get("period") || "";

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (isExportParam) params.set("is_export", isExportParam);
      if (dateFromParam) params.set("date_from", dateFromParam);
      const res = await fetch(`/api/invoices?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch {
      // Network error
    } finally {
      setLoading(false);
    }
  }, [search, status, isExportParam, dateFromParam]);

  useEffect(() => {
    const timeout = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(timeout);
  }, [fetchInvoices]);

  const hasFilters = isExportParam || dateFromParam || periodLabel;

  return (
    <div>
      {/* Filter banner from dashboard */}
      {hasFilters && (
        <div className="mb-4 flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5 text-sm">
          <svg className="w-4 h-4 text-teal-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-teal-800">
            Showing{" "}
            <strong>{isExportParam === "1" ? "Export" : isExportParam === "0" ? "Inside" : "All"} Sales</strong>
            {periodLabel && <> for <strong>{periodLabel}</strong></>}
          </span>
          <Link href="/invoices" className="ml-auto text-teal-600 hover:text-teal-800 text-xs font-medium">
            Clear Filters
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Invoice
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search invoices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="partial">Partial</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500">
            <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <p className="text-sm font-medium">No invoices found</p>
            <p className="mt-1 text-xs text-gray-400">Create a new invoice to get started.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Invoice Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Due Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-teal-600">{inv.invoice_code}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{inv.customer_name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{inv.invoice_date}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{inv.due_date}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 text-right font-medium">{formatAmount(inv.grand_total)}</td>
                  <td className="whitespace-nowrap px-6 py-4"><StatusBadge status={inv.status} /></td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link href={`/invoices/${inv.id}`} className="text-sm font-medium text-teal-600 hover:text-teal-800">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
