"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Account { id: string; code: string; name: string; type: string; sub_type: string; description: string; is_system: number; is_active: number; opening_balance: number; opening_balance_type: string; }

export default function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [saving, setSaving] = useState(false);
  const ic = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all";

  useEffect(() => { fetch(`/api/accounts/${id}`).then((r) => r.json()).then(setAccount); }, [id]);

  const handleSave = async () => {
    if (!account) return;
    setSaving(true);
    await fetch(`/api/accounts/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(account) });
    router.push("/accounting/chart-of-accounts");
    setSaving(false);
  };

  if (!account) return <div className="flex items-center justify-center h-96 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/accounting/chart-of-accounts" className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
        <h1 className="text-xl font-semibold text-gray-900">Edit Account</h1>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Code</label><input type="text" value={account.code} onChange={(e) => setAccount({ ...account, code: e.target.value })} className={ic} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input type="text" value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} className={ic} /></div>
        </div>
        <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input type="text" value={account.description || ""} onChange={(e) => setAccount({ ...account, description: e.target.value })} className={ic} /></div>
        <label className="inline-flex items-center gap-2"><input type="checkbox" checked={!!account.is_active} onChange={(e) => setAccount({ ...account, is_active: e.target.checked ? 1 : 0 })} className="rounded border-gray-300 text-teal-600" /><span className="text-sm text-gray-700">Active</span></label>
        <div className="flex gap-3 pt-3">
          <button onClick={handleSave} disabled={saving} className="bg-teal-700 text-white px-6 py-2.5 rounded-lg hover:bg-teal-800 text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : "Save"}</button>
          <Link href="/accounting/chart-of-accounts" className="border border-gray-200 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
