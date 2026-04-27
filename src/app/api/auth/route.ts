import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function POST(request: NextRequest) {
  const { username, password } = await request.json();
  const db = getDb();

  const user = db.prepare(`
    SELECT u.*, g.name as group_name FROM users u
    LEFT JOIN user_groups g ON u.group_id = g.id
    WHERE u.username = ? AND u.active = 1
  `).get(username) as { id: string; password: string; username: string; full_name: string; is_admin: number; group_id: string; group_name: string } | undefined;

  if (!user || user.password !== password) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Get permissions
  const permissions = db.prepare(`
    SELECT module, can_view, can_create, can_edit, can_delete
    FROM group_permissions WHERE group_id = ?
  `).all(user.group_id) as { module: string; can_view: number; can_create: number; can_edit: number; can_delete: number }[];

  // Log the login
  db.prepare("INSERT INTO audit_log (id, user_id, username, action, module, details) VALUES (?, ?, ?, ?, ?, ?)").run(uuid(), user.id, user.username, "login", "auth", "User logged in");

  return NextResponse.json({
    id: user.id,
    username: user.username,
    full_name: user.full_name,
    is_admin: user.is_admin,
    group_name: user.group_name,
    permissions: Object.fromEntries(permissions.map((p) => [p.module, { view: !!p.can_view, create: !!p.can_create, edit: !!p.can_edit, delete: !!p.can_delete }])),
  });
}
