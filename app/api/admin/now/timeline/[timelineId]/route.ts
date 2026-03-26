// =============================================================================
// isaacpaha.com — Single Timeline Event API
// app/api/admin/now/timeline/[timelineId]/route.ts
// PATCH  → update event fields
// DELETE → delete event
// =============================================================================

import { NextRequest, NextResponse }  from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import { prismadb }                   from "@/lib/db";
import {
  updateTimelineEvent,
  deleteTimelineEvent,
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ timelineId: string }> }
) {

    const { timelineId } = await params;

  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const updated = await updateTimelineEvent(timelineId, {
    year:        body.year        !== undefined ? Number(body.year) : undefined,
    month:       body.month       !== undefined ? (body.month ? Number(body.month) : null) : undefined,
    title:       body.title?.trim(),
    description: body.description?.trim(),
    type:        body.type        as TimelineType | undefined,
    icon:        body.icon,
    imageUrl:    body.imageUrl,
    link:        body.link,
    isHighlight: body.isHighlight,
    sortOrder:   body.sortOrder   !== undefined ? Number(body.sortOrder) : undefined,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ timelineId: string }> }
) {

    const { timelineId } = await params;

  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteTimelineEvent(timelineId);
  return NextResponse.json({ ok: true });
}