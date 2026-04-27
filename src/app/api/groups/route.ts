import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const db = getDb();
  const groups = db.prepare("SELECT * FROM user_groups ORDER BY name").all();
  return NextResponse.json(groups);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const id = uuid();
  db.prepare("INSERT INTO user_groups (id, name, description) VALUES (?, ?, ?)").run(id, body.name, body.description || null);
  return NextResponse.json(db.prepare("SELECT * FROM user_groups WHERE id = ?").get(id), { status: 201 });
}
