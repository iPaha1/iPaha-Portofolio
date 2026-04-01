// =============================================================================
// isaacpaha.com — Message Rewriter — Dedicated Tool Page
// app/tools/message-rewriter/page.tsx
// Route: /tools/message-rewriter
// =============================================================================

import type { Metadata }       from "next";
import { currentUser }         from "@clerk/nextjs/server";
import { notFound }            from "next/navigation";
import { getToolBySlug }       from "@/lib/actions/tools-actions";
import { getPublicTools }      from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool } from "../_tools/tools-lab-client";
import { MessageRewriterPage } from "./_message-rewriter/message-rewriter-page";

export const dynamic = 'force-dynamic';

// ─── Field normaliser (mirrors tools-lab-client.tsx normalise()) ──────────────

const CATEGORY_ACCENT: Record<string, string> = {
  AI:           "#f59e0b",
  CAREER:       "#ec4899",
  FINANCE:      "#14b8a6",
  STARTUP:      "#10b981",
  EDUCATION:    "#8b5cf6",
  PRODUCTIVITY: "#14b8a6",
  WRITING:      "#3b82f6",
  OTHER:        "#6b7280",
};

function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p.filter((t): t is string => typeof t === "string") : [];
  } catch { return []; }
}

function parseFeatures(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((f): f is string => typeof f === "string");
  if (typeof raw === "string") {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalise(t: any): NormalisedTool {
  return {
    id:          t.id,
    slug:        t.slug,
    name:        t.name,
    tagline:     t.tagLine,
    description: t.description,
    category:    t.category,
    status:      t.status,
    icon:        t.icon          ?? "✍️",
    accentColor: t.accentColor   ?? CATEGORY_ACCENT[t.category] ?? "#e11d48",
    tags:        parseTags(t.tags),
    features:    parseFeatures(t.features),
    usageCount:  t.usageCount    ?? 0,
    tokenCost:   t.tokenCost     ?? undefined,
    ratingAvg:   t.ratingAvg     ?? 0,
    ratingCount: t.ratingCount   ?? 0,
    isFeatured:  t.isFeatured,
    isNew:       t.isNew,
    isPremium:   t.isPremium,
    coverImage:  t.coverImage    ?? undefined,
  };
}

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
  const [clerkUser, rawTool, allTools] = await Promise.all([
    currentUser().catch(() => null),
    getToolBySlug("message-rewriter"),
    getPublicTools(),
  ]);

  // Tool must exist and be active/public
  if (!rawTool || !rawTool.isActive || !rawTool.isPublic) notFound();

  const tool = normalise(rawTool);
  const relatedTools = (allTools as DbTool[])
    .filter((t) => t.category === rawTool.category && t.slug !== rawTool.slug && t.status !== "COMING_SOON")
    .slice(0, 3)
    .map(normalise);

  return (
    <MessageRewriterPage
      isSignedIn={!!clerkUser}
      tool={tool}
      relatedTools={relatedTools}
    />
  );
}





// // =============================================================================
// // isaacpaha.com — Message Rewriter — Dedicated Tool Page
// // app/tools/message-rewriter/page.tsx
// // Route: /tools/message-rewriter
// // =============================================================================

// import type { Metadata }       from "next";
// import { currentUser }         from "@clerk/nextjs/server";
// import { MessageRewriterPage } from "./_message-rewriter/message-rewriter-page";


// export const dynamic = 'force-dynamic';

// // ─── SEO Metadata ─────────────────────────────────────────────────────────────

// export const metadata: Metadata = {
//   title: "Message Rewriter — Say It Better, Instantly | Free AI Tool",
//   description:
//     "Paste any message and instantly rewrite it in the perfect tone. Professional, polite, confident, friendly, or direct. Get 3 versions, copy with one click. Free, fast, and judgement-free.",
//   openGraph: {
//     title:       "Message Rewriter — Say It Better, Instantly | Isaac Paha Tools",
//     description: "Stop overthinking messages. Paste, pick a tone, and get 3 improved versions instantly. Professional, polite, direct, confident, friendly. Free.",
//     url:         "https://isaacpaha.com/tools/message-rewriter",
//     type:        "website",
//     images: [{ url: "https://isaacpaha.com/og/message-rewriter.png", width: 1200, height: 630 }],
//   },
//   twitter: {
//     card:        "summary_large_image",
//     title:       "Message Rewriter — Say It Better, Instantly | Free Tool",
//     description: "Paste any message → pick a tone → get 3 improved versions. One click copy. The tool that makes you sound exactly how you want to sound.",
//     creator:     "@iPaha3",
//   },
//   alternates: { canonical: "https://isaacpaha.com/tools/message-rewriter" },
//   keywords: [
//     "message rewriter", "rewrite text", "professional email", "polite message",
//     "AI writing tool", "improve writing", "tone changer", "email rewriter",
//     "message improver", "communication tool", "how to sound professional",
//     "how to sound polite", "message tone changer",
//   ],
// };

// // ─── Page ─────────────────────────────────────────────────────────────────────

// export default async function MessageRewriterServerPage() {
//   const clerkUser = await currentUser().catch(() => null);
//   return <MessageRewriterPage />;
// }