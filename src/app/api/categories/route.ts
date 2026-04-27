import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare("SELECT * FROM product_categories ORDER BY name").all());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const id = uuid();
  db.prepare("INSERT INTO product_categories (id, name, description, parent_id) VALUES (?, ?, ?, ?)").run(id, body.name, body.description || null, body.parent_id || null);
  return NextResponse.json(db.prepare("SELECT * FROM product_categories WHERE id = ?").get(id), { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  getDb().prepare("DELETE FROM product_categories WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
