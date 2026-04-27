import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const warehouseId = request.nextUrl.searchParams.get("warehouse_id") || "";
  const lowStock = request.nextUrl.searchParams.get("low_stock") === "true";
  const db = getDb();

  let query = `
    SELECT i.*, p.name as product_name, p.code as product_code, p.unit, p.rate,
      p.min_stock_level, p.category, p.image_path, w.name as warehouse_name
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    JOIN warehouses w ON i.warehouse_id = w.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (warehouseId) {
    query += " AND i.warehouse_id = ?";
    params.push(warehouseId);
  }
  if (lowStock) {
    query += " AND i.quantity < p.min_stock_level AND p.min_stock_level > 0";
  }
  query += " ORDER BY p.name, w.name";

  const inventory = db.prepare(query).all(...params);
  return NextResponse.json(inventory);
}
