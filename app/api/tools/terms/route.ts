// =============================================================================
// app/api/tools/terms/route.ts
//
// POST → mark the current user as having accepted the tools terms.
//         Sets isToolsTermsAccepted = true on the User record.
//
// GET  → returns the current user's acceptance status.
//         Used by the layout to decide whether to show the popup.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json({ accepted: false });
    }

    const user = await prismadb.user.findUnique({
      where:  { clerkId },
      select: { isToolsTermsAccepted: true },
    });

    return NextResponse.json({
      accepted: user?.isToolsTermsAccepted ?? false,
    });
  } catch (error) {
    console.error("[GET /api/tools/terms]", error);
    return NextResponse.json({ accepted: false }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({})) as { accepted?: boolean };

    if (body.accepted !== true) {
      return NextResponse.json(
        { error: "accepted must be true" },
        { status: 400 },
      );
    }

    const user = await prismadb.user.findUnique({
      where:  { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prismadb.user.update({
      where: { id: user.id },
      data:  {
        isToolsTermsAccepted: true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, accepted: true });
  } catch (error) {
    console.error("[POST /api/tools/terms]", error);
    return NextResponse.json(
      { error: "Failed to save acceptance" },
      { status: 500 },
    );
  }
}