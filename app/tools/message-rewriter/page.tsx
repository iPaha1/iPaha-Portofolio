// =============================================================================
// isaacpaha.com — Message Rewriter — Dedicated Tool Page
// app/tools/message-rewriter/page.tsx
// Route: /tools/message-rewriter
// =============================================================================

import type { Metadata }       from "next";
import { currentUser }         from "@clerk/nextjs/server";
import { MessageRewriterPage } from "./_message-rewriter/message-rewriter-page";


export const dynamic = 'force-dynamic';

// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Message Rewriter — Say It Better, Instantly | Free AI Tool",
  description:
    "Paste any message and instantly rewrite it in the perfect tone. Professional, polite, confident, friendly, or direct. Get 3 versions, copy with one click. Free, fast, and judgement-free.",
  openGraph: {
    title:       "Message Rewriter — Say It Better, Instantly | Isaac Paha Tools",
    description: "Stop overthinking messages. Paste, pick a tone, and get 3 improved versions instantly. Professional, polite, direct, confident, friendly. Free.",
    url:         "https://isaacpaha.com/tools/message-rewriter",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/message-rewriter.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Message Rewriter — Say It Better, Instantly | Free Tool",
    description: "Paste any message → pick a tone → get 3 improved versions. One click copy. The tool that makes you sound exactly how you want to sound.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/message-rewriter" },
  keywords: [
    "message rewriter", "rewrite text", "professional email", "polite message",
    "AI writing tool", "improve writing", "tone changer", "email rewriter",
    "message improver", "communication tool", "how to sound professional",
    "how to sound polite", "message tone changer",
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MessageRewriterServerPage() {
  const clerkUser = await currentUser().catch(() => null);
  return <MessageRewriterPage />;
}