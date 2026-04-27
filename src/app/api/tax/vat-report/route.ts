import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const dateFrom = request.nextUrl.searchParams.get("date_from") || "";
  const dateTo = request.nextUrl.searchParams.get("date_to") || "";
  const db = getDb();

  const outputVAT = db.prepare(`SELECT COALESCE(SUM(tax_total), 0) as total FROM invoices WHERE invoice_date BETWEEN ? AND ? AND status != 'draft'`).get(dateFrom || "2000-01-01", dateTo || "2099-12-31") as { total: number };
  const inputVAT = db.prepare(`SELECT COALESCE(SUM(tax_total), 0) as total FROM bills WHERE bill_date BETWEEN ? AND ? AND status != 'draft'`).get(dateFrom || "2000-01-01", dateTo || "2099-12-31") as { total: number };

  const salesDetails = db.prepare(`SELECT i.invoice_code, i.invoice_date, c.name as customer_name, c.pan_no, i.subtotal, i.tax_total, i.grand_total FROM invoices i LEFT JOIN customers c ON i.customer_id = c.id WHERE i.invoice_date BETWEEN ? AND ? AND i.status != 'draft' ORDER BY i.invoice_date`).all(dateFrom || "2000-01-01", dateTo || "2099-12-31");
  const purchaseDetails = db.prepare(`SELECT b.bill_code, b.bill_date, s.name as supplier_name, s.pan_no, b.subtotal, b.tax_total, b.grand_total FROM bills b LEFT JOIN suppliers s ON b.supplier_id = s.id WHERE b.bill_date BETWEEN ? AND ? AND b.status != 'draft' ORDER BY b.bill_date`).all(dateFrom || "2000-01-01", dateTo || "2099-12-31");

  return NextResponse.json({
    date_from: dateFrom, date_to: dateTo,
    output_vat: outputVAT.total, input_vat: inputVAT.total,
    net_vat: outputVAT.total - inputVAT.total,
    sales: salesDetails, purchases: purchaseDetails,
  });
}
