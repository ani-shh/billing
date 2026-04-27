"use client";
import { useEffect, useState } from "react";

interface LogEntry { id: string; username: string; action: string; module: string; record_id: string; details: string; created_at: string; }

const actionColors: Record<string, string> = {
  login: "bg-blue-100 text-blue-700",
  create: "bg-green-100 text-green-700",
  update: "bg-amber-100 text-amber-700",
  delete: "bg-red-100 text-red-700",
  logout: "bg-gray-100 text-gray-700",
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (moduleFilter) params.set("module", moduleFilter);
    params.set("limit", "100");
    fetch(`/api/audit-log?${params}`).then((r) => r.json()).then(setLogs).finally(() => setLoading(false));
  }, [moduleFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
        <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Modules</option>
          <option value="auth">Authentication</option>
          <option value="invoices">Invoices</option>
          <option value="customers">Customers</option>
          <option value="products">Products</option>
          <option value="inventory">Inventory</option>
          <option value="bills">Bills</option>
          <option value="users">Users</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">Timestamp</th><th className="px-6 py-3">User</th><th className="px-6 py-3">Action</th><th className="px-6 py-3">Module</th><th className="px-6 py-3">Details</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{log.created_at?.replace("T", " ").slice(0, 19)}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold">{(log.username || "?").charAt(0).toUpperCase()}</div>
                      <span className="text-gray-700">{log.username || "System"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${actionColors[log.action] || "bg-gray-100 text-gray-700"}`}>{log.action}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-600 capitalize">{log.module || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{log.details || "-"}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No audit log entries</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
