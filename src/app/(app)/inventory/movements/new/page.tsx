"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Product { id: string; name: string; code: string; }
interface Warehouse { id: string; name: string; }

export default function NewMovementPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    product_id: "",
    warehouse_id: "",
    type: "in",
    quantity: 0,
    reference: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    fetch("/api/warehouses").then((r) => r.json()).then(setWarehouses);
  }, []);

  const update = (field: string, value: string | number) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (!form.product_id || !form.warehouse_id || form.quantity <= 0) {
      alert("Please fill in product, warehouse, and quantity");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/inventory/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) router.push("/inventory/movements");
      else alert("Failed to record movement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/inventory/movements" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Record Stock Movement</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        {/* Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Movement Type</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "in", label: "Stock In", color: "border-green-500 bg-green-50 text-green-700" },
              { value: "out", label: "Stock Out", color: "border-red-500 bg-red-50 text-red-700" },
              { value: "adjustment", label: "Adjustment", color: "border-blue-500 bg-blue-50 text-blue-700" },
            ].map((t) => (
              <button key={t.value} type="button" onClick={() => update("type", t.value)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${form.type === t.value ? t.color : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product <span className="text-red-500">*</span></label>
          <select value={form.product_id} onChange={(e) => update("product_id", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">Select Product</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.code ? `${p.code} - ` : ""}{p.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse <span className="text-red-500">*</span></label>
          <select value={form.warehouse_id} onChange={(e) => update("warehouse_id", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="">Select Warehouse</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity <span className="text-red-500">*</span></label>
          <input type="number" min={0} value={form.quantity} onChange={(e) => update("quantity", parseFloat(e.target.value) || 0)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
          <input type="text" value={form.reference} onChange={(e) => update("reference", e.target.value)} placeholder="PO number, invoice, etc."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} placeholder="Optional notes"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} disabled={saving}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50">
            {saving ? "Saving..." : "Record Movement"}
          </button>
          <Link href="/inventory/movements" className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
