import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET() {
  const db = getDb();
  return NextResponse.json(db.prepare(`SELECT po.*, p.name as product_name, p.code as product_code, w.name as warehouse_name FROM production_orders po JOIN products p ON po.product_id = p.id JOIN warehouses w ON po.warehouse_id = w.id ORDER BY po.created_at DESC`).all());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();
    const id = uuid();
    const code = "PO-" + (parseInt(((db.prepare("SELECT order_code FROM production_orders ORDER BY order_code DESC LIMIT 1").get() as {order_code:string}|undefined)?.order_code || "PO-0000").replace("PO-","")) + 1).toString().padStart(4,"0");

    db.prepare("INSERT INTO production_orders (id, order_code, product_id, warehouse_id, quantity, status, start_date, end_date, notes) VALUES (?,?,?,?,?,?,?,?,?)").run(id, code, body.product_id, body.warehouse_id, body.quantity, body.status || "draft", body.start_date || null, body.end_date || null, body.notes || null);

    return NextResponse.json(db.prepare("SELECT * FROM production_orders WHERE id = ?").get(id), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const db = getDb();

  if (body.status === "completed") {
    const transaction = db.transaction(() => {
      db.prepare("UPDATE production_orders SET status = 'completed', updated_at = datetime('now') WHERE id = ?").run(body.id);
      // Add produced stock
      db.prepare(`INSERT INTO inventory (id, product_id, warehouse_id, quantity) VALUES (?, ?, ?, ?) ON CONFLICT(product_id, warehouse_id) DO UPDATE SET quantity = quantity + ?, updated_at = datetime('now')`).run(uuid(), body.product_id, body.warehouse_id, body.quantity, body.quantity);
      const order = db.prepare("SELECT order_code FROM production_orders WHERE id = ?").get(body.id) as { order_code: string };
      db.prepare("INSERT INTO stock_movements (id, product_id, warehouse_id, type, quantity, reference, notes) VALUES (?,?,?,?,?,?,?)").run(uuid(), body.product_id, body.warehouse_id, "in", body.quantity, order.order_code, "Production completed");
    });
    transaction();
  } else {
    db.prepare("UPDATE production_orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(body.status, body.id);
  }

  return NextResponse.json(db.prepare("SELECT * FROM production_orders WHERE id = ?").get(body.id));
}
