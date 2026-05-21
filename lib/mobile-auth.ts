import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production"
);

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string | null;
}

/**
 * Unified session resolver: accepts both NextAuth session cookies (web)
 * and Bearer JWT tokens (mobile app). Returns null if not authenticated.
 */
export async function getSessionUser(req: NextRequest): Promise<SessionUser | null> {
  // 1. Try Bearer token first (mobile)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return {
        id: payload.id as string,
        email: payload.email as string,
        name: payload.name as string,
        role: payload.role as string,
        schoolId: (payload.schoolId as string | null) ?? null,
      };
    } catch {
      return null;
    }
  }

  // 2. Fall back to NextAuth session (web)
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    id: session.user.id as string,
    email: session.user.email as string,
    name: session.user.name as string,
    role: session.user.role as string,
    schoolId: (session.user as any).schoolId ?? null,
  };
}
