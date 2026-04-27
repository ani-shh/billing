import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const db = getDb();
  const payments = db.prepare(`
    SELECT p.*, i.invoice_code, i.grand_total as invoice_total, c.name as customer_name
    FROM payments p
    LEFT JOIN invoices i ON p.invoice_id = i.id
    LEFT JOIN customers c ON i.customer_id = c.id
    ORDER BY p.created_at DESC
  `).all();
  return NextResponse.json(payments);
}

export async function POST(request: NextRequest) {
  try {
  const body = await request.json();
  const db = getDb();
  const id = uuid();

  const transaction = db.transaction(() => {
    db.prepare(
      "INSERT INTO payments (id, invoice_id, amount, payment_date, payment_method, reference, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).run(id, body.invoice_id, body.amount, body.payment_date, body.payment_method || "cash", body.reference || null, body.notes || null);

    // Check if invoice is fully paid
    const totalPaid = db.prepare(
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id = ?"
    ).get(body.invoice_id) as { total: number };

    const invoice = db.prepare(
      "SELECT grand_total FROM invoices WHERE id = ?"
    ).get(body.invoice_id) as { grand_total: number };

    if (totalPaid.total >= invoice.grand_total) {
      db.prepare("UPDATE invoices SET status = 'paid', updated_at = datetime('now') WHERE id = ?").run(body.invoice_id);
    } else {
      db.prepare("UPDATE invoices SET status = 'partial', updated_at = datetime('now') WHERE id = ?").run(body.invoice_id);
    }
  });

  transaction();

  const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(id);
  return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    console.error("Payment error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
