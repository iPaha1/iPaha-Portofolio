// =============================================================================
// isaacpaha.com — QR Code Generator: Save & Track API
// app/api/tools/qr/save/route.ts
//
// GET    → list user's saved QR codes
// POST   → save a new QR code
// PATCH  → update (rename, edit destination for dynamic QR)
// DELETE → delete by id
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import { QRCodeType } from "@/lib/generated/prisma/enums";

// ─── GET: list saved QR codes ─────────────────────────────────────────────────

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ qrCodes: [] });

  const qrCodes = await prismadb.qrCode.findMany({
    where:   { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { scans: true } } },
  });

  return NextResponse.json({ qrCodes });
}

// ─── POST: save a new QR code ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to save QR codes" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const count = await prismadb.qrCode.count({ where: { userId: user.id } });
  if (count >= 50) {
    return NextResponse.json({ error: "50 QR code limit reached. Delete some to continue." }, { status: 429 });
  }

  const body = await req.json();
  const {
    label,
    type,           // coming from client as lowercase string
    content,
    qrData,
    designJson,
    isDynamic = false,
    isPublic = false,
  } = body;

  if (!content?.trim() || !label?.trim()) {
    return NextResponse.json({ error: "label and content are required" }, { status: 400 });
  }

  // Normalize type to uppercase and validate it's a valid enum value
  const normalizedType = (type ?? "URL").toUpperCase();

  // Optional: strict validation (recommended)
  const validTypes = [
    "URL", "LINKEDIN", "INSTAGRAM", "TWITTER", "VCARD", "EMAIL",
    "SMS", "PHONE", "WIFI", "PAYMENT", "TEXT"
  ];
  if (!validTypes.includes(normalizedType)) {
    return NextResponse.json(
      { error: `Invalid QR type: "${type}". Must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  const dynamicId = isDynamic
    ? Math.random().toString(36).slice(2, 8).toUpperCase()
    : null;

  const qr = await prismadb.qrCode.create({
    data: {
      userId:      user.id,   // ← use user.id, not clerk userId
      label:       label.trim(),
      type:        normalizedType as QRCodeType,   // now "PHONE", "URL", etc.
      content:     content.trim(),
      qrData:      qrData ?? content.trim(),
      designJson:  designJson ? JSON.stringify(designJson) : null,
      isDynamic,
      dynamicId,
      isPublic,
      destination: isDynamic ? content.trim() : null,
    },
  });

  return NextResponse.json({ ok: true, qrCode: qr }, { status: 201 });
}
// ─── PATCH: update label, destination (dynamic QR), or design ─────────────────

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const id   = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json();

  const updated = await prismadb.qrCode.updateMany({
    where: { id, userId: user.id },
    data: {
      ...(body.label       !== undefined && { label: body.label       }),
      ...(body.destination !== undefined && { destination: body.destination }), // dynamic QR
      ...(body.designJson  !== undefined && { designJson: JSON.stringify(body.designJson) }),
      ...(body.isPublic    !== undefined && { isPublic: body.isPublic }),
    },
  });

  return NextResponse.json({ ok: true, updated });
}

// ─── DELETE: remove a QR code ─────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prismadb.qrCode.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
