"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Supplier { id: string; name: string; email: string; phone: string; address: string; pan_no: string; }

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/suppliers/${id}`).then((r) => r.json()).then((d) => { setSupplier(d); setForm(d); });
  }, [id]);

  const update = (f: string, v: string) => { if (form) setForm({ ...form, [f]: v }); };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) { const updated = await res.json(); setSupplier(updated); setEditing(false); }
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete supplier "${supplier?.name}"?`)) return;
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    router.push("/purchase/suppliers");
  };

  if (!supplier) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/purchase/suppliers" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{supplier.name}</h1>
        </div>
        <div className="flex gap-2">
          {!editing && <button onClick={() => setEditing(true)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm">Edit</button>}
          <button onClick={handleDelete} className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 text-sm">Delete</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        {editing ? (
          <>
            {["name", "email", "phone", "pan_no"].map((f) => (
              <div key={f}>
                <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{f.replace("_", " ")}</label>
                <input type="text" value={(form as unknown as Record<string, string>)?.[f] || ""} onChange={(e) => update(f, e.target.value)} className={inputClass} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea value={form?.address || ""} onChange={(e) => update("address", e.target.value)} rows={3} className={inputClass} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 text-sm disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
              <button onClick={() => { setForm(supplier); setEditing(false); }} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {[["Name", supplier.name], ["Email", supplier.email || "-"], ["Phone", supplier.phone || "-"], ["PAN No", supplier.pan_no || "-"], ["Address", supplier.address || "-"]].map(([l, v]) => (
              <div key={l} className={l === "Address" ? "col-span-2" : ""}><p className="text-xs text-gray-500 mb-1">{l}</p><p className="text-sm text-gray-800">{v}</p></div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
