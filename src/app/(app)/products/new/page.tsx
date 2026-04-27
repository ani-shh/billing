"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchSelect } from "@/components/SearchSelect";

const DEFAULT_CATEGORIES = ["Construction", "Electrical", "Plumbing", "Finishing", "Roofing", "Hardware", "Service", "Other"];
const DEFAULT_UNITS = ["pcs", "kg", "bag", "roll", "sheet", "bucket", "bottle", "box", "bowl", "cubic meter", "trip", "service"];
const DEFAULT_ACCOUNTS = ["Sales Revenue", "Cost of Goods Sold", "Sales Returns", "Purchase Returns", "Inventory", "Other Income"];

const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function NewProductPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    product_type: "goods",
    name: "", code: "", description: "",
    category: "", brand: "",
    tax_rate: 13, unit: "pcs",
    sku: "", hs_code: "",
    available_for_sale: true,
    selling_price: 0, purchase_price: 0, rate: 0,
    sales_account: "", purchase_account: "",
    sales_return_account: "", purchase_return_account: "",
    valuation_method: "", min_stock_level: 0,
    track_inventory: true,
    weight: "", dimensions: "",
  });

  // Dynamic lists that can grow with "Add New"
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [units, setUnits] = useState(DEFAULT_UNITS);
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);

  // Add New modal
  const [addNewModal, setAddNewModal] = useState<{ type: string; label: string } | null>(null);
  const [addNewValue, setAddNewValue] = useState("");
  const [newAccount, setNewAccount] = useState({ name: "", under: "", description: "", code: "" });
  const isAccountModal = addNewModal && ["sales_account", "purchase_account", "sales_return_account", "purchase_return_account"].includes(addNewModal.type);

  const handleAddNew = () => {
    if (!addNewModal) return;

    if (["sales_account", "purchase_account", "sales_return_account", "purchase_return_account"].includes(addNewModal.type)) {
      if (!newAccount.name.trim()) return;
      const val = newAccount.name.trim();
      if (!accounts.includes(val)) setAccounts([...accounts, val]);
      update(addNewModal.type, val);
      setNewAccount({ name: "", under: "", description: "", code: "" });
    } else {
      if (!addNewValue.trim()) return;
      const val = addNewValue.trim();
      if (addNewModal.type === "category") {
        if (!categories.includes(val)) setCategories([...categories, val]);
        update("category", val);
      } else if (addNewModal.type === "unit") {
        if (!units.includes(val)) setUnits([...units, val]);
        update("unit", val);
      }
    }
    setAddNewModal(null);
    setAddNewValue("");
  };

  const update = (field: string, value: string | number | boolean) => setForm({ ...form, [field]: value });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert("Name is required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, rate: form.selling_price || form.rate };
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const product = await res.json();
        if (imageFile) {
          const fd = new FormData();
          fd.append("image", imageFile);
          await fetch(`/api/products/${product.id}/image`, { method: "POST", body: fd });
        }
        router.push("/products");
      } else alert("Failed to create product");
    } finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
        <div className="flex items-center gap-3">
          <button onClick={handleSave} disabled={saving}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
          <Link href="/products" className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Type of Product */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <label className={labelClass}>Type of Product <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3 mt-1">
            {(["goods", "services"] as const).map((type) => (
              <button key={type} type="button" onClick={() => update("product_type", type)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors capitalize ${
                  form.product_type === type ? "border-teal-500 bg-teal-50 text-teal-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}>
                {type === "goods" ? "Goods" : "Services"}
              </button>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Image + Name row */}
          <div className="flex gap-6 mb-5">
            <div onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-teal-400 transition-colors overflow-hidden shrink-0">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange} className="hidden" />
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Name <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Name" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Code</label>
                <input type="text" value={form.code} onChange={(e) => update("code", e.target.value)} placeholder="Code" className={inputClass} />
              </div>
            </div>
          </div>

          {/* Category, Tax, Unit */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div>
              <label className={labelClass}>Category <span className="text-red-500">*</span></label>
              <SearchSelect
                value={form.category}
                onChange={(v) => update("category", v)}
                placeholder="Category Name"
                options={categories.map((c) => ({ value: c, label: c }))}
                onAddNew={() => { setAddNewModal({ type: "category", label: "Category" }); setAddNewValue(""); }}
                addNewLabel="+ Add New"
              />
            </div>
            <div>
              <label className={labelClass}>Tax</label>
              <SearchSelect
                value={form.tax_rate.toString()}
                onChange={(v) => update("tax_rate", parseFloat(v) || 0)}
                placeholder="Select Tax"
                options={[
                  { value: "0", label: "No VAT", sublabel: "0%" },
                  { value: "13", label: "VAT", sublabel: "13%" },
                  { value: "5", label: "Reduced", sublabel: "5%" },
                ]}
              />
            </div>
            <div>
              <label className={labelClass}>Primary Unit <span className="text-red-500">*</span></label>
              <SearchSelect
                value={form.unit}
                onChange={(v) => update("unit", v)}
                placeholder="Primary Unit"
                options={units.map((u) => ({ value: u, label: u.charAt(0).toUpperCase() + u.slice(1) }))}
                onAddNew={() => { setAddNewModal({ type: "unit", label: "Unit" }); setAddNewValue(""); }}
                addNewLabel="+ Add New"
              />
            </div>
          </div>

          {/* HS Code + Available toggle */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelClass}>HS Code</label>
              <input type="text" value={form.hs_code} onChange={(e) => update("hs_code", e.target.value)} placeholder="HS Code" className={inputClass} />
            </div>
            <div className="flex items-end pb-1">
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <button type="button" role="switch" aria-checked={form.available_for_sale}
                  onClick={() => update("available_for_sale", !form.available_for_sale)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.available_for_sale ? "bg-teal-600" : "bg-gray-200"}`}>
                  <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.available_for_sale ? "translate-x-5" : "translate-x-0"}`} />
                </button>
                <span className="text-sm text-gray-700">Available For Sale</span>
              </label>
            </div>
          </div>

          {/* Selling & Purchase Price */}
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Pricing</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Selling Price</label>
              <input type="number" value={form.selling_price} onChange={(e) => update("selling_price", parseFloat(e.target.value) || 0)}
                placeholder="0" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Purchase Price</label>
              <input type="number" value={form.purchase_price} onChange={(e) => update("purchase_price", parseFloat(e.target.value) || 0)}
                placeholder="0" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Additional Information</h3>

          <div className="grid grid-cols-3 gap-4 mb-5">
            <div>
              <label className={labelClass}>Sales Account</label>
              <SearchSelect value={form.sales_account} onChange={(v) => update("sales_account", v)} placeholder="Select Account"
                options={accounts.map((a) => ({ value: a, label: a }))}
                onAddNew={() => { setAddNewModal({ type: "sales_account", label: "Sales Account" }); setAddNewValue(""); }}
                addNewLabel="+ Add New" />
            </div>
            <div>
              <label className={labelClass}>Purchase Account</label>
              <SearchSelect value={form.purchase_account} onChange={(v) => update("purchase_account", v)} placeholder="Select Account"
                options={accounts.map((a) => ({ value: a, label: a }))}
                onAddNew={() => { setAddNewModal({ type: "purchase_account", label: "Purchase Account" }); setAddNewValue(""); }}
                addNewLabel="+ Add New" />
            </div>
            <div>
              <label className={labelClass}>Sales Return Account</label>
              <SearchSelect value={form.sales_return_account} onChange={(v) => update("sales_return_account", v)} placeholder="Select Account"
                options={accounts.map((a) => ({ value: a, label: a }))}
                onAddNew={() => { setAddNewModal({ type: "sales_return_account", label: "Sales Return Account" }); setAddNewValue(""); }}
                addNewLabel="+ Add New" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-5">
            <div>
              <label className={labelClass}>Purchase Return Account</label>
              <SearchSelect value={form.purchase_return_account} onChange={(v) => update("purchase_return_account", v)} placeholder="Select Account"
                options={accounts.map((a) => ({ value: a, label: a }))}
                onAddNew={() => { setAddNewModal({ type: "purchase_return_account", label: "Purchase Return Account" }); setAddNewValue(""); }}
                addNewLabel="+ Add New" />
            </div>
            <div>
              <label className={labelClass}>Valuation Method</label>
              <SearchSelect value={form.valuation_method} onChange={(v) => update("valuation_method", v)} placeholder="Select..."
                options={[
                  { value: "fifo", label: "FIFO" },
                  { value: "lifo", label: "LIFO" },
                  { value: "weighted_avg", label: "Weighted Average" },
                ]} />
            </div>
            <div>
              <label className={labelClass}>Reorder Level</label>
              <input type="number" value={form.min_stock_level} onChange={(e) => update("min_stock_level", parseFloat(e.target.value) || 0)}
                placeholder="Reorder Level" className={inputClass} />
            </div>
          </div>

          {/* Track Inventory toggle */}
          <label className="inline-flex items-center gap-3 cursor-pointer">
            <button type="button" role="switch" aria-checked={form.track_inventory}
              onClick={() => update("track_inventory", !form.track_inventory)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.track_inventory ? "bg-teal-600" : "bg-gray-200"}`}>
              <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${form.track_inventory ? "translate-x-5" : "translate-x-0"}`} />
            </button>
            <span className="text-sm text-gray-700">Track Inventory</span>
          </label>
        </div>
      </div>

      {/* Add New Modal */}
      {addNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setAddNewModal(null)} />
          <div className={`relative bg-white rounded-xl shadow-2xl w-full mx-4 p-6 z-10 ${isAccountModal ? "max-w-lg" : "max-w-sm"}`}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {isAccountModal ? "New Account" : `Add New ${addNewModal.label}`}
              </h2>
              <button onClick={() => setAddNewModal(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isAccountModal ? (
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Account Name <span className="text-red-500">*</span></label>
                  <input type="text" value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    placeholder="Account Name" className={inputClass} autoFocus />
                </div>
                <div>
                  <label className={labelClass}>Under <span className="text-red-500">*</span></label>
                  <SearchSelect
                    value={newAccount.under}
                    onChange={(v) => setNewAccount({ ...newAccount, under: v })}
                    placeholder="Parent Group"
                    options={[
                      { value: "Current Assets", label: "Current Assets" },
                      { value: "Fixed Assets", label: "Fixed Assets" },
                      { value: "Current Liabilities", label: "Current Liabilities" },
                      { value: "Revenue", label: "Revenue" },
                      { value: "Cost of Revenue", label: "Cost of Revenue" },
                      { value: "Expenses", label: "Expenses" },
                      { value: "Equity", label: "Equity" },
                    ]}
                  />
                </div>
                <div>
                  <label className={labelClass}>Description</label>
                  <input type="text" value={newAccount.description}
                    onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                    placeholder="Description" className={inputClass} />
                </div>
                <div className="w-1/2">
                  <label className={labelClass}>Code</label>
                  <input type="text" value={newAccount.code}
                    onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                    placeholder="Code" className={inputClass} />
                </div>
                <button type="button" onClick={handleAddNew} disabled={!newAccount.name.trim()}
                  className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50 mt-2">
                  Save
                </button>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <label className={labelClass}>{addNewModal.label} Name <span className="text-red-500">*</span></label>
                  <input type="text" value={addNewValue}
                    onChange={(e) => setAddNewValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddNew(); }}
                    placeholder={`Enter ${addNewModal.label.toLowerCase()} name`}
                    className={inputClass} autoFocus />
                </div>
                <button type="button" onClick={handleAddNew} disabled={!addNewValue.trim()}
                  className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50">
                  Save
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
