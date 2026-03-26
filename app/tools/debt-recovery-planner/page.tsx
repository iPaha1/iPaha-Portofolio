// =============================================================================
// isaacpaha.com — AI Debt Recovery Planner — Dedicated Tool Page
// app/tools/debt-recovery-planner/page.tsx
// Route: /tools/debt-recovery-planner
// =============================================================================

import type { Metadata }    from "next";
import { currentUser }      from "@clerk/nextjs/server";
import { DebtPlannerPage } from "./_debt-recovery-planner/debt-planner-page";


// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "AI Debt Recovery Planner — Free Personalised Debt Repayment Plan",
  description:
    "Enter your debts, income, and expenses to get a personalised AI-generated repayment roadmap. Snowball or avalanche strategy, month-by-month timeline, weekly action plan, scenario simulation, and an AI financial coach — all free.",
  openGraph: {
    title:       "AI Debt Recovery Planner | Free Tool — Isaac Paha",
    description: "Turn financial stress into a clear, step-by-step plan. Free personalised debt repayment roadmap with AI coaching.",
    url:         "https://isaacpaha.com/tools/debt-recovery-planner",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/debt-planner.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "AI Debt Recovery Planner | Free Tool",
    description: "Free personalised debt repayment roadmap with AI coaching. Turn financial stress into a clear plan.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/debt-recovery-planner" },
  keywords: [
    "debt repayment plan", "debt recovery planner", "how to pay off debt",
    "debt snowball calculator", "debt avalanche calculator",
    "free debt planner", "AI debt advice", "debt payoff timeline",
    "budgeting tool", "personal finance planner",
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DebtRecoveryPlannerPage() {
  const clerkUser = await currentUser().catch(() => null);
  return <DebtPlannerPage isSignedIn={!!clerkUser} />;
}