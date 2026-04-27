import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get per-warehouse inventory
  const inventory = db.prepare(`
    SELECT i.*, w.name as warehouse_name
    FROM inventory i
    JOIN warehouses w ON i.warehouse_id = w.id
    WHERE i.product_id = ?
  `).all(id);

  // Recent movements
  const movements = db.prepare(`
    SELECT sm.*, w.name as warehouse_name
    FROM stock_movements sm
    JOIN warehouses w ON sm.warehouse_id = w.id
    WHERE sm.product_id = ?
    ORDER BY sm.created_at DESC LIMIT 10
  `).all(id);

  return NextResponse.json({ ...product as object, inventory, movements });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const db = getDb();
  db.prepare(`
    UPDATE products SET name=?, code=?, description=?, rate=?, tax_rate=?, unit=?,
      category=?, brand=?, sku=?, weight=?, dimensions=?, min_stock_level=?,
      product_type=?, hs_code=?, available_for_sale=?, selling_price=?, purchase_price=?,
      sales_account=?, purchase_account=?, sales_return_account=?, purchase_return_account=?,
      valuation_method=?, track_inventory=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    body.name, body.code || null, body.description || null,
    body.rate || 0, body.tax_rate || 0, body.unit || "pcs",
    body.category || null, body.brand || null, body.sku || null,
    body.weight || null, body.dimensions || null, body.min_stock_level || 0,
    body.product_type || "goods", body.hs_code || null,
    body.available_for_sale !== false ? 1 : 0,
    body.selling_price || 0, body.purchase_price || 0,
    body.sales_account || null, body.purchase_account || null,
    body.sales_return_account || null, body.purchase_return_account || null,
    body.valuation_method || null, body.track_inventory !== false ? 1 : 0, id
  );
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  return NextResponse.json(product);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM products WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
