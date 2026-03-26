// =============================================================================
// isaacpaha.com — Hub Global Search API
// app/api/admin/hub/search/route.ts
// GET ?q=prisma  → results grouped by type, max 8 per section
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import { globalHubSearch }           from "@/lib/actions/hub-actions";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q     = new URL(req.url).searchParams.get("q") ?? "";
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? 8);

  if (!q.trim()) {
    return NextResponse.json({ snippets: [], prompts: [], commands: [], errors: [], query: "" });
  }

  const results = await globalHubSearch(q.trim(), limit);
  return NextResponse.json({ ...results, query: q.trim() });
}