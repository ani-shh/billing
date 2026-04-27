"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchSelect } from "@/components/SearchSelect";

interface Supplier { id: string; name: string; }
interface Bill { id: string; bill_code: string; supplier_id: string; }
interface Product { id: string; name: string; code: string; rate: number; tax_rate: number; }
interface LineItem { id: string; product_id: string; description: string; quantity: number; rate: number; tax_rate: number; amount: number; }

function today() { return new Date().toISOString().slice(0, 10); }
function calc(i: LineItem) { const sub = i.quantity * i.rate; return sub + sub * (i.tax_rate / 100); }
function fmt(n: number) { return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

const REASONS = ["Goods Returned to Supplier", "Pricing Error", "Defective Goods", "Short Supply", "Quality Issue", "Other"];

export default function NewDebitNotePage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [billId, setBillId] = useState("");
  const [debitDate, setDebitDate] = useState(today());
  const [referenceNo, setReferenceNo] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);

  useEffect(() => {
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers);
    fetch("/api/bills").then((r) => r.json()).then(setBills);
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  const addProduct = (pid: string) => {
    const p = products.find((x) => x.id === pid);
    if (!p) return;
    const item: LineItem = { id: Math.random().toString(36).slice(2), product_id: p.id, description: p.name, quantity: 1, rate: p.rate, tax_rate: p.tax_rate, amount: 0 };
    item.amount = calc(item);
    setItems([...items, item]);
  };

  const updateItem = (id: string, f: keyof LineItem, v: number) => {
    setItems(items.map((i) => { if (i.id !== id) return i; const u = { ...i, [f]: v }; u.amount = calc(u); return u; }));
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
  const taxTotal = items.reduce((s, i) => { const sub = i.quantity * i.rate; return s + sub * (i.tax_rate / 100); }, 0);
  const grandTotal = subtotal + taxTotal;

  const handleSave = async () => {
    if (!supplierId || items.length === 0) { alert("Select a supplier and add items"); return; }
    setSaving(true);
    const res = await fetch("/api/debit-notes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ supplier_id: supplierId, bill_id: billId || undefined, debit_date: debitDate, reference_no: referenceNo, reason, notes, subtotal, tax_total: taxTotal, grand_total: grandTotal, items: items.map(({ id: _, ...rest }) => rest) }) });
    if (res.ok) router.push("/purchase/debit-notes"); else alert("Failed");
    setSaving(false);
  };

  const ic = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all";

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">New Debit Note</h1>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="bg-teal-700 text-white px-6 py-2.5 rounded-lg hover:bg-teal-800 text-sm font-medium disabled:opacity-50 shadow-sm">{saving ? "Saving..." : "Save"}</button>
          <Link href="/purchase/debit-notes" className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2.5 text-gray-400 hover:bg-gray-50">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </Link>
        </div>
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-lg border border-gray-200 p-5 overflow-visible">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Supplier <span className="text-red-500">*</span></label>
              <SearchSelect value={supplierId} onChange={setSupplierId} placeholder="Select Supplier" options={suppliers.map((s) => ({ value: s.id, label: s.name }))} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Against Bill</label>
              <SearchSelect value={billId} onChange={setBillId} placeholder="Select Bill (optional)" options={bills.filter((b) => !supplierId || b.supplier_id === supplierId).map((b) => ({ value: b.id, label: b.bill_code }))} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Debit Date <span className="text-red-500">*</span></label>
              <input type="date" value={debitDate} onChange={(e) => setDebitDate(e.target.value)} className={ic} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reference No</label>
              <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="Reference" className={ic} /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <SearchSelect value={reason} onChange={setReason} placeholder="Select Reason" options={REASONS.map((r) => ({ value: r, label: r }))} /></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Items</h2>
          <div className="mb-3"><SearchSelect value="" onChange={addProduct} placeholder="Add product..." options={products.map((p) => ({ value: p.id, label: p.code ? `${p.code} - ${p.name}` : p.name, sublabel: `Rs. ${p.rate}` }))} /></div>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100"><tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Product</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-20">Qty</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-24">Rate</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-16">Tax%</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-28">Amount</th>
              <th className="w-8"></th>
            </tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="px-3 py-2 text-gray-700">{item.description}</td>
                  <td className="px-3 py-2"><input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)} className="w-full rounded border border-gray-200 px-2 py-1 text-right text-sm" /></td>
                  <td className="px-3 py-2"><input type="number" value={item.rate} onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)} className="w-full rounded border border-gray-200 px-2 py-1 text-right text-sm" /></td>
                  <td className="px-3 py-2 text-right text-gray-500">{item.tax_rate}%</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">{fmt(item.amount)}</td>
                  <td className="px-3 py-2"><button onClick={() => setItems(items.filter((i) => i.id !== item.id))} className="text-gray-300 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></td>
                </tr>
              ))}
              {items.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">No items</td></tr>}
            </tbody>
          </table>
          {items.length > 0 && (
            <div className="mt-3 flex justify-end"><div className="w-64 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span className="tabular-nums">{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Tax</span><span className="tabular-nums">{fmt(taxTotal)}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900"><span>Total Debit</span><span className="tabular-nums">{fmt(grandTotal)}</span></div>
            </div></div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Additional notes..." className={ic} />
        </div>
      </div>
    </div>
  );
}
