// =============================================================================
// isaacpaha.com — Ideas AI Brainstorm API
// app/api/admin/ideas/brainstorm/route.ts
//
// POST { mode, prompt, category, context? }
//   mode "generate"  → 3 groundbreaking ideas from a theme
//   mode "expand"    → full 600-900 word article from a title
//   mode "titles"    → 6 alternative title options
//   mode "summary"   → sharp 40-word teaser summary
//   mode "tags"      → 6-8 tag suggestions
//   mode "critique"  → honest critical analysis
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { prismadb }                  from "@/lib/db";

// ─── Anthropic client ─────────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { role: true },
  });
  return user?.role === "ADMIN";
}

// ─── Isaac's persona ──────────────────────────────────────────────────────────

const PERSONA = `You are a thinking partner for Isaac Paha — a First-Class Computing & IT graduate from The Open University, founder of iPaha Ltd (UK software consultancy), iPahaStores Ltd (e-commerce), and Okpah Ltd (African tech products). Isaac writes bold, intellectually honest essays for his Ideas Lab at isaacpaha.com.

His voice:
- Direct, confident, no filler words or corporate speak
- Slightly provocative — willing to challenge consensus
- African-British perspective on tech, society, and business
- Grounded visionary: ideas must have a clear "so what"
- First person. Plain English over jargon.`;

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(mode: string, prompt: string, category: string, context?: string): string {
  const cat = category && category !== "ALL" ? `Category: ${category}. ` : "";
  const ctx = context ? `\n\nContext / existing content:\n${context}` : "";

  switch (mode) {

    case "generate":
      return `${PERSONA}

Generate 3 distinct, groundbreaking Ideas Lab entries for Isaac. ${cat}Theme/prompt: "${prompt}"${ctx}

For each idea produce exactly this structure:

IDEA 1:
TITLE: [punchy, max 10 words]
SUMMARY: [one sentence hook, max 35 words]
CONTENT:
[3 paragraphs — bold opening thesis, development with concrete examples or thought experiments, closing "so what" / implications. 200-250 words total. No bullet points.]
STATUS: [CONCEPT | EXPLORING | DEVELOPING]
TAGS: [4-5 comma-separated tags]

IDEA 2:
[same structure]

IDEA 3:
[same structure]

Make these feel like genuine Isaac thoughts — intellectually bold, slightly provocative, never generic.`;

    case "expand":
      return `${PERSONA}

Write full article content for this Ideas Lab entry.

Title: "${prompt}"
${cat}${ctx}

Produce a 650-900 word essay structured as:
— Opening paragraph: arresting thesis statement, no warm-up
— 3-4 body paragraphs: develop the argument with concrete examples, data, or thought experiments  
— Implications paragraph: what this means, who it affects, the second-order effects
— Closing: leave the reader with a question or provocation, not a summary

Rules: No headers inside the content. No bullet points. Flowing prose only. First person where natural. This is published on isaacpaha.com — it must feel polished and intellectually rigorous.`;

    case "titles":
      return `${PERSONA}

Generate 6 alternative title options for this idea:
"${prompt}"
${cat}

Mix these styles — one provocative question, one bold statement, one "What if..." framing, one unexpected metaphor, one numbered insight, one contrarian take.

Output exactly 6 lines, each starting with a number and period. No explanations, no extra text.`;

    case "summary":
      return `${PERSONA}

Write a sharp teaser summary for this idea (max 40 words):
"${prompt}"
${cat}

The summary appears on the Ideas Lab card. It must: hook immediately, state the central provocation or question, and make the reader want more. No filler. Start strong — don't begin with "This idea" or "In this piece".

Output just the summary text.`;

    case "tags":
      return `${PERSONA}

Suggest 6-8 precise tags for this idea:
"${prompt}"
${cat}

Mix topic tags (e.g. "AI Agents"), theme tags (e.g. "Future of Work"), and regional/audience tags (e.g. "African Tech"). Capitalise naturally. Keep each tag 1-4 words.

Output as a comma-separated list only.`;

    case "critique":
      return `${PERSONA}

Give Isaac honest, sharp critical feedback on this idea:
"${prompt}"
${cat}${ctx}

Cover in 350-450 words:
1. What's genuinely novel or valuable here
2. The strongest counterarguments or objections
3. What's underexplored or missing
4. A sharper angle or more provocative framing Isaac hasn't considered
5. One concrete "yes, but..." refinement

Be a peer, not a cheerleader. Direct and specific.`;

    default:
      return `${PERSONA}\n\n${prompt}`;
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mode = "generate", prompt, category = "ALL", context } = await req.json();

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const userPrompt = buildPrompt(mode, prompt.trim(), category, context);

  try {
    const response = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 2500,
      messages:   [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const content   = textBlock?.type === "text" ? textBlock.text : "";

    return NextResponse.json({ content });

  } catch (err: unknown) {
    if (typeof err === "object" && err !== null) {
      const status = (err as { status?: number }).status;
      const message = (err as { message?: string }).message;
      console.error("[brainstorm] Claude error:", status, message ?? err);

      if (status === 401) {
        return NextResponse.json(
          { error: "Anthropic API key is missing or invalid. Set ANTHROPIC_API_KEY in your .env file." },
          { status: 500 }
        );
      }
    } else {
      console.error("[brainstorm] Claude error:", err);
    }

    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 }
    );
  }
}