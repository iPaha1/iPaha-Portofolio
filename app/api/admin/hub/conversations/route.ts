// app/api/admin/hub/conversations/route.ts — GET list
import { NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const convs = await prismadb.hubConversation.findMany({
    orderBy: { updatedAt: "desc" }, take: 50,
    select: { id: true, title: true, messages: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json({ conversations: convs.map((c) => ({ ...c, messages: JSON.parse(c.messages || "[]") })) });
}