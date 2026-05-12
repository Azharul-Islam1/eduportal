import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: "/superadmin",
  SCHOOL_ADMIN: "/admin",
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STAFF: "/admin",
  STUDENT: "/student",
  PARENT: "/parent",
};

// Security headers applied to every matched response
function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  // Permissive CSP for Next.js (inline scripts/styles are required)
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  return res;
}

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: { role?: string } | null } }) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Attach a short request ID for tracing through logs
    const requestId = Math.random().toString(36).slice(2, 10);
    req.headers.set("x-request-id", requestId);

    if (!token) {
      const res = NextResponse.redirect(new URL("/login", req.url));
      res.headers.set("x-request-id", requestId);
      return addSecurityHeaders(res);
    }

    const role = (token.role as string) ?? "";
    const home = ROLE_HOME[role] ?? "/admin";

    // Role-based route guards
    if (pathname.startsWith("/superadmin") && role !== "SUPER_ADMIN") {
      return addSecurityHeaders(NextResponse.redirect(new URL(home, req.url)));
    }
    if (
      pathname.startsWith("/admin") &&
      !["SCHOOL_ADMIN", "ADMIN", "SUPER_ADMIN"].includes(role)
    ) {
      return addSecurityHeaders(NextResponse.redirect(new URL(home, req.url)));
    }
    if (
      pathname.startsWith("/teacher") &&
      !["TEACHER", "SCHOOL_ADMIN", "ADMIN"].includes(role)
    ) {
      return addSecurityHeaders(NextResponse.redirect(new URL(home, req.url)));
    }
    if (
      pathname.startsWith("/student") &&
      !["STUDENT", "SCHOOL_ADMIN", "ADMIN"].includes(role)
    ) {
      return addSecurityHeaders(NextResponse.redirect(new URL(home, req.url)));
    }
    if (
      pathname.startsWith("/parent") &&
      !["PARENT", "SCHOOL_ADMIN", "ADMIN"].includes(role)
    ) {
      return addSecurityHeaders(NextResponse.redirect(new URL(home, req.url)));
    }

    const res = NextResponse.next();
    res.headers.set("x-request-id", requestId);
    return addSecurityHeaders(res);
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/superadmin/:path*",
    "/admin/:path*",
    "/teacher/:path*",
    "/student/:path*",
    "/parent/:path*",
  ],
};
