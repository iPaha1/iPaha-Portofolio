// =============================================================================
// isaacpaha.com — /about page
// app/about/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { AboutClient } from "./_about/about-client";


export const metadata: Metadata = {
  title: "About | Isaac Paha",
  description:
    "Isaac Paha — First-Class Computing & IT graduate, founder of iPaha Ltd, iPahaStores Ltd, and Okpah Ltd. Building technology that matters across the UK and Ghana since 2019.",
  openGraph: {
    title: "About Isaac Paha",
    description:
      "Technologist, entrepreneur, and thinker. Founder of three companies, builder of seven products, operating across the UK and Ghana.",
    url: "https://www.isaacpaha.com/about",
    type: "profile",
  },
  twitter: {
    title: "About | Isaac Paha",
    description:
      "Founder, builder, and thinker. Three companies. Seven products. UK and Ghana.",
    card: "summary_large_image",
    creator: "@iPaha3",
  },
  alternates: {
    canonical: "https://www.isaacpaha.com/about",
  },
};

export default function AboutPage() {
  return <AboutClient />;
}