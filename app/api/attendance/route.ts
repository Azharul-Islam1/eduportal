import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const date = searchParams.get("date");
  const studentId = searchParams.get("studentId");

  const where: Record<string, unknown> = {};
  if (studentId) where.studentId = studentId;
  if (date) where.date = new Date(date);
  if (classId) where.student = { classId };

  const records = await db.attendance.findMany({
    where,
    include: { student: { include: { user: { select: { name: true } } } } },
    orderBy: { date: "desc" },
    take: 200,
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { records, date, classId } = await req.json();
  // records: [{ studentId, status, remarks? }]

  if (!records || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: "No attendance records provided" }, { status: 400 });
  }

  if (!date) {
    return NextResponse.json({ error: "Date is required" }, { status: 400 });
  }

  let teacherId: string | undefined;

  if (session.user.role === "TEACHER") {
    const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher) {
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 400 });
    }
    teacherId = teacher.id;

    // Optional: Validate that teacher teaches the selected class
    if (classId) {
      const isAssigned = await db.timetable.findFirst({
        where: { classId, teacherId },
      });
      if (!isAssigned) {
        return NextResponse.json({ error: "You are not assigned to this class" }, { status: 403 });
      }
    }
  } else {
    // Admin must provide explicit teacherId or it will be fetched from first record (not recommended)
    teacherId = records[0]?.teacherId;
    if (!teacherId) {
      return NextResponse.json({ error: "Teacher ID is required for admin" }, { status: 400 });
    }
  }

  if (!teacherId) {
    return NextResponse.json({ error: "Unable to determine teacher ID" }, { status: 400 });
  }

  try {
    const upserts = records.map((r: { studentId: string; status: string; remarks?: string }) =>
      db.attendance.upsert({
        where: { studentId_date: { studentId: r.studentId, date: new Date(date) } },
        create: { studentId: r.studentId, teacherId, date: new Date(date), status: r.status as never, remarks: r.remarks },
        update: { status: r.status as never, remarks: r.remarks },
      })
    );

    const results = await Promise.all(upserts);
    return NextResponse.json(results, { status: 201 });
  } catch (error) {
    console.error("Attendance POST error:", error);
    return NextResponse.json({ error: "Failed to save attendance records" }, { status: 500 });
  }
}

