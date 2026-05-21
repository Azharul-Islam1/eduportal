import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { classId } = await params;
  const entries = await db.timetable.findMany({
    where: { classId },
    include: {
      subject: true,
      teacher: { include: { user: { select: { name: true } } } },
    },
    orderBy: [{ day: "asc" }, { period: "asc" }],
  });
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { classId } = await params;
  const { subjectId, teacherId, day, period, startTime, endTime } = await req.json();

  if (!subjectId || !teacherId || !day || !period) {
    return NextResponse.json({ error: "subjectId, teacherId, day, period required" }, { status: 400 });
  }

  const entry = await db.timetable.upsert({
    where: { classId_day_period: { classId, day, period } },
    update: { subjectId, teacherId, startTime, endTime },
    create: { classId, subjectId, teacherId, day, period, startTime, endTime },
    include: {
      subject: true,
      teacher: { include: { user: { select: { name: true } } } },
    },
  });
  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ classId: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { classId } = await params;
  const { searchParams } = req.nextUrl;
  const day = searchParams.get("day");
  const period = searchParams.get("period");

  if (!day || !period) return NextResponse.json({ error: "day and period required" }, { status: 400 });

  await db.timetable.deleteMany({ where: { classId, day, period: parseInt(period) } });
  return NextResponse.json({ success: true });
}
