import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const updated = await db.feeStructure.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name || null }),
      ...(body.classId !== undefined && { classId: body.classId || null }),
      ...(body.feeType !== undefined && { feeType: body.feeType }),
      ...(body.amount !== undefined && { amount: parseFloat(body.amount) }),
      ...(body.academicYear !== undefined && { academicYear: body.academicYear }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.frequency !== undefined && { frequency: body.frequency }),
    },
    include: { class: { select: { name: true, section: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.feeStructure.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
