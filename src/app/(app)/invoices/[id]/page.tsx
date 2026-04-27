"use client";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";

interface LineItem {
  product_name: string;
  product_code: string;
  quantity: number;
  rate: number;
  discount: number;
  tax_rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoice_code: string;
  reference_no: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  invoice_date: string;
  due_date: string;
  currency: string;
  exchange_rate: number;
  warehouse_name: string;
  is_export: number;
  status: string;
  items: LineItem[];
  payments: Array<{ id: string; amount: number; payment_date: string; payment_method: string; reference: string }>;
  received_by: string;
  expiry: string;
  batch_no: string;
  udf: string;
  tds_applicable: number;
  terms: string;
  reporting_tags: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  grand_total: number;
}

function formatAmount(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payment, setPayment] = useState({ amount: "", date: today(), method: "cash", reference: "" });
  const [paymentSaving, setPaymentSaving] = useState(false);

  const fetchInvoice = () => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then(setInvoice)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInvoice(); }, [id]);

  const handleMarkAsSent = async () => {
    if (!invoice) return;
    await fetch(`/api/invoices/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...invoice, status: "sent" }),
    });
    fetchInvoice();
  };

  const handleRecordPayment = async () => {
    if (!payment.amount || parseFloat(payment.amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    setPaymentSaving(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: id,
          amount: parseFloat(payment.amount),
          payment_date: payment.date,
          payment_method: payment.method,
          reference: payment.reference,
        }),
      });
      if (res.ok) {
        setShowPaymentForm(false);
        setPayment({ amount: "", date: today(), method: "cash", reference: "" });
        fetchInvoice();
      }
    } finally {
      setPaymentSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this invoice?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    router.push("/invoices");
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!invoice) return (
    <div className="text-center py-20">
      <p className="text-gray-500 mb-4">Invoice not found</p>
      <Link href="/invoices" className="text-teal-600 hover:text-teal-800 text-sm">Back to Invoices</Link>
    </div>
  );

  const totalPaid = (invoice.payments || []).reduce((s, p) => s + p.amount, 0);
  const balance = invoice.grand_total - totalPaid;

  return (
    <div className="max-w-5xl print-invoice">
      {/* Print-only header */}
      <div className="hidden print:block print-header mb-6">
        <div>
          <h1 className="text-2xl font-bold text-teal-700">INVOICE</h1>
          <p className="text-sm text-gray-500 mt-1">Moonbeam Trading & Suppliers</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-lg font-bold">{invoice.invoice_code}</p>
          <p>Date: {invoice.invoice_date}</p>
          <p>Due: {invoice.due_date}</p>
        </div>
      </div>

      <Link href="/invoices" className="no-print inline-flex items-center gap-1 text-sm text-gray-500 hover:text-teal-600 mb-6">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Invoices
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6 print:border-0 print:p-0 print:shadow-none print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{invoice.invoice_code}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            {invoice.reference_no && <p className="text-sm text-gray-500">Ref: {invoice.reference_no}</p>}
          </div>
          <div className="text-sm text-gray-500 sm:text-right space-y-1">
            <p>Invoice Date: <span className="font-medium text-gray-700">{invoice.invoice_date}</span></p>
            <p>Due Date: <span className="font-medium text-gray-700">{invoice.due_date}</span></p>
            <p>Currency: <span className="font-medium text-gray-700">{invoice.currency}</span></p>
          </div>
        </div>
      </div>

      {/* Customer & Warehouse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 print:gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 print:rounded-none print:shadow-none print:p-3 print:border">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Customer</h2>
          <p className="text-base font-medium text-gray-900">{invoice.customer_name}</p>
          {invoice.customer_email && <p className="text-sm text-gray-500">{invoice.customer_email}</p>}
          {invoice.customer_phone && <p className="text-sm text-gray-500">{invoice.customer_phone}</p>}
          {invoice.customer_address && <p className="text-sm text-gray-500">{invoice.customer_address}</p>}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Warehouse</h2>
          <p className="text-base font-medium text-gray-900">{invoice.warehouse_name || "-"}</p>
          {invoice.is_export === 1 && (
            <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">Export Sales</span>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Product / Service</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Qty</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Rate</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Discount</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Tax</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(invoice.items || []).map((item, i) => (
                <tr key={i}>
                  <td className="px-4 py-3 text-gray-700">{item.product_name || "-"}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatAmount(item.rate)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatAmount(item.discount)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{item.tax_rate}%</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">{formatAmount(item.amount)}</td>
                </tr>
              ))}
              {(!invoice.items || invoice.items.length === 0) && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No line items</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatAmount(invoice.subtotal)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Discount</span><span>- {formatAmount(invoice.discount_total)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Tax</span><span>{formatAmount(invoice.tax_total)}</span></div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
              <span>Grand Total</span><span>{formatAmount(invoice.grand_total)}</span>
            </div>
            {totalPaid > 0 && (
              <>
                <div className="flex justify-between text-green-600"><span>Paid</span><span>{formatAmount(totalPaid)}</span></div>
                <div className="flex justify-between font-bold text-gray-900"><span>Balance</span><span>{formatAmount(balance)}</span></div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Custom Fields */}
      {(invoice.received_by || invoice.expiry || invoice.batch_no || invoice.udf) && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Fields</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {invoice.received_by && <div><p className="text-gray-400 font-medium">Received By</p><p className="text-gray-900">{invoice.received_by}</p></div>}
            {invoice.expiry && <div><p className="text-gray-400 font-medium">Expiry</p><p className="text-gray-900">{invoice.expiry}</p></div>}
            {invoice.batch_no && <div><p className="text-gray-400 font-medium">Batch NO</p><p className="text-gray-900">{invoice.batch_no}</p></div>}
            {invoice.udf && <div><p className="text-gray-400 font-medium">UDF</p><p className="text-gray-900">{invoice.udf}</p></div>}
          </div>
        </div>
      )}

      {invoice.terms && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Terms and Conditions</h2>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.terms}</p>
        </div>
      )}

      {/* Payments History */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Payments</h2>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Method</th>
                <th className="px-4 py-2 text-left font-medium text-gray-500">Reference</th>
                <th className="px-4 py-2 text-right font-medium text-gray-500">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 text-gray-700">{p.payment_date}</td>
                  <td className="px-4 py-2 text-gray-700 capitalize">{p.payment_method}</td>
                  <td className="px-4 py-2 text-gray-700">{p.reference || "-"}</td>
                  <td className="px-4 py-2 text-right font-medium text-green-600">{formatAmount(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Actions */}
      <div className="no-print bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex flex-wrap gap-3">
          {invoice.status === "draft" && (
            <button onClick={handleMarkAsSent} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Mark as Sent
            </button>
          )}
          <button onClick={() => setShowPaymentForm(!showPaymentForm)} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            Record Payment
          </button>
          <button onClick={() => window.print()} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Print
          </button>
          <button onClick={handleDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>

      {/* Payment Form */}
      {showPaymentForm && (
        <div className="no-print bg-teal-50 rounded-xl border border-teal-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount <span className="text-red-500">*</span></label>
              <input type="number" min={0} step="0.01" value={payment.amount}
                onChange={(e) => setPayment({ ...payment, amount: e.target.value })}
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={payment.date}
                onChange={(e) => setPayment({ ...payment, date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
              <select value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="online">Online</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
              <input type="text" value={payment.reference}
                onChange={(e) => setPayment({ ...payment, reference: e.target.value })}
                placeholder="Payment reference"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={handleRecordPayment} disabled={paymentSaving}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
              {paymentSaving ? "Saving..." : "Save Payment"}
            </button>
            <button onClick={() => setShowPaymentForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
