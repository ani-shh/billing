import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") || "";
  const status = request.nextUrl.searchParams.get("status") || "";
  const isExport = request.nextUrl.searchParams.get("is_export");
  const dateFrom = request.nextUrl.searchParams.get("date_from") || "";
  const db = getDb();

  let query = `
    SELECT i.*, c.name as customer_name
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (search) {
    query += " AND (i.invoice_code LIKE ? OR c.name LIKE ? OR i.reference_no LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status) {
    query += " AND i.status = ?";
    params.push(status);
  }
  if (isExport === "0" || isExport === "1") {
    query += " AND i.is_export = ?";
    params.push(isExport);
  }
  if (dateFrom) {
    query += " AND i.invoice_date >= ?";
    params.push(dateFrom);
  }
  query += " ORDER BY i.created_at DESC";

  const invoices = db.prepare(query).all(...params);
  return NextResponse.json(invoices);
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

export async function POST(request: NextRequest) {
  try {
  const body = await request.json();
  const db = getDb();
  const id = uuid();

  const invoiceCode = body.invoice_code || generateInvoiceCode(db);

  const insertInvoice = db.prepare(`
    INSERT INTO invoices (id, invoice_code, customer_id, reference_no, invoice_date, due_date,
      currency, exchange_rate, warehouse_id, is_export, subtotal, discount_total, tax_total,
      grand_total, status, received_by, expiry, batch_no, udf, tds_applicable, tds_amount,
      terms, reporting_tags, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT INTO invoice_items (id, invoice_id, product_id, description, quantity, rate, discount,
      discount_type, tax_rate, amount, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    insertInvoice.run(
      id, invoiceCode, body.customer_id, body.reference_no || null,
      body.invoice_date, body.due_date, body.currency || "NPR",
      body.exchange_rate || 1, body.warehouse_id || null, body.is_export ? 1 : 0,
      body.subtotal || 0, body.discount_total || 0, body.tax_total || 0,
      body.grand_total || 0, body.status || "draft",
      body.received_by || null, body.expiry || null, body.batch_no || null,
      body.udf || null, body.tds_applicable ? 1 : 0, body.tds_amount || 0,
      body.terms || null, body.reporting_tags || null, body.notes || null
    );

    if (body.items && Array.isArray(body.items)) {
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

  const invoice = db.prepare(`
    SELECT i.*, c.name as customer_name
    FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.id = ?
  `).get(id);
  return NextResponse.json(invoice, { status: 201 });
  } catch (err) {
    console.error("Invoice creation error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function generateInvoiceCode(db: ReturnType<typeof getDb>): string {
  const last = db.prepare(
    "SELECT invoice_code FROM invoices WHERE invoice_code LIKE 'INV-%' ORDER BY invoice_code DESC LIMIT 1"
  ).get() as { invoice_code: string } | undefined;

  if (!last) return "INV-0001";
  const num = parseInt(last.invoice_code.replace("INV-", "")) + 1;
  return `INV-${num.toString().padStart(4, "0")}`;
}
