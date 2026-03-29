// =============================================================================
// app/api/token-rush/cashout/route.ts
// POST → submit a cashout request (minimum 1,000,000 tokens)
//        Deducts tokens, creates a CashoutStatus.PENDING record, logs tx.
//        Admin processes PayPal payment and marks PAID.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

const CASHOUT_MINIMUM  = 1_000_000;
const CASHOUT_RATE_GBP = 0.0001;   // 1 M tokens = £100

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prismadb.user.findUnique({
      where:   { clerkId },
      include: { tokenWallet: true },
    });
    if (!user || !user.tokenWallet) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { email, tokenAmount } = await req.json() as {
      email: string;
      tokenAmount: number;
    };

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid PayPal email required" }, { status: 400 });
    }
    if (!tokenAmount || tokenAmount < CASHOUT_MINIMUM) {
      return NextResponse.json(
        { error: `Minimum ${CASHOUT_MINIMUM.toLocaleString()} tokens required` },
        { status: 400 },
      );
    }
    if (user.tokenWallet.balance < tokenAmount) {
      return NextResponse.json({ error: "Insufficient token balance" }, { status: 400 });
    }

    const gbpAmount = parseFloat((tokenAmount * CASHOUT_RATE_GBP).toFixed(2));

    await prismadb.$transaction([
      // Deduct tokens immediately to prevent double-submit
      prismadb.tokenWallet.update({
        where: { userId: user.id },
        data:  { balance: { decrement: tokenAmount }, totalSpent: { increment: tokenAmount } },
      }),
      // Create cashout request for admin to action
      prismadb.tokenRushCashout.create({
        data: {
          userId:      user.id,
          tokenAmount,
          gbpAmount,
          paypalEmail: email,
          status:      "PENDING",
        },
      }),
      // Transaction log
      prismadb.tokenTransaction.create({
        data: {
          userId:      user.id,
          amount:      -tokenAmount,
          type:        "REDEMPTION",
          description: `Cashout request — £${gbpAmount.toFixed(2)} to ${email}`,
        },
      }),
    ]);

    // TODO: send admin notification email (e.g. via Resend/SendGrid)
    // await sendAdminCashoutNotification({ user, tokenAmount, gbpAmount, email });

    return NextResponse.json({ success: true, gbpAmount });
  } catch (error) {
    console.error("[POST /api/token-rush/cashout]", error);
    return NextResponse.json({ error: "Failed to process cashout" }, { status: 500 });
  }
}