// =============================================================================
// isaacpaha.com — Math Understanding Engine — Server Page
// app/tools/math-engine/page.tsx
// Route: /tools/math-engine
// =============================================================================

import type { Metadata } from "next";
import { currentUser }   from "@clerk/nextjs/server";
import { MathEnginePage } from "./_math-engine/math-engine-page";


export const metadata: Metadata = {
  title: "Math Understanding Engine — Step-by-Step Maths Explained",
  description:
    "Paste any maths question and get a complete breakdown: step-by-step solution, why the method works, the history behind the concept, real-world applications, and interactive graphs. GCSE, A-Level, University. Free.",
  openGraph: {
    title:       "Math Understanding Engine | Isaac Paha Tools",
    description: "Not just the answer — the why, the history, and where it's used in real life. Free AI maths tool for GCSE, A-Level, and University.",
    url:         "https://isaacpaha.com/tools/math-engine",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/math-engine.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Math Understanding Engine | Free Tool",
    description: "Understand any maths question — not just the answer, but the why, history, and real world.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/math-engine" },
  keywords: [
    "maths explanation tool", "GCSE maths help", "A-Level maths tutor",
    "step by step maths", "why does maths work", "maths understanding",
    "AI maths tutor", "free maths help", "quadratic equations explained",
    "calculus explained", "maths history", "real world maths",
  ],
};

export default async function MathEnginePage_() {
  const clerkUser = await currentUser().catch(() => null);
  return <MathEnginePage isSignedIn={!!clerkUser} />;
}