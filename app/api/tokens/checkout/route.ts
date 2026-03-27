// =============================================================================
// isaacpaha.com — Stripe Token Purchase — Create Checkout Session
// app/api/tokens/checkout/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Stripe                        from "stripe";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import { TOKEN_PACKAGES }            from "@/lib/tokens/token-packages"; // ← shared constants

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// TOKEN_PACKAGES is no longer defined or exported from here.
// Import it from "@/lib/tokens/token-packages" in any file that needs it.

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

    const priceId = process.env[pkg.priceEnvKey];

    if (!priceId) {
      // Dev/staging fallback — create price on the fly
      const session = await stripe.checkout.sessions.create({
        mode:       "payment",
        line_items: [
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
        customer_email:        dbUser.email ?? undefined,
        success_url:           `${process.env.NEXT_PUBLIC_URL}/token-purchase-success?token_success=1&tokens=${pkg.tokens}`,
        cancel_url:            `${process.env.NEXT_PUBLIC_URL}/token-purchase-success?token_cancelled=1`,
        allow_promotion_codes: true,
      });
      return NextResponse.json({ url: session.url });
    }

    // Production: use pre-created Stripe price IDs
    const session = await stripe.checkout.sessions.create({
      mode:       "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        clerkId,
        dbUserId:  dbUser.id,
        packageId: pkg.id,
        tokens:    pkg.tokens.toString(),
      },
      customer_email:        dbUser.email ?? undefined,
      success_url:           `${process.env.NEXT_PUBLIC_URL}/token-purchase-success?token_success=1&tokens=${pkg.tokens}`,
      cancel_url:            `${process.env.NEXT_PUBLIC_URL}/token-purchase-success?token_cancelled=1`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("[tokens/checkout]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}