import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") ?? undefined;

  const notices = await db.notice.findMany({
    where: {
      isActive: true,
      OR: [{ targetRole: null }, { targetRole: role?.toUpperCase() }],
    },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notices);
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN", "STAFF"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, content, targetRole, expiryDate } = await req.json();

  const notice = await db.notice.create({
    data: {
      title, content,
      targetRole: targetRole || null,
      publishedBy: sessionUser.id,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    },
  });

  return NextResponse.json(notice, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN", "STAFF"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  await db.notice.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
