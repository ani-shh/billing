import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();
  db.prepare(
    "UPDATE customers SET name=?, email=?, phone=?, address=?, pan_no=?, updated_at=datetime('now') WHERE id=?"
  ).run(body.name, body.email || null, body.phone || null, body.address || null, body.pan_no || null, id);
  const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
  return NextResponse.json(customer);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM customers WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
