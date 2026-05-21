import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { db } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production"
);

async function signToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password required" }, { status: 400 });
    }

    // Check SuperAdmin
    const superAdmin = await db.superAdmin.findUnique({ where: { email } });
    if (superAdmin) {
      const match = await bcrypt.compare(password, superAdmin.passwordHash);
      if (!match) {
        return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
      }
      const token = await signToken({
        id: superAdmin.id,
        email: superAdmin.email,
        name: superAdmin.name,
        role: "SUPER_ADMIN",
        schoolId: null,
      });
      return NextResponse.json({
        token,
        user: { id: superAdmin.id, email: superAdmin.email, name: superAdmin.name, role: "SUPER_ADMIN", schoolId: null },
      });
    }

    // Check school-level user
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, password: true, role: true, isActive: true, schoolId: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const token = await signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
    });

    // Include role-specific record IDs for mobile client
    let extra: Record<string, string | null> = {};
    if (user.role === "STUDENT") {
      const student = await db.student.findUnique({ where: { userId: user.id }, select: { id: true, classId: true, studentId: true } });
      extra = { studentId: student?.id ?? null, classId: student?.classId ?? null, studentNo: student?.studentId ?? null };
    } else if (user.role === "TEACHER") {
      const teacher = await db.teacher.findUnique({ where: { userId: user.id }, select: { id: true } });
      extra = { teacherId: teacher?.id ?? null };
    } else if (user.role === "PARENT") {
      // Find linked child via guardian record whose email matches the parent's login email
      const guardian = await db.guardian.findFirst({
        where: { email: user.email, schoolId: user.schoolId ?? undefined },
        include: {
          studentLinks: {
            orderBy: { isPrimary: "desc" },
            take: 1,
            include: { student: { select: { id: true, classId: true } } },
          },
        },
      });
      const child = guardian?.studentLinks?.[0]?.student;
      extra = { studentId: child?.id ?? null, classId: child?.classId ?? null };
    }

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, schoolId: user.schoolId, ...extra },
    });
  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
