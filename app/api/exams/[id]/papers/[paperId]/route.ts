import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paperId: string }> }
) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["ADMIN", "SCHOOL_ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { paperId } = await params;
  const { maxMarks, passingMarks } = await req.json();

  const paper = await db.examPaper.update({
    where: { id: paperId },
    data: {
      ...(maxMarks !== undefined && { maxMarks }),
      ...(passingMarks !== undefined && { passingMarks }),
    },
  });
  return NextResponse.json(paper);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; paperId: string }> }
) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["ADMIN", "SCHOOL_ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { paperId } = await params;
  await db.examPaper.delete({ where: { id: paperId } });
  return NextResponse.json({ ok: true });
}
