"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewSupplierPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", pan_no: "" });
  const update = (f: string, v: string) => setForm({ ...form, [f]: v });

  const handleSave = async () => {
    if (!form.name.trim()) { alert("Name is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (res.ok) router.push("/purchase/suppliers");
      else alert("Failed to create supplier");
    } finally { setSaving(false); }
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New Supplier</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
          <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Supplier name" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="Email" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="text" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="Phone" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea value={form.address} onChange={(e) => update("address", e.target.value)} placeholder="Address" rows={3} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PAN No</label>
          <input type="text" value={form.pan_no} onChange={(e) => update("pan_no", e.target.value)} placeholder="PAN number" className={inputClass} />
        </div>
        <div className="flex gap-3 pt-4">
          <button onClick={handleSave} disabled={saving} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save Supplier"}</button>
          <Link href="/purchase/suppliers" className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
