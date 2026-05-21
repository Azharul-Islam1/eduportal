import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const classId = searchParams.get("classId");
  const studentId = searchParams.get("studentId");
  const date = searchParams.get("date");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const period = searchParams.get("period");

  const conditions: object[] = [];

  if (sessionUser.role === "STUDENT") {
    // Students can only see their own attendance — auto-scope by userId
    conditions.push({ student: { userId: sessionUser.id } });
  } else {
    if (sessionUser.schoolId) {
      conditions.push({ student: { user: { schoolId: sessionUser.schoolId } } });
    }
    if (studentId) conditions.push({ studentId });
    if (classId) conditions.push({ student: { classId } });
  }
  if (date) conditions.push({ date: new Date(date) });
  if (fromDate || toDate) {
    conditions.push({
      date: {
        ...(fromDate && { gte: new Date(fromDate) }),
        ...(toDate && { lte: new Date(toDate) }),
      },
    });
  }
  if (period !== null && period !== undefined) conditions.push({ period: parseInt(period) });

  const records = await db.attendance.findMany({
    where: conditions.length > 0 ? { AND: conditions } : {},
    include: {
      student: {
        include: {
          user: { select: { name: true } },
          class: { select: { name: true, section: true } },
        },
      },
    },
    orderBy: [{ date: "desc" }, { student: { user: { name: "asc" } } }],
    take: 500,
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["TEACHER", "ADMIN", "SCHOOL_ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { records, date, period = 0 } = await req.json();

  if (!records || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: "No attendance records provided" }, { status: 400 });
  }
  if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });

  let teacherId: string | null = null;
  if (sessionUser.role === "TEACHER") {
    const teacher = await db.teacher.findUnique({ where: { userId: sessionUser.id } });
    if (teacher) teacherId = teacher.id;
  }

  const parsedDate = new Date(date);
  const upserts = records.map((r: { studentId: string; status: string; remarks?: string }) =>
    db.attendance.upsert({
      where: { studentId_date_period: { studentId: r.studentId, date: parsedDate, period } },
      create: {
        studentId: r.studentId,
        teacherId: teacherId ?? null,
        date: parsedDate,
        status: r.status as never,
        period,
        markedBy: sessionUser.id,
        remarks: r.remarks ?? null,
      },
      update: {
        status: r.status as never,
        remarks: r.remarks ?? null,
        markedBy: sessionUser.id,
      },
    })
  );

  const results = await Promise.all(upserts);
  return NextResponse.json(results, { status: 201 });
}
