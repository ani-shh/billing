import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();

  const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(id) as { invoice_id: string } | undefined;
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  db.prepare("DELETE FROM payments WHERE id = ?").run(id);

  // Recalculate invoice status
  const totalPaid = db.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id = ?"
  ).get(payment.invoice_id) as { total: number };

  const invoice = db.prepare(
    "SELECT grand_total FROM invoices WHERE id = ?"
  ).get(payment.invoice_id) as { grand_total: number };

  let newStatus = "sent";
  if (totalPaid.total >= invoice.grand_total) newStatus = "paid";
  else if (totalPaid.total > 0) newStatus = "partial";

  db.prepare("UPDATE invoices SET status = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, payment.invoice_id);

  return NextResponse.json({ success: true });
}
