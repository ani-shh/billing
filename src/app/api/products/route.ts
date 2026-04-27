import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") || "";
  const db = getDb();

  let query = `
    SELECT p.*, COALESCE(SUM(i.quantity), 0) as total_stock
    FROM products p
    LEFT JOIN inventory i ON p.id = i.product_id
  `;
  const params: string[] = [];

  if (search) {
    query += " WHERE (p.name LIKE ? OR p.code LIKE ? OR p.sku LIKE ? OR p.category LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  query += " GROUP BY p.id ORDER BY p.name";

  const products = db.prepare(query).all(...params);
  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const id = uuid();
  db.prepare(`
    INSERT INTO products (id, name, code, description, rate, tax_rate, unit, category, brand, sku, weight, dimensions, min_stock_level,
      product_type, hs_code, available_for_sale, selling_price, purchase_price, sales_account, purchase_account,
      sales_return_account, purchase_return_account, valuation_method, track_inventory)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, body.name, body.code || null, body.description || null,
    body.rate || 0, body.tax_rate || 0, body.unit || "pcs",
    body.category || null, body.brand || null, body.sku || null,
    body.weight || null, body.dimensions || null, body.min_stock_level || 0,
    body.product_type || "goods", body.hs_code || null,
    body.available_for_sale !== false ? 1 : 0,
    body.selling_price || 0, body.purchase_price || 0,
    body.sales_account || null, body.purchase_account || null,
    body.sales_return_account || null, body.purchase_return_account || null,
    body.valuation_method || null, body.track_inventory !== false ? 1 : 0
  );
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  return NextResponse.json(product, { status: 201 });
}
