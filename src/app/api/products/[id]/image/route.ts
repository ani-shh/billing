import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { writeFile, unlink } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    // Validate
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Only JPG, PNG, WEBP allowed" }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 2MB)" }, { status: 400 });
    }

    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const fileName = `${id}.${ext}`;
    const filePath = path.join(process.cwd(), "public", "uploads", "products", fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const imagePath = `/uploads/products/${fileName}`;
    db.prepare("UPDATE products SET image_path = ?, updated_at = datetime('now') WHERE id = ?").run(imagePath, id);

    return NextResponse.json({ image_path: imagePath });
  } catch (err) {
    console.error("Image upload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();

    const product = db.prepare("SELECT image_path FROM products WHERE id = ?").get(id) as { image_path: string } | undefined;
    if (product?.image_path) {
      const filePath = path.join(process.cwd(), "public", product.image_path);
      await unlink(filePath).catch(() => {});
    }

    db.prepare("UPDATE products SET image_path = NULL, updated_at = datetime('now') WHERE id = ?").run(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
