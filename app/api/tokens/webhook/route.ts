// =============================================================================
// isaacpaha.com — Stripe Webhook — Credit tokens on payment success
// app/api/tokens/webhook/route.ts
//
// Set in Stripe dashboard: https://isaacpaha.com/api/tokens/webhook
// Events to listen for: checkout.session.completed
// =============================================================================

import { prismadb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import Stripe                        from "stripe";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export async function POST(req: NextRequest) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error("[tokens/webhook] signature verification failed:", err.message);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session  = event.data.object as Stripe.Checkout.Session;
    const { dbUserId, tokens, packageId } = session.metadata ?? {};

    if (!dbUserId || !tokens) {
      console.error("[tokens/webhook] Missing metadata", session.metadata);
      return NextResponse.json({ error: "missing_metadata" }, { status: 400 });
    }

    const tokenAmount = parseInt(tokens, 10);

    try {
      await prismadb.$transaction(async (tx) => {
        // Upsert wallet
        let wallet = await tx.tokenWallet.findUnique({
          where:  { userId: dbUserId },
          select: { id: true },
        });

        if (!wallet) {
          wallet = await tx.tokenWallet.create({
            data:   { userId: dbUserId, balance: 0 },
            select: { id: true },
          });
        }

        // Credit tokens
        await tx.tokenWallet.update({
          where: { userId: dbUserId },
          data:  { balance: { increment: tokenAmount } },
        });

        // Record transaction
        await tx.tokenTransaction.create({
          data: {
            id:    wallet.id,
            userId:      dbUserId,
            amount:      tokenAmount,
            type:        "PURCHASE",
            description: `Stripe purchase: ${packageId} pack (${tokenAmount.toLocaleString()} tokens)`,
            metadata:    JSON.stringify({
              stripeSessionId: session.id,
              packageId,
              amountPaid:      session.amount_total,
              currency:        session.currency,
            }),
          },
        });
      });

      console.log(`[tokens/webhook] Credited ${tokenAmount} tokens → user ${dbUserId}`);
    } catch (err: any) {
      console.error("[tokens/webhook] DB error:", err);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

// Disable body parsing — Stripe needs raw body for signature verification
export const config = { api: { bodyParser: false } };