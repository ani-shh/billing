"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  pan_no: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/customers${params}`)
      .then((r) => r.json())
      .then(setCustomers)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete customer "${name}"?`)) return;
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    fetchCustomers();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <Link href="/customers/new" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium">
          + Add Customer
        </Link>
      </div>

      <div className="mb-6 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Phone</th>
                  <th className="px-6 py-3">PAN No</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.email || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.phone || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{c.pan_no || "-"}</td>
                    <td className="px-6 py-4 flex gap-3">
                      <Link href={`/customers/${c.id}`} className="text-teal-600 hover:text-teal-800 text-sm">View</Link>
                      <button onClick={() => handleDelete(c.id, c.name)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No customers found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
