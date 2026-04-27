import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const group = db.prepare("SELECT * FROM user_groups WHERE id = ?").get(id);
  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const permissions = db.prepare("SELECT * FROM group_permissions WHERE group_id = ?").all(id);
  const members = db.prepare("SELECT id, username, full_name, email, active FROM users WHERE group_id = ?").all(id);
  return NextResponse.json({ ...group as object, permissions, members });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare("DELETE FROM user_groups WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
