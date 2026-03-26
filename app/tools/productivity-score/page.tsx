// =============================================================================
// isaacpaha.com — Productivity Score — Dedicated Tool Page
// app/tools/productivity-score/page.tsx
// Route: /tools/productivity-score
// =============================================================================

import type { Metadata } from "next";
import { currentUser } from "@clerk/nextjs/server";
import { ProductivityScorePage } from "./_productivity-score/productivity-score-page";


export const metadata: Metadata = {
  title: "Productivity Score — Find What's Slowing You Down | Free Audit Tool",
  description:
    "Take a 20-question audit of your work habits, focus, and daily systems. Get a personalised productivity score, uncover hidden bottlenecks, and receive a clear, actionable plan to improve how you work — instantly.",
  openGraph: {
    title: "Productivity Score — Free Audit Tool | Isaac Paha",
    description: "Find what's slowing you down and fix it today. Get your personalised score, bottleneck detection, and 3-step action plan.",
    url: "https://isaacpaha.com/tools/productivity-score",
    type: "website",
    images: [{ url: "https://isaacpaha.com/og/productivity-score.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Productivity Score — Free Audit Tool",
    description: "20 questions. 90 seconds. Get your score + a plan to work better.",
    creator: "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/productivity-score" },
  keywords: [
    "productivity score", "productivity audit", "focus test", "work habits",
    "time management", "productivity tool", "how productive am I",
    "bottleneck detection", "productivity assessment", "workflow audit",
    "productivity quiz",
  ],
};

export default async function ProductivityScoreServerPage() {
  const clerkUser = await currentUser().catch(() => null);
  return <ProductivityScorePage isSignedIn={!!clerkUser} />;
}