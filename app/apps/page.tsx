// =============================================================================
// isaacpaha.com — /apps page
// app/apps/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { AppsClient } from "./_apps/apps-client";


export const metadata: Metadata = {
  title: "Apps — Isaac Paha | Products I've Built & Shipped",
  description:
    "Seven commercial applications across three companies — from AI productivity tools and fintech for the underbanked to the West Africa's leading jobs platform. Real products, real users.",
  openGraph: {
    title: "Apps | Isaac Paha",
    description:
      "Seven commercial applications across three companies — from AI productivity tools to West Africa's leading jobs platform.",
    url: "https://www.isaacpaha.com/apps",
    type: "website",
  },
  twitter: {
    title: "Apps | Isaac Paha",
    description:
      "Seven commercial applications across three companies. Real products, real users.",
    card: "summary_large_image",
    creator: "@iPaha3",
  },
  alternates: {
    canonical: "https://www.isaacpaha.com/apps",
  },
  keywords: [
    "Isaac Paha apps",
    "oKadwuma",
    "okDdwa",
    "okSika",
    "Paralel Me",
    "iPahaStore",
    "Ghana tech",
    "West Africa apps",
    "UK startup",
    "founder portfolio",
  ],
};

export default function AppsPage() {
  return <AppsClient />;
}