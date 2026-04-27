import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const db = getDb();
  const users = db.prepare(`SELECT u.id, u.username, u.full_name, u.email, u.is_admin, u.active, u.group_id, g.name as group_name, u.created_at FROM users u LEFT JOIN user_groups g ON u.group_id = g.id ORDER BY u.created_at`).all();
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const id = uuid();
  try {
    db.prepare("INSERT INTO users (id, username, password, full_name, email, group_id, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, body.username, body.password, body.full_name || null, body.email || null, body.group_id || null, body.is_admin ? 1 : 0);
    return NextResponse.json(db.prepare("SELECT id, username, full_name, email, is_admin, group_id, active FROM users WHERE id = ?").get(id), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
