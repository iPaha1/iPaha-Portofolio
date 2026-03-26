// =============================================================================
// isaacpaha.com — Birthday Planner — Single Party API
// app/api/tools/birthday-planner/parties/[partyId]/route.ts
// FIXED: Next.js 15 async params
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

async function resolveParty(partyId: string, clerkId: string) {
  const user = await prismadb.user.findUnique({ where: { clerkId }, select: { id: true } });
  if (!user) return null;
  return prismadb.party.findFirst({ where: { id: partyId, userId: user.id } });
}

export async function GET(
  _req:    NextRequest,
  context: { params: Promise<{ partyId: string }> }
) {
  const { partyId } = await context.params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const party = await resolveParty(partyId, userId);
  if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

  const full = await prismadb.party.findUnique({
    where:   { id: party.id },
    include: {
      guests:   { orderBy: { createdAt: "asc" } },
      checklist:{ orderBy: { sortOrder: "asc" } },
      songs:    { orderBy: { createdAt: "asc" } },
    },
  });
  return NextResponse.json({ party: full });
}

export async function PUT(
  req:     NextRequest,
  context: { params: Promise<{ partyId: string }> }
) {
  const { partyId }     = await context.params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const party = await resolveParty(partyId, userId);
  if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prismadb.party.update({
    where: { id: party.id },
    data:  {
      childName:       body.childName       ?? undefined,
      childAge:        body.childAge        ? Number(body.childAge) : undefined,
      partyDate:       body.partyDate       ? new Date(body.partyDate) : undefined,
      partyEndTime:    body.partyEndTime    ? new Date(body.partyEndTime) : undefined,
      locationName:    body.locationName    ?? undefined,
      locationAddress: body.locationAddress ?? undefined,
      theme:           body.theme           ?? undefined,
      customTheme:     body.customTheme     ?? undefined,
      numKids:         body.numKids         ? Number(body.numKids) : undefined,
      budgetRange:     body.budgetRange     ?? undefined,
      budgetAmount:    body.budgetAmount    ? Number(body.budgetAmount) : undefined,
      indoor:          body.indoor          !== undefined ? body.indoor : undefined,
      restrictions:    body.restrictions    !== undefined ? JSON.stringify(body.restrictions) : undefined,
      specialNotes:    body.specialNotes    ?? undefined,
      inviteMessage:   body.inviteMessage   ?? undefined,
      planJson:        body.planJson        ?? undefined,
    },
  });
  return NextResponse.json({ ok: true, party: updated });
}

export async function PATCH(
  req:     NextRequest,
  context: { params: Promise<{ partyId: string }> }
) {
  const { partyId }     = await context.params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const party  = await resolveParty(partyId, userId);
  if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

  const action = new URL(req.url).searchParams.get("action");
  const body   = await req.json();

  if (action === "status") {
    await prismadb.party.update({ where: { id: party.id }, data: { status: body.status } });
  } else if (action === "invite") {
    await prismadb.party.update({
      where: { id: party.id },
      data:  { status: "ACTIVE", inviteSentAt: new Date(), inviteMessage: body.inviteMessage ?? party.inviteMessage },
    });
  } else if (action === "dayof") {
    await prismadb.party.update({ where: { id: party.id }, data: { status: "DAY_OF" } });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req:    NextRequest,
  context: { params: Promise<{ partyId: string }> }
) {
  const { partyId }     = await context.params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const party = await resolveParty(partyId, userId);
  if (!party) return NextResponse.json({ error: "Party not found" }, { status: 404 });

  await prismadb.party.delete({ where: { id: party.id } });
  return NextResponse.json({ ok: true });
}