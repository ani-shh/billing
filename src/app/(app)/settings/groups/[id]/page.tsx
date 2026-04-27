"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";

interface Permission { module: string; can_view: number; can_create: number; can_edit: number; can_delete: number; }
interface Member { id: string; username: string; full_name: string; active: number; }
interface GroupDetail { id: string; name: string; description: string; permissions: Permission[]; members: Member[]; }

const ALL_MODULES = [
  { key: "dashboard", label: "Dashboard" },
  { key: "invoices", label: "Invoices" },
  { key: "customers", label: "Customers" },
  { key: "payments", label: "Payments" },
  { key: "products", label: "Products" },
  { key: "inventory", label: "Inventory" },
  { key: "bills", label: "Purchase Bills" },
  { key: "suppliers", label: "Suppliers" },
  { key: "users", label: "User Management" },
  { key: "audit_log", label: "Audit Log" },
];

export default function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [perms, setPerms] = useState<Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchGroup = () => {
    fetch(`/api/groups/${id}`).then((r) => r.json()).then((data) => {
      setGroup(data);
      const permMap: typeof perms = {};
      for (const mod of ALL_MODULES) {
        const p = data.permissions.find((pp: Permission) => pp.module === mod.key);
        permMap[mod.key] = { view: !!p?.can_view, create: !!p?.can_create, edit: !!p?.can_edit, delete: !!p?.can_delete };
      }
      setPerms(permMap);
    });
  };
  useEffect(() => { fetchGroup(); }, [id]);

  const toggle = (mod: string, perm: "view" | "create" | "edit" | "delete") => {
    setSaved(false);
    setPerms((prev) => ({ ...prev, [mod]: { ...prev[mod], [perm]: !prev[mod]?.[perm] } }));
  };

  const toggleAll = (mod: string, val: boolean) => {
    setSaved(false);
    setPerms((prev) => ({ ...prev, [mod]: { view: val, create: val, edit: val, delete: val } }));
  };

  const handleSave = async () => {
    setSaving(true);
    const permissions = ALL_MODULES.map((mod) => ({
      module: mod.key,
      can_view: perms[mod.key]?.view || false,
      can_create: perms[mod.key]?.create || false,
      can_edit: perms[mod.key]?.edit || false,
      can_delete: perms[mod.key]?.delete || false,
    }));
    await fetch(`/api/groups/${id}/permissions`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ permissions }) });
    setSaving(false);
    setSaved(true);
  };

  if (!group) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings/groups" className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{group.name}</h1>
          <p className="text-sm text-gray-500">{group.description || "No description"}</p>
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Permissions</h2>
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-green-600">Saved!</span>}
            <button onClick={handleSave} disabled={saving} className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50">
              {saving ? "Saving..." : "Save Permissions"}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-medium text-gray-500">Module</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">View</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Create</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Edit</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">Delete</th>
              <th className="px-4 py-3 text-center font-medium text-gray-500">All</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-100">
              {ALL_MODULES.map((mod) => {
                const p = perms[mod.key] || { view: false, create: false, edit: false, delete: false };
                const allChecked = p.view && p.create && p.edit && p.delete;
                return (
                  <tr key={mod.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-700">{mod.label}</td>
                    {(["view", "create", "edit", "delete"] as const).map((perm) => (
                      <td key={perm} className="px-4 py-3 text-center">
                        <input type="checkbox" checked={p[perm]} onChange={() => toggle(mod.key, perm)}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">
                      <input type="checkbox" checked={allChecked} onChange={() => toggleAll(mod.key, !allChecked)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Members */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Members ({group.members.length})</h2>
        {group.members.length === 0 ? (
          <p className="text-sm text-gray-400">No users in this group</p>
        ) : (
          <div className="space-y-2">
            {group.members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold">{(m.full_name || m.username).charAt(0).toUpperCase()}</div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.full_name || m.username}</p>
                  <p className="text-xs text-gray-400">@{m.username}</p>
                </div>
                <span className={`ml-auto rounded-full px-2 py-0.5 text-xs ${m.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{m.active ? "Active" : "Inactive"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
