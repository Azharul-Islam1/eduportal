import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/mobile-auth";

export async function POST(req: NextRequest) {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(sessionUser.role)) {
      return NextResponse.json({ message: "Forbidden: admin access required" }, { status: 403 });
    }

    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      return NextResponse.json({ message: "userId and newPassword required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: "Password must be at least 6 characters" }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, schoolId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ADMIN can only reset passwords within their own school
    if (sessionUser.role === "ADMIN" && user.schoolId !== sessionUser.schoolId) {
      return NextResponse.json({ message: "Forbidden: user belongs to a different school" }, { status: 403 });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.user.update({ where: { id: userId }, data: { password: hashed } });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Admin reset password error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
