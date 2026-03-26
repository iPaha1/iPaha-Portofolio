// =============================================================================
// isaacpaha.com — Single Hub Entry API
// app/api/admin/hub/[hubId]/route.ts
// GET    → full entry
// PATCH  → update  |  _action: toggleFavourite | togglePin | duplicate | incrementCopy
// DELETE → delete
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import {
  getHubEntryById, updateHubEntry, deleteHubEntry,
  toggleFavourite, togglePin, duplicateHubEntry, incrementCopyCount,
} from "@/lib/actions/hub-actions";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ hubId: string }> }
) {

    const { hubId } = await params;

  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entry = await getHubEntryById(hubId);
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(entry);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ hubId: string }> }
) {

    const { hubId } = await params;

  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body._action === "toggleFavourite") return NextResponse.json(await toggleFavourite(hubId));
  if (body._action === "togglePin")       return NextResponse.json(await togglePin(hubId));
  if (body._action === "duplicate")       return NextResponse.json(await duplicateHubEntry(hubId));
  if (body._action === "incrementCopy")   { await incrementCopyCount(hubId); return NextResponse.json({ ok: true }); }

  const updated = await updateHubEntry(hubId, body);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ hubId: string }> }
) {

    const { hubId } = await params;
    
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteHubEntry(hubId);
  return NextResponse.json({ ok: true });
}


