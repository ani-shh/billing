import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const asOf = request.nextUrl.searchParams.get("as_of") || new Date().toISOString().slice(0, 10);
  const db = getDb();

  const query = (type: string, isDebitNormal: boolean) => db.prepare(`
    SELECT a.id, a.code, a.name, a.sub_type,
      ${isDebitNormal
        ? "a.opening_balance + COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0)"
        : "a.opening_balance + COALESCE(SUM(jel.credit), 0) - COALESCE(SUM(jel.debit), 0)"
      } as balance
    FROM accounts a
    LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
    LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.status = 'posted' AND je.entry_date <= ?
    WHERE a.type = ? AND a.is_active = 1
    GROUP BY a.id ORDER BY a.code
  `).all(asOf, type);

  const assets = query("asset", true) as { balance: number }[];
  const liabilities = query("liability", false) as { balance: number }[];
  const equity = query("equity", false) as { balance: number }[];

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.balance, 0);
  const totalEquity = equity.reduce((s, e) => s + e.balance, 0);

  return NextResponse.json({ as_of: asOf, assets, liabilities, equity, totalAssets, totalLiabilities, totalEquity });
}
