import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const asOf = request.nextUrl.searchParams.get("as_of") || new Date().toISOString().slice(0, 10);
  const db = getDb();

  const data = db.prepare(`
    SELECT a.id, a.code, a.name, a.type, a.sub_type, a.opening_balance, a.opening_balance_type,
      COALESCE(SUM(jel.debit), 0) as total_debit,
      COALESCE(SUM(jel.credit), 0) as total_credit
    FROM accounts a
    LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
    LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.status = 'posted' AND je.entry_date <= ?
    WHERE a.is_active = 1
    GROUP BY a.id
    ORDER BY a.code
  `).all(asOf);

  return NextResponse.json({ as_of: asOf, accounts: data });
}
