"use client";
import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface InventoryItem { warehouse_name: string; quantity: number; }
interface Movement { type: string; quantity: number; warehouse_name: string; reference: string; created_at: string; }
interface Product {
  id: string; name: string; code: string; description: string; rate: number; tax_rate: number; unit: string;
  category: string; brand: string; sku: string; weight: number; dimensions: string;
  min_stock_level: number; image_path: string;
  inventory: InventoryItem[]; movements: Movement[];
}

function formatAmount(n: number) {
  return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);

  const fetchProduct = () => {
    fetch(`/api/products/${id}`).then((r) => r.json()).then((data) => { setProduct(data); setForm(data); });
  };

  useEffect(() => { fetchProduct(); }, [id]);

  const update = (field: string, value: string | number) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (res.ok) { fetchProduct(); setEditing(false); }
    } finally { setSaving(false); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("image", file);
    await fetch(`/api/products/${id}/image`, { method: "POST", body: fd });
    fetchProduct();
  };

  const handleDeleteImage = async () => {
    await fetch(`/api/products/${id}/image`, { method: "DELETE" });
    fetchProduct();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${product?.name}"?`)) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    router.push("/products");
  };

  if (!product) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const totalStock = (product.inventory || []).reduce((s, i) => s + i.quantity, 0);

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/products" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
        </div>
        <div className="flex gap-2">
          {!editing && <button onClick={() => setEditing(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm">Edit</button>}
          <button onClick={handleDelete} className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 text-sm">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Image + Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Product Image */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-3">
              {product.image_path ? (
                <img src={product.image_path} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()}
                className="flex-1 text-center bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-200">
                {product.image_path ? "Change" : "Upload"} Image
              </button>
              {product.image_path && (
                <button onClick={handleDeleteImage} className="text-red-500 text-xs px-3 py-1.5 rounded-lg hover:bg-red-50">Remove</button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" />
          </div>

          {/* Stock Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Stock Summary</h3>
            <div className="text-3xl font-bold text-gray-900 mb-1">{totalStock} <span className="text-sm font-normal text-gray-500">{product.unit}</span></div>
            {product.min_stock_level > 0 && (
              <p className={`text-xs ${totalStock < product.min_stock_level ? "text-red-600" : "text-green-600"}`}>
                Min level: {product.min_stock_level}
              </p>
            )}
            <div className="mt-3 space-y-2">
              {(product.inventory || []).map((inv, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-500">{inv.warehouse_name}</span>
                  <span className="font-medium">{inv.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Details</h3>
            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ["name", "Name", "text"], ["code", "Code", "text"], ["sku", "SKU", "text"],
                    ["brand", "Brand", "text"],
                  ].map(([f, l, t]) => (
                    <div key={f}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                      <input type={t} value={(form as Record<string, string | number>)[f] || ""} onChange={(e) => update(f, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select value={form.category || ""} onChange={(e) => update("category", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                      <option value="">None</option>
                      {["Construction", "Electrical", "Plumbing", "Finishing", "Roofing", "Hardware", "Service", "Other"].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select value={form.unit || "pcs"} onChange={(e) => update("unit", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                      {["pcs", "kg", "bag", "roll", "sheet", "bucket", "cubic meter", "trip", "service"].map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description || ""} onChange={(e) => update("description", e.target.value)} rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    ["rate", "Rate"], ["tax_rate", "Tax %"], ["min_stock_level", "Min Stock"],
                  ].map(([f, l]) => (
                    <div key={f}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                      <input type="number" value={(form as Record<string, number>)[f] || 0} onChange={(e) => update(f, parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <input type="number" step="0.01" value={form.weight || ""} onChange={(e) => update("weight", e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
                    <input type="text" value={form.dimensions || ""} onChange={(e) => update("dimensions", e.target.value)} placeholder="LxWxH"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 text-sm disabled:opacity-50">
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => { setForm(product); setEditing(false); }} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {[
                  ["Code", product.code], ["SKU", product.sku], ["Category", product.category],
                  ["Brand", product.brand], ["Rate", formatAmount(product.rate)], ["Tax Rate", `${product.tax_rate}%`],
                  ["Unit", product.unit], ["Min Stock", product.min_stock_level || "-"],
                  ["Weight", product.weight ? `${product.weight} kg` : "-"],
                  ["Dimensions", product.dimensions || "-"],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <p className="text-xs text-gray-400 mb-0.5">{label as string}</p>
                    <p className="text-sm text-gray-800">{(value as string) || "-"}</p>
                  </div>
                ))}
                {product.description && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-0.5">Description</p>
                    <p className="text-sm text-gray-800">{product.description}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recent Stock Movements */}
          {product.movements && product.movements.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Movements</h3>
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Warehouse</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {product.movements.map((m, i) => (
                    <tr key={i}>
                      <td className="px-3 py-2 text-gray-500">{m.created_at?.slice(0, 10)}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${m.type === "in" ? "bg-green-100 text-green-700" : m.type === "out" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                          {m.type}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">{m.warehouse_name}</td>
                      <td className="px-3 py-2 text-right font-medium">{m.type === "out" ? "-" : ""}{m.quantity}</td>
                      <td className="px-3 py-2 text-gray-500">{m.reference || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
