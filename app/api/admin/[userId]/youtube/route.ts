// =============================================================================
// ROUTE FILES
// Place each of these in the correct directory under:
// app/api/admin/[userId]/youtube/
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/admin/[userId]/youtube/ideas/route.ts
// ─────────────────────────────────────────────────────────────────────────────
/*
export { GET, POST } from "@/lib/youtube/handlers/ideas";
*/

// ─────────────────────────────────────────────────────────────────────────────
// FILE: app/api/admin/[userId]/youtube/ideas/[ideaId]/route.ts
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string; ideaId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    const body = await req.json();
    const { userId, ideaId } = await params;
    const updated = await prismadb.youtubeContentIdea.update({
      where: { id: ideaId },
      data: body,
    });
    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string; ideaId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    const { userId, ideaId } = await params;
    await prismadb.youtubeContentIdea.delete({ where: { id: ideaId } });
    return NextResponse.json({ message: "Idea deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}