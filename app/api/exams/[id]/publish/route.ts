import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["ADMIN", "SCHOOL_ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const exam = await db.exam.findUnique({ where: { id }, select: { status: true } });
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isPublished = exam.status === "PUBLISHED";
  const updated = await db.exam.update({
    where: { id },
    data: {
      status: isPublished ? "ACTIVE" : "PUBLISHED",
      publishedAt: isPublished ? null : new Date(),
      isPublished: !isPublished,
    },
  });

  return NextResponse.json(updated);
}
