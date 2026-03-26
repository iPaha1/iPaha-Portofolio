// =============================================================================
// isaacpaha.com — Contact Submissions API
// app/api/admin/contacts/route.ts
// GET    → paginated list with filters
// DELETE → bulk delete (body: { ids: string[] })
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import { getSubmissions, bulkDelete, markAllRead } from "@/lib/actions/contacts-actions";


async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp        = new URL(req.url).searchParams;
  const page      = Number(sp.get("page")     ?? 1);
  const pageSize  = Number(sp.get("pageSize") ?? 30);
  const type      = sp.get("type")     ?? undefined;
  const search    = sp.get("search")   ?? undefined;
  const isRead    = sp.has("isRead")    ? sp.get("isRead")    === "true" : undefined;
  const isReplied = sp.has("isReplied") ? sp.get("isReplied") === "true" : undefined;
//   const sortBy    = sp.get("sortBy") ?? "createdAt";
//   const sortOrder = sp.get("sortOrder") ?? "desc";

  const result = await getSubmissions({ page, pageSize, type, search, isRead, isReplied});
  return NextResponse.json(result);
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }
  await bulkDelete(ids);
  return NextResponse.json({ ok: true, deleted: ids.length });
}

// PATCH /api/admin/contacts → mark all as read
export async function PATCH() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await markAllRead();
  return NextResponse.json({ ok: true });
}