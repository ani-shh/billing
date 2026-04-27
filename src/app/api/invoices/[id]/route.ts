import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const invoice = db.prepare(`
    SELECT i.*, c.name as customer_name, c.email as customer_email,
      c.phone as customer_phone, c.address as customer_address, c.pan_no as customer_pan,
      w.name as warehouse_name
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN warehouses w ON i.warehouse_id = w.id
    WHERE i.id = ?
  `).get(id);

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const items = db.prepare(`
    SELECT ii.*, p.name as product_name, p.code as product_code
    FROM invoice_items ii
    LEFT JOIN products p ON ii.product_id = p.id
    WHERE ii.invoice_id = ?
    ORDER BY ii.sort_order
  `).all(id);

  const payments = db.prepare(
    "SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC"
  ).all(id);

  return NextResponse.json({ ...invoice as object, items, payments });
}

interface InvoiceItem {
  product_id?: string;
  description?: string;
  quantity: number;
  rate: number;
  discount?: number;
  discount_type?: string;
  tax_rate?: number;
  amount: number;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  const updateInvoice = db.prepare(`
    UPDATE invoices SET customer_id=?, reference_no=?, invoice_date=?, due_date=?,
      currency=?, exchange_rate=?, warehouse_id=?, is_export=?, subtotal=?,
      discount_total=?, tax_total=?, grand_total=?, status=?, received_by=?,
      expiry=?, batch_no=?, udf=?, tds_applicable=?, tds_amount=?,
      terms=?, reporting_tags=?, notes=?, updated_at=datetime('now')
    WHERE id=?
  `);

  const insertItem = db.prepare(`
    INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, rate, discount,
      discount_type, tax_rate, amount, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    updateInvoice.run(
      body.customer_id, body.reference_no || null, body.invoice_date, body.due_date,
      body.currency || "NPR", body.exchange_rate || 1, body.warehouse_id || null,
      body.is_export ? 1 : 0, body.subtotal || 0, body.discount_total || 0,
      body.tax_total || 0, body.grand_total || 0, body.status || "draft",
      body.received_by || null, body.expiry || null, body.batch_no || null,
      body.udf || null, body.tds_applicable ? 1 : 0, body.tds_amount || 0,
      body.terms || null, body.reporting_tags || null, body.notes || null, id
    );

    if (body.items && Array.isArray(body.items)) {
      db.prepare("DELETE FROM invoice_items WHERE invoice_id = ?").run(id);
      body.items.forEach((item: InvoiceItem, index: number) => {
        insertItem.run(
          uuid(), id, item.product_id || null, item.description || null,
          item.quantity || 1, item.rate || 0, item.discount || 0,
          item.discount_type || "percent", item.tax_rate || 0,
          item.amount || 0, index
        );
      });
    }
  });

  transaction();

  const invoice = db.prepare("SELECT * FROM invoices WHERE id = ?").get(id);
  return NextResponse.json(invoice);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM invoices WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
