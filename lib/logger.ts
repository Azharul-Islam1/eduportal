/**
 * Structured JSON logger — writes to stdout (Docker/cloud compatible).
 * Errors are also fire-and-forget stored to the AppLog DB table for the
 * /superadmin/logs UI. Compatible with pino's API shape.
 */

import { db } from "@/lib/db";

type Level = "debug" | "info" | "warn" | "error";

export interface LogMeta {
  path?: string;
  method?: string;
  status?: number;
  duration?: number;
  userId?: string;
  schoolId?: string;
  requestId?: string;
  stack?: string;
  [key: string]: unknown;
}

function write(level: Level, msg: string, meta: LogMeta = {}) {
  const entry = { level, time: Date.now(), msg, ...meta };
  if (level === "error" || level === "warn") {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }

  // Persist errors and warnings to DB (fire-and-forget)
  if (level === "error" || level === "warn") {
    db.appLog
      .create({
        data: {
          level,
          message: msg,
          path: meta.path ?? null,
          method: meta.method ?? null,
          status: typeof meta.status === "number" ? meta.status : null,
          duration: typeof meta.duration === "number" ? meta.duration : null,
          userId: meta.userId ?? null,
          schoolId: meta.schoolId ?? null,
          requestId: meta.requestId ?? null,
          stack: meta.stack ?? null,
          meta: Object.keys(meta).length > 0 ? (meta as object) : undefined,
        },
      })
      .catch(() => {});
  }
}

const logger = {
  debug: (msg: string, meta?: LogMeta) => write("debug", msg, meta),
  info: (msg: string, meta?: LogMeta) => write("info", msg, meta),
  warn: (msg: string, meta?: LogMeta) => write("warn", msg, meta),
  error: (msg: string, meta?: LogMeta) => write("error", msg, meta),
};

export default logger;

/**
 * Wrap a Next.js route handler to log request + response automatically.
 *
 * Usage:
 *   export const GET = withApiLogging(async (req) => { ... });
 */
export function withApiLogging<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async function (...args: T): Promise<Response> {
    const req = args[0] as Request;
    const start = Date.now();
    const requestId = crypto.randomUUID().slice(0, 8);
    const method = req.method ?? "GET";
    const path = new URL(req.url).pathname;

    try {
      const res = await handler(...args);
      const duration = Date.now() - start;
      logger.info("api_request", { method, path, status: res.status, duration, requestId });
      return res;
    } catch (err) {
      const duration = Date.now() - start;
      const message = err instanceof Error ? err.message : "Unhandled error";
      const stack = err instanceof Error ? err.stack : undefined;
      logger.error(message, { method, path, duration, requestId, stack, status: 500 });
      const { NextResponse } = await import("next/server");
      return NextResponse.json({ error: "Internal server error", requestId }, { status: 500 });
    }
  };
}
