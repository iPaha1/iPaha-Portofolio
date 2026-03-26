// =============================================================================
// isaacpaha.com — Birthday Planner — My RSVP Lookup
// app/api/tools/birthday-planner/my-rsvp/route.ts
//
// GET ?token=xxx → find this signed-in user's existing guest record for a party
//                 Used so the invite page knows if you've already RSVPd,
//                 what your guest ID is, and what status to show on refresh.
//
// POST { token, childName, parentName, allergies, rsvpNote,
//        status, photoConsent, photoShareConsent }
//      → RSVP and link the guest row to the authenticated Clerk user
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

// ─── GET — look up existing RSVP ──────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return NextResponse.json({ guest: null });

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ guest: null });

  // Find party
  const party = await prismadb.party.findUnique({
    where:  { inviteToken: token },
    select: { id: true, status: true },
  });
  if (!party) return NextResponse.json({ guest: null });

  // Find guest linked to this Clerk user for this party
  const guest = await prismadb.guest.findFirst({
    where: { partyId: party.id, guestClerkId: userId },
  });

  return NextResponse.json({ guest: guest ? JSON.parse(JSON.stringify(guest)) : null });
}

// ─── POST — authenticated RSVP ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to RSVP" }, { status: 401 });

  const body = await req.json();
  const {
    token, childName, parentName, parentEmail, parentPhone,
    allergies, rsvpNote, status = "ACCEPTED",
    photoConsent = false, photoShareConsent = false,
  } = body;

  if (!token)              return NextResponse.json({ error: "token required" }, { status: 400 });
  if (!childName?.trim()) return NextResponse.json({ error: "childName required" }, { status: 400 });

  const party = await prismadb.party.findUnique({ where: { inviteToken: token } });
  if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

  // Check for existing RSVP by this Clerk user
  const existing = await prismadb.guest.findFirst({
    where: { partyId: party.id, guestClerkId: userId },
  });

  if (existing) {
    // Update existing RSVP
    const updated = await prismadb.guest.update({
      where: { id: existing.id },
      data:  {
        childName, parentName, parentEmail, parentPhone,
        allergies, rsvpNote, status, rsvpAt: new Date(),
        photoConsent, photoShareConsent,
      },
    });
    return NextResponse.json({ ok: true, guest: JSON.parse(JSON.stringify(updated)), isUpdate: true });
  }

  // Create new guest row linked to Clerk user
  const guest = await prismadb.guest.create({
    data: {
      partyId:           party.id,
      guestClerkId:      userId,
      childName:         childName.trim(),
      parentName:        parentName        ?? null,
      parentEmail:       parentEmail       ?? null,
      parentPhone:       parentPhone       ?? null,
      allergies:         allergies         ?? null,
      rsvpNote:          rsvpNote          ?? null,
      status,
      rsvpAt:            new Date(),
      photoConsent,
      photoShareConsent,
      digitalTag:        `Hi, I'm ${childName.trim()}! 🎉`,
    },
  });

  return NextResponse.json({ ok: true, guest: JSON.parse(JSON.stringify(guest)) });
}