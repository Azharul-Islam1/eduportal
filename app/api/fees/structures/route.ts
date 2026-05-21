import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const academicYear = searchParams.get("academicYear") ?? undefined;
  const classId = searchParams.get("classId") ?? undefined;

  const structures = await db.feeStructure.findMany({
    where: {
      schoolId: sessionUser.schoolId!,
      ...(academicYear && { academicYear }),
      ...(classId && { classId }),
    },
    include: {
      class: { select: { name: true, section: true } },
      _count: { select: { payments: true } },
    },
    orderBy: [{ academicYear: "desc" }, { feeType: "asc" }],
  });
  return NextResponse.json(structures);
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, classId, feeType, amount, academicYear, dueDate, description, frequency } = await req.json();
  if (!amount || !feeType) return NextResponse.json({ error: "feeType and amount required" }, { status: 400 });

  const structure = await db.feeStructure.create({
    data: {
      name: name || null,
      schoolId: sessionUser.schoolId!,
      classId: classId || null,
      feeType,
      amount: parseFloat(amount),
      academicYear: academicYear ?? "2025-2026",
      dueDate: dueDate ? new Date(dueDate) : null,
      description: description || null,
      frequency: frequency ?? "ANNUAL",
    },
  });
  return NextResponse.json(structure, { status: 201 });
}
