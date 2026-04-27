import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const accountId = request.nextUrl.searchParams.get("account_id") || "";
  const dateFrom = request.nextUrl.searchParams.get("date_from") || "";
  const dateTo = request.nextUrl.searchParams.get("date_to") || "";
  const db = getDb();

  if (!accountId) return NextResponse.json([]);

  let query = `SELECT jel.*, je.entry_code, je.entry_date, je.narration, je.source_type, je.status
    FROM journal_entry_lines jel
    JOIN journal_entries je ON jel.journal_entry_id = je.id
    WHERE jel.account_id = ? AND je.status = 'posted'`;
  const params: string[] = [accountId];
  if (dateFrom) { query += " AND je.entry_date >= ?"; params.push(dateFrom); }
  if (dateTo) { query += " AND je.entry_date <= ?"; params.push(dateTo); }
  query += " ORDER BY je.entry_date, je.created_at";

  const transactions = db.prepare(query).all(...params);
  const account = db.prepare("SELECT * FROM accounts WHERE id = ?").get(accountId);
  return NextResponse.json({ account, transactions });
}
