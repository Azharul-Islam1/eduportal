import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const payment = await db.payment.findFirst({
    where: {
      id,
      invoice: { schoolId: sessionUser.schoolId! },
    },
    include: {
      invoice: {
        include: {
          student: {
            include: {
              user: { select: { name: true, email: true, phone: true } },
              class: { select: { name: true, section: true } },
            },
          },
          class: { select: { name: true, section: true } },
          payments: { orderBy: { paymentDate: "asc" } },
        },
      },
    },
  });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const school = await db.school.findUnique({
    where: { id: sessionUser.schoolId! },
    select: { name: true, address: true, phone: true, email: true },
  });

  return NextResponse.json({ ...payment, school });
}
