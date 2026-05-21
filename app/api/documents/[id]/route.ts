import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete physical file
  try {
    const filePath = path.join(process.cwd(), "public", doc.url);
    await fs.unlink(filePath);
  } catch {
    // File may not exist; continue
  }

  await db.document.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
