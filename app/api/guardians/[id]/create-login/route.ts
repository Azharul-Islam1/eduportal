import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

function isSchoolStaff(role: string) {
  return ["SCHOOL_ADMIN", "ADMIN", "STAFF"].includes(role);
}

function generatePassword(guardianName: string): string {
  // e.g. "Parent@1234"
  const base = guardianName.split(" ")[0] ?? "Parent";
  return `${base}@1234`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !isSchoolStaff(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const guardian = await db.guardian.findUnique({
    where: { id },
    include: {
      studentLinks: {
        take: 1,
        include: { student: { select: { id: true } } },
      },
    },
  });

  if (!guardian) return NextResponse.json({ error: "Guardian not found" }, { status: 404 });
  if (!guardian.email) return NextResponse.json({ error: "Guardian has no email address" }, { status: 400 });

  // Check if a user account already exists with this email
  const existing = await db.user.findUnique({ where: { email: guardian.email } });
  if (existing) {
    return NextResponse.json({ error: "A login account already exists for this email", email: guardian.email }, { status: 409 });
  }

  const rawPassword = generatePassword(guardian.name);
  const hashed = await bcrypt.hash(rawPassword, 10);

  await db.user.create({
    data: {
      name: guardian.name,
      email: guardian.email,
      password: hashed,
      role: "PARENT",
      schoolId: guardian.schoolId,
      isActive: true,
    },
  });

  return NextResponse.json({
    message: "Parent login created successfully",
    credentials: { email: guardian.email, password: rawPassword },
  }, { status: 201 });
}
