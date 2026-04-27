import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") || "";
  const status = request.nextUrl.searchParams.get("status") || "";
  const db = getDb();
  let query = `SELECT dn.*, s.name as supplier_name, b.bill_code FROM debit_notes dn LEFT JOIN suppliers s ON dn.supplier_id = s.id LEFT JOIN bills b ON dn.bill_id = b.id WHERE 1=1`;
  const params: string[] = [];
  if (search) { query += " AND (dn.debit_note_code LIKE ? OR s.name LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
  if (status) { query += " AND dn.status = ?"; params.push(status); }
  query += " ORDER BY dn.created_at DESC";
  return NextResponse.json(db.prepare(query).all(...params));
}

interface NoteItem { product_id?: string; description?: string; quantity: number; rate: number; tax_rate?: number; amount: number; }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();
    const id = uuid();
    const code = body.debit_note_code || genCode(db);
    const insert = db.prepare(`INSERT INTO debit_notes (id, debit_note_code, bill_id, supplier_id, debit_date, reference_no, reason, subtotal, tax_total, grand_total, status, notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
    const insertItem = db.prepare(`INSERT INTO debit_note_items (id, debit_note_id, product_id, description, quantity, rate, tax_rate, amount, sort_order) VALUES (?,?,?,?,?,?,?,?,?)`);
    const tx = db.transaction(() => {
      insert.run(id, code, body.bill_id || null, body.supplier_id, body.debit_date, body.reference_no || null, body.reason || null, body.subtotal || 0, body.tax_total || 0, body.grand_total || 0, body.status || "draft", body.notes || null);
      if (body.items) body.items.forEach((item: NoteItem, i: number) => { insertItem.run(uuid(), id, item.product_id || null, item.description || null, item.quantity, item.rate, item.tax_rate || 0, item.amount, i); });
    });
    tx();
    return NextResponse.json(db.prepare("SELECT dn.*, s.name as supplier_name FROM debit_notes dn LEFT JOIN suppliers s ON dn.supplier_id = s.id WHERE dn.id = ?").get(id), { status: 201 });
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }); }
}

function genCode(db: ReturnType<typeof getDb>) {
  const last = db.prepare("SELECT debit_note_code FROM debit_notes WHERE debit_note_code LIKE 'DN-%' ORDER BY debit_note_code DESC LIMIT 1").get() as { debit_note_code: string } | undefined;
  if (!last) return "DN-0001";
  return `DN-${(parseInt(last.debit_note_code.replace("DN-", "")) + 1).toString().padStart(4, "0")}`;
}
