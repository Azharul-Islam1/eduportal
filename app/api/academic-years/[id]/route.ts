import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const year = await db.academicYear.findFirst({
    where: { id, schoolId: sessionUser.schoolId! },
  });
  if (!year) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(year);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  if (body.isCurrent === true) {
    await db.academicYear.updateMany({
      where: { schoolId: sessionUser.schoolId!, NOT: { id } },
      data: { isCurrent: false },
    });
  }

  const updated = await db.academicYear.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.startDate !== undefined && { startDate: new Date(body.startDate) }),
      ...(body.endDate !== undefined && { endDate: new Date(body.endDate) }),
      ...(body.isCurrent !== undefined && { isCurrent: body.isCurrent }),
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
  await db.academicYear.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
