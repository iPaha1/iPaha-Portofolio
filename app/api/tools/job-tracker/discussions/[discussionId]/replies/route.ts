// =============================================================================
// app/api/tools/job-tracker/discussions/[discussionId]/replies/route.ts
// POST → add reply · PATCH → like discussion
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { createReply, likeDiscussion } from "@/lib/tools/actions/job-tracker-actions";


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {

  const { userId } = await auth();
  const { discussionId } = await params;

  if (!userId) return NextResponse.json({ error: "Sign in to reply" }, { status: 401 });

  const { content, isAnonymous } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const reply = await createReply(discussionId, content, isAnonymous ?? false);
  return NextResponse.json({ ok: true, reply }, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ discussionId: string }> }
) {

  const { userId } = await auth();
  const { discussionId } = await params;

  if (!userId) return NextResponse.json({ error: "Sign in to like" }, { status: 401 });

  const { action } = await req.json();
  if (action === "like") {
    await likeDiscussion(discussionId);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}