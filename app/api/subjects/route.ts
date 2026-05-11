import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subjects = await db.subject.findMany({
    include: { teacher: { include: { user: { select: { name: true } } } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(subjects);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, code, teacherId } = await req.json();

  const subject = await db.subject.create({ data: { name, code, teacherId } });
  return NextResponse.json(subject, { status: 201 });
}
