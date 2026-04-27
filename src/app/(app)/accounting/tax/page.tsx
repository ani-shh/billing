"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface VATData { output_vat: number; input_vat: number; net_vat: number; sales: Array<{ invoice_code: string; invoice_date: string; customer_name: string; pan_no: string; subtotal: number; tax_total: number; grand_total: number }>; purchases: Array<{ bill_code: string; bill_date: string; supplier_name: string; pan_no: string; subtotal: number; tax_total: number; grand_total: number }>; }
function fmt(n: number) { return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function TaxPage() {
  const [data, setData] = useState<VATData | null>(null);
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(now.toISOString().slice(0, 10));

  useEffect(() => { fetch(`/api/tax/vat-report?date_from=${dateFrom}&date_to=${dateTo}`).then((r) => r.json()).then(setData); }, [dateFrom, dateTo]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold text-gray-900">Tax & VAT</h1><p className="text-sm text-gray-500 mt-0.5">VAT summary and register</p></div>
        <div className="flex gap-2">
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50" />
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50" />
        </div>
      </div>
      {data && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase mb-1">Output VAT (Sales)</p><p className="text-lg font-semibold text-red-600 tabular-nums">{fmt(data.output_vat)}</p></div>
            <div className="bg-white rounded-lg border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase mb-1">Input VAT (Purchase)</p><p className="text-lg font-semibold text-emerald-600 tabular-nums">{fmt(data.input_vat)}</p></div>
            <div className="bg-white rounded-lg border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase mb-1">Net VAT {data.net_vat >= 0 ? "Payable" : "Refundable"}</p><p className={`text-lg font-semibold tabular-nums ${data.net_vat >= 0 ? "text-red-600" : "text-emerald-600"}`}>{fmt(Math.abs(data.net_vat))}</p></div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50"><h2 className="text-sm font-semibold text-gray-900">Sales Register (Output VAT)</h2></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Invoice</th><th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Date</th><th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Customer</th><th className="px-5 py-2 text-left text-xs font-medium text-gray-500">PAN</th><th className="px-5 py-2 text-right text-xs font-medium text-gray-500">Taxable</th><th className="px-5 py-2 text-right text-xs font-medium text-gray-500">VAT</th><th className="px-5 py-2 text-right text-xs font-medium text-gray-500">Total</th>
              </tr></thead>
              <tbody>
                {data.sales.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50"><td className="px-5 py-2 text-teal-700 font-medium">{s.invoice_code}</td><td className="px-5 py-2 text-gray-500">{s.invoice_date}</td><td className="px-5 py-2 text-gray-700">{s.customer_name}</td><td className="px-5 py-2 text-gray-500">{s.pan_no || "-"}</td><td className="px-5 py-2 text-right tabular-nums">{fmt(s.subtotal)}</td><td className="px-5 py-2 text-right tabular-nums text-red-600">{fmt(s.tax_total)}</td><td className="px-5 py-2 text-right font-medium tabular-nums">{fmt(s.grand_total)}</td></tr>
                ))}
                {data.sales.length === 0 && <tr><td colSpan={7} className="px-5 py-6 text-center text-gray-400">No sales</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50"><h2 className="text-sm font-semibold text-gray-900">Purchase Register (Input VAT)</h2></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Bill</th><th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Date</th><th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Supplier</th><th className="px-5 py-2 text-left text-xs font-medium text-gray-500">PAN</th><th className="px-5 py-2 text-right text-xs font-medium text-gray-500">Taxable</th><th className="px-5 py-2 text-right text-xs font-medium text-gray-500">VAT</th><th className="px-5 py-2 text-right text-xs font-medium text-gray-500">Total</th>
              </tr></thead>
              <tbody>
                {data.purchases.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50"><td className="px-5 py-2 text-teal-700 font-medium">{p.bill_code}</td><td className="px-5 py-2 text-gray-500">{p.bill_date}</td><td className="px-5 py-2 text-gray-700">{p.supplier_name}</td><td className="px-5 py-2 text-gray-500">{p.pan_no || "-"}</td><td className="px-5 py-2 text-right tabular-nums">{fmt(p.subtotal)}</td><td className="px-5 py-2 text-right tabular-nums text-emerald-600">{fmt(p.tax_total)}</td><td className="px-5 py-2 text-right font-medium tabular-nums">{fmt(p.grand_total)}</td></tr>
                ))}
                {data.purchases.length === 0 && <tr><td colSpan={7} className="px-5 py-6 text-center text-gray-400">No purchases</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
