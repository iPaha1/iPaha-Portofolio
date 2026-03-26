// =============================================================================
// isaacpaha.com — /podcast page
// app/podcast/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { PodcastClient } from "./_podcast/podcast-client";


export const metadata: Metadata = {
  title: "Signal & Noise — Podcast | Isaac Paha",
  description:
    "Signal & Noise — a podcast by Isaac Paha about building companies, African technology, AI, and ideas worth holding onto. Launching Q3 2026.",
  openGraph: {
    title: "Signal & Noise | Isaac Paha's Podcast",
    description:
      "A podcast about building companies, African technology, AI, and ideas worth holding onto. Hosted by Isaac Paha. Launching Q3 2026.",
    url: "https://www.isaacpaha.com/podcast",
    type: "website",
  },
  twitter: {
    title: "Signal & Noise | Isaac Paha",
    description:
      "Conversations worth having. A podcast on building, African tech & AI. Launching Q3 2026.",
    card: "summary_large_image",
    creator: "@iPaha3",
  },
  alternates: {
    canonical: "https://www.isaacpaha.com/podcast",
  },
  keywords: [
    "Isaac Paha podcast",
    "Signal and Noise podcast",
    "African technology podcast",
    "startup podcast",
    "building companies podcast",
    "AI podcast",
    "founder podcast",
  ],
};

export default function PodcastPage() {
  return <PodcastClient />;
}