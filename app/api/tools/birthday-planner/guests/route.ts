// =============================================================================
// isaacpaha.com — Birthday Planner — Guests API
// app/api/tools/birthday-planner/guests/route.ts
//
// GET  ?partyId=xxx  → get all guests for a party
// POST              → add guest manually (organiser) OR public RSVP (no auth)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const partyId = new URL(req.url).searchParams.get("partyId");
  if (!partyId) return NextResponse.json({ error: "partyId required" }, { status: 400 });

  // Verify ownership OR that the party is public (invite token context)
  const { userId } = await auth();

  if (userId) {
    const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    const party = await prismadb.party.findFirst({ where: { id: partyId, userId: user.id } });
    if (!party) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const guests = await prismadb.guest.findMany({
    where:   { partyId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ guests });
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    partyId, inviteToken,           // one of these required
    childName, parentName, parentEmail, parentPhone,
    allergies, rsvpNote, status = "ACCEPTED",
    photoConsent = false, photoShareConsent = false,
  } = body;

  if (!childName?.trim()) return NextResponse.json({ error: "childName required" }, { status: 400 });

  // Resolve party — either by partyId (authenticated organiser) or inviteToken (public RSVP)
  let party: any;
  if (partyId) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
    party = user ? await prismadb.party.findFirst({ where: { id: partyId, userId: user.id } }) : null;
  } else if (inviteToken) {
    party = await prismadb.party.findUnique({ where: { inviteToken } });
  }

  if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

  // Prevent duplicate RSVP by same child name on same party
  const existing = await prismadb.guest.findFirst({ where: { partyId: party.id, childName: { equals: childName.trim()} } });

  if (existing) {
    // Update existing RSVP
    const updated = await prismadb.guest.update({
      where: { id: existing.id },
      data:  { parentName, parentEmail, parentPhone, allergies, rsvpNote, status, rsvpAt: new Date(), photoConsent, photoShareConsent },
    });
    return NextResponse.json({ ok: true, guest: updated, isUpdate: true });
  }

  const guest = await prismadb.guest.create({
    data: {
      partyId:           party.id,
      childName:         childName.trim(),
      parentName:        parentName   ?? null,
      parentEmail:       parentEmail  ?? null,
      parentPhone:       parentPhone  ?? null,
      allergies:         allergies    ?? null,
      rsvpNote:          rsvpNote     ?? null,
      status,
      rsvpAt:            new Date(),
      photoConsent,
      photoShareConsent,
      digitalTag:        `Hi, I'm ${childName.trim()}! 🎉`,
    },
  });

  return NextResponse.json({ ok: true, guest });
}