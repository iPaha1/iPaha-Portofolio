// =============================================================================
// isaacpaha.com — Media Files API
// app/api/admin/media/files/route.ts
//
// GET    → paginated list with filters
// PATCH  → bulk move to folder  { ids[], folderId }
// DELETE → bulk trash           { ids[] }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import { MediaType } from "@/lib/generated/prisma/enums";
import { getMediaFiles, trashFiles, moveFiles } from "@/lib/actions/media-actions";


async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sp        = new URL(req.url).searchParams;
  const page      = Number(sp.get("page")     ?? 1);
  const pageSize  = Number(sp.get("pageSize") ?? 40);
  const type      = (sp.get("type")     as MediaType) || undefined;
  const folderId  = sp.get("folderId") ?? undefined;
  const search    = sp.get("search")   ?? undefined;
  const sortBy    = (sp.get("sortBy")    as "createdAt" | "filename" | "size" | null) ?? "createdAt";
  const sortOrder = (sp.get("sortOrder") as "asc" | "desc" | null) ?? "desc";

  const result = await getMediaFiles({ page, pageSize, type, folderId, search, sortBy, sortOrder });
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { ids, folderId } = body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids[] required" }, { status: 400 });
  }
  await moveFiles(ids, folderId ?? null);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids[] required" }, { status: 400 });
  }
  await trashFiles(ids);
  return NextResponse.json({ ok: true, trashed: ids.length });
}