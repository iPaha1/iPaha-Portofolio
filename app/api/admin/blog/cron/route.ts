// =============================================================================
// isaacpaha.com — Blog AI Cron Job
// app/api/admin/blog/cron/route.ts
//
// GET  → status + history
// POST { action: "run" | "configure" | "stop", settings? } → manual trigger or config
//
// The cron taps into:
//   1. Isaac's Now page entries (current focus, reading, thoughts)
//   2. Timeline events (for milestone/journey posts)  
//   3. Knowledge items (for book review / learning posts)
//   4. Existing blog posts (to avoid duplication, find gaps)
//   5. External knowledge base prompt (Isaac's strong views, expertise)
//
// Generated posts are saved as DRAFT with authorBio containing "AI_GENERATED"
// tag so Isaac can filter, review, edit, critique and publish.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { prismadb }                  from "@/lib/db";
import {
  getCronSettings, saveCronSettings, getCronHistory, saveCronHistory,
  generateUniqueBlogSlug,
} from "@/lib/actions/blog-actions";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

// ─── Isaac's knowledge base for cron posts ───────────────────────────────────

const ISAAC_KNOWLEDGE_BASE = `
## Isaac Paha — Expert Knowledge Base for Blog Post Generation

### Who Isaac Is
First-Class Computing & IT graduate, The Open University. Founder of:
- **Okpah Ltd** (Ghana): oKadwuma (jobs, 8,500+ users), okDdwa (e-commerce, ₵280k GMV/mo), okSika (fintech, 3,400 beta users), okSumame (delivery, building), okEdukation (schools, coming soon)
- **iPaha Ltd** (UK): Paralel Me (AI productivity, 1,200 beta users, 4.8/5 rating)
- **iPahaStores Ltd** (UK): Multi-vendor marketplace, 340+ vendors, £180k GMV/mo

### Deep Expertise Areas
1. **African tech ecosystem** — mobile money, leapfrog patterns, trust dynamics, informal economy, market entry
2. **Fintech for the underbanked** — M-Pesa model, savings products, micro-lending, digital identity
3. **Last-mile logistics in Africa** — informal courier networks, data reconciliation, courier API integration
4. **Solo founding** — systems over hustle, craft framing, deep work, staying sane
5. **AI for productivity** — system prompts, fine-tuning vs prompting, AI tools that amplify vs replace
6. **Education technology** — digital literacy, access inequality, mobile-first learning
7. **Open University / non-traditional education** — value of self-directed learning, first-class results
8. **UK-Ghana dual context** — building across two very different regulatory/cultural environments

### Strong Opinions to Write From
- Trust, not payments, is the core problem in African e-commerce
- The best products are built by people who are the user
- AI productivity tools optimise the wrong variable (throughput instead of choice of task)
- Africa will produce the next trillion-dollar tech companies within 15 years
- Open University education was as rigorous as traditional university, and more self-directed
- Building alone is sustainable as craft, not as grind
- Most startup advice is written from the US context and doesn't translate to emerging markets
- Real-time systems are the hardest engineering problem in logistics tech

### Writing Themes That Resonate With Isaac's Audience
- "Building in public" posts about specific technical/product challenges
- Essays connecting Africa's tech trajectory to global patterns
- Honest startup lessons that contrast with Twitter-founder mythology
- Learning posts about books, technical topics, mental models
- Fintech/logistics deep-dives for founders in similar spaces
`;

// ─── Pull context from DB ─────────────────────────────────────────────────────

async function gatherContext(): Promise<string> {
  const [nowEntries, knowledgeItems, recentPosts, timelineHighlights] = await Promise.all([
    prismadb.nowPage.findMany({
      where: { isPublished: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 2,
      select: { title: true, content: true, month: true, year: true },
    }),
    prismadb.knowledgeItem.findMany({
      where: { isRecommended: true },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { title: true, author: true, type: true, notes: true, description: true },
    }),
    prismadb.blogPost.findMany({
      where:   { status: "PUBLISHED", deletedAt: null },
      orderBy: { publishedAt: "desc" },
      take:    10,
      select:  { title: true, tags: true },
    }),
    prismadb.timelineEvent.findMany({
      where: { isHighlight: true },
      orderBy: { year: "desc" },
      take: 5,
      select: { title: true, description: true, year: true, type: true },
    }),
  ]);

  const sections: string[] = [];

  if (nowEntries.length) {
    sections.push(`## What Isaac is Doing Now\n${nowEntries.map((e) =>
      `${e.title} (${e.month}/${e.year}):\n${e.content.slice(0, 600)}…`
    ).join("\n\n")}`);
  }

  if (knowledgeItems.length) {
    sections.push(`## Isaac's Recent Reading / Learning\n${knowledgeItems.map((k) =>
      `- **${k.title}** by ${k.author ?? "Unknown"} (${k.type}): ${k.notes ?? k.description ?? ""}`
    ).join("\n")}`);
  }

  if (timelineHighlights.length) {
    sections.push(`## Recent Milestones\n${timelineHighlights.map((t) =>
      `- ${t.year}: ${t.title} — ${t.description}`
    ).join("\n")}`);
  }

  if (recentPosts.length) {
    sections.push(`## Already Published (avoid duplicating these topics)\n${recentPosts.map((p) => `- ${p.title}`).join("\n")}`);
  }

  return sections.join("\n\n");
}

// ─── Generate a single AI blog post ──────────────────────────────────────────

async function generateBlogPost(category: string, context: string): Promise<{
  title: string; slug: string; excerpt: string; content: string; tags: string[];
}> {
  const prompt = `You are writing as Isaac Paha — direct, intellectually honest, building across UK and West Africa. Write a complete, publishable blog post.

${ISAAC_KNOWLEDGE_BASE}

## Current Context (what Isaac is working on / reading / thinking about right now)
${context}

## Instructions
Category: ${category}
Generate a COMPLETE blog post in Isaac's voice and style. 

Requirements:
- Title: punchy, specific, avoiding generic phrasing
- 900-1200 words
- Markdown format (## headings, **bold**, > blockquotes, code blocks where needed)
- Strong opening that makes a claim immediately — no warm-up
- 3-4 H2 sections with substantive titles
- At least one blockquote with a key insight
- At least one specific data point, example from Isaac's work, or concrete observation
- Ends with implications, not a summary
- Excerpt: 120-155 character description for search/card display

Output EXACTLY this JSON (no markdown wrapping, no preamble):
{
  "title": "post title here",
  "excerpt": "120-155 char excerpt here",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "content": "full markdown content here"
}`;

  const message = await anthropic.messages.create({
    model:      "claude-sonnet-4-20250514",
    max_tokens: 3500,
    messages:   [{ role: "user", content: prompt }],
  });

  const raw  = message.content[0].type === "text" ? message.content[0].text : "{}";
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  return JSON.parse(clean);
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [settings, history] = await Promise.all([getCronSettings(), getCronHistory()]);
  return NextResponse.json({ settings, history });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, settings: newSettings } = await req.json();

  // ── Configure ──────────────────────────────────────────────────────────────
  if (action === "configure" && newSettings) {
    await saveCronSettings(newSettings);
    return NextResponse.json({ ok: true, settings: newSettings });
  }

  // ── Manual run ─────────────────────────────────────────────────────────────
  if (action === "run") {
    const settings = await getCronSettings();
    const history  = await getCronHistory();
    const categories: string[] = Array.isArray((settings as Record<string, unknown>)?.categories) ? (settings as Record<string, unknown>).categories as string[] : ["AI", "Africa", "Technology"];

    // Pick a category to write about (rotate)
    const nextCategoryIndex = history.length % categories.length;
    const category = categories[nextCategoryIndex];

    const runId    = `run_${Date.now()}`;
    const startedAt = new Date().toISOString();

    try {
      const context  = await gatherContext();
      const generated = await generateBlogPost(category, context);

      // Get the admin user for author fields
      const { userId: clerkId } = await auth();
      const adminUser = clerkId
        ? await prismadb.user.findUnique({ where: { clerkId }, select: { id: true, displayName: true, avatarUrl: true } })
        : null;

      const slug = await generateUniqueBlogSlug(generated.title);

      const post = await prismadb.blogPost.create({
        data: {
          title:             generated.title,
          slug,
          excerpt:           generated.excerpt,
          content:           generated.content,
          status:            (settings as Record<string, unknown>)?.autoPublish ? "PUBLISHED" : "DRAFT",
          tags:              JSON.stringify(generated.tags),
          authorId:          adminUser?.id    ?? "system",
          authorName:        adminUser?.displayName ?? "Isaac Paha",
          authorImage:       adminUser?.avatarUrl ?? null,
          authorBio:         "AI_GENERATED", // sentinel flag for filtering
          wordCount:         generated.content.trim().split(/\s+/).length,
          readingTimeMinutes: Math.max(1, Math.round(generated.content.trim().split(/\s+/).length / 200)),
          publishedAt:       (settings as Record<string, unknown>)?.autoPublish ? new Date() : null,
        },
      });

      // Save run history
      const newHistory = [{
        id: runId, startedAt, completedAt: new Date().toISOString(),
        category, status: "success",
        postId: post.id, postTitle: post.title, postSlug: post.slug,
      }, ...history];
      await saveCronHistory(newHistory);

      // Update lastRun in settings
      await saveCronSettings({ ...(settings as Record<string, unknown>), lastRun: new Date().toISOString() });

      return NextResponse.json({ ok: true, post: { id: post.id, title: post.title, slug: post.slug }, runId });
    } catch (err: unknown) {
      console.error("[blog/cron]", err);
      const newHistory = [{
        id: runId, startedAt, completedAt: new Date().toISOString(),
        category, status: "error", error: (err as Error).message ?? "Unknown error",
      }, ...history];
      await saveCronHistory(newHistory);
      return NextResponse.json({ error: "Generation failed", details: (err as Error).message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}