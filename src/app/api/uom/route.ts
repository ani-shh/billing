import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare("SELECT * FROM units_of_measurement ORDER BY name").all());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const id = uuid();
  db.prepare("INSERT INTO units_of_measurement (id, name, abbreviation, type) VALUES (?, ?, ?, ?)").run(id, body.name, body.abbreviation || body.name.toLowerCase(), body.type || "unit");
  return NextResponse.json(db.prepare("SELECT * FROM units_of_measurement WHERE id = ?").get(id), { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  getDb().prepare("DELETE FROM units_of_measurement WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
