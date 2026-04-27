import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

interface SalesBreakdown { inside: number; export: number; total: number; }

function getSalesForPeriod(db: ReturnType<typeof getDb>, dateExpr: string): SalesBreakdown {
  const inside = db.prepare(
    `SELECT COALESCE(SUM(grand_total), 0) as total FROM invoices WHERE is_export = 0 AND invoice_date >= ${dateExpr}`
  ).get() as { total: number };
  const exp = db.prepare(
    `SELECT COALESCE(SUM(grand_total), 0) as total FROM invoices WHERE is_export = 1 AND invoice_date >= ${dateExpr}`
  ).get() as { total: number };
  return { inside: inside.total, export: exp.total, total: inside.total + exp.total };
}

export async function GET() {
  const db = getDb();

  const totalRevenue = db.prepare(
    "SELECT COALESCE(SUM(grand_total), 0) as total FROM invoices WHERE status = 'paid'"
  ).get() as { total: number };

  const totalOutstanding = db.prepare(
    "SELECT COALESCE(SUM(grand_total), 0) as total FROM invoices WHERE status IN ('sent', 'partial')"
  ).get() as { total: number };

  const totalOverdue = db.prepare(
    "SELECT COALESCE(SUM(grand_total), 0) as total FROM invoices WHERE status = 'overdue'"
  ).get() as { total: number };

  const invoiceCount = db.prepare(
    "SELECT COUNT(*) as count FROM invoices"
  ).get() as { count: number };

  const recentInvoices = db.prepare(`
    SELECT i.*, c.name as customer_name
    FROM invoices i
    LEFT JOIN customers c ON i.customer_id = c.id
    ORDER BY i.created_at DESC
    LIMIT 5
  `).all();

  // Sales by period
  const weeklySales = getSalesForPeriod(db, "date('now', '-7 days')");
  const monthlySales = getSalesForPeriod(db, "date('now', '-1 month')");
  const quarterlySales = getSalesForPeriod(db, "date('now', '-3 months')");
  const yearlySales = getSalesForPeriod(db, "date('now', '-1 year')");

  // Monthly trend (last 6 months) with inside/export split
  const monthlyTrend = db.prepare(`
    SELECT
      strftime('%Y-%m', invoice_date) as month,
      SUM(CASE WHEN is_export = 0 THEN grand_total ELSE 0 END) as inside_sales,
      SUM(CASE WHEN is_export = 1 THEN grand_total ELSE 0 END) as export_sales,
      SUM(grand_total) as total
    FROM invoices
    WHERE invoice_date >= date('now', '-6 months')
    GROUP BY strftime('%Y-%m', invoice_date)
    ORDER BY month
  `).all();

  const lowStockCount = db.prepare(`
    SELECT COUNT(*) as count FROM (
      SELECT p.id FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.min_stock_level > 0
      GROUP BY p.id
      HAVING COALESCE(SUM(i.quantity), 0) < p.min_stock_level
    )
  `).get() as { count: number };

  return NextResponse.json({
    totalRevenue: totalRevenue.total,
    totalOutstanding: totalOutstanding.total,
    totalOverdue: totalOverdue.total,
    invoiceCount: invoiceCount.count,
    lowStockCount: lowStockCount.count,
    recentInvoices,
    sales: {
      weekly: weeklySales,
      monthly: monthlySales,
      quarterly: quarterlySales,
      yearly: yearlySales,
    },
    monthlyTrend,
  });
}
