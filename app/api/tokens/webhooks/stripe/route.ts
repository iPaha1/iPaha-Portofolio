// =============================================================================
// isaacpaha.com — Stripe Webhook — Credit tokens on payment success
// app/api/tokens/webhooks/stripe/route.ts
//
// Set in Stripe dashboard: https://isaacpaha.com/api/tokens/webhooks/stripe
// Events to listen for: checkout.session.completed
// =============================================================================
// Events to listen for: checkout.session.completed
// =============================================================================

import { prismadb }          from "@/lib/db";
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
    const session = event.data.object as Stripe.Checkout.Session;
    const { dbUserId, tokens, packageId } = session.metadata ?? {};

    if (!dbUserId || !tokens) {
      console.error("[tokens/webhook] Missing metadata", session.metadata);
      return NextResponse.json({ error: "missing_metadata" }, { status: 400 });
    }

    const tokenAmount = parseInt(tokens, 10);
    console.log(`[tokens/webhook] checkout.session.completed — user: ${dbUserId}, package: ${packageId}, tokens: ${tokenAmount}`);

    try {
      await prismadb.$transaction(async (tx) => {
        // 1. Upsert wallet
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

        // 2. Credit tokens
        await tx.tokenWallet.update({
          where: { userId: dbUserId },
          data:  {
            balance:     { increment: tokenAmount },
            totalEarned: { increment: tokenAmount },
          },
        });

        // 3. Record transaction
        //    ✅ No `id` field — let Prisma generate a fresh cuid()
        //    ✅ Connect via relation (tokenWallet TokenWallet[]) not a scalar walletId
        await tx.tokenTransaction.create({
          data: {
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
            tokenWallet: {
              connect: { id: wallet.id },
            },
          },
        });
      });

      console.log(`[tokens/webhook] ✅ Credited ${tokenAmount} tokens → user ${dbUserId}`);
    } catch (err: any) {
      console.error("[tokens/webhook] DB error:", err);
      return NextResponse.json({ error: "db_error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

// export const config = { api: { bodyParser: false } };