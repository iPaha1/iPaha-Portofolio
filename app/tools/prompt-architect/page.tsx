// =============================================================================
// isaacpaha.com — Prompt Architect — Dedicated Tool Page
// app/tools/prompt-architect/page.tsx
// =============================================================================

import type { Metadata }    from "next";
import { auth }             from "@clerk/nextjs/server";
import { notFound }         from "next/navigation";
import { prismadb }         from "@/lib/db";
import { getToolBySlug, getPublicTools } from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool }   from "../_tools/tools-lab-client";
import { PromptArchitectPage } from "./_prompt-architect/prompt-architect-page";


export const dynamic = "force-dynamic";

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
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p.filter((t): t is string => typeof t === "string") : []; }
  catch { return []; }
}
function parseFeatures(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((f): f is string => typeof f === "string");
  if (typeof raw === "string") { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } }
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
    icon:        t.icon        ?? "⚡",
    accentColor: t.accentColor ?? CATEGORY_ACCENT[t.category] ?? "#f59e0b",
    tags:        parseTags(t.tags),
    features:    parseFeatures(t.features),
    usageCount:  t.usageCount  ?? 0,
    tokenCost:   t.tokenCost   ?? undefined,
    ratingAvg:   t.ratingAvg   ?? 0,
    ratingCount: t.ratingCount ?? 0,
    isFeatured:  t.isFeatured,
    isNew:       t.isNew,
    isPremium:   t.isPremium,
    coverImage:  t.coverImage  ?? undefined,
    buildTime:   t.buildTime   ?? undefined,
  };
}

export const metadata: Metadata = {
  title:       "Prompt Architect — Build Expert-Level AI Prompts That Actually Work | Isaac Paha",
  description: "Stop getting mediocre AI responses. Prompt Architect turns your rough idea into a precision-engineered prompt — for Claude, ChatGPT, Gemini, Midjourney and more. Score your existing prompts and learn exactly what to fix.",
  openGraph: {
    title:       "Prompt Architect | Isaac Paha Tools",
    description: "The problem isn't the AI. It's your prompt. Build expert-level prompts for any AI model, any task.",
    url:         "https://isaacpaha.com/tools/prompt-architect",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/prompt-architect.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "The problem isn't the AI — it's your prompt. Fix it in seconds.",
    description: "Build expert prompts for Claude, ChatGPT, Gemini, Midjourney & more. Free prompt scorer included.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/prompt-architect" },
  keywords: [
    "AI prompt generator", "prompt engineering tool", "ChatGPT prompt builder",
    "Claude prompt generator", "Midjourney prompt generator", "prompt optimizer",
    "how to write AI prompts", "prompt scorer", "chain of thought prompting",
    "few shot prompting", "system prompt generator", "AI prompt templates",
    "prompt engineering tutorial", "better AI prompts", "prompt library",
  ],
};

export default async function PromptArchitectPageRoute() {
  const { userId } = await auth();

  const [rawTool, allTools] = await Promise.all([
    getToolBySlug("prompt-architect"),
    getPublicTools(),
  ]);

  if (!rawTool || !rawTool.isActive || !rawTool.isPublic) notFound();

  const tool         = normalise(rawTool);
  const relatedTools = (allTools as DbTool[])
    .filter((t) => t.category === rawTool.category && t.slug !== rawTool.slug && t.status !== "COMING_SOON")
    .slice(0, 3)
    .map(normalise);

  let isSignedIn = false;
  if (userId) {
    const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
    isSignedIn = !!user;
  }

  return <PromptArchitectPage isSignedIn={isSignedIn} tool={tool} relatedTools={relatedTools} />;
}