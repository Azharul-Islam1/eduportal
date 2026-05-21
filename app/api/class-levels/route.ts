import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const levels = await db.classLevel.findMany({
    where: { schoolId: sessionUser.schoolId! },
    include: { _count: { select: { sections: true } } },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(levels);
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, order, description } = await req.json();
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const level = await db.classLevel.create({
    data: {
      name,
      order: order ?? 0,
      description: description ?? null,
      schoolId: sessionUser.schoolId!,
    },
  });
  return NextResponse.json(level, { status: 201 });
}
