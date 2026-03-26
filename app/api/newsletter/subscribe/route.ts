// =============================================================================
// isaacpaha.com — Public Newsletter Subscribe
// app/api/newsletter/subscribe/route.ts
// Called from the public newsletter page + any subscribe form on the site.
// =============================================================================

import { prismadb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest) {
  try {
    const { email, firstName, source } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const normalised = email.toLowerCase().trim();

    const existing = await prismadb.newsletterSubscriber.findUnique({
      where:  { email: normalised },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        return NextResponse.json(
          { message: "You're already subscribed!" },
          { status: 200 }
        );
      }
      // Re-subscribe
      await prismadb.newsletterSubscriber.update({
        where: { id: existing.id },
        data:  { status: "ACTIVE", unsubscribedAt: null },
      });
      return NextResponse.json({ message: "Welcome back! You've been re-subscribed." });
    }

    await prismadb.newsletterSubscriber.create({
      data: {
        email:     normalised,
        firstName: firstName?.trim() ?? null,
        source:    source ?? "website",
        status:    "ACTIVE",
      },
    });

    return NextResponse.json({ message: "You're subscribed! Welcome to The Signal." }, { status: 201 });
  } catch (err) {
    console.error("[subscribe]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}