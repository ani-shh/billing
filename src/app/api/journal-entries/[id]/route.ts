import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const je = db.prepare("SELECT je.*, fy.name as fiscal_year FROM journal_entries je LEFT JOIN fiscal_years fy ON je.fiscal_year_id = fy.id WHERE je.id = ?").get(id);
  if (!je) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const lines = db.prepare("SELECT jel.*, a.code as account_code, a.name as account_name, a.type as account_type FROM journal_entry_lines jel JOIN accounts a ON jel.account_id = a.id WHERE jel.journal_entry_id = ? ORDER BY jel.sort_order").all(id);
  return NextResponse.json({ ...je as object, lines });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();
  db.prepare("UPDATE journal_entries SET status=?, updated_at=datetime('now') WHERE id=?").run(body.status, id);
  return NextResponse.json(db.prepare("SELECT * FROM journal_entries WHERE id = ?").get(id));
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const je = db.prepare("SELECT status FROM journal_entries WHERE id = ?").get(id) as { status: string } | undefined;
  if (je?.status === "posted") return NextResponse.json({ error: "Cannot delete posted entries" }, { status: 400 });
  db.prepare("DELETE FROM journal_entries WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
