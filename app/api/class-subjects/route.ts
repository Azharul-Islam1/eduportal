import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const classId = req.nextUrl.searchParams.get("classId");
  if (!classId) return NextResponse.json({ error: "classId required" }, { status: 400 });

  const mappings = await db.classSubject.findMany({
    where: { classId },
    include: { subject: true },
  });
  return NextResponse.json(mappings);
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { classId, subjectIds } = await req.json();
  if (!classId || !Array.isArray(subjectIds)) {
    return NextResponse.json({ error: "classId and subjectIds[] required" }, { status: 400 });
  }

  await db.classSubject.deleteMany({ where: { classId } });

  if (subjectIds.length > 0) {
    await db.classSubject.createMany({
      data: subjectIds.map((subjectId: string) => ({ classId, subjectId })),
    });
  }

  const mappings = await db.classSubject.findMany({
    where: { classId },
    include: { subject: true },
  });
  return NextResponse.json(mappings);
}
