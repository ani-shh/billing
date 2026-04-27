"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Group { id: string; name: string; description: string; }

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const fetch_ = () => { fetch("/api/groups").then((r) => r.json()).then(setGroups).finally(() => setLoading(false)); };
  useEffect(() => { fetch_(); }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await fetch("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description: desc }) });
    setName(""); setDesc(""); setShowForm(false); setSaving(false); fetch_();
  };

  const handleDelete = async (id: string, n: string) => {
    if (!window.confirm(`Delete group "${n}"? Users in this group will lose their permissions.`)) return;
    await fetch(`/api/groups/${id}`, { method: "DELETE" }); fetch_();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Group Policy</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">+ New Group</button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Group Name <span className="text-red-500">*</span></label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Accountants" autoFocus className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What this group can do" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" /></div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 text-sm disabled:opacity-50">{saving ? "Saving..." : "Create Group"}</button>
            <button onClick={() => setShowForm(false)} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">Cancel</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map((g) => (
          <div key={g.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-base font-semibold text-gray-800">{g.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{g.description || "No description"}</p>
              </div>
              <button onClick={() => handleDelete(g.id, g.name)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
            </div>
            <Link href={`/settings/groups/${g.id}`} className="inline-flex items-center gap-1 text-sm text-teal-600 hover:text-teal-800 mt-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
              Manage Permissions
            </Link>
          </div>
        ))}
        {!loading && groups.length === 0 && <p className="text-gray-400 text-sm col-span-3 text-center py-8">No groups created yet</p>}
      </div>
    </div>
  );
}
