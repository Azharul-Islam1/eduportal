import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId") ?? undefined;

  const exams = await db.exam.findMany({
    where: classId ? { classId } : {},
    include: { class: true, subject: true, teacher: { include: { user: { select: { name: true } } } }, _count: { select: { results: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(exams);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, type, classId, subjectId, teacherId, date, totalMarks, passingMarks } = body;

  let resolvedTeacherId = teacherId;
  if (!resolvedTeacherId && session.user.role === "TEACHER") {
    const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
    resolvedTeacherId = teacher?.id;
  }

  const exam = await db.exam.create({
    data: { name, type, classId, subjectId, teacherId: resolvedTeacherId, date: new Date(date), totalMarks, passingMarks },
    include: { class: true, subject: true },
  });

  return NextResponse.json(exam, { status: 201 });
}
