// app/api/admin/hub/conversations/[conversationId]/route.ts — DELETE single
import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prismadb.hubConversation.delete({ where: { id: conversationId } }).catch(() => {});
  return NextResponse.json({ ok: true });
}