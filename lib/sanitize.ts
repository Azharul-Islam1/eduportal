/**
 * Input sanitization utilities.
 *
 * Prisma parameterizes all queries automatically, so SQL injection is
 * handled at the ORM layer. These utilities address XSS and other
 * injection vectors at the application layer.
 *
 * Security notes:
 * - Never use db.$queryRawUnsafe() with user input.
 * - Use db.$queryRaw`...` with Prisma.sql template tags instead.
 * - All string inputs from users SHOULD go through sanitizeText() before
 *   being stored or reflected back in HTML.
 */

/**
 * Strip HTML tags and control characters from a string.
 * Suitable for names, addresses, and other plain-text fields.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")                     // strip HTML tags
    .replace(/[^\x20-\x7E -￿]/g, "")  // strip non-printable ASCII
    .trim()
    .slice(0, 10_000);                             // hard cap
}

/**
 * Sanitize an object's string values recursively.
 * Useful for sanitizing request bodies.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const [key, val] of Object.entries(result)) {
    if (typeof val === "string") {
      (result as Record<string, unknown>)[key] = sanitizeText(val);
    } else if (val !== null && typeof val === "object" && !Array.isArray(val)) {
      (result as Record<string, unknown>)[key] = sanitizeObject(val as Record<string, unknown>);
    }
  }
  return result;
}

/**
 * Validate and sanitize a date string. Returns null for invalid input.
 */
export function sanitizeDate(input: unknown): Date | null {
  if (!input) return null;
  const d = new Date(String(input));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Validate an email address format.
 */
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Clamp a number within a range.
 */
export function clampNumber(val: unknown, min: number, max: number): number {
  const n = Number(val);
  if (isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

/**
 * CSRF token helpers.
 *
 * For full CSRF protection, use the next-auth CSRF token from the session
 * (next-auth handles this for its own endpoints). For custom mutations,
 * verify that the Origin/Referer header matches the expected host.
 */
export function validateSameOrigin(req: Request, expectedHost: string): boolean {
  const origin = req.headers.get("origin") ?? "";
  const referer = req.headers.get("referer") ?? "";
  const allowed = [`https://${expectedHost}`, `http://${expectedHost}`, `http://localhost:3000`];
  return allowed.some((a) => origin.startsWith(a) || referer.startsWith(a));
}
