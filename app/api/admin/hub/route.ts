// =============================================================================
// isaacpaha.com — Developer Hub List API
// app/api/admin/hub/route.ts
// GET    → paginated list (+ type filter + search)
// POST   → create entry
// DELETE → bulk delete { ids[] }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import {
  getHubEntries, createHubEntry, bulkDeleteHubEntries,
} from "@/lib/actions/hub-actions";
import type { HubEntryType, HubLanguage } from "@/lib/generated/prisma/enums";

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

  const sp = new URL(req.url).searchParams;
  const result = await getHubEntries({
    type:        (sp.get("type")     as HubEntryType)  || undefined,
    page:        Number(sp.get("page")     ?? 1),
    pageSize:    Number(sp.get("pageSize") ?? 30),
    search:      sp.get("search")   || undefined,
    category:    sp.get("category") || undefined,
    language:    (sp.get("language") as HubLanguage) || undefined,
    isFavourite: sp.has("fav")  ? sp.get("fav")  === "true" : undefined,
    isPinned:    sp.has("pinned") ? sp.get("pinned") === "true" : undefined,
    sortBy:      (["createdAt", "updatedAt", "title", "copyCount", "viewCount"].includes(sp.get("sortBy") ?? "") 
                  ? sp.get("sortBy") 
                  : "createdAt") as "createdAt" | "updatedAt" | "title" | "copyCount" | "viewCount",
    sortOrder:   (sp.get("sortOrder") as "asc" | "desc") ?? "desc",
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.type || !body.title?.trim() || !body.content?.trim()) {
    return NextResponse.json({ error: "type, title, and content are required" }, { status: 400 });
  }

  const entry = await createHubEntry(body);
  return NextResponse.json({ ok: true, entry }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids[] required" }, { status: 400 });
  }
  await bulkDeleteHubEntries(ids);
  return NextResponse.json({ ok: true, deleted: ids.length });
}