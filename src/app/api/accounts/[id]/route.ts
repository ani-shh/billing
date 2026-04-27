import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const account = db.prepare("SELECT * FROM accounts WHERE id = ?").get(id);
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(account);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();
  db.prepare("UPDATE accounts SET code=?, name=?, type=?, sub_type=?, parent_id=?, description=?, opening_balance=?, opening_balance_type=?, is_active=?, updated_at=datetime('now') WHERE id=?").run(body.code, body.name, body.type, body.sub_type || null, body.parent_id || null, body.description || null, body.opening_balance || 0, body.opening_balance_type || "debit", body.is_active !== false ? 1 : 0, id);
  return NextResponse.json(db.prepare("SELECT * FROM accounts WHERE id = ?").get(id));
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const acct = db.prepare("SELECT is_system FROM accounts WHERE id = ?").get(id) as { is_system: number } | undefined;
  if (acct?.is_system) return NextResponse.json({ error: "System accounts cannot be deleted" }, { status: 400 });
  db.prepare("DELETE FROM accounts WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
