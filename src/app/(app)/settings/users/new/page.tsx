"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchSelect } from "@/components/SearchSelect";

interface Group { id: string; name: string; }

export default function NewUserPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ username: "", password: "", full_name: "", email: "", group_id: "", is_admin: false });

  useEffect(() => { fetch("/api/groups").then((r) => r.json()).then(setGroups); }, []);
  const update = (f: string, v: string | boolean) => setForm({ ...form, [f]: v });
  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

  const handleSave = async () => {
    if (!form.username.trim() || !form.password.trim()) { alert("Username and password are required"); return; }
    setSaving(true);
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) router.push("/settings/users"); else alert("Failed — username may already exist");
    setSaving(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Add New User</h1>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label><input type="text" value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="username" className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label><input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Password" className={inputClass} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Full name" className={inputClass} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="Email" className={inputClass} /></div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Group <span className="text-red-500">*</span></label>
          <SearchSelect value={form.group_id} onChange={(v) => update("group_id", v)} placeholder="Select Group" options={groups.map((g) => ({ value: g.id, label: g.name }))} />
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_admin} onChange={(e) => update("is_admin", e.target.checked)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          <span className="text-sm text-gray-700">Admin privileges (full access regardless of group)</span>
        </label>
        <div className="flex gap-3 pt-4">
          <button onClick={handleSave} disabled={saving} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Create User"}</button>
          <Link href="/settings/users" className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
