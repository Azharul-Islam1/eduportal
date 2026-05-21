import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  let studentId = searchParams.get("studentId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  // Students can only see their own issued books
  if (sessionUser.role === "STUDENT") {
    const student = await db.student.findUnique({ where: { userId: sessionUser.id }, select: { id: true } });
    studentId = student?.id ?? "none";
  }

  const issues = await db.bookIssue.findMany({
    where: {
      ...(studentId && { studentId }),
      ...(status && { status: status as never }),
    },
    include: {
      book: { include: { category: true } },
      student: { include: { user: { select: { name: true } } } },
    },
    orderBy: { issueDate: "desc" },
    take: 100,
  });

  return NextResponse.json(issues);
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN", "STAFF"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { bookId, studentId, dueDate } = await req.json();
  if (!bookId || !studentId || !dueDate) {
    return NextResponse.json({ error: "bookId, studentId, dueDate required" }, { status: 400 });
  }

  const book = await db.book.findUnique({ where: { id: bookId } });
  if (!book || book.available < 1) {
    return NextResponse.json({ error: "Book not available" }, { status: 400 });
  }

  const [issue] = await Promise.all([
    db.bookIssue.create({
      data: { bookId, studentId, dueDate: new Date(dueDate), status: "ISSUED" },
      include: { book: true },
    }),
    db.book.update({ where: { id: bookId }, data: { available: { decrement: 1 } } }),
  ]);

  return NextResponse.json(issue, { status: 201 });
}
