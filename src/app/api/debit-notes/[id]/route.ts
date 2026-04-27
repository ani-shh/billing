import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const note = db.prepare(`SELECT dn.*, s.name as supplier_name, s.email as supplier_email, s.phone as supplier_phone, s.address as supplier_address, b.bill_code FROM debit_notes dn LEFT JOIN suppliers s ON dn.supplier_id = s.id LEFT JOIN bills b ON dn.bill_id = b.id WHERE dn.id = ?`).get(id);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = db.prepare(`SELECT di.*, p.name as product_name, p.code as product_code FROM debit_note_items di LEFT JOIN products p ON di.product_id = p.id WHERE di.debit_note_id = ? ORDER BY di.sort_order`).all(id);
  return NextResponse.json({ ...note as object, items });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();
  db.prepare(`UPDATE debit_notes SET supplier_id=?, bill_id=?, debit_date=?, reference_no=?, reason=?, subtotal=?, tax_total=?, grand_total=?, status=?, notes=?, updated_at=datetime('now') WHERE id=?`).run(body.supplier_id, body.bill_id || null, body.debit_date, body.reference_no || null, body.reason || null, body.subtotal || 0, body.tax_total || 0, body.grand_total || 0, body.status || "draft", body.notes || null, id);
  return NextResponse.json(db.prepare("SELECT * FROM debit_notes WHERE id = ?").get(id));
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare("DELETE FROM debit_notes WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
