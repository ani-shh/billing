import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search") || "";
  const db = getDb();
  let customers;
  if (search) {
    customers = db
      .prepare("SELECT * FROM customers WHERE name LIKE ? OR email LIKE ? ORDER BY name")
      .all(`%${search}%`, `%${search}%`);
  } else {
    customers = db.prepare("SELECT * FROM customers ORDER BY name").all();
  }
  return NextResponse.json(customers);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const db = getDb();
  const id = uuid();
  db.prepare(
    "INSERT INTO customers (id, name, email, phone, address, pan_no) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, body.name, body.email || null, body.phone || null, body.address || null, body.pan_no || null);
  const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
  return NextResponse.json(customer, { status: 201 });
}
