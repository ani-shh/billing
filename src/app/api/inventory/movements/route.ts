import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("product_id") || "";
  const warehouseId = request.nextUrl.searchParams.get("warehouse_id") || "";
  const db = getDb();

  let query = `
    SELECT sm.*, p.name as product_name, p.code as product_code, w.name as warehouse_name
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    JOIN warehouses w ON sm.warehouse_id = w.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (productId) {
    query += " AND sm.product_id = ?";
    params.push(productId);
  }
  if (warehouseId) {
    query += " AND sm.warehouse_id = ?";
    params.push(warehouseId);
  }
  query += " ORDER BY sm.created_at DESC LIMIT 100";

  const movements = db.prepare(query).all(...params);
  return NextResponse.json(movements);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();
    const id = uuid();

    const transaction = db.transaction(() => {
      // Record the movement
      db.prepare(
        "INSERT INTO stock_movements (id, product_id, warehouse_id, type, quantity, reference, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
      ).run(id, body.product_id, body.warehouse_id, body.type, body.quantity, body.reference || null, body.notes || null);

      // Update inventory
      const delta = body.type === "out" ? -body.quantity : body.quantity;
      db.prepare(`
        INSERT INTO inventory (id, product_id, warehouse_id, quantity)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(product_id, warehouse_id)
        DO UPDATE SET quantity = quantity + ?, updated_at = datetime('now')
      `).run(uuid(), body.product_id, body.warehouse_id, Math.max(0, delta), delta);
    });

    transaction();

    const movement = db.prepare("SELECT * FROM stock_movements WHERE id = ?").get(id);
    return NextResponse.json(movement, { status: 201 });
  } catch (err) {
    console.error("Stock movement error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
