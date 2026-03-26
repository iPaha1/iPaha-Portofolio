// =============================================================================
// isaacpaha.com — Blog AI Writing Assistant
// app/api/admin/blog/ai/route.ts
//
// POST { mode, prompt, content?, title?, category?, tags?, excerpt? }
//   "draft"      — write full blog post from outline/notes  
//   "expand"     — expand section or paragraph
//   "rewrite"    — rewrite selected text in Isaac's voice
//   "outline"    — generate detailed post outline from title/idea
//   "titles"     — 6 alternative title options
//   "excerpt"    — write compelling meta excerpt/description
//   "tags"       — suggest 6-8 SEO-relevant tags
//   "critique"   — editorial critique: structure, voice, argument
//   "seo"        — SEO analysis + keyword suggestions + meta copy
//   "intro"      — write a powerful opening paragraph
//   "conclusion" — write a strong closing paragraph
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { prismadb }                  from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

// ─── Isaac's full blogging persona ───────────────────────────────────────────

const BLOG_PERSONA = `You are writing as Isaac Paha — a First-Class Computing & IT graduate from The Open University, and founder of three companies: iPaha Ltd (UK software/AI), iPahaStores Ltd (UK e-commerce), and Okpah Ltd (Ghana/West Africa tech products — oKadwuma jobs platform, okDdwa e-commerce, okSika fintech, okSumame delivery, okEdukation schools platform; Paralel Me AI assistant).

## Isaac's Blog Voice
Isaac writes long-form essays at isaacpaha.com — direct, intellectually rigorous, and grounded in lived experience of building in both the UK and West Africa.

Core voice characteristics:
- **Opens strong** — arresting first sentence, no throat-clearing, no "In this article I will…"
- **Uses specific detail** — real numbers, real product names, real situations, not vague generalities  
- **Holds genuine opinions** — willing to be contrarian, challenges Silicon Valley consensus from a global-South perspective
- **First person** — "I", "we", not "one should" or passive voice
- **Shows thinking, not just conclusions** — "Here's what I noticed…" "The question I keep returning to is…"
- **Short sentences when landing a point.** Longer sentences when building an argument.
- **No buzzwords** — no "disruptive", "leverage", "synergy", "ecosystem" without irony
- **References real research / data** when making factual claims — specific enough to be credible
- **Ends with implication** — what the reader should think or do differently, not a "summary of what we covered"

## Strong Views Isaac Holds
- Africa will produce the world's next great technology companies within 15 years
- The leapfrog pattern (mobile money → fintech → logistics → education) will repeat
- Most productivity advice is performative; the real constraint is knowing what matters
- Open University was as good as or better than traditional university for skills that matter
- Building for emerging markets requires rethinking assumptions from first principles
- AI assistants that amplify human judgment beat AI that tries to replace it

## Blog Structure Pattern
- H2 headings (##) for main sections — 3-5 per post
- H3 headings (###) for sub-points when needed
- Blockquotes (> ) for key insights or pullquotes
- **Bold** for emphasis — used sparingly, not for decoration
- Code blocks for technical content
- Lists only when genuinely list-like (not for packaging prose as bullets)
- No "Conclusion" as a heading — the final section should have a substantive title`;

function buildPrompt(mode: string, data: {
  prompt: string; content?: string; title?: string;
  category?: string; tags?: string; excerpt?: string;
  selectedText?: string; contextBefore?: string; contextAfter?: string;
}): string {
  const { prompt, content, title, category, tags, excerpt, selectedText, contextBefore, contextAfter } = data;

  switch (mode) {
    case "draft":
      return `${BLOG_PERSONA}

Write a complete, publishable blog post based on this outline/notes:

${prompt}

${category ? `Category: ${category}` : ""}

Requirements:
- 900–1400 words
- Start with an arresting opening paragraph — bold claim or unexpected observation
- 3-5 H2 sections with substantive titles (not generic "Introduction", "Conclusion")
- Use specific data, examples, and Isaac's own product experience where relevant
- Include 1-2 blockquotes (> ) for key insights
- End with a paragraph about implications — what this means and why it matters now
- Markdown format throughout
- No "Conclusion" section heading — make the final section a substantive argument`;

    case "expand":
      return `${BLOG_PERSONA}

Expand this section/paragraph into richer, more detailed content. Keep Isaac's voice:

Current text:
${selectedText || content}

${contextBefore ? `Context before:\n${contextBefore}` : ""}
${contextAfter  ? `Context after:\n${contextAfter}`   : ""}

Notes/direction: ${prompt}

Return the expanded version only — no preamble, no explanation. 100-250 words.`;

    case "rewrite":
      return `${BLOG_PERSONA}

Rewrite this passage in Isaac's voice — more direct, more specific, stronger:

Original:
${selectedText || content}

Notes: ${prompt}

Return the rewritten version only — same approximate length but sharper. No preamble.`;

    case "outline":
      return `${BLOG_PERSONA}

Create a detailed blog post outline for:

Title/Topic: ${title || prompt}
${category ? `Category: ${category}` : ""}

Produce:
1. A revised/sharpened title (if the original can be improved)
2. A one-sentence thesis / central argument
3. 4-5 H2 section headings with 2-3 bullet points under each describing what that section covers
4. A suggested opening hook (one sentence)
5. Key data points or examples to research/include
6. Suggested tags (6-8)

Format clearly so it can be used as a writing guide.`;

    case "titles":
      return `${BLOG_PERSONA}

Generate 6 alternative title options for this post:

Topic/Current title: ${title || prompt}
${category ? `Category: ${category}` : ""}
${excerpt  ? `Current excerpt: ${excerpt}` : ""}

Mix these styles: provocative question / bold contrarian statement / "The X of Y" / "Why I…" / numbered insight / unexpected angle.

All must feel authentic to Isaac — not clickbait, not corporate. One should be deliberately short and punchy (under 6 words).

Output exactly 6 numbered lines. No explanations.`;

    case "excerpt":
      return `${BLOG_PERSONA}

Write a compelling meta excerpt/description for this post (90-155 characters for SEO, but make it worth reading as prose):

Title: ${title || ""}
Content summary / notes: ${prompt}

The excerpt appears on the blog card and in search results. It should: state the central argument or question, create genuine curiosity, not reveal the full answer.

Return just the excerpt text — no quotes, no label.`;

    case "tags":
      return `${BLOG_PERSONA}

Suggest 8-10 SEO-optimised tags for this blog post:

Title: ${title || ""}
Content: ${prompt || content?.slice(0, 400)}
${category ? `Category: ${category}` : ""}

Mix: specific topic tags, broader theme tags, audience tags, and 1-2 long-tail keyword tags.
Good examples: "African Fintech", "Solo Founder Lessons", "AI Productivity", "Building in Public"

Return as a comma-separated list only. No explanations.`;

    case "critique":
      return `${BLOG_PERSONA}

Give Isaac honest editorial critique of this draft:

Title: ${title || "Unknown"}
Content:
${content?.slice(0, 3000)}

Critique structure (be direct and specific):
1. **Opening** — Does it hook? Does it make a clear claim?
2. **Argument** — Is the central thesis clear? Is it well-supported?
3. **Voice** — Where does it sound like Isaac? Where does it drift generic?
4. **Structure** — Do the sections flow? Any unnecessary detours?
5. **Ending** — Does it leave the reader with something? Too abrupt? Too padded?
6. **One thing to cut** — What's the weakest section/paragraph?
7. **One thing to add** — What's missing that would make this stronger?

Be a peer editor, not a cheerleader. ~350-450 words.`;

    case "seo":
      return `You are an SEO specialist analysing a blog post for Isaac Paha's personal brand site (isaacpaha.com).

Post title: ${title || ""}
Category: ${category || ""}
Current tags: ${tags || ""}
Content (first 500 words): ${content?.slice(0, 500) || ""}

Provide a structured SEO analysis:

**Primary keyword** — what is the best target keyword for this post?
**Secondary keywords** — 3-4 related terms to naturally include
**Meta title** — optimised title (50-60 chars) including primary keyword
**Meta description** — compelling description (150-160 chars)
**Issues** — 3-5 specific issues: keyword density, missing headers, internal linking opportunities, image alt text, etc.
**Quick wins** — 3 specific changes that would most improve ranking

Format with clear headers. Be specific and actionable.`;

    case "intro":
      return `${BLOG_PERSONA}

Write a powerful opening paragraph (80-130 words) for this blog post:

Title: ${title || prompt}
${category ? `Category: ${category}` : ""}
${content  ? `Post notes/draft:\n${content.slice(0, 400)}` : ""}

Rules:
- First sentence must be surprising, specific, or challenging — no warm-up
- No "In this post I will…" or "Today we're going to…"
- State the thesis or central question by the end of the paragraph
- Should make the reader feel they're about to read something worth their time

Return just the paragraph — no preamble, no label.`;

    case "conclusion":
      return `${BLOG_PERSONA}

Write a strong final section (120-180 words) for this post. Do NOT use "Conclusion" as a heading.

Title: ${title || ""}
Content so far:
${content?.slice(-800) || prompt}

The closing should:
- Make the central argument land with weight — not summarise, but synthesise
- Give the reader something to do or think about differently
- End with a single memorable sentence — not a call to action, not "if you enjoyed this"
- Optionally include a rhetorical question or provocation

Return the section with a substantive H2 heading and the body text.`;

    default:
      return `${BLOG_PERSONA}\n\nTask: ${prompt}\n\nContent context:\n${content?.slice(0, 1000) || ""}`;
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { mode = "draft", prompt, ...rest } = body;

  if (!prompt?.trim() && !rest.content?.trim() && !rest.title?.trim()) {
    return NextResponse.json({ error: "prompt, content, or title required" }, { status: 400 });
  }

  const userPrompt = buildPrompt(mode, { prompt: prompt ?? "", ...rest });
  const maxTokens  = ["draft"].includes(mode) ? 3000 : 1200;

  try {
    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages:   [{ role: "user", content: userPrompt }],
    });
    const content = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ content });
  } catch (err: unknown) {
    console.error("[blog/ai]", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}