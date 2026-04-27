import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { permissions } = await request.json();
  const db = getDb();

  const transaction = db.transaction(() => {
    db.prepare("DELETE FROM group_permissions WHERE group_id = ?").run(id);
    for (const perm of permissions) {
      db.prepare("INSERT INTO group_permissions (id, group_id, module, can_view, can_create, can_edit, can_delete) VALUES (?, ?, ?, ?, ?, ?, ?)").run(uuid(), id, perm.module, perm.can_view ? 1 : 0, perm.can_create ? 1 : 0, perm.can_edit ? 1 : 0, perm.can_delete ? 1 : 0);
    }
  });
  transaction();

  return NextResponse.json({ success: true });
}
