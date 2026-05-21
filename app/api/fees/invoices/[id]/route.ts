import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const invoice = await db.invoice.findFirst({
    where: { id, schoolId: sessionUser.schoolId! },
    include: {
      student: {
        include: {
          user: { select: { name: true, email: true, phone: true } },
          class: { select: { name: true, section: true } },
        },
      },
      class: { select: { name: true, section: true } },
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(invoice);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const updated = await db.invoice.update({
    where: { id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.dueDate !== undefined && { dueDate: new Date(body.dueDate) }),
    },
  });
  return NextResponse.json(updated);
}
