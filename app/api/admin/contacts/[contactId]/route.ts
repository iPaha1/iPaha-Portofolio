// =============================================================================
// isaacpaha.com — Single Submission API
// app/api/admin/contacts/[id]/route.ts
// GET    → fetch single
// PATCH  → update isRead / isReplied
// DELETE → delete single
// =============================================================================

import { NextRequest, NextResponse }   from "next/server";
import { auth }                        from "@clerk/nextjs/server";
import {
  getSubmissionById,
  markAsRead,
  markAsReplied,
  markAsUnreplied,
  deleteSubmission
} from "@/lib/actions/contacts-actions";
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
  { params }: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await params;

  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sub = await getSubmissionById(contactId);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Auto-mark as read when opened
  if (!sub.isRead) await markAsRead(contactId);

  return NextResponse.json({ ...sub, isRead: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await params;
  
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (body.isRead === true)      await markAsRead(contactId);
  if (body.isReplied === true)   await markAsReplied(contactId);
  if (body.isReplied === false)  await markAsUnreplied(contactId);

  const updated = await getSubmissionById(contactId);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await params;
  
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await deleteSubmission(contactId);
  return NextResponse.json({ ok: true });
}