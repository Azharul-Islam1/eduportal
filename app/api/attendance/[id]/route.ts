import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const record = await db.attendance.findUnique({
    where: { id },
    include: {
      student: { include: { user: { select: { name: true } } } },
      audits: { orderBy: { changedAt: "desc" } },
    },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(record);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["ADMIN", "SCHOOL_ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  const { id } = await params;
  const { status, reason } = await req.json();

  if (!status || !reason?.trim()) {
    return NextResponse.json({ error: "status and reason are required" }, { status: 400 });
  }

  const existing = await db.attendance.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [updated] = await db.$transaction([
    db.attendance.update({ where: { id }, data: { status: status as never } }),
    db.attendanceAudit.create({
      data: {
        attendanceId: id,
        oldStatus: existing.status,
        newStatus: status,
        reason: reason.trim(),
        changedBy: sessionUser.id,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
