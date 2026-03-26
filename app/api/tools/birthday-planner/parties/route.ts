// =============================================================================
// isaacpaha.com — Birthday Planner — Parties API
// app/api/tools/birthday-planner/parties/route.ts
//
// GET  → list all parties for signed-in user (with guest count summaries)
// POST → create a new party (saves plan + auto-creates AI checklist + songs)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib//db";

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ parties: [] });

  const parties = await prismadb.party.findMany({
    where:   { userId: user.id },
    orderBy: { partyDate: "asc" },
    include: {
      guests:   { select: { id: true, status: true } },
      checklist:{ select: { id: true, isDone: true } },
      songs:    { select: { id: true } },
    },
  });

  return NextResponse.json({ parties });
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to save parties" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const {
    childName, childAge, partyDate, partyEndTime,
    locationName, locationAddress, country, city,
    theme, customTheme, ageGroup, numKids,
    budgetRange, budgetAmount, indoor, restrictions, specialNotes,
    plan,   // full PartyPlan JSON
  } = body;

  if (!childName?.trim() || !partyDate || !plan) {
    return NextResponse.json({ error: "childName, partyDate, and plan are required" }, { status: 400 });
  }

  // Soft cap: 20 parties per user
  const count = await prismadb.party.count({ where: { userId: user.id } });
  if (count >= 20) return NextResponse.json({ error: "20-party limit reached" }, { status: 429 });

  // Create party
  const party = await prismadb.party.create({
    data: {
      userId: user.id,
      childName:       childName.trim(),
      childAge:        Number(childAge) || 0,
      partyDate:       new Date(partyDate),
      partyEndTime:    partyEndTime ? new Date(partyEndTime) : undefined,
      locationName:    locationName   ?? null,
      locationAddress: locationAddress ?? null,
      country:         country         ?? "GB",
      city:            city            ?? null,
      theme:           theme.trim(),
      customTheme:     customTheme     ?? null,
      ageGroup:        ageGroup        ?? "6-8",
      numKids:         Number(numKids) || 10,
      budgetRange:     budgetRange     ?? "medium",
      budgetAmount:    budgetAmount    ? Number(budgetAmount) : undefined,
      indoor:          indoor !== false,
      restrictions:    Array.isArray(restrictions) ? JSON.stringify(restrictions) : null,
      specialNotes:    specialNotes    ?? null,
      planJson:        JSON.stringify(plan),
      planGenerated:   true,
      inviteMessage:   plan.inviteMessage ?? null,
      status:          "DRAFT",
    },
  });

  // Auto-create AI checklist items
  if (plan.checklist?.length) {
    const sorted = [...plan.checklist].sort((a: any, b: any) => (b.weeksBefore ?? 0) - (a.weeksBefore ?? 0));
    await prismadb.checklistItem.createMany({
      data: sorted.map((item: any, idx: number) => ({
        partyId:   party.id,
        text:      item.text,
        category:  item.category ?? "general",
        sortOrder: idx,
        isAI:      true,
      })),
    });
  }

  // Auto-create AI song suggestions
  if (plan.music?.suggestedSongs?.length) {
    await prismadb.songSuggestion.createMany({
      data: plan.music.suggestedSongs.map((s: any) => ({
        partyId:     party.id,
        title:       s.title,
        artist:      s.artist   ?? null,
        suggestedBy: "AI",
        isApproved:  true,
      })),
    });
  }

  const full = await prismadb.party.findUnique({
    where:   { id: party.id },
    include: { guests: true, checklist: true, songs: true },
  });

  return NextResponse.json({ ok: true, party: full });
}