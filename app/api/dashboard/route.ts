import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [students, teachers, classes, notices, events, pendingFees, issuedBooks] = await Promise.all([
    db.student.count(),
    db.teacher.count(),
    db.class.count(),
    db.notice.count({ where: { isActive: true } }),
    db.event.count({ where: { isActive: true, date: { gte: new Date() } } }),
    db.feePayment.count({ where: { status: "PENDING" } }),
    db.bookIssue.count({ where: { status: "ISSUED" } }),
  ]);

  return NextResponse.json({
    students, teachers, classes, notices, events, issuedBooks,
    totalStudents: students,
    totalTeachers: teachers,
    totalClasses: classes,
    pendingFees,
    presentToday: null,
    absentToday: null,
    totalFeeCollected: null,
  });
}
