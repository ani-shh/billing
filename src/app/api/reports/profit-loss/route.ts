import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const dateFrom = request.nextUrl.searchParams.get("date_from") || new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const dateTo = request.nextUrl.searchParams.get("date_to") || new Date().toISOString().slice(0, 10);
  const db = getDb();

  const revenue = db.prepare(`
    SELECT a.id, a.code, a.name, a.sub_type,
      COALESCE(SUM(jel.credit), 0) - COALESCE(SUM(jel.debit), 0) as balance
    FROM accounts a
    LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
    LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.status = 'posted' AND je.entry_date BETWEEN ? AND ?
    WHERE a.type = 'revenue' AND a.is_active = 1
    GROUP BY a.id ORDER BY a.code
  `).all(dateFrom, dateTo);

  const expenses = db.prepare(`
    SELECT a.id, a.code, a.name, a.sub_type,
      COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0) as balance
    FROM accounts a
    LEFT JOIN journal_entry_lines jel ON a.id = jel.account_id
    LEFT JOIN journal_entries je ON jel.journal_entry_id = je.id AND je.status = 'posted' AND je.entry_date BETWEEN ? AND ?
    WHERE a.type = 'expense' AND a.is_active = 1
    GROUP BY a.id ORDER BY a.code
  `).all(dateFrom, dateTo);

  const totalRevenue = (revenue as { balance: number }[]).reduce((s, r) => s + r.balance, 0);
  const totalExpenses = (expenses as { balance: number }[]).reduce((s, e) => s + e.balance, 0);

  return NextResponse.json({ date_from: dateFrom, date_to: dateTo, revenue, expenses, totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses });
}
