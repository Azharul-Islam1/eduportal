import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const cls = await db.class.findUnique({
    where: { id },
    include: {
      classLevel: true,
      _count: { select: { students: true } },
      classSubjects: { include: { subject: true } },
      teacherAssignments: {
        include: {
          teacher: { include: { user: { select: { name: true } } } },
          subject: true,
        },
      },
    },
  });
  if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cls);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const updated = await db.class.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.section !== undefined && { section: body.section }),
      ...(body.capacity !== undefined && { capacity: body.capacity }),
      ...(body.academicYear !== undefined && { academicYear: body.academicYear }),
      ...(body.classLevelId !== undefined && { classLevelId: body.classLevelId || null }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.class.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
