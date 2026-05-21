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

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ message: "Current and new password required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ message: "New password must be at least 6 characters" }, { status: 400 });
    }

    if (sessionUser.role === "SUPER_ADMIN") {
      const superAdmin = await db.superAdmin.findUnique({ where: { id: sessionUser.id } });
      if (!superAdmin) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }
      const match = await bcrypt.compare(currentPassword, superAdmin.passwordHash);
      if (!match) {
        return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await db.superAdmin.update({ where: { id: sessionUser.id }, data: { passwordHash: hashed } });
    } else {
      const user = await db.user.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, password: true },
      });
      if (!user) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      await db.user.update({ where: { id: sessionUser.id }, data: { password: hashed } });
    }

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
