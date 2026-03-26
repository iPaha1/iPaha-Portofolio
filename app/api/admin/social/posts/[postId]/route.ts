
// =============================================================================
// app/api/admin/social/posts/[id]/route.ts
// GET / PATCH / DELETE single post
// PATCH _action: publish | schedule | duplicate
// =============================================================================

// PASTE INTO: app/api/admin/social/posts/[id]/route.ts

import { NextRequest, NextResponse }  from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import { prismadb }                   from "@/lib/db";
import {
  getSocialPostById, updateSocialPost,
  deleteSocialPost, duplicateSocialPost,
} from "@/lib/actions/social-actions";

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { postId } = await params;
  const post = await getSocialPostById(postId);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (body._action === "duplicate") return NextResponse.json(await duplicateSocialPost(postId));
  if (body._action === "publish") {
    // Actually post to the platform
    const post       = await getSocialPostById(postId);
    if (!post)       return NextResponse.json({ error: "Not found" }, { status: 404 });
    const connection = post.connection;
    // Call the platform publish function (platform-specific)
    const result = await publishToPlatform(post, connection);
    if (result.error) {
      await updateSocialPost(postId, { status: "failed" });
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    const updated = await updateSocialPost(postId, {
      status: "published", platformPostId: result.postId,
    });
    // Update lastPostedAt on connection
    await prismadb.socialConnection.update({
      where: { id: connection.id }, data: { lastPostedAt: new Date() },
    });
    return NextResponse.json(updated);
  }
  const updated = await updateSocialPost(postId, body);
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteSocialPost(postId);
  return NextResponse.json({ ok: true });
}

// Platform-specific publish implementations
async function publishToPlatform(post: any, connection: any): Promise<{ postId?: string; error?: string }> {
  try {
    switch (post.platform) {
      case "TWITTER": {
        const media = post.mediaUrls ? JSON.parse(post.mediaUrls) : [];
        const body: any = { text: post.content };
        const res = await fetch("https://api.twitter.com/2/tweets", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${connection.accessToken}`,
            "Content-Type":  "application/json",
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) return { error: data.detail ?? data.title ?? "Twitter post failed" };
        return { postId: data.data?.id };
      }
      case "LINKEDIN": {
        const body = {
          author:     `urn:li:person:${connection.handle}`,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: post.content },
              shareMediaCategory: "NONE",
            },
          },
          visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
        };
        const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${connection.accessToken}`,
            "Content-Type":  "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) return { error: data.message ?? "LinkedIn post failed" };
        return { postId: data.id };
      }
      case "FACEBOOK": {
        const res = await fetch(`https://graph.facebook.com/v19.0/${connection.handle}/feed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: post.content, access_token: connection.accessToken }),
        });
        const data = await res.json();
        if (!res.ok || data.error) return { error: data.error?.message ?? "Facebook post failed" };
        return { postId: data.id };
      }
      case "INSTAGRAM": {
        // Step 1: create media container
        const media = post.mediaUrls ? JSON.parse(post.mediaUrls) : [];
        const createRes = await fetch(
          `https://graph.facebook.com/v19.0/${connection.handle}/media`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image_url:    media[0],
              caption:      post.content,
              access_token: connection.accessToken,
            }),
          }
        );
        const createData = await createRes.json();
        if (!createRes.ok) return { error: createData.error?.message ?? "Instagram media creation failed" };
        // Step 2: publish
        const publishRes = await fetch(
          `https://graph.facebook.com/v19.0/${connection.handle}/media_publish`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ creation_id: createData.id, access_token: connection.accessToken }),
          }
        );
        const publishData = await publishRes.json();
        if (!publishRes.ok) return { error: publishData.error?.message ?? "Instagram publish failed" };
        return { postId: publishData.id };
      }
      default:
        return { error: `Publishing to ${post.platform} is not yet implemented` };
    }
  } catch (err: any) {
    return { error: err.message ?? "Publish failed" };
  }
}
