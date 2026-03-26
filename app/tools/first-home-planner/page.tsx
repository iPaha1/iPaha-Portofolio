// =============================================================================
// isaacpaha.com — First Home Planner — Dedicated Tool Page
// app/tools/first-home-planner/page.tsx
// Route: /tools/first-home-planner
// =============================================================================

import type { Metadata }      from "next";
import { currentUser }        from "@clerk/nextjs/server";
import { prismadb }           from "@/lib/db";
import { HomePlannerPage } from "./_first-home-planner/home-planner-page";


// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "First Home Planner — Free AI Tool to Plan Buying Your First Home",
  description:
    "Go from your first payslip to owning a home. Enter your income, savings, and target property price to get a personalised AI-powered deposit plan, mortgage readiness roadmap, credit-building strategy, and a month-by-month action plan. Free, UK-focused.",
  openGraph: {
    title:       "First Home Planner | Free AI Tool — Isaac Paha",
    description: "From renting to owning. Get your personalised deposit plan, mortgage roadmap, and credit strategy — all free.",
    url:         "https://isaacpaha.com/tools/first-home-planner",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/first-home-planner.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "First Home Planner | Free AI Tool",
    description: "Get your personalised plan to buy your first home — deposit target, roadmap, credit strategy.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/first-home-planner" },
  keywords: [
    "first home planner", "how to buy first home UK", "first time buyer guide",
    "mortgage readiness", "deposit savings plan", "how much deposit do I need",
    "first time buyer schemes UK", "lifetime ISA calculator",
    "can I afford a house", "mortgage calculator UK", "home buying plan",
    "how to save for a house", "credit score for mortgage",
  ],
};

// ─── Page — server component with optional DB prefetch ───────────────────────

export default async function FirstHomePlannerPage() {
  const clerkUser = await currentUser().catch(() => null);
  let initialPlan = null;

  if (clerkUser) {
    try {
      const user = await prismadb.user.findUnique({
        where:  { clerkId: clerkUser.id },
        select: { id: true },
      });
      if (user) {
        initialPlan = await prismadb.homeOwnershipPlan.findFirst({
          where:   { userId: user.id },
          orderBy: { updatedAt: "desc" },
          include: {
            milestones:  { orderBy: { targetMonth: "asc" } },
            savingsLogs: { orderBy: { savedAt: "desc" }, take: 20 },
          },
        });
      }
    } catch {
      // DB not yet migrated — fail silently, tool still works without saved plan
    }
  }

  return (
    <HomePlannerPage
      isSignedIn={!!clerkUser}
      initialPlan={initialPlan}
    />
  );
}