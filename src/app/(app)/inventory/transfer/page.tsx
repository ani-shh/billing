"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SearchSelect } from "@/components/SearchSelect";

interface Transfer { id: string; transfer_code: string; product_name: string; product_code: string; from_warehouse: string; to_warehouse: string; quantity: number; status: string; transfer_date: string; }
interface Product { id: string; name: string; code: string; }
interface Warehouse { id: string; name: string; }

export default function TransferPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product_id: "", from_warehouse_id: "", to_warehouse_id: "", quantity: 0, notes: "", transfer_date: new Date().toISOString().slice(0, 10) });

  const fetch_ = () => { fetch("/api/transfers").then((r) => r.json()).then(setTransfers).finally(() => setLoading(false)); };
  useEffect(() => { fetch_(); fetch("/api/products").then((r) => r.json()).then(setProducts); fetch("/api/warehouses").then((r) => r.json()).then(setWarehouses); }, []);

  const handleSave = async () => {
    if (!form.product_id || !form.from_warehouse_id || !form.to_warehouse_id || form.quantity <= 0) { alert("Please fill all required fields"); return; }
    if (form.from_warehouse_id === form.to_warehouse_id) { alert("Source and destination warehouse must be different"); return; }
    setSaving(true);
    const res = await fetch("/api/transfers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setShowForm(false); setForm({ product_id: "", from_warehouse_id: "", to_warehouse_id: "", quantity: 0, notes: "", transfer_date: new Date().toISOString().slice(0, 10) }); fetch_(); }
    else alert("Transfer failed");
    setSaving(false);
  };

  const statusColors: Record<string, string> = { pending: "bg-amber-100 text-amber-700", completed: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Warehouse Transfer</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">+ New Transfer</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product <span className="text-red-500">*</span></label>
              <SearchSelect value={form.product_id} onChange={(v) => setForm({ ...form, product_id: v })} placeholder="Select Product"
                options={products.map((p) => ({ value: p.id, label: p.code ? `${p.code} - ${p.name}` : p.name }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Warehouse <span className="text-red-500">*</span></label>
              <SearchSelect value={form.from_warehouse_id} onChange={(v) => setForm({ ...form, from_warehouse_id: v })} placeholder="Source"
                options={warehouses.map((w) => ({ value: w.id, label: w.name }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Warehouse <span className="text-red-500">*</span></label>
              <SearchSelect value={form.to_warehouse_id} onChange={(v) => setForm({ ...form, to_warehouse_id: v })} placeholder="Destination"
                options={warehouses.map((w) => ({ value: w.id, label: w.name }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Date</label>
              <input type="date" value={form.transfer_date} onChange={(e) => setForm({ ...form, transfer_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 text-sm disabled:opacity-50">{saving ? "Transferring..." : "Transfer"}</button>
            <button onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">Code</th><th className="px-6 py-3">Product</th><th className="px-6 py-3">From</th><th className="px-6 py-3">To</th><th className="px-6 py-3 text-right">Qty</th><th className="px-6 py-3">Date</th><th className="px-6 py-3">Status</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {transfers.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-teal-600">{t.transfer_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{t.product_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{t.from_warehouse}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{t.to_warehouse}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">{t.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{t.transfer_date}</td>
                  <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[t.status] || "bg-gray-100 text-gray-700"}`}>{t.status}</span></td>
                </tr>
              ))}
              {transfers.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No transfers yet</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
