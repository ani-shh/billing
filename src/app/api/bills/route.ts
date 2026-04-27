import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") || "";
  const status = request.nextUrl.searchParams.get("status") || "";
  const db = getDb();

  let query = `SELECT b.*, s.name as supplier_name FROM bills b LEFT JOIN suppliers s ON b.supplier_id = s.id WHERE 1=1`;
  const params: string[] = [];
  if (search) { query += " AND (b.bill_code LIKE ? OR s.name LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
  if (status) { query += " AND b.status = ?"; params.push(status); }
  query += " ORDER BY b.created_at DESC";

  return NextResponse.json(db.prepare(query).all(...params));
}

interface BillItem { product_id?: string; description?: string; quantity: number; rate: number; discount?: number; tax_rate?: number; amount: number; }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();
    const id = uuid();
    const billCode = body.bill_code || generateBillCode(db);

    const insertBill = db.prepare(`INSERT INTO bills (id, bill_code, supplier_id, reference_no, bill_date, due_date, currency, exchange_rate, warehouse_id, subtotal, discount_total, tax_total, grand_total, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const insertItem = db.prepare(`INSERT INTO bill_items (id, bill_id, product_id, description, quantity, rate, discount, tax_rate, amount, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    const transaction = db.transaction(() => {
      insertBill.run(id, billCode, body.supplier_id, body.reference_no || null, body.bill_date, body.due_date, body.currency || "NPR", body.exchange_rate || 1, body.warehouse_id || null, body.subtotal || 0, body.discount_total || 0, body.tax_total || 0, body.grand_total || 0, body.status || "draft", body.notes || null);
      if (body.items && Array.isArray(body.items)) {
        body.items.forEach((item: BillItem, i: number) => {
          insertItem.run(uuid(), id, item.product_id || null, item.description || null, item.quantity || 1, item.rate || 0, item.discount || 0, item.tax_rate || 0, item.amount || 0, i);
        });
      }
    });
    transaction();

    const bill = db.prepare("SELECT b.*, s.name as supplier_name FROM bills b LEFT JOIN suppliers s ON b.supplier_id = s.id WHERE b.id = ?").get(id);
    return NextResponse.json(bill, { status: 201 });
  } catch (err) {
    console.error("Bill creation error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

function generateBillCode(db: ReturnType<typeof getDb>): string {
  const last = db.prepare("SELECT bill_code FROM bills WHERE bill_code LIKE 'BILL-%' ORDER BY bill_code DESC LIMIT 1").get() as { bill_code: string } | undefined;
  if (!last) return "BILL-0001";
  const num = parseInt(last.bill_code.replace("BILL-", "")) + 1;
  return `BILL-${num.toString().padStart(4, "0")}`;
}
