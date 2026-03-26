// =============================================================================
// isaacpaha.com — Media Trash API
// app/api/admin/media/trash/route.ts
//
// GET    → list trashed files
// PATCH  → restore { ids[] }
// DELETE → permanently delete { ids[] } OR empty entire trash { all: true }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import {
  getTrashFiles,
  restoreFiles,
  permanentlyDeleteFiles,
  emptyTrash,
} from "@/lib/actions/media-actions";


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
  const sp       = new URL(req.url).searchParams;
  const page     = Number(sp.get("page")     ?? 1);
  const pageSize = Number(sp.get("pageSize") ?? 40);
  const result   = await getTrashFiles({ page, pageSize });
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids[] required" }, { status: 400 });
  }
  await restoreFiles(ids);
  return NextResponse.json({ ok: true, restored: ids.length });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();

  if (body.all === true) {
    await emptyTrash();
    return NextResponse.json({ ok: true, action: "emptied" });
  }

  if (Array.isArray(body.ids) && body.ids.length > 0) {
    await permanentlyDeleteFiles(body.ids);
    return NextResponse.json({ ok: true, deleted: body.ids.length });
  }

  return NextResponse.json({ error: "Provide ids[] or all:true" }, { status: 400 });
}