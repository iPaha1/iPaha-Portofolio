// =============================================================================
// isaacpaha.com — Single Subscriber API
// app/api/admin/newsletter/subscribers/[id]/route.ts
// PATCH  → update status
// DELETE → remove subscriber
// =============================================================================

import { NextRequest, NextResponse }   from "next/server";
import { auth }                        from "@clerk/nextjs/server";
import { updateSubscriberStatus, deleteSubscriber } from "@/lib/actions/newsletter-actions";
import { NewsletterStatus }            from "@/lib/generated/prisma/enums";
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ subscriberId: string }> }
) {

    const { subscriberId } = await params;

  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await req.json();
  if (!["ACTIVE", "UNSUBSCRIBED", "BOUNCED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await updateSubscriberStatus(subscriberId, status as NewsletterStatus);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ subscriberId: string }> }
) {

    const { subscriberId } = await params;
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteSubscriber(subscriberId);
  return NextResponse.json({ ok: true });
}