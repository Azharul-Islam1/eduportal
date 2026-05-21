import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  studentId: z.string(),
  classId: z.string(),
  academicYear: z.string().default("2025-2026"),
  rollNumber: z.string().optional(),
  status: z.string().default("ACTIVE"),
});

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  let studentId = searchParams.get("studentId") ?? undefined;
  const classId = searchParams.get("classId") ?? undefined;
  const academicYear = searchParams.get("academicYear") ?? undefined;

  // Students can only see their own enrollment
  if (sessionUser.role === "STUDENT") {
    const student = await db.student.findUnique({ where: { userId: sessionUser.id }, select: { id: true } });
    studentId = student?.id ?? "none";
  }

  const enrollments = await db.enrollment.findMany({
    where: {
      ...(studentId && { studentId }),
      ...(classId && { classId }),
      ...(academicYear && { academicYear }),
    },
    include: { class: true, student: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(enrollments);
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { studentId, classId, academicYear, rollNumber, status } = parsed.data;

  const enrollment = await db.enrollment.upsert({
    where: { studentId_academicYear: { studentId, academicYear } },
    create: { studentId, classId, academicYear, rollNumber, status },
    update: { classId, rollNumber, status },
    include: { class: true },
  });

  // Update student's current classId for the active year
  if (academicYear === "2025-2026") {
    await db.student.update({ where: { id: studentId }, data: { classId, rollNumber } });
  }

  return NextResponse.json(enrollment, { status: 201 });
}
