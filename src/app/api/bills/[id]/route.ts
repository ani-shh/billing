import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const bill = db.prepare(`SELECT b.*, s.name as supplier_name, s.email as supplier_email, s.phone as supplier_phone, s.address as supplier_address, w.name as warehouse_name FROM bills b LEFT JOIN suppliers s ON b.supplier_id = s.id LEFT JOIN warehouses w ON b.warehouse_id = w.id WHERE b.id = ?`).get(id);
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = db.prepare(`SELECT bi.*, p.name as product_name, p.code as product_code FROM bill_items bi LEFT JOIN products p ON bi.product_id = p.id WHERE bi.bill_id = ? ORDER BY bi.sort_order`).all(id);
  return NextResponse.json({ ...bill as object, items });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();
  db.prepare(`UPDATE bills SET supplier_id=?, reference_no=?, bill_date=?, due_date=?, currency=?, exchange_rate=?, warehouse_id=?, subtotal=?, discount_total=?, tax_total=?, grand_total=?, status=?, notes=?, updated_at=datetime('now') WHERE id=?`)
    .run(body.supplier_id, body.reference_no || null, body.bill_date, body.due_date, body.currency || "NPR", body.exchange_rate || 1, body.warehouse_id || null, body.subtotal || 0, body.discount_total || 0, body.tax_total || 0, body.grand_total || 0, body.status || "draft", body.notes || null, id);
  const bill = db.prepare("SELECT * FROM bills WHERE id = ?").get(id);
  return NextResponse.json(bill);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  getDb().prepare("DELETE FROM bills WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
