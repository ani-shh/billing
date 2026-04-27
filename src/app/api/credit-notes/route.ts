import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") || "";
  const status = request.nextUrl.searchParams.get("status") || "";
  const db = getDb();
  let query = `SELECT cn.*, c.name as customer_name, i.invoice_code FROM credit_notes cn LEFT JOIN customers c ON cn.customer_id = c.id LEFT JOIN invoices i ON cn.invoice_id = i.id WHERE 1=1`;
  const params: string[] = [];
  if (search) { query += " AND (cn.credit_note_code LIKE ? OR c.name LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
  if (status) { query += " AND cn.status = ?"; params.push(status); }
  query += " ORDER BY cn.created_at DESC";
  return NextResponse.json(db.prepare(query).all(...params));
}

interface NoteItem { product_id?: string; description?: string; quantity: number; rate: number; tax_rate?: number; amount: number; }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();
    const id = uuid();
    const code = body.credit_note_code || genCode(db);
    const insert = db.prepare(`INSERT INTO credit_notes (id, credit_note_code, invoice_id, customer_id, credit_date, reference_no, reason, subtotal, tax_total, grand_total, status, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
    const insertItem = db.prepare(`INSERT INTO credit_note_items (id, credit_note_id, product_id, description, quantity, rate, tax_rate, amount, sort_order) VALUES (?,?,?,?,?,?,?,?,?)`);
    const tx = db.transaction(() => {
      insert.run(id, code, body.invoice_id || null, body.customer_id, body.credit_date, body.reference_no || null, body.reason || null, body.subtotal || 0, body.tax_total || 0, body.grand_total || 0, body.status || "draft", body.notes || null);
      if (body.items) body.items.forEach((item: NoteItem, i: number) => { insertItem.run(uuid(), id, item.product_id || null, item.description || null, item.quantity, item.rate, item.tax_rate || 0, item.amount, i); });
    });
    tx();
    return NextResponse.json(db.prepare("SELECT cn.*, c.name as customer_name FROM credit_notes cn LEFT JOIN customers c ON cn.customer_id = c.id WHERE cn.id = ?").get(id), { status: 201 });
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }); }
}

function genCode(db: ReturnType<typeof getDb>) {
  const last = db.prepare("SELECT credit_note_code FROM credit_notes WHERE credit_note_code LIKE 'CN-%' ORDER BY credit_note_code DESC LIMIT 1").get() as { credit_note_code: string } | undefined;
  if (!last) return "CN-0001";
  return `CN-${(parseInt(last.credit_note_code.replace("CN-", "")) + 1).toString().padStart(4, "0")}`;
}
