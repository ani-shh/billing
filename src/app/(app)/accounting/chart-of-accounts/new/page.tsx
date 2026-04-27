"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchSelect } from "@/components/SearchSelect";

const SUB_TYPES: Record<string, { value: string; label: string }[]> = {
  asset: [{ value: "cash", label: "Cash" }, { value: "bank", label: "Bank" }, { value: "accounts_receivable", label: "Accounts Receivable" }, { value: "inventory", label: "Inventory" }, { value: "current_asset", label: "Current Asset" }, { value: "fixed_asset", label: "Fixed Asset" }],
  liability: [{ value: "accounts_payable", label: "Accounts Payable" }, { value: "current_liability", label: "Current Liability" }, { value: "long_term_liability", label: "Long Term Liability" }],
  equity: [{ value: "equity", label: "Equity" }, { value: "retained_earnings", label: "Retained Earnings" }],
  revenue: [{ value: "operating_revenue", label: "Operating Revenue" }, { value: "contra_revenue", label: "Contra Revenue" }, { value: "other_income", label: "Other Income" }],
  expense: [{ value: "cost_of_goods_sold", label: "Cost of Goods Sold" }, { value: "operating_expense", label: "Operating Expense" }, { value: "contra_expense", label: "Contra Expense" }],
};

const ic = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all";

export default function NewAccountPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", type: "asset", sub_type: "", description: "", opening_balance: 0, opening_balance_type: "debit" });
  const update = (f: string, v: string | number) => setForm({ ...form, [f]: v });

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) { alert("Code and Name are required"); return; }
    setSaving(true);
    const res = await fetch("/api/accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) router.push("/accounting/chart-of-accounts"); else alert("Failed — code may already exist");
    setSaving(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">New Account</h1>
      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Code <span className="text-red-500">*</span></label><input type="text" value={form.code} onChange={(e) => update("code", e.target.value)} placeholder="e.g. 1050" className={ic} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Name <span className="text-red-500">*</span></label><input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Account name" className={ic} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
            <SearchSelect value={form.type} onChange={(v) => { update("type", v); setForm((p) => ({ ...p, type: v, sub_type: "" })); }} placeholder="Account Type" options={["asset", "liability", "equity", "revenue", "expense"].map((t) => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Sub Type</label>
            <SearchSelect value={form.sub_type} onChange={(v) => update("sub_type", v)} placeholder="Sub Type" options={SUB_TYPES[form.type] || []} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input type="text" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Optional" className={ic} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Opening Balance</label><input type="number" value={form.opening_balance} onChange={(e) => update("opening_balance", parseFloat(e.target.value) || 0)} className={ic} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Balance Type</label>
            <SearchSelect value={form.opening_balance_type} onChange={(v) => update("opening_balance_type", v)} placeholder="Type" options={[{ value: "debit", label: "Debit" }, { value: "credit", label: "Credit" }]} /></div>
        </div>
        <div className="flex gap-3 pt-3">
          <button onClick={handleSave} disabled={saving} className="bg-teal-700 text-white px-6 py-2.5 rounded-lg hover:bg-teal-800 text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Create Account"}</button>
          <Link href="/accounting/chart-of-accounts" className="border border-gray-200 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
