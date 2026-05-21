import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const academicYear = searchParams.get("academicYear") ?? undefined;

  const exams = await db.exam.findMany({
    where: {
      AND: [
        { school: { users: { some: { id: sessionUser.id } } } },
        ...(academicYear ? [{ academicYear }] : []),
      ],
    },
    include: {
      papers: {
        include: {
          subject: { select: { name: true } },
          class: { select: { name: true, section: true } },
          _count: { select: { marks: true } },
        },
      },
      _count: { select: { papers: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(exams);
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["ADMIN", "SCHOOL_ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const school = await db.school.findFirst({
    where: { users: { some: { id: sessionUser.id } } },
  });
  if (!school) return NextResponse.json({ error: "School not found" }, { status: 400 });

  const { name, academicYear, startDate, endDate, weightage } = await req.json();
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const exam = await db.exam.create({
    data: {
      name,
      academicYear: academicYear ?? "2025-2026",
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      weightage: weightage ?? 100,
      schoolId: school.id,
    },
  });

  return NextResponse.json(exam, { status: 201 });
}
