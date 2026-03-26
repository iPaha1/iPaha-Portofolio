// =============================================================================
// app/api/tools/job-tracker/discussions/route.ts
// GET  → list discussions (paginated, filterable)
// POST → create discussion
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { createDiscussion, getDiscussions } from "@/lib/tools/actions/job-tracker-actions";


export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const result = await getDiscussions({
    category: sp.get("category") || undefined,
    sortBy:   (sp.get("sortBy") as any) || "createdAt",
    page:     Number(sp.get("page")     ?? 1),
    pageSize: Number(sp.get("pageSize") ?? 20),
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to post" }, { status: 401 });

  const body = await req.json();
  if (!body.title?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: "Title and content required" }, { status: 400 });
  }

  const disc = await createDiscussion(body);
  return NextResponse.json({ ok: true, discussion: disc }, { status: 201 });
}