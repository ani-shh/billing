import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const warehouses = db.prepare("SELECT * FROM warehouses ORDER BY name").all();
  return NextResponse.json(warehouses);
}
