"use client";
import { useEffect, useState } from "react";

interface UOM { id: string; name: string; abbreviation: string; type: string; }

export default function UOMPage() {
  const [uoms, setUoms] = useState<UOM[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [abbr, setAbbr] = useState("");
  const [type, setType] = useState("unit");
  const [saving, setSaving] = useState(false);

  const fetch_ = () => { fetch("/api/uom").then((r) => r.json()).then(setUoms).finally(() => setLoading(false)); };
  useEffect(() => { fetch_(); }, []);

  const handleSave = async () => {
    if (!name.trim() || !abbr.trim()) return;
    setSaving(true);
    await fetch("/api/uom", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, abbreviation: abbr, type }) });
    setName(""); setAbbr(""); setType("unit"); setShowForm(false); setSaving(false); fetch_();
  };

  const handleDelete = async (id: string, n: string) => {
    if (!window.confirm(`Delete unit "${n}"?`)) return;
    await fetch(`/api/uom?id=${id}`, { method: "DELETE" }); fetch_();
  };

  const typeColors: Record<string, string> = { unit: "bg-gray-100 text-gray-700", weight: "bg-blue-100 text-blue-700", volume: "bg-teal-100 text-teal-700", length: "bg-purple-100 text-purple-700", service: "bg-amber-100 text-amber-700" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Unit of Measurement</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">+ Add Unit</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name <span className="text-red-500">*</span></label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kilogram" autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Abbreviation <span className="text-red-500">*</span></label>
              <input type="text" value={abbr} onChange={(e) => setAbbr(e.target.value)} placeholder="e.g. kg"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="unit">Unit</option><option value="weight">Weight</option><option value="volume">Volume</option><option value="length">Length</option><option value="service">Service</option>
              </select>
            </div>
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
              <th className="px-6 py-3">Name</th><th className="px-6 py-3">Abbreviation</th><th className="px-6 py-3">Type</th><th className="px-6 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {uoms.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{u.name}</td>
                  <td className="px-6 py-4 text-sm font-mono text-teal-600">{u.abbreviation}</td>
                  <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeColors[u.type] || typeColors.unit}`}>{u.type}</span></td>
                  <td className="px-6 py-4"><button onClick={() => handleDelete(u.id, u.name)} className="text-red-500 hover:text-red-700 text-sm">Delete</button></td>
                </tr>
              ))}
              {uoms.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No units</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
