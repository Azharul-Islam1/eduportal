import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const classes = await db.class.findMany({
    include: { _count: { select: { students: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, section, capacity, academicYear } = await req.json();

  const cls = await db.class.create({
    data: { name, section: section ?? "A", capacity: capacity ?? 40, academicYear: academicYear ?? "2025-2026" },
  });

  return NextResponse.json(cls, { status: 201 });
}
