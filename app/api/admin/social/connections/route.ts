// =============================================================================
// isaacpaha.com — Social Connections API
// app/api/admin/social/connections/route.ts
// GET  → all connections with status
// POST { platform, accessToken, handle, ... } → upsert connection (manual / after OAuth)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import { getConnections, upsertConnection, disconnectPlatform } from "@/lib/actions/social-actions";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const connections = await getConnections();
  console.log('All connections:' , connections); // Debug log to verify data
  return NextResponse.json(connections);
}


export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  console.log("======== Post Body: ========================", body)
  if (!body.platform || !body.accessToken) {
    return NextResponse.json({ error: "platform and accessToken required" }, { status: 400 });
  }
  const conn = await upsertConnection(body);
  return NextResponse.json({ ok: true, connection: conn });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { platform } = await req.json();
  if (!platform) return NextResponse.json({ error: "platform required" }, { status: 400 });
  await disconnectPlatform(platform);
  return NextResponse.json({ ok: true });
}


// =============================================================================