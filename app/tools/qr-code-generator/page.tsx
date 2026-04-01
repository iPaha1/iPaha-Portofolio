// =============================================================================
// isaacpaha.com — Custom QR Code Generator — Dedicated Tool Page
// app/tools/qr-code-generator/page.tsx
// Route: /tools/qr-code-generator
// =============================================================================

import type { Metadata }     from "next";
import { currentUser }       from "@clerk/nextjs/server";
import { notFound }          from "next/navigation";
import { getToolBySlug }     from "@/lib/actions/tools-actions";
import { getPublicTools }    from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool } from "../_tools/tools-lab-client";
import { QRGeneratorPage } from "./_qr-code-generator/qr-generator-page";

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
    icon:        t.icon          ?? "⬛",
    accentColor: t.accentColor   ?? CATEGORY_ACCENT[t.category] ?? "#6366f1",
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
  title: "Custom QR Code Generator — Free Branded QR Codes",
  description:
    "Create beautiful, branded QR codes for free. Customise colours, dot shapes, gradients, and logos. Generate QR codes for URLs, LinkedIn, vCard, WiFi, payments, email, and more. Download as PNG or SVG.",
  openGraph: {
    title:       "Custom QR Code Generator | Free Tool — Isaac Paha",
    description: "Beautiful branded QR codes in seconds. 10 types, full design control, AI suggestions, PNG + SVG export.",
    url:         "https://isaacpaha.com/tools/qr-code-generator",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/qr-generator.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Custom QR Code Generator | Free Tool",
    description: "Beautiful branded QR codes. 10 types, full design control, free PNG + SVG download.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/qr-code-generator" },
  keywords: [
    "qr code generator", "custom qr code", "branded qr code", "free qr code",
    "qr code design", "qr code with logo", "linkedin qr code", "vcard qr code",
    "wifi qr code", "qr code download svg", "qr code generator free",
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function QRCodeGeneratorPage() {
  const [clerkUser, rawTool, allTools] = await Promise.all([
    currentUser().catch(() => null),
    getToolBySlug("qr-code-generator"),
    getPublicTools(),
  ]);

  // Tool must exist and be active/public
  if (!rawTool || !rawTool.isActive || !rawTool.isPublic) notFound();

  const tool         = normalise(rawTool);
  const relatedTools = (allTools as DbTool[])
    .filter((t) => t.category === rawTool.category && t.slug !== rawTool.slug && t.status !== "COMING_SOON")
    .slice(0, 3)
    .map(normalise);

  return (
    <QRGeneratorPage
      isSignedIn={!!clerkUser}
      tool={tool}
      relatedTools={relatedTools}
    />
  );
}


// // =============================================================================
// // isaacpaha.com — Custom QR Code Generator — Dedicated Tool Page
// // app/tools/qr-code-generator/page.tsx
// // Route: /tools/qr-code-generator
// // =============================================================================

// import type { Metadata }     from "next";
// import { currentUser }       from "@clerk/nextjs/server";
// import { QRGeneratorPage } from "./_qr-code-generator/qr-generator-page";

// export const dynamic = 'force-dynamic';

// // ─── SEO Metadata ─────────────────────────────────────────────────────────────

// export const metadata: Metadata = {
//   title: "Custom QR Code Generator — Free Branded QR Codes",
//   description:
//     "Create beautiful, branded QR codes for free. Customise colours, dot shapes, gradients, and logos. Generate QR codes for URLs, LinkedIn, vCard, WiFi, payments, email, and more. Download as PNG or SVG.",
//   openGraph: {
//     title:       "Custom QR Code Generator | Free Tool — Isaac Paha",
//     description: "Beautiful branded QR codes in seconds. 10 types, full design control, AI suggestions, PNG + SVG export.",
//     url:         "https://isaacpaha.com/tools/qr-code-generator",
//     type:        "website",
//     images: [{ url: "https://isaacpaha.com/og/qr-generator.png", width: 1200, height: 630 }],
//   },
//   twitter: {
//     card:        "summary_large_image",
//     title:       "Custom QR Code Generator | Free Tool",
//     description: "Beautiful branded QR codes. 10 types, full design control, free PNG + SVG download.",
//     creator:     "@iPaha3",
//   },
//   alternates: { canonical: "https://isaacpaha.com/tools/qr-code-generator" },
//   keywords: [
//     "qr code generator", "custom qr code", "branded qr code", "free qr code",
//     "qr code design", "qr code with logo", "linkedin qr code", "vcard qr code",
//     "wifi qr code", "qr code download svg", "qr code generator free",
//   ],
// };

// // ─── Page ─────────────────────────────────────────────────────────────────────

// export default async function QRCodeGeneratorPage() {
//   const clerkUser = await currentUser().catch(() => null);
//   return <QRGeneratorPage isSignedIn={!!clerkUser} />;
// }

