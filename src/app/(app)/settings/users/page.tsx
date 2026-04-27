"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface User { id: string; username: string; full_name: string; email: string; group_name: string; is_admin: number; active: number; }

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch_ = () => { fetch("/api/users").then((r) => r.json()).then(setUsers).finally(() => setLoading(false)); };
  useEffect(() => { fetch_(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete user "${name}"?`)) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" }); fetch_();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <Link href="/settings/users/new" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">+ Add User</Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">User</th><th className="px-6 py-3">Username</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Group</th><th className="px-6 py-3">Role</th><th className="px-6 py-3">Status</th><th className="px-6 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-sm font-bold">{(u.full_name || u.username).charAt(0).toUpperCase()}</div>
                      <span className="font-medium text-gray-800">{u.full_name || u.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.username}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{u.email || "-"}</td>
                  <td className="px-6 py-4 text-sm"><span className="bg-slate-100 text-slate-700 rounded-full px-2.5 py-0.5 text-xs font-medium">{u.group_name || "-"}</span></td>
                  <td className="px-6 py-4 text-sm">{u.is_admin ? <span className="bg-purple-100 text-purple-700 rounded-full px-2.5 py-0.5 text-xs font-medium">Admin</span> : <span className="text-gray-500 text-xs">User</span>}</td>
                  <td className="px-6 py-4"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{u.active ? "Active" : "Inactive"}</span></td>
                  <td className="px-6 py-4 flex gap-3">
                    <Link href={`/settings/users/${u.id}`} className="text-teal-600 hover:text-teal-800 text-sm">Edit</Link>
                    <button onClick={() => handleDelete(u.id, u.full_name || u.username)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No users</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
