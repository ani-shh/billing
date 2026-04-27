"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchSelect } from "@/components/SearchSelect";

// ---------- Types ----------

interface Customer {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  code: string;
  rate: number;
  tax_rate: number;
}

interface LineItem {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  rate: number;
  discount: number;
  tax: number;
  amount: number;
}

interface CustomFields {
  receivedBy: string;
  expiry: string;
  batchNo: string;
  udf: string;
}

// ---------- Helpers ----------

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatAmount(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function calcLineAmount(item: LineItem): number {
  const base = item.qty * item.rate;
  const afterDiscount = base - item.discount;
  const taxAmount = afterDiscount * (item.tax / 100);
  return afterDiscount + taxAmount;
}

// ---------- Component ----------

export default function NewInvoicePage() {
  const router = useRouter();

  // Reference data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form state
  const [customerId, setCustomerId] = useState("");
  const [referenceNo, setReferenceNo] = useState("");
  const [invoiceCode, setInvoiceCode] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState(today());
  const [currency, setCurrency] = useState("NPR");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [warehouseId, setWarehouseId] = useState("");
  const [isExportSales, setIsExportSales] = useState(false);

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  // Custom fields
  const [customFields, setCustomFields] = useState<CustomFields>({
    receivedBy: "",
    expiry: "",
    batchNo: "",
    udf: "",
  });

  // Other
  const [tdsApplicable, setTdsApplicable] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [terms, setTerms] = useState("");
  const [showTags, setShowTags] = useState(false);
  const [reportingTags, setReportingTags] = useState("");

  const [saving, setSaving] = useState(false);

  // Export sales fields
  const [exportCountry, setExportCountry] = useState("");
  const [exportDate, setExportDate] = useState("");
  const [exportDocNo, setExportDocNo] = useState("");

  // Customer search & modal
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    type: "customer" as "customer" | "supplier" | "lead",
    name: "",
    address: "",
    code: "",
    pan_no: "",
    phone: "",
    group: "",
  });
  const [savingCustomer, setSavingCustomer] = useState(false);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  function selectCustomer(id: string, name: string) {
    setCustomerId(id);
    setCustomerSearch(name);
    setShowCustomerDropdown(false);
  }

  async function handleSaveNewCustomer() {
    if (!newCustomer.name.trim()) { alert("Name is required"); return; }
    setSavingCustomer(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCustomer.name,
          address: newCustomer.address,
          pan_no: newCustomer.pan_no,
          phone: newCustomer.phone,
          email: "",
        }),
      });
      if (res.ok) {
        const created = await res.json();
        // Refresh customer list and select the new one
        const refreshed = await fetch("/api/customers").then((r) => r.json());
        setCustomers(refreshed);
        selectCustomer(created.id, created.name);
        setShowNewCustomerModal(false);
        setNewCustomer({ type: "customer", name: "", address: "", code: "", pan_no: "", phone: "", group: "" });
      }
    } finally {
      setSavingCustomer(false);
    }
  }

  // Fetch reference data
  useEffect(() => {
    fetch("/api/customers")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCustomers)
      .catch(() => {});
    fetch("/api/warehouses")
      .then((r) => (r.ok ? r.json() : []))
      .then(setWarehouses)
      .catch(() => {});
    fetch("/api/products")
      .then((r) => (r.ok ? r.json() : []))
      .then(setProducts)
      .catch(() => {});
  }, []);

  // ---------- Line item handlers ----------

  function addProduct() {
    if (!selectedProductId) return;
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;

    const newItem: LineItem = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      qty: 1,
      rate: product.rate,
      discount: 0,
      tax: product.tax_rate,
      amount: 0,
    };
    newItem.amount = calcLineAmount(newItem);
    setLineItems((prev) => [...prev, newItem]);
    setSelectedProductId("");
  }

  function updateLineItem(id: string, field: keyof LineItem, value: string | number) {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        updated.amount = calcLineAmount(updated);
        return updated;
      })
    );
  }

  function removeLineItem(id: string) {
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  }

  // ---------- Totals ----------

  const subtotal = lineItems.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const discountTotal = lineItems.reduce((sum, item) => sum + item.discount, 0);
  const taxTotal = lineItems.reduce((sum, item) => {
    const afterDiscount = item.qty * item.rate - item.discount;
    return sum + afterDiscount * (item.tax / 100);
  }, 0);
  const grandTotal = subtotal - discountTotal + taxTotal;

  // ---------- Save ----------

  async function handleSave() {
    if (!customerId || !invoiceDate || !dueDate || !warehouseId) {
      alert("Please fill in all required fields: Customer, Invoice Date, Due Date, and Warehouse.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        customer_id: customerId,
        reference_no: referenceNo,
        invoice_code: invoiceCode || undefined,
        invoice_date: invoiceDate,
        due_date: dueDate,
        currency,
        exchange_rate: exchangeRate,
        warehouse_id: warehouseId,
        is_export: isExportSales,
        items: lineItems.map((item) => ({
          product_id: item.productId,
          description: item.productName,
          quantity: item.qty,
          rate: item.rate,
          discount: item.discount,
          tax_rate: item.tax,
          amount: item.amount,
        })),
        received_by: customFields.receivedBy,
        expiry: customFields.expiry,
        batch_no: customFields.batchNo,
        udf: customFields.udf,
        tds_applicable: tdsApplicable,
        terms,
        reporting_tags: reportingTags,
        subtotal,
        discount_total: discountTotal,
        tax_total: taxTotal,
        grand_total: grandTotal,
      };
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push("/invoices");
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || "Failed to save invoice.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ---------- Render ----------

  const inputClass =
    "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const selectClass =
    "block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Add New Invoice</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-teal-600 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <Link
              href="/invoices"
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-2 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="space-y-8">
          {/* ===== Top fields (2-col grid) ===== */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm overflow-visible">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              {/* Customer - Searchable dropdown */}
              <div className="relative z-30">
                <label className={labelClass}>
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={showCustomerDropdown ? customerSearch : (selectedCustomer?.name || customerSearch)}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setShowCustomerDropdown(true);
                    if (!e.target.value) setCustomerId("");
                  }}
                  onFocus={() => {
                    setShowCustomerDropdown(true);
                    setCustomerSearch(selectedCustomer?.name || "");
                  }}
                  placeholder="Customer Name"
                  className={`${inputClass} ${customerId ? "border-teal-400" : ""}`}
                />
                {showCustomerDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowCustomerDropdown(false)} />
                    <div className="absolute z-40 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg flex flex-col">
                      {/* Scrollable customer list */}
                      <div className="max-h-48 overflow-y-auto">
                        {filteredCustomers.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => selectCustomer(c.id, c.name)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 flex items-center justify-between border-b border-gray-100 last:border-0"
                          >
                            <span className="text-gray-800">{c.name}</span>
                          </button>
                        ))}
                        {filteredCustomers.length === 0 && customerSearch && (
                          <div className="px-4 py-3 text-sm text-gray-400">No customers found</div>
                        )}
                      </div>
                      {/* Sticky Add New button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowCustomerDropdown(false);
                          setNewCustomer({ ...newCustomer, name: customerSearch });
                          setShowNewCustomerModal(true);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-teal-600 font-medium hover:bg-teal-50 border-t border-gray-200 shrink-0"
                      >
                        + Add New
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Reference No */}
              <div>
                <label className={labelClass}>Reference No</label>
                <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} className={inputClass} placeholder="e.g. PO-001" />
              </div>

              {/* Invoice Code */}
              <div>
                <label className={labelClass}>Invoice Code</label>
                <input type="text" value={invoiceCode} onChange={(e) => setInvoiceCode(e.target.value)} className={inputClass} placeholder="e.g. INV-0001" />
              </div>

              {/* Invoice Date */}
              <div>
                <label className={labelClass}>
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={inputClass} required />
              </div>

              {/* Due Date */}
              <div>
                <label className={labelClass}>
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass} required />
              </div>

              {/* Currency */}
              <div>
                <label className={labelClass}>Currency</label>
                <SearchSelect
                  value={currency}
                  onChange={setCurrency}
                  placeholder="Select Currency"
                  options={[
                    { value: "NPR", label: "Nepalese Rupee", sublabel: "NPR" },
                    { value: "USD", label: "US Dollar", sublabel: "USD" },
                    { value: "INR", label: "Indian Rupee", sublabel: "INR" },
                    { value: "EUR", label: "Euro", sublabel: "EUR" },
                  ]}
                />
              </div>

              {/* Exchange Rate */}
              <div>
                <label className={labelClass}>Exchange Rate to NPR</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                  className={inputClass}
                />
              </div>

              {/* Warehouse */}
              <div>
                <label className={labelClass}>
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <SearchSelect
                  value={warehouseId}
                  onChange={setWarehouseId}
                  placeholder="Select Warehouse"
                  options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
                />
              </div>
            </div>

            {/* Export Sales checkbox */}
            <div className="mt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isExportSales}
                  onChange={(e) => setIsExportSales(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">This is export sales</span>
              </label>
            </div>

            {/* Export Sales Fields */}
            {isExportSales && (
              <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5 pt-5 border-t border-gray-200">
                <div>
                  <label className={labelClass}>Country</label>
                  <SearchSelect
                    value={exportCountry}
                    onChange={setExportCountry}
                    placeholder="Country"
                    options={[
                      { value: "IN", label: "India" }, { value: "CN", label: "China" },
                      { value: "US", label: "United States" }, { value: "GB", label: "United Kingdom" },
                      { value: "AE", label: "UAE" }, { value: "JP", label: "Japan" },
                      { value: "KR", label: "South Korea" }, { value: "DE", label: "Germany" },
                      { value: "AU", label: "Australia" }, { value: "BD", label: "Bangladesh" },
                      { value: "BT", label: "Bhutan" }, { value: "MY", label: "Malaysia" },
                      { value: "SG", label: "Singapore" }, { value: "OTHER", label: "Other" },
                    ]}
                  />
                </div>
                <div>
                  <label className={labelClass}>Date</label>
                  <input
                    type="date"
                    value={exportDate}
                    onChange={(e) => setExportDate(e.target.value)}
                    placeholder="DD-MM-YYYY (AD)"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Document No</label>
                  <input
                    type="text"
                    value={exportDocNo}
                    onChange={(e) => setExportDocNo(e.target.value)}
                    placeholder="Document No"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ===== Line Items ===== */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>

            {/* Add product */}
            <div className="mb-4">
              <label className={labelClass}>Add Code or Product</label>
              <SearchSelect
                value=""
                onChange={(productId) => {
                  if (productId) {
                    setSelectedProductId(productId);
                    // Auto-add the product
                    const product = products.find((p) => p.id === productId);
                    if (product) {
                      const newItem: LineItem = {
                        id: Math.random().toString(36).substring(2, 11),
                        productId: product.id,
                        productName: product.name,
                        qty: 1,
                        rate: product.rate,
                        discount: 0,
                        tax: product.tax_rate,
                        amount: 0,
                      };
                      newItem.amount = calcLineAmount(newItem);
                      setLineItems((prev) => [...prev, newItem]);
                    }
                  }
                }}
                placeholder="Search & add product..."
                options={products.map((p) => ({
                  value: p.id,
                  label: p.code ? `${p.code} - ${p.name}` : p.name,
                  sublabel: `Rs. ${p.rate}`,
                }))}
              />
            </div>

            {/* Items table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Product / Service</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 w-24">Qty</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 w-28">Rate</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 w-28">Discount</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 w-24">Tax (%)</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500 w-32">Amount</th>
                    <th className="px-4 py-3 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        No items added yet. Select a product above.
                      </td>
                    </tr>
                  ) : (
                    lineItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-gray-700">{item.productName}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => updateLineItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => updateLineItem(item.id, "rate", parseFloat(e.target.value) || 0)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.discount}
                            onChange={(e) => updateLineItem(item.id, "discount", parseFloat(e.target.value) || 0)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={item.tax}
                            onChange={(e) => updateLineItem(item.id, "tax", parseFloat(e.target.value) || 0)}
                            className="w-full rounded border border-gray-300 px-2 py-1 text-right text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">{formatAmount(item.amount)}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeLineItem(item.id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatAmount(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Discount</span>
                  <span>- {formatAmount(discountTotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatAmount(taxTotal)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
                  <span>Grand Total</span>
                  <span>{formatAmount(grandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== Custom Fields ===== */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Custom Fields</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
              <div className="md:col-span-2">
                <label className={labelClass}>Received By</label>
                <input
                  type="text"
                  value={customFields.receivedBy}
                  onChange={(e) => setCustomFields((prev) => ({ ...prev, receivedBy: e.target.value }))}
                  className={inputClass}
                  placeholder="Name of receiver"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-5 mt-5">
              <div>
                <label className={labelClass}>Expiry</label>
                <input
                  type="date"
                  value={customFields.expiry}
                  onChange={(e) => setCustomFields((prev) => ({ ...prev, expiry: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Batch NO</label>
                <input
                  type="text"
                  value={customFields.batchNo}
                  onChange={(e) => setCustomFields((prev) => ({ ...prev, batchNo: e.target.value }))}
                  className={inputClass}
                  placeholder="Batch number"
                />
              </div>
              <div>
                <label className={labelClass}>UDF</label>
                <input
                  type="text"
                  value={customFields.udf}
                  onChange={(e) => setCustomFields((prev) => ({ ...prev, udf: e.target.value }))}
                  className={inputClass}
                  placeholder="User defined field"
                />
              </div>
            </div>
          </div>

          {/* ===== Other / TDS, Terms, Tags ===== */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            {/* TDS Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">TDS is applicable</span>
              <button
                type="button"
                role="switch"
                aria-checked={tdsApplicable}
                onClick={() => setTdsApplicable((v) => !v)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${tdsApplicable ? "bg-teal-600" : "bg-gray-200"}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${tdsApplicable ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>

            {/* Terms */}
            <div>
              <button
                type="button"
                onClick={() => setShowTerms((v) => !v)}
                className="text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors"
              >
                + Add Terms and Conditions
              </button>
              {showTerms && (
                <textarea
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  rows={4}
                  className={`${inputClass} mt-2`}
                  placeholder="Enter terms and conditions..."
                />
              )}
            </div>

            {/* Reporting Tags */}
            <div>
              <button
                type="button"
                onClick={() => setShowTags((v) => !v)}
                className="text-sm font-medium text-teal-600 hover:text-teal-800 transition-colors"
              >
                + Add Reporting Tags
              </button>
              {showTags && (
                <input
                  type="text"
                  value={reportingTags}
                  onChange={(e) => setReportingTags(e.target.value)}
                  className={`${inputClass} mt-2`}
                  placeholder="Enter reporting tags (comma separated)"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Customer Modal */}
      {showNewCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowNewCustomerModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">New Customer Name</h2>
              <button onClick={() => setShowNewCustomerModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Type of Contact */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type of Contact <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(["customer", "lead"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setNewCustomer({ ...newCustomer, type })}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                      newCustomer.type === type
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="w-6 h-6 rounded flex items-center justify-center bg-gray-100 text-xs font-bold text-gray-500">
                      {type[0].toUpperCase()}
                    </span>
                    <span className="capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="Name"
                className={inputClass}
                autoFocus
              />
            </div>

            {/* Address */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                placeholder="Address"
                className={inputClass}
              />
            </div>

            {/* Code & PAN */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={newCustomer.code}
                  onChange={(e) => setNewCustomer({ ...newCustomer, code: e.target.value })}
                  placeholder="Code"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN</label>
                <input
                  type="text"
                  value={newCustomer.pan_no}
                  onChange={(e) => setNewCustomer({ ...newCustomer, pan_no: e.target.value })}
                  placeholder="PAN"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Phone & Group */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Phone Number"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                <select
                  value={newCustomer.group}
                  onChange={(e) => setNewCustomer({ ...newCustomer, group: e.target.value })}
                  className={selectClass}
                >
                  <option value="">Group Name</option>
                  <option value="individual">Individual</option>
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="corporate">Corporate</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveNewCustomer}
              disabled={savingCustomer}
              className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {savingCustomer ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
