"use client";
import { useEffect, useState } from "react";
import { SearchSelect } from "@/components/SearchSelect";

interface Adjustment { id: string; adjustment_code: string; product_name: string; product_code: string; warehouse_name: string; adjustment_type: string; quantity: number; reason: string; adjustment_date: string; }
interface Product { id: string; name: string; code: string; }
interface Warehouse { id: string; name: string; }

export default function AdjustmentPage() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product_id: "", warehouse_id: "", adjustment_type: "increase", quantity: 0, reason: "", notes: "", adjustment_date: new Date().toISOString().slice(0, 10) });

  const fetch_ = () => { fetch("/api/adjustments").then((r) => r.json()).then(setAdjustments).finally(() => setLoading(false)); };
  useEffect(() => { fetch_(); fetch("/api/products").then((r) => r.json()).then(setProducts); fetch("/api/warehouses").then((r) => r.json()).then(setWarehouses); }, []);

  const handleSave = async () => {
    if (!form.product_id || !form.warehouse_id || form.quantity <= 0) { alert("Fill all required fields"); return; }
    setSaving(true);
    const res = await fetch("/api/adjustments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setShowForm(false); setForm({ product_id: "", warehouse_id: "", adjustment_type: "increase", quantity: 0, reason: "", notes: "", adjustment_date: new Date().toISOString().slice(0, 10) }); fetch_(); }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Adjustment</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">+ New Adjustment</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "increase", label: "Increase Stock", color: "border-green-500 bg-green-50 text-green-700" },
                { value: "decrease", label: "Decrease Stock", color: "border-red-500 bg-red-50 text-red-700" },
              ].map((t) => (
                <button key={t.value} type="button" onClick={() => setForm({ ...form, adjustment_type: t.value })}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${form.adjustment_type === t.value ? t.color : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product <span className="text-red-500">*</span></label>
              <SearchSelect value={form.product_id} onChange={(v) => setForm({ ...form, product_id: v })} placeholder="Select Product"
                options={products.map((p) => ({ value: p.id, label: p.code ? `${p.code} - ${p.name}` : p.name }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse <span className="text-red-500">*</span></label>
              <SearchSelect value={form.warehouse_id} onChange={(v) => setForm({ ...form, warehouse_id: v })} placeholder="Select Warehouse"
                options={warehouses.map((w) => ({ value: w.id, label: w.name }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
              <input type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.adjustment_date} onChange={(e) => setForm({ ...form, adjustment_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="">Select Reason</option>
              <option value="Damaged">Damaged</option><option value="Expired">Expired</option><option value="Lost">Lost</option>
              <option value="Found">Found</option><option value="Recount">Recount</option><option value="Return">Return</option><option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Additional notes"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 text-sm disabled:opacity-50">{saving ? "Saving..." : "Save Adjustment"}</button>
            <button onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">Code</th><th className="px-6 py-3">Product</th><th className="px-6 py-3">Warehouse</th><th className="px-6 py-3">Type</th><th className="px-6 py-3 text-right">Qty</th><th className="px-6 py-3">Reason</th><th className="px-6 py-3">Date</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {adjustments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-teal-600">{a.adjustment_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{a.product_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{a.warehouse_name}</td>
                  <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${a.adjustment_type === "increase" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{a.adjustment_type}</span></td>
                  <td className="px-6 py-4 text-sm text-right font-medium">{a.adjustment_type === "decrease" ? "-" : "+"}{a.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{a.reason || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{a.adjustment_date}</td>
                </tr>
              ))}
              {adjustments.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No adjustments</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
