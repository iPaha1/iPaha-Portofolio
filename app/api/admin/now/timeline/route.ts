// =============================================================================
// isaacpaha.com — Timeline Events API
// app/api/admin/now/timeline/route.ts
// GET  → all events (ordered year desc)
// POST → create new event
// =============================================================================

import { NextRequest, NextResponse }  from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import { prismadb }                   from "@/lib/db";
import {
  getTimelineEvents,
  createTimelineEvent,
} from "@/lib/actions/now-actions";
import type { TimelineType } from "@/lib/generated/prisma/enums";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const events = await getTimelineEvents();
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (!body.title?.trim() || !body.description?.trim() || !body.year || !body.type) {
    return NextResponse.json(
      { error: "title, description, year, and type are required" },
      { status: 400 }
    );
  }

  const event = await createTimelineEvent({
    year:        Number(body.year),
    month:       body.month ? Number(body.month) : undefined,
    title:       body.title.trim(),
    description: body.description.trim(),
    type:        body.type as TimelineType,
    icon:        body.icon        || undefined,
    imageUrl:    body.imageUrl    || undefined,
    link:        body.link        || undefined,
    isHighlight: body.isHighlight ?? false,
    sortOrder:   body.sortOrder   ?? 0,
  });

  return NextResponse.json({ ok: true, event }, { status: 201 });
}