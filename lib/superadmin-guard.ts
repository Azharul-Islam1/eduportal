import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";

export async function requireSuperAdmin(req?: NextRequest) {
  if (req) {
    const user = await getSessionUser(req);
    if (!user || user.role !== "SUPER_ADMIN") {
      return { session: null, user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    return { session: null, user, error: null };
  }

  // fallback for routes that don't pass req
  const { getServerSession } = await import("next-auth");
  const { authOptions } = await import("@/lib/auth");
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return { session: null, user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, user: session.user, error: null };
}
