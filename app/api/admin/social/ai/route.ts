// =============================================================================
// isaacpaha.com — Social AI Writing Assistant
// app/api/admin/social/ai/route.ts
//
// POST { mode, prompt, platform?, content?, topic? }
//   "write"       → write a post for a specific platform from a topic/notes
//   "adapt"       → adapt existing content for a different platform
//   "thread"      → turn content into a Twitter thread
//   "hook"        → write 5 alternative opening hooks
//   "hashtags"    → suggest 10-15 optimal hashtags
//   "viral"       → analyse what makes a post viral + rewrite for virality
//   "critique"    → give honest critique + improvement suggestions
//   "repurpose"   → take a blog post excerpt and turn into 3 social variants
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

// ─── Platform constraints ─────────────────────────────────────────────────────

const PLATFORM_RULES: Record<string, { charLimit: number; style: string }> = {
  TWITTER:   { charLimit: 280,  style: "Punchy, direct, opinionated. Short sentences. One strong idea. Can use thread format. Hook in the first line." },
  LINKEDIN:  { charLimit: 3000, style: "Professional but personal. Storytelling format. Problem → insight → takeaway. Use line breaks for readability. End with a question or call-to-action." },
  FACEBOOK:  { charLimit: 2000, style: "Conversational and warm. Slightly longer form. Can use emojis sparingly. Stories and personal anecdotes work well." },
  INSTAGRAM: { charLimit: 2200, style: "Visual storytelling. Start with a hook. Use line breaks. End with a call to action. Hashtags at the bottom." },
  THREADS:   { charLimit: 500,  style: "Casual, conversational. Short takes. Opinions and observations. Less formal than LinkedIn." },
  TIKTOK:    { charLimit: 2200, style: "High energy, youth-oriented but not pandering. Strong hook. Trend-aware. Captions for videos." },
  YOUTUBE:   { charLimit: 5000, style: "Informative video description. Keywords for SEO. Chapters if long video. Links and CTAs." },
};

// ─── Isaac's social voice ──────────────────────────────────────────────────────

const ISAAC_SOCIAL_VOICE = `You are writing social media posts as Isaac Paha — founder of 3 tech companies across UK and Ghana. Direct, intellectually honest, grounded in real experience building in emerging markets.

Isaac's social voice:
- Makes bold, specific claims backed by real numbers or experiences
- Connects tech/Africa/startups to broader patterns most people miss
- Never uses buzzwords (no "disruptive", "paradigm shift", "synergy")
- First person, present tense — writing from current reality, not abstract theory
- Dry wit, occasionally provocative, never cynical
- Comfortable being contrarian when the data supports it
- References his actual products and real metrics when relevant

His strongest social content themes:
- African tech leapfrogging (mobile money → fintech → logistics → education)
- Solo founder reality vs Silicon Valley mythology
- AI tools that actually work vs hype
- Trust dynamics in emerging market e-commerce
- Building products in two very different regulatory environments (UK/Ghana)
- Open University education vs traditional routes
- Real metrics from his products (8,500+ oKadwuma users, 340+ iPahaStore vendors, etc.)`;

function buildSocialPrompt(mode: string, data: {
  prompt: string; platform?: string; content?: string; topic?: string;
}): string {
  const { prompt, platform, content, topic } = data;
  const rules = platform ? PLATFORM_RULES[platform] : null;
  const platformContext = rules
    ? `\nPlatform: ${platform}\nChar limit: ${rules.charLimit}\nStyle: ${rules.style}`
    : "";

  switch (mode) {
    case "write":
      return `${ISAAC_SOCIAL_VOICE}${platformContext}

Write a social media post about:
${prompt}

Rules:
- Stay within ${rules?.charLimit ?? 280} characters if Twitter, or be appropriate for the platform
- Open with a strong hook — the first sentence must make people stop scrolling
- Be specific: use numbers, concrete examples, or counterintuitive observations
- Write as Isaac, from his actual experience
- No emojis unless platform is Instagram/Threads
- End with something that invites engagement (question, strong statement, or call to action)

Return ONLY the post text — no labels, no explanation.`;

    case "adapt":
      return `${ISAAC_SOCIAL_VOICE}

Adapt this content for ${platform ?? "the target platform"}:${platformContext}

Original content:
${content || prompt}

Rewrite it natively for ${platform} — different length, different format, same core message. Don't just truncate — genuinely rewrite for the platform's style.

Return ONLY the adapted post text.`;

    case "thread":
      return `${ISAAC_SOCIAL_VOICE}

Turn this into a compelling Twitter/X thread (5-8 tweets):
${content || prompt}

Rules:
- Tweet 1: The hook — bold claim or surprising fact that makes people click "show more"
- Tweets 2-6: Each standalone point — build the argument progressively
- Final tweet: The "so what" — implication + your take
- Each tweet max 270 chars (leave room for thread numbers)
- Number each tweet: 1/ 2/ etc.

Return the full thread with tweet numbers.`;

    case "hook":
      return `${ISAAC_SOCIAL_VOICE}

Generate 5 alternative opening hooks for a post about:
${prompt}

Each hook should:
- Be under 140 characters (strong first line for any platform)
- Make a bold claim, share a surprising number, or ask a provocative question
- Be distinct from the others — try different angles: contrarian, personal confession, stat-led, question, bold statement

Output as a numbered list. No explanations.`;

    case "hashtags":
      return `You are a social media strategist for Isaac Paha's personal brand.

Generate 15 optimal hashtags for this post on ${platform ?? "social media"}:
${content || prompt}

Mix:
- 5 high-volume broad tags (e.g. #AI, #Startup, #Africa)
- 5 medium-volume specific tags (e.g. #AfricanStartups, #SoloFounder, #AIProductivity)
- 5 niche/community tags (e.g. #BuildInPublic, #TechAfrica, #OpenUniversity)

Output as a space-separated hashtag string only. No explanation.`;

    case "viral":
      return `${ISAAC_SOCIAL_VOICE}

Analyse why this post might not go viral, then rewrite it for maximum engagement on ${platform ?? "Twitter"}:${platformContext}

Original post:
${content || prompt}

Analysis (brief — 2-3 lines on what's weak):
[analysis here]

Rewritten for virality:
[rewrite here]

What changed:
[1-2 line explanation]`;

    case "critique":
      return `${ISAAC_SOCIAL_VOICE}

Give honest editorial critique of this social post for ${platform ?? "the platform"}:

Post:
${content || prompt}

Cover:
1. Hook strength — does it make you stop scrolling?
2. Voice authenticity — does it sound like Isaac or generic?
3. Clarity of the core point
4. Engagement potential — will people reply, share, save?
5. One specific rewrite suggestion

Be direct, not diplomatic. 200-250 words.`;

    case "repurpose":
      return `${ISAAC_SOCIAL_VOICE}

Repurpose this blog content into 3 distinct social posts:

Blog excerpt:
${content || prompt}

Create:
1. TWITTER POST (max 280 chars) — the single most punchable insight
2. LINKEDIN POST (200-400 words) — storytelling format with the full argument
3. INSTAGRAM CAPTION (150-200 words + hashtags) — visual storytelling hook

Label each clearly. Write all three in Isaac's voice.`;

    default:
      return `${ISAAC_SOCIAL_VOICE}\n\n${prompt}`;
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { mode = "write", prompt, platform, content, topic } = body;

  if (!prompt?.trim() && !content?.trim()) {
    return NextResponse.json({ error: "prompt or content required" }, { status: 400 });
  }

  const userPrompt = buildSocialPrompt(mode, { prompt: prompt ?? "", platform, content, topic });
  const maxTokens  = mode === "thread" || mode === "repurpose" ? 1200 : 800;

  try {
    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      messages:   [{ role: "user", content: userPrompt }],
    });
    const result = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ content: result });
  } catch (err: any) {
    console.error("[social/ai]", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}


// =============================================================================
// isaacpaha.com — Social AI Cron Job
// app/api/admin/social/cron/route.ts
// GET  → status + history
// POST { action: "run" | "configure" } → manual trigger or save settings
// =============================================================================