import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  phone: z.string().optional(),
  classId: z.string(),
  rollNumber: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const search = searchParams.get("search") ?? "";
  const classId = searchParams.get("classId") ?? undefined;

  const where = {
    ...(classId ? { classId } : {}),
    ...(search ? { user: { name: { contains: search } } } : {}),
  };

  const [students, total] = await Promise.all([
    db.student.findMany({
      where,
      include: { user: { select: { name: true, email: true, phone: true, isActive: true } }, class: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    db.student.count({ where }),
  ]);

  return NextResponse.json({ students, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { name, email, password, phone, classId, rollNumber, gender, dateOfBirth } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const count = await db.student.count();
  const studentId = `STU${String(count + 1).padStart(4, "0")}`;
  const hashed = await bcrypt.hash(password?.trim() || "password123", 10);

  const user = await db.user.create({
    data: {
      name, email, password: hashed, role: "STUDENT", phone,
      student: {
        create: {
          studentId, classId, rollNumber, gender,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        },
      },
    },
    include: { student: true },
  });

  return NextResponse.json(user, { status: 201 });
}
