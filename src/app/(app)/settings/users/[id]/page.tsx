"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchSelect } from "@/components/SearchSelect";

interface Group { id: string; name: string; }
interface User { id: string; username: string; full_name: string; email: string; group_id: string; is_admin: number; active: number; }

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: "", password: "", full_name: "", email: "", group_id: "", is_admin: false, active: true,
  });

  useEffect(() => {
    fetch("/api/groups").then((r) => r.json()).then(setGroups);
    fetch(`/api/users`).then((r) => r.json()).then((users: User[]) => {
      const user = users.find((u) => u.id === id);
      if (user) {
        setForm({
          username: user.username,
          password: "",
          full_name: user.full_name || "",
          email: user.email || "",
          group_id: user.group_id || "",
          is_admin: !!user.is_admin,
          active: !!user.active,
        });
      }
      setLoading(false);
    });
  }, [id]);

  const update = (f: string, v: string | boolean) => setForm({ ...form, [f]: v });
  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";

  const handleSave = async () => {
    if (!form.username.trim()) { alert("Username is required"); return; }
    setSaving(true);
    const payload: Record<string, unknown> = { ...form };
    if (!form.password) delete payload.password; // Don't update password if empty
    const res = await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) router.push("/settings/users");
    else alert("Failed to update user");
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete user "${form.full_name || form.username}"?`)) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    router.push("/settings/users");
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/settings/users" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Edit User</h1>
        </div>
        <button onClick={handleDelete} className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 text-sm">
          Delete User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
            <input type="text" value={form.username} onChange={(e) => update("username", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-xs text-gray-400">(leave empty to keep current)</span></label>
            <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="New password" className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input type="text" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
          <SearchSelect value={form.group_id} onChange={(v) => update("group_id", v)} placeholder="Select Group"
            options={groups.map((g) => ({ value: g.id, label: g.name }))} />
        </div>

        <div className="flex items-center gap-6">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_admin} onChange={(e) => update("is_admin", e.target.checked)}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
            <span className="text-sm text-gray-700">Admin privileges</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
            <span className="text-sm text-gray-700">Active</span>
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={handleSave} disabled={saving}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <Link href="/settings/users" className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
