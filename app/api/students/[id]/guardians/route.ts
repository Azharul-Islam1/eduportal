import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

function isSchoolStaff(role: string) {
  return ["SCHOOL_ADMIN", "ADMIN", "STAFF"].includes(role);
}

const schema = z.object({
  name: z.string().min(2),
  relation: z.string().default("GUARDIAN"),
  phone: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  occupation: z.string().optional(),
  isPrimary: z.boolean().default(false),
  createLogin: z.boolean().default(false),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !isSchoolStaff(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: studentId } = await params;

  const student = await db.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, relation, phone, email, occupation, isPrimary, createLogin } = parsed.data;
  const cleanEmail = email?.trim() || undefined;

  // Create the guardian record
  const guardian = await db.guardian.create({
    data: {
      name,
      relation,
      phone,
      email: cleanEmail,
      occupation,
      schoolId: sessionUser.schoolId!,
    },
  });

  // Link to student
  await db.studentGuardian.create({
    data: { studentId, guardianId: guardian.id, isPrimary },
  });

  // Optionally create parent login
  let credentials: { email: string; password: string } | null = null;
  if (createLogin && cleanEmail) {
    const existing = await db.user.findUnique({ where: { email: cleanEmail } });
    if (!existing) {
      const rawPassword = `${name.split(" ")[0]}@1234`;
      const hashed = await bcrypt.hash(rawPassword, 10);
      await db.user.create({
        data: {
          name,
          email: cleanEmail,
          password: hashed,
          role: "PARENT",
          schoolId: sessionUser.schoolId!,
          isActive: true,
        },
      });
      credentials = { email: cleanEmail, password: rawPassword };
    }
  }

  return NextResponse.json({ guardian, credentials }, { status: 201 });
}
