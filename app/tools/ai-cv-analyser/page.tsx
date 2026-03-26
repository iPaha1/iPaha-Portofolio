// =============================================================================
// isaacpaha.com — AI CV Analyser Pro — Dedicated Tool Page
// app/tools/ai-cv-analyser/page.tsx
// Route: /tools/ai-cv-analyser
// =============================================================================

import type { Metadata } from "next";
import { currentUser }   from "@clerk/nextjs/server";
import { CVAnalyserPage } from "./_ai-cv-analyser/ai-cv-analyser-page";

export const dynamic = 'force-dynamic';

// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "AI CV Analyser Pro — ATS Check, Keyword Gap & Rewrite Tool",
  description:
    "Free AI-powered CV analyser. Get your ATS score, keyword gap analysis vs a job description, section-by-section feedback, bullet point rewrites, and interview questions — in 8 seconds.",
  openGraph: {
    title:       "AI CV Analyser Pro | Free Tool — Isaac Paha",
    description: "ATS score, keyword gap analysis, section feedback, bullet rewrites & interview prep. Free.",
    url:         "https://isaacpaha.com/tools/ai-cv-analyser",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/cv-analyser.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "AI CV Analyser Pro | Free Tool",
    description: "ATS score, keyword gap analysis, bullet rewrites and interview prep in 8 seconds.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/ai-cv-analyser" },
  keywords: [
    "CV analyser", "resume analyzer", "ATS checker", "keyword gap analysis",
    "CV feedback", "resume feedback", "ATS score", "CV rewriter",
    "job application CV", "AI resume checker", "CV improvement tool",
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AICVAnalyserPage() {
  const clerkUser = await currentUser().catch(() => null);
  return <CVAnalyserPage isSignedIn={!!clerkUser} />;
}