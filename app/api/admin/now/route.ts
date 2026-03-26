// =============================================================================
// isaacpaha.com — Now Page API Routes
// app/api/admin/now/
//   route.ts         — GET all entries, POST create, DELETE bulk
//   [id]/route.ts    — GET, PATCH, DELETE single
//   timeline/route.ts        — GET + POST
//   timeline/[id]/route.ts   — PATCH + DELETE
//   knowledge/route.ts       — GET + POST
//   knowledge/[id]/route.ts  — PATCH + DELETE
//   draft/route.ts           — POST → AI draft generation
//
// FILE: app/api/admin/now/route.ts (NowPage entries)
// =============================================================================

// === app/api/admin/now/route.ts ===

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import {
  getNowEntries, createNowEntry
} from "@/lib/actions/now-actions";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entries = await getNowEntries();
  return NextResponse.json(entries);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.title?.trim() || !body.month || !body.year) {
    return NextResponse.json({ error: "title, month, year required" }, { status: 400 });
  }
  const entry = await createNowEntry(body);
  return NextResponse.json({ ok: true, entry }, { status: 201 });
}