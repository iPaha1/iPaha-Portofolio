// =============================================================================
// isaacpaha.com — Smart Budget Survival Planner — Dedicated Tool Page
// app/tools/smart-budget-planner/page.tsx
// Route: /tools/smart-budget-planner
// =============================================================================

import type { Metadata }       from "next";
import { currentUser }         from "@clerk/nextjs/server";
import { BudgetPlannerPage } from "./_smart-budget-planner/budget-planner-page";

export const dynamic = 'force-dynamic';

// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Smart Budget Survival Planner — Can You Survive on This?",
  description:
    "Enter your total budget, fixed costs, and flexible spending to get a personalised day-by-day survival plan with daily limits, risk assessment, cut suggestions, scenario testing, and an AI budget coach. Free.",
  openGraph: {
    title:       "Smart Budget Survival Planner | Free Tool — Isaac Paha",
    description: "\"Can I survive on £500 for 30 days?\" — find out in seconds with a full day-by-day plan.",
    url:         "https://isaacpaha.com/tools/smart-budget-planner",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/budget-planner.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Smart Budget Survival Planner | Free Tool",
    description: "Your daily survival budget, risk level, and exact cut suggestions — instant, free, and judgment-free.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/smart-budget-planner" },
  keywords: [
    "budget planner", "survival budget", "daily budget calculator",
    "can I afford", "how to make money last", "budget breakdown",
    "money survival plan", "budget tool UK", "AI budget planner",
    "how to stretch money", "tight budget plan",
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SmartBudgetPlannerPage() {
  const clerkUser = await currentUser().catch(() => null);
  return <BudgetPlannerPage isSignedIn={!!clerkUser} />;
}