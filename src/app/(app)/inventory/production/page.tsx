"use client";
import { useEffect, useState } from "react";
import { SearchSelect } from "@/components/SearchSelect";

interface ProdOrder { id: string; order_code: string; product_name: string; product_code: string; product_id: string; warehouse_name: string; warehouse_id: string; quantity: number; status: string; start_date: string; end_date: string; notes: string; }
interface Product { id: string; name: string; code: string; }
interface Warehouse { id: string; name: string; }

export default function ProductionPage() {
  const [orders, setOrders] = useState<ProdOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product_id: "", warehouse_id: "", quantity: 0, start_date: new Date().toISOString().slice(0, 10), end_date: "", notes: "" });

  const fetch_ = () => { fetch("/api/production-orders").then((r) => r.json()).then(setOrders).finally(() => setLoading(false)); };
  useEffect(() => { fetch_(); fetch("/api/products").then((r) => r.json()).then(setProducts); fetch("/api/warehouses").then((r) => r.json()).then(setWarehouses); }, []);

  const handleSave = async () => {
    if (!form.product_id || !form.warehouse_id || form.quantity <= 0) { alert("Fill all required fields"); return; }
    setSaving(true);
    const res = await fetch("/api/production-orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setShowForm(false); setForm({ product_id: "", warehouse_id: "", quantity: 0, start_date: new Date().toISOString().slice(0, 10), end_date: "", notes: "" }); fetch_(); }
    setSaving(false);
  };

  const handleStatusChange = async (order: ProdOrder, newStatus: string) => {
    await fetch("/api/production-orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: order.id, status: newStatus, product_id: order.product_id, warehouse_id: order.warehouse_id, quantity: order.quantity }) });
    fetch_();
  };

  const statusColors: Record<string, string> = { draft: "bg-gray-100 text-gray-700", "in_progress": "bg-blue-100 text-blue-700", completed: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Production Orders</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">+ New Order</button>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 text-sm disabled:opacity-50">{saving ? "Saving..." : "Create Order"}</button>
            <button onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">Code</th><th className="px-6 py-3">Product</th><th className="px-6 py-3">Warehouse</th><th className="px-6 py-3 text-right">Qty</th><th className="px-6 py-3">Dates</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-teal-600">{o.order_code}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{o.product_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{o.warehouse_name}</td>
                  <td className="px-6 py-4 text-sm text-right font-medium">{o.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{o.start_date || "-"}{o.end_date ? ` → ${o.end_date}` : ""}</td>
                  <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[o.status] || statusColors.draft}`}>{o.status.replace("_", " ")}</span></td>
                  <td className="px-6 py-4">
                    {o.status === "draft" && <button onClick={() => handleStatusChange(o, "in_progress")} className="text-blue-600 hover:text-blue-800 text-sm mr-2">Start</button>}
                    {o.status === "in_progress" && <button onClick={() => handleStatusChange(o, "completed")} className="text-green-600 hover:text-green-800 text-sm">Complete</button>}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No production orders</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
