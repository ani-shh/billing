import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare("SELECT * FROM accounts ORDER BY code").all());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const id = uuid();
  db.prepare("INSERT INTO accounts (id, code, name, type, sub_type, parent_id, description, is_system, opening_balance, opening_balance_type) VALUES (?,?,?,?,?,?,?,?,?,?)").run(id, body.code, body.name, body.type, body.sub_type || null, body.parent_id || null, body.description || null, 0, body.opening_balance || 0, body.opening_balance_type || "debit");
  return NextResponse.json(db.prepare("SELECT * FROM accounts WHERE id = ?").get(id), { status: 201 });
}
