import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const years = await db.academicYear.findMany({
    where: { schoolId: sessionUser.schoolId! },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(years);
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, startDate, endDate, isCurrent } = await req.json();
  if (!name || !startDate || !endDate) {
    return NextResponse.json({ error: "name, startDate, endDate required" }, { status: 400 });
  }

  if (isCurrent) {
    await db.academicYear.updateMany({
      where: { schoolId: sessionUser.schoolId! },
      data: { isCurrent: false },
    });
  }

  const year = await db.academicYear.create({
    data: {
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      isCurrent: isCurrent ?? false,
      schoolId: sessionUser.schoolId!,
    },
  });
  return NextResponse.json(year, { status: 201 });
}
