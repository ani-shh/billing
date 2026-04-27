"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SearchSelect } from "@/components/SearchSelect";

interface Account { id: string; code: string; name: string; type: string; }
interface Line { id: string; account_id: string; debit: number; credit: number; description: string; }

function today() { return new Date().toISOString().slice(0, 10); }
function fmt(n: number) { return `Rs. ${(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`; }

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [saving, setSaving] = useState(false);
  const [entryDate, setEntryDate] = useState(today());
  const [reference, setReference] = useState("");
  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { id: "1", account_id: "", debit: 0, credit: 0, description: "" },
    { id: "2", account_id: "", debit: 0, credit: 0, description: "" },
  ]);

  useEffect(() => { fetch("/api/accounts").then((r) => r.json()).then(setAccounts); }, []);

  const addLine = () => setLines([...lines, { id: Math.random().toString(36).slice(2), account_id: "", debit: 0, credit: 0, description: "" }]);
  const removeLine = (id: string) => { if (lines.length > 2) setLines(lines.filter((l) => l.id !== id)); };
  const updateLine = (id: string, f: string, v: string | number) => setLines(lines.map((l) => l.id === id ? { ...l, [f]: v } : l));

  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const handleSave = async (post: boolean) => {
    if (!balanced) { alert("Debits must equal credits"); return; }
    if (lines.some((l) => !l.account_id)) { alert("All lines must have an account"); return; }
    if (totalDebit === 0) { alert("Entry cannot be zero"); return; }
    setSaving(true);
    const res = await fetch("/api/journal-entries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entry_date: entryDate, reference, narration, status: post ? "posted" : "draft", lines: lines.map(({ id: _, ...rest }) => rest) }) });
    if (res.ok) router.push("/accounting/journal-entries"); else { const d = await res.json(); alert(d.error || "Failed"); }
    setSaving(false);
  };

  const ic = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all";

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">New Journal Entry</h1>
        <div className="flex gap-2">
          <button onClick={() => handleSave(false)} disabled={saving} className="border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50">Save Draft</button>
          <button onClick={() => handleSave(true)} disabled={saving || !balanced} className="bg-teal-700 text-white px-4 py-2.5 rounded-lg hover:bg-teal-800 text-sm font-medium disabled:opacity-50 shadow-sm">Post Entry</button>
          <Link href="/accounting/journal-entries" className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white p-2.5 text-gray-400 hover:bg-gray-50">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg></Link>
        </div>
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label><input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className={ic} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Reference</label><input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Reference" className={ic} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Narration</label><input type="text" value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Description of entry" className={ic} /></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Entry Lines</h2>
            <button onClick={addLine} className="text-sm text-teal-600 hover:text-teal-800 font-medium">+ Add Line</button>
          </div>
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100"><tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Account</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-40">Description</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-32">Debit</th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 w-32">Credit</th>
              <th className="w-8"></th>
            </tr></thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.id} className="border-b border-gray-50">
                  <td className="px-3 py-2">
                    <SearchSelect value={line.account_id} onChange={(v) => updateLine(line.id, "account_id", v)} placeholder="Select Account"
                      options={accounts.map((a) => ({ value: a.id, label: `${a.code} - ${a.name}`, sublabel: a.type }))} />
                  </td>
                  <td className="px-3 py-2"><input type="text" value={line.description} onChange={(e) => updateLine(line.id, "description", e.target.value)} placeholder="Note" className="w-full rounded border border-gray-200 px-2 py-1.5 text-sm" /></td>
                  <td className="px-3 py-2"><input type="number" min={0} step="0.01" value={line.debit || ""} onChange={(e) => { updateLine(line.id, "debit", parseFloat(e.target.value) || 0); if (parseFloat(e.target.value)) updateLine(line.id, "credit", 0); }} className="w-full rounded border border-gray-200 px-2 py-1.5 text-right text-sm tabular-nums" /></td>
                  <td className="px-3 py-2"><input type="number" min={0} step="0.01" value={line.credit || ""} onChange={(e) => { updateLine(line.id, "credit", parseFloat(e.target.value) || 0); if (parseFloat(e.target.value)) updateLine(line.id, "debit", 0); }} className="w-full rounded border border-gray-200 px-2 py-1.5 text-right text-sm tabular-nums" /></td>
                  <td className="px-3 py-2">{lines.length > 2 && <button onClick={() => removeLine(line.id)} className="text-gray-300 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200">
                <td colSpan={2} className="px-3 py-2 text-right text-sm font-semibold text-gray-700">Total</td>
                <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums">{fmt(totalDebit)}</td>
                <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums">{fmt(totalCredit)}</td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={2} className="px-3 py-1 text-right text-xs text-gray-500">Difference</td>
                <td colSpan={2} className={`px-3 py-1 text-right text-xs font-medium ${balanced ? "text-emerald-600" : "text-red-600"}`}>
                  {balanced ? "Balanced" : fmt(Math.abs(totalDebit - totalCredit))}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
