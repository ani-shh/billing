"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Supplier { id: string; name: string; email: string; phone: string; pan_no: string; }

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchSuppliers = () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/suppliers${params}`).then((r) => r.json()).then(setSuppliers).finally(() => setLoading(false));
  };
  useEffect(() => { fetchSuppliers(); }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete supplier "${name}"?`)) return;
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    fetchSuppliers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Suppliers</h1>
        <Link href="/purchase/suppliers/new" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">+ Add Supplier</Link>
      </div>
      <div className="mb-6 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
          <table className="w-full">
            <thead><tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">Name</th><th className="px-6 py-3">Email</th><th className="px-6 py-3">Phone</th><th className="px-6 py-3">PAN No</th><th className="px-6 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-gray-200">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{s.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.email || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.phone || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{s.pan_no || "-"}</td>
                  <td className="px-6 py-4 flex gap-3">
                    <Link href={`/purchase/suppliers/${s.id}`} className="text-teal-600 hover:text-teal-800 text-sm">View</Link>
                    <button onClick={() => handleDelete(s.id, s.name)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No suppliers found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
