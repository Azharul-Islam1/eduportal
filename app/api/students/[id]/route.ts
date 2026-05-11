import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const student = await db.student.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true, address: true, isActive: true } },
      class: true,
      parent: { include: { user: { select: { name: true, email: true, phone: true } } } },
      attendance: { orderBy: { date: "desc" }, take: 30 },
      results: { include: { exam: { include: { subject: true } } }, orderBy: { createdAt: "desc" } },
      feePayments: { include: { feeStructure: true }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(student);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, phone, address, classId, rollNumber, gender } = body;

  const student = await db.student.findUnique({ where: { id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.user.update({ where: { id: student.userId }, data: { name, phone, address } });
  const updated = await db.student.update({
    where: { id },
    data: { classId, rollNumber, gender },
    include: { user: { select: { name: true, email: true } }, class: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const student = await db.student.findUnique({ where: { id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.user.update({ where: { id: student.userId }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
