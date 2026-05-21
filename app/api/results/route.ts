import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";
import { getGrade } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const examId = searchParams.get("examId");
  const studentId = searchParams.get("studentId");

  // Students can only see their own results
  let effectiveStudentId = studentId;
  if (sessionUser.role === "STUDENT") {
    const student = await db.student.findUnique({ where: { userId: sessionUser.id }, select: { id: true } });
    effectiveStudentId = student?.id ?? "none";
  }

  const results = await db.examResult.findMany({
    where: {
      ...(examId ? { examId } : {}),
      ...(effectiveStudentId ? { studentId: effectiveStudentId } : {}),
    },
    include: {
      exam: { include: { subject: true, class: true } },
      student: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(results);
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["TEACHER", "SCHOOL_ADMIN", "ADMIN", "STAFF"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { results } = await req.json();
  // results: [{ examId, studentId, marksObtained, remarks? }]

  const upserts = results.map(async (r: { examId: string; studentId: string; marksObtained: number; remarks?: string }) => {
    const exam = await db.exam.findUnique({ where: { id: r.examId } });
    const grade = exam ? getGrade(r.marksObtained, exam.totalMarks) : undefined;

    return db.examResult.upsert({
      where: { examId_studentId: { examId: r.examId, studentId: r.studentId } },
      create: { examId: r.examId, studentId: r.studentId, marksObtained: r.marksObtained, grade, remarks: r.remarks },
      update: { marksObtained: r.marksObtained, grade, remarks: r.remarks },
    });
  });

  const saved = await Promise.all(upserts);
  return NextResponse.json(saved, { status: 201 });
}
