// =============================================================================
// isaacpaha.com — Single Media File API
// app/api/admin/media/files/[id]/route.ts
//
// GET    → fetch single file with usage
// PATCH  → update metadata { alt, caption, description, tags, folderId, filename }
// DELETE → permanent delete (from Cloudinary + DB)
// =============================================================================

import { NextRequest, NextResponse }  from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import {
  getMediaFileById,
  updateMediaFile,
  permanentlyDeleteFiles,
} from "@/lib/actions/media-actions";



async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
    const { fileId } = await params;

  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const file = await getMediaFileById(fileId);
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(file);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
    const { fileId } = await params;

  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const updated = await updateMediaFile(fileId, body);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
    const { fileId } = await params;
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await permanentlyDeleteFiles([fileId]);
  return NextResponse.json({ ok: true });
}