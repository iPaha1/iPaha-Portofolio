// =============================================================================
// isaacpaha.com — Single Now Entry API
// app/api/admin/now/[nowId]/route.ts
// GET    → fetch single entry
// PATCH  → update fields (title, content, isPublished, month, year)
// DELETE → delete entry
// =============================================================================

import { NextRequest, NextResponse }  from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import { prismadb }                   from "@/lib/db";
import {
  getNowEntry,
  updateNowEntry,
  deleteNowEntry,
} from "@/lib/actions/now-actions";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ nowId: string }> }
) {

    const { nowId } = await params;

  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entry = await getNowEntry(nowId);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(entry);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ nowId: string }> }
) {

    const { nowId } = await params;

  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body    = await req.json();
  const updated = await updateNowEntry(nowId, {
    title:       body.title?.trim(),
    content:     body.content?.trim(),
    isPublished: body.isPublished,
    month:       body.month !== undefined ? Number(body.month) : undefined,
    year:        body.year  !== undefined ? Number(body.year)  : undefined,
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ nowId: string }> }
) {

    const { nowId } = await params;

  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteNowEntry(nowId);
  return NextResponse.json({ ok: true });
}