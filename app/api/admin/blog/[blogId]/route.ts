// =============================================================================
// isaacpaha.com — Single Post API
// app/api/admin/blog/[blogId]/route.ts
// =============================================================================
import { NextRequest, NextResponse }  from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import { prismadb }                   from "@/lib/db";
import {
  getBlogPostById, updateBlogPost, softDeletePost,
  publishPost, unpublishPost, duplicateBlogPost, restorePost,
  getRevisions,
} from "@/lib/actions/blog-actions";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }   // ← was { id: string }
) {

    const { blogId } = await params;

  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  if (sp.get("revisions") === "true") {
    return NextResponse.json(await getRevisions(blogId));  // ← was params.id
  }
  const post = await getBlogPostById(blogId);              // ← was params.id
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }   // ← was { id: string }
) {

    const { blogId } = await params;

  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (body._action === "publish")   return NextResponse.json(await publishPost(blogId));
  if (body._action === "unpublish") return NextResponse.json(await unpublishPost(blogId));
  if (body._action === "duplicate") return NextResponse.json(await duplicateBlogPost(blogId));
  if (body._action === "restore")   return NextResponse.json(await restorePost(blogId));
  const updated = await updateBlogPost(blogId, body);
  return NextResponse.json(updated);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ blogId: string }> }   // ← was { id: string }
) {

    const { blogId } = await params;
    
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await softDeletePost(blogId);           // ← was params.id
  return NextResponse.json({ ok: true });
}