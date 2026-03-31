// =============================================================================
// isaacpaha.com — Scripture Explorer: Save/Bookmark API
// app/api/tools/scripture-explorer/save/route.ts
//
// GET  → list saved explorations for this user
// POST → save a new exploration
// DELETE ?id=xxx → delete a saved exploration
// PATCH → update notes on a saved exploration
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

export async function GET() {
  console.log(`[scripture-explorer/save] GET request received at ${new Date().toISOString()}`);
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { id: true },
  });
  console.log(`[scripture-explorer/save] Authenticated userId: ${userId}, DB user lookup result:`, user);
  if (!user) return NextResponse.json({ explorations: [] });

  const explorations = await prismadb.scriptureExploration.findMany({
    where:   { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { notes: true },
  });

  return NextResponse.json({ explorations });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to save explorations" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  console.log(`[scripture-explorer/save] Found user: ${user.id}`);

  const { topic, query, mode, result } = await req.json();

  if (!topic || !result) {
    return NextResponse.json({ error: "topic and result required" }, { status: 400 });
  }

  // Soft limit: 50 saved explorations
  const count = await prismadb.scriptureExploration.count({ where: { userId: user.id } });
  if (count >= 50) {
    return NextResponse.json({ error: "You've reached the 50 saved explorations limit. Delete some to save more." }, { status: 429 });
  }

  const saved = await prismadb.scriptureExploration.create({
    data: {
      userId: user.id,
      topic:       topic.slice(0, 200),
      query:       query?.slice(0, 500) ?? topic,
      mode:        mode ?? "compare",
      resultJson:  JSON.stringify(result),
      traditions:  result.traditions?.map((t: any) => t.tradition).join(", ") ?? "Bible, Qur'an, Tanakh",
    },
  });
  console.log(`[scripture-explorer/save] Created new exploration with ID: ${saved.id} for user ${user.id}`);

  return NextResponse.json({ ok: true, id: saved.id });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prismadb.scriptureExploration.deleteMany({ where: { id, userId: user.id } });
  console.log(`[scripture-explorer/save] Deleted exploration with ID: ${id} for user ${user.id}`);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { noteText, isStarred } = await req.json();

  if (noteText !== undefined) {
    // Upsert a note
    await prismadb.scriptureNote.upsert({
      where:  { explorationId: id },
      create: { explorationId: id, userId: user.id, content: noteText.slice(0, 2000) },
      update: { content: noteText.slice(0, 2000), updatedAt: new Date() },
    });
  }

  if (isStarred !== undefined) {
    await prismadb.scriptureExploration.updateMany({
      where: { id, userId: user.id },
      data:  { isStarred },
    });
  }

  return NextResponse.json({ ok: true });
}