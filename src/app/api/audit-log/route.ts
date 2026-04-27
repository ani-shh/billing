import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  const limit = parseInt(request.nextUrl.searchParams.get("limit") || "50");
  const module = request.nextUrl.searchParams.get("module") || "";
  const db = getDb();

  let query = "SELECT * FROM audit_log WHERE 1=1";
  const params: (string | number)[] = [];
  if (module) { query += " AND module = ?"; params.push(module); }
  query += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit);

  return NextResponse.json(db.prepare(query).all(...params));
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const id = uuid();
  db.prepare("INSERT INTO audit_log (id, user_id, username, action, module, record_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, body.user_id || null, body.username || null, body.action, body.module || null, body.record_id || null, body.details || null);
  return NextResponse.json({ success: true }, { status: 201 });
}
