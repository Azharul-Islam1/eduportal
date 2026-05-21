import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const classLevelId = req.nextUrl.searchParams.get("classLevelId");

  const classes = await db.class.findMany({
    where: { ...(classLevelId && { classLevelId }) },
    include: {
      _count: { select: { students: true } },
      classLevel: true,
    },
    orderBy: [{ name: "asc" }, { section: "asc" }],
  });
  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, section, capacity, academicYear, classLevelId } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const cls = await db.class.create({
    data: {
      name,
      section: section ?? "A",
      capacity: capacity ?? 40,
      academicYear: academicYear ?? "2025-2026",
      ...(classLevelId && { classLevelId }),
    },
  });
  return NextResponse.json(cls, { status: 201 });
}
