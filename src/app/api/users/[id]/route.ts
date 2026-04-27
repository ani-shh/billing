import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();
  if (body.password) {
    db.prepare("UPDATE users SET username=?, password=?, full_name=?, email=?, group_id=?, is_admin=?, active=?, updated_at=datetime('now') WHERE id=?").run(body.username, body.password, body.full_name || null, body.email || null, body.group_id || null, body.is_admin ? 1 : 0, body.active !== false ? 1 : 0, id);
  } else {
    db.prepare("UPDATE users SET username=?, full_name=?, email=?, group_id=?, is_admin=?, active=?, updated_at=datetime('now') WHERE id=?").run(body.username, body.full_name || null, body.email || null, body.group_id || null, body.is_admin ? 1 : 0, body.active !== false ? 1 : 0, id);
  }
  return NextResponse.json(db.prepare("SELECT id, username, full_name, email, is_admin, group_id, active FROM users WHERE id = ?").get(id));
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare("DELETE FROM users WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
