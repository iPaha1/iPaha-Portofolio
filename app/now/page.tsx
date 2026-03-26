// =============================================================================
// isaacpaha.com — /now page
// app/now/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { NowClient } from "./_now/now-client";


export const metadata: Metadata = {
  title: "Now — What Isaac Is Doing | Isaac Paha",
  description:
    "A living snapshot of what Isaac Paha is building, reading, thinking about, and working on right now. Updated regularly. Honest, not curated.",
  openGraph: {
    title: "Now | Isaac Paha",
    description:
      "What Isaac is building, reading, and thinking about right now. A living /now page — updated regularly.",
    url: "https://www.isaacpaha.com/now",
    type: "website",
  },
  twitter: {
    title: "Now | Isaac Paha",
    description: "A living snapshot of what Isaac is up to right now — building, reading, thinking.",
    card: "summary_large_image",
    creator: "@iPaha3",
  },
  alternates: {
    canonical: "https://www.isaacpaha.com/now",
  },
  keywords: [
    "Isaac Paha now",
    "what Isaac is building",
    "founder now page",
    "now page",
    "currently reading",
    "currently building",
    "nownownow",
  ],
};

export default function NowPage() {
  return <NowClient />;
}