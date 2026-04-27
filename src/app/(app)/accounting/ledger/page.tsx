"use client";
import { useEffect, useState } from "react";
import { SearchSelect } from "@/components/SearchSelect";

interface Account { id: string; code: string; name: string; type: string; opening_balance: number; }
interface Txn { entry_code: string; entry_date: string; narration: string; debit: number; credit: number; description: string; source_type: string; }
function fmt(n: number) { return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function GeneralLedgerPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountId, setAccountId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [data, setData] = useState<{ account: Account; transactions: Txn[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetch("/api/accounts").then((r) => r.json()).then(setAccounts); }, []);

  useEffect(() => {
    if (!accountId) { setData(null); return; }
    setLoading(true);
    const p = new URLSearchParams({ account_id: accountId });
    if (dateFrom) p.set("date_from", dateFrom);
    if (dateTo) p.set("date_to", dateTo);
    fetch(`/api/ledger?${p}`).then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, [accountId, dateFrom, dateTo]);

  let balance = data?.account?.opening_balance || 0;

  return (
    <div>
      <div className="mb-6"><h1 className="text-xl font-semibold text-gray-900">General Ledger</h1><p className="text-sm text-gray-500 mt-0.5">Account-wise transaction history</p></div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <SearchSelect value={accountId} onChange={setAccountId} placeholder="Select Account" options={accounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}`, sublabel: a.type }))} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">From</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">To</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600" /></div>
        </div>
      </div>

      {!accountId && <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-400 text-sm">Select an account to view its ledger</div>}
      {loading && <div className="p-10 text-center text-gray-400">Loading...</div>}
      {data && !loading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div><span className="font-mono text-teal-700 text-sm mr-2">{data.account.code}</span><span className="font-semibold text-gray-900">{data.account.name}</span></div>
            <span className="text-xs text-gray-500 capitalize">{data.account.type}</span>
          </div>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Date</th>
              <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Entry</th>
              <th className="px-5 py-2 text-left text-xs font-medium text-gray-500">Description</th>
              <th className="px-5 py-2 text-right text-xs font-medium text-gray-500">Debit</th>
              <th className="px-5 py-2 text-right text-xs font-medium text-gray-500">Credit</th>
              <th className="px-5 py-2 text-right text-xs font-medium text-gray-500">Balance</th>
            </tr></thead>
            <tbody>
              <tr className="border-b border-gray-100 bg-gray-50/30"><td colSpan={5} className="px-5 py-2 text-sm text-gray-500 italic">Opening Balance</td><td className="px-5 py-2 text-right font-medium tabular-nums">{fmt(balance)}</td></tr>
              {data.transactions.map((t, i) => {
                balance += (t.debit || 0) - (t.credit || 0);
                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-2 text-gray-500 tabular-nums">{t.entry_date}</td>
                    <td className="px-5 py-2 font-medium text-teal-700">{t.entry_code}</td>
                    <td className="px-5 py-2 text-gray-600">{t.description || t.narration || "-"}</td>
                    <td className="px-5 py-2 text-right tabular-nums">{t.debit > 0 ? fmt(t.debit) : ""}</td>
                    <td className="px-5 py-2 text-right tabular-nums">{t.credit > 0 ? fmt(t.credit) : ""}</td>
                    <td className="px-5 py-2 text-right font-medium tabular-nums">{fmt(balance)}</td>
                  </tr>
                );
              })}
              {data.transactions.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-gray-400">No transactions for this period</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
