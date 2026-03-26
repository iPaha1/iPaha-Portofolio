// =============================================================================
// isaacpaha.com — Media Folders API
// app/api/admin/media/folders/route.ts   GET + POST
// app/api/admin/media/folders/[id]/route.ts  PATCH + DELETE
// =============================================================================

// ── route.ts (list + create) ─────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import { getFolders, createFolder } from "@/lib/actions/media-actions";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const folders = await getFolders();
  return NextResponse.json({ folders });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { name, description, color, icon, parentId } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Auto-generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Ensure slug is unique
  const existing = await prismadb.mediaFolder.findUnique({ where: { slug } });
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

  const folder = await createFolder({
    name: name.trim(),
    slug: finalSlug,
    description,
    color,
    icon,
    parentId,
  });

  return NextResponse.json({ ok: true, folder }, { status: 201 });
}