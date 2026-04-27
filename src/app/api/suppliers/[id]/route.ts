import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id);
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(supplier);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();
  db.prepare("UPDATE suppliers SET name=?, email=?, phone=?, address=?, pan_no=?, updated_at=datetime('now') WHERE id=?")
    .run(body.name, body.email || null, body.phone || null, body.address || null, body.pan_no || null, id);
  const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id);
  return NextResponse.json(supplier);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM suppliers WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
