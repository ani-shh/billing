"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Account { id: string; code: string; name: string; type: string; sub_type: string; is_system: number; is_active: number; opening_balance: number; }

const typeColors: Record<string, string> = {
  asset: "bg-blue-50 text-blue-700 border-blue-200",
  liability: "bg-red-50 text-red-700 border-red-200",
  equity: "bg-purple-50 text-purple-700 border-purple-200",
  revenue: "bg-emerald-50 text-emerald-700 border-emerald-200",
  expense: "bg-amber-50 text-amber-700 border-amber-200",
};

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetch_ = () => { fetch("/api/accounts").then((r) => r.json()).then(setAccounts).finally(() => setLoading(false)); };
  useEffect(() => { fetch_(); }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete account "${name}"?`)) return;
    const res = await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); alert(d.error); return; }
    fetch_();
  };

  const filtered = filter ? accounts.filter((a) => a.type === filter) : accounts;
  const grouped = ["asset", "liability", "equity", "revenue", "expense"].map((type) => ({
    type, label: type.charAt(0).toUpperCase() + type.slice(1),
    accounts: filtered.filter((a) => a.type === type),
  })).filter((g) => g.accounts.length > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-xl font-semibold text-gray-900">Chart of Accounts</h1><p className="text-sm text-gray-500 mt-0.5">Manage your account structure</p></div>
        <Link href="/accounting/chart-of-accounts/new" className="inline-flex items-center gap-2 bg-teal-700 text-white px-4 py-2.5 rounded-lg hover:bg-teal-800 text-sm font-medium shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>New Account
        </Link>
      </div>

      <div className="flex gap-2 mb-5">
        {["", "asset", "liability", "equity", "revenue", "expense"].map((t) => (
          <button key={t} onClick={() => setFilter(t)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === t ? "bg-white text-gray-900 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
            {t ? t.charAt(0).toUpperCase() + t.slice(1) : "All"}
          </button>
        ))}
      </div>

      {loading ? <div className="p-10 text-center text-gray-400">Loading...</div> : (
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.type} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                <h2 className="text-sm font-semibold text-gray-700 capitalize">{group.label} Accounts</h2>
              </div>
              <table className="w-full">
                <thead><tr className="border-b border-gray-100">
                  <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 w-24">Code</th>
                  <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                  <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Sub Type</th>
                  <th className="px-5 py-2 text-center text-xs font-medium text-gray-500">System</th>
                  <th className="px-5 py-2 text-right text-xs font-medium text-gray-500">Actions</th>
                </tr></thead>
                <tbody>
                  {group.accounts.map((a) => (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="px-5 py-2.5 text-sm font-mono text-teal-700">{a.code}</td>
                      <td className="px-5 py-2.5 text-sm font-medium text-gray-800">{a.name}</td>
                      <td className="px-5 py-2.5 text-sm text-gray-500 capitalize">{a.sub_type?.replace(/_/g, " ") || "-"}</td>
                      <td className="px-5 py-2.5 text-center">{a.is_system ? <span className="text-xs text-gray-400">System</span> : ""}</td>
                      <td className="px-5 py-2.5 text-right">
                        <Link href={`/accounting/chart-of-accounts/${a.id}`} className="text-teal-600 hover:text-teal-800 text-sm mr-3">Edit</Link>
                        {!a.is_system && <button onClick={() => handleDelete(a.id, a.name)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
