import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const alerts = db.prepare(`
    SELECT p.id, p.name, p.code, p.min_stock_level, p.image_path,
      COALESCE(SUM(i.quantity), 0) as total_stock
    FROM products p
    LEFT JOIN inventory i ON p.id = i.product_id
    WHERE p.min_stock_level > 0
    GROUP BY p.id
    HAVING total_stock < p.min_stock_level
    ORDER BY (total_stock * 1.0 / p.min_stock_level) ASC
  `).all();
  return NextResponse.json(alerts);
}
