import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") || "";
  const db = getDb();
  let suppliers;
  if (search) {
    suppliers = db.prepare("SELECT * FROM suppliers WHERE name LIKE ? OR email LIKE ? ORDER BY name").all(`%${search}%`, `%${search}%`);
  } else {
    suppliers = db.prepare("SELECT * FROM suppliers ORDER BY name").all();
  }
  return NextResponse.json(suppliers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const id = uuid();
  db.prepare("INSERT INTO suppliers (id, name, email, phone, address, pan_no) VALUES (?, ?, ?, ?, ?, ?)")
    .run(id, body.name, body.email || null, body.phone || null, body.address || null, body.pan_no || null);
  const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id);
  return NextResponse.json(supplier, { status: 201 });
}
