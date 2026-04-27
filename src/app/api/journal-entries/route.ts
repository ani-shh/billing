import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") || "";
  const db = getDb();
  let query = "SELECT je.*, fy.name as fiscal_year FROM journal_entries je LEFT JOIN fiscal_years fy ON je.fiscal_year_id = fy.id WHERE 1=1";
  const params: string[] = [];
  if (status) { query += " AND je.status = ?"; params.push(status); }
  query += " ORDER BY je.created_at DESC LIMIT 100";
  return NextResponse.json(db.prepare(query).all(...params));
}

interface JELine { account_id: string; debit: number; credit: number; description?: string; }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();
    const id = uuid();
    const code = body.entry_code || genCode(db);
    const fy = db.prepare("SELECT id FROM fiscal_years WHERE is_current = 1 LIMIT 1").get() as { id: string } | undefined;

    const totalDebit = (body.lines as JELine[]).reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = (body.lines as JELine[]).reduce((s, l) => s + (l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) return NextResponse.json({ error: "Debits must equal credits" }, { status: 400 });

    const tx = db.transaction(() => {
      db.prepare("INSERT INTO journal_entries (id, entry_code, entry_date, fiscal_year_id, reference, source_type, source_id, narration, total_debit, total_credit, status, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(id, code, body.entry_date, fy?.id || null, body.reference || null, body.source_type || "manual", body.source_id || null, body.narration || null, totalDebit, totalCredit, body.status || "draft", body.created_by || null);
      (body.lines as JELine[]).forEach((line, i) => {
        db.prepare("INSERT INTO journal_entry_lines (id, journal_entry_id, account_id, debit, credit, description, sort_order) VALUES (?,?,?,?,?,?,?)").run(uuid(), id, line.account_id, line.debit || 0, line.credit || 0, line.description || null, i);
      });
    });
    tx();
    return NextResponse.json(db.prepare("SELECT * FROM journal_entries WHERE id = ?").get(id), { status: 201 });
  } catch (err) { return NextResponse.json({ error: String(err) }, { status: 500 }); }
}

function genCode(db: ReturnType<typeof getDb>) {
  const last = db.prepare("SELECT entry_code FROM journal_entries WHERE entry_code LIKE 'JE-%' ORDER BY entry_code DESC LIMIT 1").get() as { entry_code: string } | undefined;
  if (!last) return "JE-0001";
  return `JE-${(parseInt(last.entry_code.replace("JE-", "")) + 1).toString().padStart(4, "0")}`;
}
