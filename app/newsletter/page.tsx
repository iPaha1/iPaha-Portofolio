// =============================================================================
// isaacpaha.com — /newsletter page
// app/newsletter/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { NewsletterClient } from "./_newsletter/newsletter-client";


export const metadata: Metadata = {
  title: "The Signal — Newsletter | Isaac Paha",
  description:
    "A fortnightly dispatch on building companies, African technology, AI, and ideas worth thinking about. Written by Isaac Paha. Free. 4,800+ readers. 52% open rate.",
  openGraph: {
    title: "The Signal | Isaac Paha's Newsletter",
    description:
      "A fortnightly dispatch on building, African tech, AI, and ideas worth thinking about. Free. 4,800+ readers.",
    url: "https://www.isaacpaha.com/newsletter",
    type: "website",
  },
  twitter: {
    title: "The Signal | Isaac Paha",
    description:
      "Fortnightly dispatch on building companies, African technology and AI. Free. Join 4,800+ readers.",
    card: "summary_large_image",
    creator: "@iPaha3",
  },
  alternates: {
    canonical: "https://www.isaacpaha.com/newsletter",
  },
  keywords: [
    "Isaac Paha newsletter",
    "The Signal newsletter",
    "African technology newsletter",
    "founder newsletter",
    "startup newsletter",
    "building companies newsletter",
    "AI newsletter",
  ],
};

export default function NewsletterPage() {
  return <NewsletterClient />;
}