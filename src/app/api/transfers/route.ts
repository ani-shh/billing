import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare(`SELECT t.*, p.name as product_name, p.code as product_code, fw.name as from_warehouse, tw.name as to_warehouse FROM warehouse_transfers t JOIN products p ON t.product_id = p.id JOIN warehouses fw ON t.from_warehouse_id = fw.id JOIN warehouses tw ON t.to_warehouse_id = tw.id ORDER BY t.created_at DESC`).all());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();
    const id = uuid();
    const code = "TRF-" + (parseInt(((db.prepare("SELECT transfer_code FROM warehouse_transfers ORDER BY transfer_code DESC LIMIT 1").get() as {transfer_code:string}|undefined)?.transfer_code || "TRF-0000").replace("TRF-","")) + 1).toString().padStart(4,"0");

    const transaction = db.transaction(() => {
      db.prepare("INSERT INTO warehouse_transfers (id, transfer_code, from_warehouse_id, to_warehouse_id, product_id, quantity, status, notes, transfer_date) VALUES (?,?,?,?,?,?,?,?,?)").run(id, code, body.from_warehouse_id, body.to_warehouse_id, body.product_id, body.quantity, body.status || "completed", body.notes || null, body.transfer_date);

      // Deduct from source
      db.prepare("UPDATE inventory SET quantity = quantity - ?, updated_at = datetime('now') WHERE product_id = ? AND warehouse_id = ?").run(body.quantity, body.product_id, body.from_warehouse_id);

      // Add to destination
      db.prepare(`INSERT INTO inventory (id, product_id, warehouse_id, quantity) VALUES (?, ?, ?, ?) ON CONFLICT(product_id, warehouse_id) DO UPDATE SET quantity = quantity + ?, updated_at = datetime('now')`).run(uuid(), body.product_id, body.to_warehouse_id, body.quantity, body.quantity);

      // Record movements
      db.prepare("INSERT INTO stock_movements (id, product_id, warehouse_id, type, quantity, reference, notes) VALUES (?,?,?,?,?,?,?)").run(uuid(), body.product_id, body.from_warehouse_id, "out", body.quantity, code, "Warehouse transfer out");
      db.prepare("INSERT INTO stock_movements (id, product_id, warehouse_id, type, quantity, reference, notes) VALUES (?,?,?,?,?,?,?)").run(uuid(), body.product_id, body.to_warehouse_id, "in", body.quantity, code, "Warehouse transfer in");
    });
    transaction();

    return NextResponse.json(db.prepare("SELECT * FROM warehouse_transfers WHERE id = ?").get(id), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
