// =============================================================================
// isaacpaha.com — Birthday Planner — Single Guest API
// app/api/tools/birthday-planner/guests/[guestId]/route.ts
// FIXED: Next.js 15 async params
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

export async function PATCH(
  req:     NextRequest,
  context: { params: Promise<{ guestId: string }> }
) {
  const { guestId }  = await context.params;
  const action  = new URL(req.url).searchParams.get("action") ?? "update";
  const body    = await req.json();

  if (!guestId) return NextResponse.json({ error: "Guest id required" }, { status: 400 });

  if (action === "checkin") {
    const guest = await prismadb.guest.findUnique({
      where:   { id: guestId },
      include: { party: { select: { inviteToken: true } } },
    });
    if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    if (body.inviteToken && guest.party.inviteToken !== body.inviteToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }
    const updated = await prismadb.guest.update({
      where: { id: guestId },
      data:  { status: "CHECKED_IN", checkedInAt: new Date(), arrivalNote: body.arrivalNote ?? null },
    });
    return NextResponse.json({ ok: true, guest: updated });
  }

  if (action === "checkout") {
    const guest = await prismadb.guest.findUnique({
      where:   { id: guestId },
      include: { party: { select: { inviteToken: true } } },
    });
    if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    if (body.inviteToken && guest.party.inviteToken !== body.inviteToken) {
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }
    const updated = await prismadb.guest.update({
      where: { id: guestId },
      data:  { status: "CHECKED_OUT", checkedOutAt: new Date() },
    });
    return NextResponse.json({ ok: true, guest: updated });
  }

  // Organiser-only
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const guest = await prismadb.guest.findUnique({
    where:   { id: guestId },
    include: { party: { select: { userId: true } } },
  });
  if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user || guest.party.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "update") {
    const updated = await prismadb.guest.update({
      where: { id: guestId },
      data:  {
        childName:         body.childName         ?? undefined,
        parentName:        body.parentName        ?? undefined,
        parentEmail:       body.parentEmail       ?? undefined,
        parentPhone:       body.parentPhone       ?? undefined,
        allergies:         body.allergies         ?? undefined,
        rsvpNote:          body.rsvpNote          ?? undefined,
        arrivalNote:       body.arrivalNote       ?? undefined,
        status:            body.status            ?? undefined,
        photoConsent:      body.photoConsent      ?? undefined,
        photoShareConsent: body.photoShareConsent ?? undefined,
      },
    });
    return NextResponse.json({ ok: true, guest: updated });
  }

  if (action === "decline") {
    const updated = await prismadb.guest.update({ where: { id: guestId }, data: { status: "DECLINED" } });
    return NextResponse.json({ ok: true, guest: updated });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(
  _req:    NextRequest,
  context: { params: Promise<{ guestId: string }> }
) {
  const { guestId }     = await context.params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const guest = await prismadb.guest.findUnique({
    where:   { id: guestId },
    include: { party: { select: { userId: true } } },
  });
  if (!guest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user || guest.party.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prismadb.guest.delete({ where: { id: guestId } });
  return NextResponse.json({ ok: true });
}