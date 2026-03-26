

// =============================================================================
// app/api/tools/qr/track/route.ts  ← PASTE INTO SEPARATE FILE
// Records a scan event (called when a dynamic QR is scanned)
// POST { dynamicId, userAgent?, referrer? }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { prismadb }                  from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { dynamicId, userAgent = "", referrer = "" } = await req.json();
    if (!dynamicId) return NextResponse.json({ error: "dynamicId required" }, { status: 400 });

    const qr = await prismadb.qrCode.findFirst({ where: { dynamicId }, select: { id: true, destination: true } });
    if (!qr) return NextResponse.json({ error: "QR not found" }, { status: 404 });

    await prismadb.qrScan.create({
      data: {
        qrCodeId:  qr.id,
        userAgent: userAgent.slice(0, 500),
        referrer:  referrer.slice(0, 500),
        ip:        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        country:   req.headers.get("x-vercel-ip-country") ?? null,
        device:    userAgent.includes("Mobile") ? "mobile" : "desktop",
        scannedAt: new Date(),
      },
    });

    await prismadb.qrCode.update({
      where: { id: qr.id },
      data:  { totalScans: { increment: 1 } },
    });

    // Redirect to destination
    return NextResponse.redirect(qr.destination ?? "/");
  } catch (err: any) {
    return NextResponse.json({ error: "Track failed" }, { status: 500 });
  }
}
