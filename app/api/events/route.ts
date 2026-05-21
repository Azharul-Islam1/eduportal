import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/mobile-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await db.event.findMany({
    where: { isActive: true },
    orderBy: { date: "asc" },
    take: 50,
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN", "STAFF"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, description, date, endDate, venue, organizer } = await req.json();

  const event = await db.event.create({
    data: { title, description, date: new Date(date), endDate: endDate ? new Date(endDate) : null, venue, organizer },
  });

  return NextResponse.json(event, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const sessionUser = await getSessionUser(req);
  if (!sessionUser || !["SCHOOL_ADMIN", "ADMIN", "STAFF"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  await db.event.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ success: true });
}
