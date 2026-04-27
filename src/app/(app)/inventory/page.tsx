"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  product_code: string;
  warehouse_name: string;
  quantity: number;
  min_stock_level: number;
  unit: string;
  rate: number;
  category: string;
  image_path: string;
}

interface Warehouse { id: string; name: string; }

function formatAmount(n: number) {
  return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function stockStatus(qty: number, min: number) {
  if (qty <= 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700" };
  if (min > 0 && qty < min) return { label: "Low Stock", color: "bg-amber-100 text-amber-700" };
  return { label: "In Stock", color: "bg-green-100 text-green-700" };
}

export default function InventoryPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(searchParams.get("low_stock") === "true");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/warehouses").then((r) => r.json()).then(setWarehouses);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (warehouseId) params.set("warehouse_id", warehouseId);
    if (lowStockOnly) params.set("low_stock", "true");
    fetch(`/api/inventory?${params}`)
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false));
  }, [warehouseId, lowStockOnly]);

  const totalProducts = new Set(items.map((i) => i.product_id)).size;
  const lowStockCount = items.filter((i) => i.min_stock_level > 0 && i.quantity < i.min_stock_level).length;
  const totalValue = items.reduce((s, i) => s + i.quantity * i.rate, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <div className="flex gap-3">
          <Link href="/inventory/movements" className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium">
            View Movements
          </Link>
          <Link href="/inventory/movements/new" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium">
            + Stock In/Out
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-teal-50 rounded-xl p-5 border-l-4 border-teal-500">
          <p className="text-sm text-gray-500">Products Tracked</p>
          <p className="text-2xl font-bold text-teal-600">{totalProducts}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-5 border-l-4 border-amber-500">
          <p className="text-sm text-gray-500">Low Stock Items</p>
          <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-5 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Total Stock Value</p>
          <p className="text-2xl font-bold text-blue-600">{formatAmount(totalValue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
          <option value="">All Warehouses</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
          Low Stock Only
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Warehouse</th>
                <th className="px-6 py-3 text-right">Qty</th>
                <th className="px-6 py-3 text-right">Min Level</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map((item) => {
                const status = stockStatus(item.quantity, item.min_stock_level);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        {item.image_path ? (
                          <img src={item.image_path} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                        <span className="font-medium text-gray-800">{item.product_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-teal-600">{item.product_code}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.warehouse_name}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium">{item.quantity} {item.unit}</td>
                    <td className="px-6 py-4 text-sm text-right text-gray-500">{item.min_stock_level || "-"}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">{formatAmount(item.quantity * item.rate)}</td>
                  </tr>
                );
              })}
              {items.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No inventory records found</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
