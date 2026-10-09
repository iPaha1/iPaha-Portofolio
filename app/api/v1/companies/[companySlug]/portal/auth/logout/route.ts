// apps/api/app/api/v1/companies/[slug]/portal/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/db";
import { hashSessionToken } from "@/lib/api/otp";

export async function POST(req: NextRequest) {
  const token = req.headers.get("x-portal-session");
  if (token) {
    await prismadb.portalSession.updateMany({
      where: { tokenHash: hashSessionToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  return NextResponse.json({ success: true, data: {}, requestId: crypto.randomUUID() });
}