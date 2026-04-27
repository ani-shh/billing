"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  code: string;
  rate: number;
  tax_rate: number;
  unit: string;
  category: string;
  brand: string;
  image_path: string;
  total_stock: number;
  min_stock_level: number;
}

function formatAmount(amount: number) {
  return `Rs. ${(amount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function stockBadge(qty: number, min: number) {
  if (qty <= 0) return <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">0</span>;
  if (min > 0 && qty < min) return <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">{qty}</span>;
  return <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">{qty}</span>;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProducts = () => {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    fetch(`/api/products${params}`)
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [search]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete product "${name}"?`)) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    fetchProducts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products & Services</h1>
        <Link href="/products/new" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors text-sm font-medium">
          + Add Product
        </Link>
      </div>

      <div className="mb-6 relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Search by name, code, SKU, or category..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Rate</th>
                  <th className="px-6 py-3">Tax</th>
                  <th className="px-6 py-3 text-right">Stock</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        {p.image_path ? (
                          <img src={p.image_path} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">{p.name}</p>
                          {p.brand && <p className="text-xs text-gray-400">{p.brand}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-teal-600">{p.code || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.category || "-"}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatAmount(p.rate)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.tax_rate}%</td>
                    <td className="px-6 py-4 text-right">{stockBadge(p.total_stock, p.min_stock_level)}</td>
                    <td className="px-6 py-4 flex gap-3">
                      <Link href={`/products/${p.id}`} className="text-teal-600 hover:text-teal-800 text-sm">View</Link>
                      <button onClick={() => handleDelete(p.id, p.name)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400">No products found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
