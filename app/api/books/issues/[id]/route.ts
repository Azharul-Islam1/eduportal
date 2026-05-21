import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const issue = await db.bookIssue.findUnique({ where: { id } });
  if (!issue) return NextResponse.json({ error: "Issue record not found" }, { status: 404 });

  const returnDate = new Date();
  const dueDate = new Date(issue.dueDate);
  const overdueDays = Math.max(0, Math.floor((returnDate.getTime() - dueDate.getTime()) / 86400000));
  const fine = overdueDays * 1;

  const [updated] = await Promise.all([
    db.bookIssue.update({
      where: { id },
      data: { returnDate, status: "RETURNED", fine },
      include: { book: true },
    }),
    db.book.update({ where: { id: issue.bookId }, data: { available: { increment: 1 } } }),
  ]);

  return NextResponse.json(updated);
}
