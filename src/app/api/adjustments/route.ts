import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare(`SELECT a.*, p.name as product_name, p.code as product_code, w.name as warehouse_name FROM inventory_adjustments a JOIN products p ON a.product_id = p.id JOIN warehouses w ON a.warehouse_id = w.id ORDER BY a.created_at DESC`).all());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();
    const id = uuid();
    const code = "ADJ-" + (parseInt(((db.prepare("SELECT adjustment_code FROM inventory_adjustments ORDER BY adjustment_code DESC LIMIT 1").get() as {adjustment_code:string}|undefined)?.adjustment_code || "ADJ-0000").replace("ADJ-","")) + 1).toString().padStart(4,"0");

    const transaction = db.transaction(() => {
      db.prepare("INSERT INTO inventory_adjustments (id, adjustment_code, warehouse_id, product_id, adjustment_type, quantity, reason, notes, adjustment_date) VALUES (?,?,?,?,?,?,?,?,?)").run(id, code, body.warehouse_id, body.product_id, body.adjustment_type, body.quantity, body.reason || null, body.notes || null, body.adjustment_date);

      const delta = body.adjustment_type === "decrease" ? -body.quantity : body.quantity;
      db.prepare(`INSERT INTO inventory (id, product_id, warehouse_id, quantity) VALUES (?, ?, ?, ?) ON CONFLICT(product_id, warehouse_id) DO UPDATE SET quantity = quantity + ?, updated_at = datetime('now')`).run(uuid(), body.product_id, body.warehouse_id, Math.max(0, delta), delta);

      db.prepare("INSERT INTO stock_movements (id, product_id, warehouse_id, type, quantity, reference, notes) VALUES (?,?,?,?,?,?,?)").run(uuid(), body.product_id, body.warehouse_id, "adjustment", body.quantity, code, `${body.adjustment_type}: ${body.reason || "Inventory adjustment"}`);
    });
    transaction();

    return NextResponse.json(db.prepare("SELECT * FROM inventory_adjustments WHERE id = ?").get(id), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
