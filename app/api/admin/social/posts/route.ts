// =============================================================================
// isaacpaha.com — Social Posts API
// app/api/admin/social/posts/route.ts
// GET    → paginated list
// POST   → create draft
// DELETE → bulk delete
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import { getSocialPosts, createSocialPost, bulkDeleteSocialPosts } from "@/lib/actions/social-actions";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const result = await getSocialPosts({
    page:     Number(sp.get("page")     ?? 1),
    pageSize: Number(sp.get("pageSize") ?? 20),
    platform: sp.get("platform") || undefined,
    status:   (sp.get("status") || undefined) as "draft" | "scheduled" | "published" | undefined,
    search:   sp.get("search")  || undefined,
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.platform || !body.content?.trim()) {
    return NextResponse.json({ error: "platform and content required" }, { status: 400 });
  }
  // Find the connection for this platform
  const connection = await prismadb.socialConnection.findFirst({
    where: { platform: body.platform, isActive: true },
  });
  if (!connection && body.platform !== "DRAFT") {
    return NextResponse.json({ error: `No active ${body.platform} connection. Please connect the platform first.` }, { status: 400 });
  }
  const post = await createSocialPost({
    connectionId:  connection?.id ?? "draft",
    platform:      body.platform,
    content:       body.content.trim(),
    mediaUrls:     body.mediaUrls,
    blogPostId:    body.blogPostId,
    scheduledFor:  body.scheduledFor ? new Date(body.scheduledFor) : undefined,
    status:        body.status ?? "draft",
  });
  return NextResponse.json({ ok: true, post }, { status: 201 });
}

// console.log("Created Post:", post)

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ids } = await req.json();
  if (!Array.isArray(ids) || !ids.length) return NextResponse.json({ error: "ids[] required" }, { status: 400 });
  await bulkDeleteSocialPosts(ids);
  return NextResponse.json({ ok: true, deleted: ids.length });
}

