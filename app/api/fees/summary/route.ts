import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const academicYear = req.nextUrl.searchParams.get("academicYear") ?? undefined;
  const schoolId = sessionUser.schoolId!;

  const [invoices, payments] = await Promise.all([
    db.invoice.groupBy({
      by: ["status"],
      where: { schoolId, ...(academicYear && { academicYear }) },
      _sum: { totalAmount: true, paidAmount: true },
      _count: { id: true },
    }),
    db.payment.aggregate({
      where: { invoice: { schoolId, ...(academicYear && { academicYear }) } },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const totalInvoiced = invoices.reduce((s, r) => s + (r._sum.totalAmount ?? 0), 0);
  const totalPaid = invoices.reduce((s, r) => s + (r._sum.paidAmount ?? 0), 0);
  const totalOutstanding = totalInvoiced - totalPaid;
  const overdueCount = invoices.find((r) => r.status === "OVERDUE")?._count.id ?? 0;
  const overdueAmount = invoices.find((r) => r.status === "OVERDUE")?._sum.totalAmount ?? 0;

  return NextResponse.json({
    totalInvoiced,
    totalCollected: payments._sum.amount ?? 0,
    totalOutstanding,
    overdueCount,
    overdueAmount,
    totalPayments: payments._count.id,
    byStatus: invoices.map((r) => ({ status: r.status, count: r._count.id, total: r._sum.totalAmount ?? 0 })),
  });
}
