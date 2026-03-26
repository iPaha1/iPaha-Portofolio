// =============================================================================
// isaacpaha.com — Stripe Token Purchase — Create Checkout Session
// app/api/tokens/checkout/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Stripe                        from "stripe";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// Token packages — price in USD cents, tokens awarded, Stripe Price ID env var
export const TOKEN_PACKAGES = [
  {
    id:          "starter",
    label:       "Starter",
    tokens:      5_000,
    price:       500,   // $5.00
    priceEnvKey: "STRIPE_PRICE_STARTER",
    popular:     false,
    badge:       null,
    per1k:       "$1.00 / 1,000 🪙",
  },
  {
    id:          "explorer",
    label:       "Explorer",
    tokens:      12_000,
    price:       1000,  // $10.00
    priceEnvKey: "STRIPE_PRICE_EXPLORER",
    popular:     true,
    badge:       "Most Popular",
    per1k:       "$0.83 / 1,000 🪙",
  },
  {
    id:          "builder",
    label:       "Builder",
    tokens:      35_000,
    price:       2500,  // $25.00
    priceEnvKey: "STRIPE_PRICE_BUILDER",
    popular:     false,
    badge:       "Best Value",
    per1k:       "$0.71 / 1,000 🪙",
  },
  {
    id:          "power",
    label:       "Power",
    tokens:      80_000,
    price:       5000,  // $50.00
    priceEnvKey: "STRIPE_PRICE_POWER",
    popular:     false,
    badge:       null,
    per1k:       "$0.63 / 1,000 🪙",
  },
] as const;

export async function POST(req: NextRequest) {
  try {
    const { packageId } = await req.json();
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const pkg = TOKEN_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return NextResponse.json({ error: "invalid_package" }, { status: 400 });
    }

    // Resolve DB user
    let dbUser = await prismadb.user.findUnique({
      where:  { clerkId },
      select: { id: true, email: true },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "user_not_found" }, { status: 404 });
    }

    // Stripe price ID (set in .env)
    const priceId = process.env[pkg.priceEnvKey];
    if (!priceId) {
      // Fallback: create a one-time price on the fly (dev/staging)
      const session = await stripe.checkout.sessions.create({
        mode:        "payment",
        line_items:  [
          {
            price_data: {
              currency:     "usd",
              unit_amount:  pkg.price,
              product_data: {
                name:        `${pkg.tokens.toLocaleString()} isaacpaha Tokens`,
                description: `${pkg.label} pack — ${pkg.per1k}`,
                images:      ["https://isaacpaha.com/og-tokens.png"],
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          clerkId,
          dbUserId:  dbUser.id,
          packageId: pkg.id,
          tokens:    pkg.tokens.toString(),
        },
        customer_email:     dbUser.email ?? undefined,
        success_url:        `${process.env.NEXT_PUBLIC_URL}/tools?token_success=1&tokens=${pkg.tokens}`,
        cancel_url:         `${process.env.NEXT_PUBLIC_URL}/tools?token_cancelled=1`,
        allow_promotion_codes: true,
      });
      return NextResponse.json({ url: session.url });
    }

    // Production: use pre-created Stripe prices
    const session = await stripe.checkout.sessions.create({
      mode:       "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        clerkId,
        dbUserId:  dbUser.id,
        packageId: pkg.id,
        tokens:    pkg.tokens.toString(),
      },
      customer_email:     dbUser.email ?? undefined,
      success_url:        `${process.env.NEXT_PUBLIC_URL}/tools?token_success=1&tokens=${pkg.tokens}`,
      cancel_url:         `${process.env.NEXT_PUBLIC_URL}/tools?token_cancelled=1`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[tokens/checkout]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}