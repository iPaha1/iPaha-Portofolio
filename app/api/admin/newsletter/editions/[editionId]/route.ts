// =============================================================================
// isaacpaha.com — Single Edition API + Send Action
// app/api/admin/newsletter/editions/[id]/route.ts
// GET    → fetch single edition
// PATCH  → update edition
// DELETE → delete edition
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { getEditionById, updateEdition, deleteEdition  } from "@/lib/actions/newsletter-actions";
import { prismadb } from "@/lib/db";


async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {

    const { editionId } = await params;
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const edition = await getEditionById(editionId);
  if (!edition) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(edition);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {
    const { editionId } = await params;
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body    = await req.json();
  const edition = await updateEdition(editionId, body);
  return NextResponse.json(edition);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ editionId: string }> }
) {
    const { editionId } = await params;
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteEdition(editionId);
  return NextResponse.json({ ok: true });
}