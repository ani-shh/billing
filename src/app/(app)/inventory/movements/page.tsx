"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Movement {
  id: string;
  product_name: string;
  product_code: string;
  warehouse_name: string;
  type: string;
  quantity: number;
  reference: string;
  notes: string;
  created_at: string;
}

const typeColors: Record<string, string> = {
  in: "bg-green-100 text-green-700",
  out: "bg-red-100 text-red-700",
  adjustment: "bg-blue-100 text-blue-700",
};

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/inventory/movements")
      .then((r) => r.json())
      .then(setMovements)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/inventory" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
        </div>
        <Link href="/inventory/movements/new" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">
          + Record Movement
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Warehouse</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3 text-right">Quantity</th>
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {movements.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">{m.created_at?.slice(0, 16)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{m.product_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{m.warehouse_name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeColors[m.type] || "bg-gray-100 text-gray-700"}`}>
                      {m.type === "in" ? "Stock In" : m.type === "out" ? "Stock Out" : "Adjustment"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-medium">{m.type === "out" ? "-" : ""}{m.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{m.reference || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{m.notes || "-"}</td>
                </tr>
              ))}
              {movements.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No movements recorded</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
