"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchSelect } from "@/components/SearchSelect";

interface Supplier { id: string; name: string; }
interface Product { id: string; name: string; code: string; rate: number; tax_rate: number; }
interface Warehouse { id: string; name: string; }
interface LineItem { id: string; product_id: string; description: string; quantity: number; rate: number; discount: number; tax_rate: number; amount: number; }

function today() { return new Date().toISOString().slice(0, 10); }
function calcAmount(item: LineItem) { const sub = item.quantity * item.rate - item.discount; return sub + sub * (item.tax_rate / 100); }
function formatAmount(n: number) { return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function NewBillPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [saving, setSaving] = useState(false);

  const [supplierId, setSupplierId] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [billCode, setBillCode] = useState("");
  const [billDate, setBillDate] = useState(today());
  const [dueDate, setDueDate] = useState(today());
  const [currency, setCurrency] = useState("NPR");
  const [warehouseId, setWarehouseId] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState("");

  // New supplier modal
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: "", email: "", phone: "", address: "", pan_no: "" });
  const [savingSupplier, setSavingSupplier] = useState(false);

  useEffect(() => {
    fetch("/api/suppliers").then((r) => r.json()).then(setSuppliers);
    fetch("/api/products").then((r) => r.json()).then(setProducts);
    fetch("/api/warehouses").then((r) => r.json()).then(setWarehouses);
  }, []);

  const addProduct = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const item: LineItem = { id: Math.random().toString(36).slice(2), product_id: product.id, description: product.name, quantity: 1, rate: product.rate, discount: 0, tax_rate: product.tax_rate, amount: 0 };
    item.amount = calcAmount(item);
    setItems([...items, item]);
  };

  const updateItem = (id: string, field: keyof LineItem, value: number) => {
    setItems(items.map((i) => {
      if (i.id !== id) return i;
      const updated = { ...i, [field]: value };
      updated.amount = calcAmount(updated);
      return updated;
    }));
  };

  const subtotal = items.reduce((s, i) => s + i.quantity * i.rate, 0);
  const discountTotal = items.reduce((s, i) => s + i.discount, 0);
  const taxTotal = items.reduce((s, i) => { const sub = i.quantity * i.rate - i.discount; return s + sub * (i.tax_rate / 100); }, 0);
  const grandTotal = subtotal - discountTotal + taxTotal;

  const handleSave = async () => {
    if (!supplierId) { alert("Please select a supplier"); return; }
    if (items.length === 0) { alert("Please add at least one item"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_id: supplierId, reference_no: referenceNo, bill_code: billCode || undefined,
          bill_date: billDate, due_date: dueDate, currency, warehouse_id: warehouseId || undefined,
          subtotal, discount_total: discountTotal, tax_total: taxTotal, grand_total: grandTotal, notes,
          items: items.map((i) => ({ product_id: i.product_id, description: i.description, quantity: i.quantity, rate: i.rate, discount: i.discount, tax_rate: i.tax_rate, amount: i.amount })),
        }),
      });
      if (res.ok) router.push("/purchase/bills");
      else alert("Failed to create bill");
    } finally { setSaving(false); }
  };

  const handleSaveSupplier = async () => {
    if (!newSupplier.name.trim()) return;
    setSavingSupplier(true);
    try {
      const res = await fetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSupplier) });
      if (res.ok) {
        const created = await res.json();
        const refreshed = await fetch("/api/suppliers").then((r) => r.json());
        setSuppliers(refreshed);
        setSupplierId(created.id);
        setShowNewSupplier(false);
        setNewSupplier({ name: "", email: "", phone: "", address: "", pan_no: "" });
      }
    } finally { setSavingSupplier(false); }
  };

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Bill</h1>
        <div className="flex gap-3">
          <button onClick={handleSave} disabled={saving} className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
          <Link href="/purchase/bills" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Top Fields */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-visible">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
            <div>
              <label className={labelClass}>Supplier Name <span className="text-red-500">*</span></label>
              <SearchSelect value={supplierId} onChange={setSupplierId} placeholder="Select Supplier"
                options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
                onAddNew={() => setShowNewSupplier(true)} addNewLabel="+ Add New" />
            </div>
            <div>
              <label className={labelClass}>Reference No</label>
              <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="PO Number" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Bill Code</label>
              <input type="text" value={billCode} onChange={(e) => setBillCode(e.target.value)} placeholder="Auto-generated" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Bill Date <span className="text-red-500">*</span></label>
              <input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Due Date <span className="text-red-500">*</span></label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <SearchSelect value={currency} onChange={setCurrency} placeholder="Currency"
                options={[{ value: "NPR", label: "Nepalese Rupee", sublabel: "NPR" }, { value: "USD", label: "US Dollar", sublabel: "USD" }, { value: "INR", label: "Indian Rupee", sublabel: "INR" }]} />
            </div>
            <div>
              <label className={labelClass}>Warehouse</label>
              <SearchSelect value={warehouseId} onChange={setWarehouseId} placeholder="Select Warehouse"
                options={warehouses.map((w) => ({ value: w.id, label: w.name }))} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
          <div className="mb-4">
            <label className={labelClass}>Add Product</label>
            <SearchSelect value="" onChange={addProduct} placeholder="Search & add product..."
              options={products.map((p) => ({ value: p.id, label: p.code ? `${p.code} - ${p.name}` : p.name, sublabel: `Rs. ${p.rate}` }))} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50"><tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">Product</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 w-20">Qty</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 w-24">Rate</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 w-24">Discount</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 w-20">Tax %</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 w-28">Amount</th>
                <th className="px-4 py-3 w-10"></th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-gray-700">{item.description}</td>
                    <td className="px-4 py-2"><input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)} className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-teal-500 focus:outline-none" /></td>
                    <td className="px-4 py-2"><input type="number" value={item.rate} onChange={(e) => updateItem(item.id, "rate", parseFloat(e.target.value) || 0)} className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-teal-500 focus:outline-none" /></td>
                    <td className="px-4 py-2"><input type="number" value={item.discount} onChange={(e) => updateItem(item.id, "discount", parseFloat(e.target.value) || 0)} className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-teal-500 focus:outline-none" /></td>
                    <td className="px-4 py-2 text-right text-gray-600">{item.tax_rate}%</td>
                    <td className="px-4 py-2 text-right font-medium">{formatAmount(item.amount)}</td>
                    <td className="px-4 py-2"><button onClick={() => setItems(items.filter((i) => i.id !== item.id))} className="text-red-400 hover:text-red-600"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button></td>
                  </tr>
                ))}
                {items.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No items added yet</td></tr>}
              </tbody>
            </table>
          </div>
          {items.length > 0 && (
            <div className="mt-4 flex justify-end">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatAmount(subtotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Discount</span><span>- {formatAmount(discountTotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Tax</span><span>{formatAmount(taxTotal)}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900"><span>Grand Total</span><span>{formatAmount(grandTotal)}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <label className={labelClass}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Additional notes..." className={inputClass} />
        </div>
      </div>

      {/* New Supplier Modal */}
      {showNewSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowNewSupplier(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">New Supplier</h2>
              <button onClick={() => setShowNewSupplier(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div><label className={labelClass}>Name <span className="text-red-500">*</span></label><input type="text" value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} placeholder="Supplier name" className={inputClass} autoFocus /></div>
              <div><label className={labelClass}>Email</label><input type="email" value={newSupplier.email} onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })} placeholder="Email" className={inputClass} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelClass}>Phone</label><input type="text" value={newSupplier.phone} onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })} placeholder="Phone" className={inputClass} /></div>
                <div><label className={labelClass}>PAN</label><input type="text" value={newSupplier.pan_no} onChange={(e) => setNewSupplier({ ...newSupplier, pan_no: e.target.value })} placeholder="PAN" className={inputClass} /></div>
              </div>
              <div><label className={labelClass}>Address</label><input type="text" value={newSupplier.address} onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })} placeholder="Address" className={inputClass} /></div>
              <button onClick={handleSaveSupplier} disabled={savingSupplier} className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">{savingSupplier ? "Saving..." : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
