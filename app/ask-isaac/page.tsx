// =============================================================================
// isaacpaha.com — /ask-isaac page
// app/ask-isaac/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { AskIsaacPage } from "./_ask-isaac/ask-isaac-page";


export const metadata: Metadata = {
  title: "Ask Isaac — AI-Powered Q&A | Isaac Paha",
  description:
    "Direct access to how Isaac Paha thinks — about startups, Africa, technology, building products, and life. Ask anything. Get honest answers from lived experience.",
  openGraph: {
    title: "Ask Isaac | Isaac Paha",
    description:
      "AI-powered access to Isaac's thinking on startups, Africa, technology, and life. Real answers from real experience.",
    url: "https://www.isaacpaha.com/ask-isaac",
    type: "website",
  },
  twitter: {
    title: "Ask Isaac | Isaac Paha",
    description:
      "Ask Isaac anything — startups, Africa, tech, building, life. AI-powered, experience-grounded.",
    card: "summary_large_image",
    creator: "@iPaha3",
  },
  alternates: {
    canonical: "https://www.isaacpaha.com/ask-isaac",
  },
  keywords: [
    "Ask Isaac Paha",
    "startup advice",
    "Africa tech",
    "building products",
    "founder Q&A",
    "Ghana technology",
    "AI assistant",
  ],
};

export default function AskIsaacPageRoute() {
  return <AskIsaacPage />;
}