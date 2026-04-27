import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const note = db.prepare(`SELECT cn.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address, i.invoice_code FROM credit_notes cn LEFT JOIN customers c ON cn.customer_id = c.id LEFT JOIN invoices i ON cn.invoice_id = i.id WHERE cn.id = ?`).get(id);
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = db.prepare(`SELECT ci.*, p.name as product_name, p.code as product_code FROM credit_note_items ci LEFT JOIN products p ON ci.product_id = p.id WHERE ci.credit_note_id = ? ORDER BY ci.sort_order`).all(id);
  return NextResponse.json({ ...note as object, items });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();
  db.prepare(`UPDATE credit_notes SET customer_id=?, invoice_id=?, credit_date=?, reference_no=?, reason=?, subtotal=?, tax_total=?, grand_total=?, status=?, notes=?, updated_at=datetime('now') WHERE id=?`).run(body.customer_id, body.invoice_id || null, body.credit_date, body.reference_no || null, body.reason || null, body.subtotal || 0, body.tax_total || 0, body.grand_total || 0, body.status || "draft", body.notes || null, id);
  return NextResponse.json(db.prepare("SELECT * FROM credit_notes WHERE id = ?").get(id));
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare("DELETE FROM credit_notes WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
