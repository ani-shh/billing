"use client";
import { useEffect, useState } from "react";

interface Category { id: string; name: string; description: string; }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const fetch_ = () => { fetch("/api/categories").then((r) => r.json()).then(setCategories).finally(() => setLoading(false)); };
  useEffect(() => { fetch_(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description: desc }) });
    setName(""); setDesc(""); setShowForm(false); setSaving(false); fetch_();
  };

  const handleDelete = async (id: string, n: string) => {
    if (!window.confirm(`Delete category "${n}"?`)) return;
    await fetch(`/api/categories?id=${id}`, { method: "DELETE" }); fetch_();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Categories</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">+ Add Category</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional description"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 text-sm disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
            <button onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">Name</th><th className="px-6 py-3">Description</th><th className="px-6 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{c.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.description || "-"}</td>
                  <td className="px-6 py-4"><button onClick={() => handleDelete(c.id, c.name)} className="text-red-500 hover:text-red-700 text-sm">Delete</button></td>
                </tr>
              ))}
              {categories.length === 0 && <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-400">No categories</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
