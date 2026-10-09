// =============================================================================
// isaacpaha.com — Startup Idea Generator — Generate API
// app/api/tools/startup-generator/generate/route.ts
//
// POST { founderBackground, skills, interests, sector, ambitiousness,
//        generationMode, locationContext, budgetContext, timeCommitment,
//        avoidSectors, count }
//
// generationMode:
//   "founder_matched"   — ideas tuned to this exact founder's DNA
//   "sector_focused"    — deep dive in chosen sector
//   "contrarian"        — ideas that seem wrong but are actually right
//   "timing_arbitrage"  — ideas whose exact moment has arrived NOW
//   "white_space"       — gaps nobody else has spotted yet
//   "free_form"         — no constraints, pure unrestricted generation
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate }                 from "@/lib/tokens/token-gate";
import { deductTokens }              from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb }                  from "@/lib/db";

const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const ToolSlug   = "startup-idea-generator";
const TOKEN_COST = 150;
const TOOL_NAME  = "Startup Idea Generator";

let TOOL_ID = "unknown-tool-id";
try {
  const tool = await prismadb.tool.findUnique({ where: { slug: ToolSlug }, select: { id: true } });
  TOOL_ID = tool?.id ?? "unknown-tool-id";
} catch {}

function cleanJSON(raw: string): any {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
    .replace(/,\s*([\]}])/g, "$1");
  const match = cleaned.match(/\{[\s\S]+\}/);
  if (!match) throw new Error("No JSON");
  return JSON.parse(match[0]);
}

// ─── Mode-specific prompting philosophy ───────────────────────────────────────

const MODE_PHILOSOPHY: Record<string, string> = {
  founder_matched: `Generate ideas that are SPECIFICALLY calibrated to this founder's exact background, skills, and interests. The ideas must give this person an unfair advantage — something they could build better than 99% of other founders because of WHO THEY ARE. Do not generate generic ideas. Reference their specific skills and experience in why this founder should build this.`,

  sector_focused: `Go extremely deep in the specified sector. Generate ideas that require intimate sector knowledge — the kind of insights only someone who has lived and breathed this space would have. These should be non-obvious, not the obvious "AI for X" or "marketplace for Y" ideas everyone has.`,

  contrarian: `Generate ideas that seem WRONG, weird, or counterintuitive at first glance — but when you think deeper, are actually profound insights. These are ideas that 90% of investors would immediately dismiss, but the 10% who understand would immediately fund. Think: the idea behind Airbnb (strangers sleeping in your home? absurd), Uber (get in a stranger's car? never), PayPal (digital currency? who cares?). The initial reaction should be "that's stupid" — but the follow-through should be "wait... actually..."`,

  timing_arbitrage: `Generate ideas whose EXACT MOMENT has arrived in 2024-2025 and ONLY NOW. These are ideas that would have failed 3 years ago but will dominate the next 3. Driven by: AI becoming accessible, remote work permanence, Gen Z becoming the primary consumer, climate urgency hitting regulatory maturity, biotech cost curves collapsing, the end of zero-interest money forcing profitability. Each idea must explain WHY NOW is the exact right window.`,

  white_space: `Generate ideas for GAPS that should exist but don't — problems that everyone experiences but nobody has solved well. The test: when you describe the idea, the listener's immediate reaction is "oh my god, why doesn't this exist?" These are not ideas for new technology — they're ideas for blindingly obvious solutions that somehow don't exist yet. Often at the intersection of two industries that have never talked to each other.`,

  free_form: `Generate the most ambitious, world-changing startup ideas you can conceive. No constraints on sector, technology, or difficulty. These should be the ideas that change how civilization works. Think about: what are the 10 most important problems humanity faces? What technology exists NOW that makes a previously impossible solution possible? What would a founder with unlimited resources and talent build?`,
};

const AMBITIOUSNESS_GUIDE: Record<string, string> = {
  MOONSHOT:     "This must be a civilisation-altering company. $10B+ potential. 10-15 year journey. Fundamental infrastructure-level change. Think OpenAI, SpaceX, DeepMind scale of ambition.",
  UNICORN:      "$1B+ path. Realistic within 7 years for a strong team. Category-defining if done right. Think Stripe, Notion, Figma scale.",
  ROCKETSHIP:   "$100M-$500M realistic path. Strong business, achievable for a good founder. Think successful Series B/C company.",
  SOLID_STARTUP:"$10M-$100M, highly achievable, profitable business. Think successful indie startup or bootstrapped gem.",
};

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;

  try {
    const body = await req.json();
    const {
      founderBackground = "",
      skills            = [],
      interests         = [],
      sector            = "OTHER",
      ambitiousness     = "UNICORN",
      generationMode    = "founder_matched",
      locationContext   = "",
      budgetContext     = "",
      timeCommitment    = "",
      avoidSectors      = [],
      count             = 3,
    } = body;

    const validModes = ["founder_matched", "sector_focused", "contrarian", "timing_arbitrage", "white_space", "free_form"];
    const validMode  = validModes.includes(generationMode) ? generationMode : "founder_matched";
    const ideaCount  = Math.max(1, Math.min(5, Number(count)));

    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    if (!gateResult.ok) return gateResult.response;

    const founderContext = [
      founderBackground && `FOUNDER BACKGROUND: ${founderBackground}`,
      skills?.length && `SKILLS: ${Array.isArray(skills) ? skills.join(", ") : skills}`,
      interests?.length && `INTERESTS: ${Array.isArray(interests) ? interests.join(", ") : interests}`,
      sector !== "OTHER" && `PREFERRED SECTOR: ${sector}`,
      locationContext && `LOCATION/MARKET CONTEXT: ${locationContext}`,
      budgetContext && `AVAILABLE CAPITAL: ${budgetContext}`,
      timeCommitment && `TIME COMMITMENT: ${timeCommitment}`,
      avoidSectors?.length && `AVOID THESE SECTORS: ${Array.isArray(avoidSectors) ? avoidSectors.join(", ") : avoidSectors}`,
    ].filter(Boolean).join("\n") || "No specific context provided — generate freely.";

    const systemPrompt = `You are one of the world's most respected startup idea generators — a cross between Paul Graham, Peter Thiel, and a seasoned venture capitalist who has seen thousands of pitches.

You have a rare ability to see startup ideas that are: (1) genuinely novel, (2) possible NOW with current technology, (3) addressing real pain that people will pay to solve, and (4) capable of becoming defensible businesses.

Your philosophy:
- Ideas must be SPECIFIC, not generic. "AI for healthcare" is not an idea. "An AI that reads GP letters and pre-fills insurance claim forms, saving NHS admin £2.3B/year" is an idea.
- Every idea must have a reason it's possible NOW that it wasn't 3 years ago.
- Every idea must have a named, specific first customer segment — not "small businesses" but "solo UK accountants who use Xero and have 20-50 clients."
- The best ideas feel slightly wrong at first. If an idea sounds safe and obvious, it's probably already been done.
- Never generate "Uber for X" or "Airbnb for Y" unless the parallel is genuinely structural.
- The founder's unfair advantage must be real — not "they're passionate about it" but "they have 10 years of domain knowledge that would take a competitor years to acquire."

GENERATION MODE: ${validMode.toUpperCase()}
${MODE_PHILOSOPHY[validMode]}

AMBITIOUSNESS TARGET: ${ambitiousness}
${AMBITIOUSNESS_GUIDE[ambitiousness]}

FOUNDER CONTEXT:
${founderContext}`;

    const userPrompt = `Generate exactly ${ideaCount} startup idea${ideaCount > 1 ? "s" : ""} for this founder.

Each idea must feel genuinely exciting — the kind of idea that makes a smart person say "I've never thought of that, but it's so obvious now you've said it."

CRITICAL JSON RULES: Return ONLY valid JSON. No trailing commas. Escape all quotes inside strings with \\".

{
  "generationContext": {
    "mode": "${validMode}",
    "ambitiousness": "${ambitiousness}",
    "founderDNA": "<1-2 sentences synthesising what this founder's real unfair advantage is, based on their background — or 'No context provided' if none given>",
    "timingInsight": "<what's happening in the world RIGHT NOW that makes this the perfect moment to be generating startup ideas in this space>"
  },

  "ideas": [
    {
      "id": 1,
      "name": "<Startup name — sharp, memorable, not trying too hard>",
      "tagline": "<one sentence — the kind that makes investors lean forward>",
      "category": "<DEEPTECH | CONSUMER | B2B_SAAS | FINTECH | HEALTHTECH | CLIMATETECH | EDTECH | CREATOR_ECONOMY | INFRASTRUCTURE | FUTURE_OF_WORK | WEB3 | BIOTECH | OTHER>",
      "ambitiousness": "${ambitiousness}",

      "theIdea": {
        "coreConcept": "<2-3 sentences: exactly what this company does, who it's for, and what makes it different. Be specific — name the customer, name the pain, name the solution. No vague generalities.>",
        "whyItDoesntExistYet": "<the real reason nobody has built this — is it a technology gap that just closed? A regulatory change? A behaviour shift? A founder type that hasn't tried this market yet?>",
        "theInsight": "<the non-obvious insight at the heart of this idea — the thing that sounds slightly wrong until you really think about it>",
        "analogies": ["<the 'X meets Y' or 'it's like Z but for W' framing that makes it click instantly>"]
      },

      "marketOpportunity": {
        "problemStatement": "<the specific pain in one punchy sentence — quantify it if possible>",
        "whoFeelsItMost": "<the specific first customer — not a category, a person. Their job title, their company size, their geography, what tool they currently use that's broken>",
        "marketSize": {
          "tam": "<Total Addressable Market — specific number with methodology, e.g. '£8.4B — UK's 2.1M SMEs spending avg £4k/year on X'>",
          "sam": "<Serviceable Addressable Market>",
          "entryWedge": "<the specific narrow entry point — the beachhead market to own first before expanding>"
        },
        "timingFactors": ["<specific reason this is possible NOW — technology, regulation, behaviour, infrastructure>", "<timing factor 2>"],
        "tailwinds": ["<market tailwind 1>", "<tailwind 2>"]
      },

      "unfairAdvantage": {
        "founderFit": "<why is THIS founder (based on their background) uniquely positioned to win here? Be specific. If no background given, describe the ideal founder profile>",
        "moatStrategy": "<what defensible advantage does this build over time — data, network effects, switching costs, regulatory moat, brand?>",
        "unfairEdge": "<the one thing this founder can do in the first 90 days that a well-funded competitor cannot immediately replicate>"
      },

      "businessModel": {
        "revenueModel": "<specific: how money is made, with example price points>",
        "unitEconomics": "<rough LTV:CAC estimate and why it works>",
        "pricingIntuition": "<what customers would likely pay and why — reference comparable products>",
        "pathToProfitability": "<realistic path to unit economics that work>"
      },

      "validation": {
        "coreAssumption": "<the single most important assumption that must be true for this to work — if this is wrong, the idea dies>",
        "validationQuestions": [
          "<the one question you should ask your first potential customer to know if this is real>",
          "<validation question 2>",
          "<validation question 3>"
        ],
        "mvpConcept": "<the leanest possible MVP — what can be built in 4-6 weeks that proves the core assumption?>",
        "firstRevenueStrategy": "<exactly how to generate the first £1,000 in revenue — specific steps>",
        "killSignals": ["<what would you learn in month 1 that should make you stop>", "<kill signal 2>"]
      },

      "riskReality": {
        "hardestThing": "<the single hardest thing about building this — the thing that will make most founders fail>",
        "competitiveRisk": "<who is most likely to kill this — a big tech company, a well-funded startup, an incumbent? How?>",
        "regulatoryRisk": "<any relevant regulatory exposure>",
        "brutalityScore": <1-10 integer — how hard is this to build? 1=anyone can do it, 10=requires 10 years and $100M>,
        "brutalityExplained": "<why this specific brutalityScore>"
      },

      "the10xQuestion": "<the single question whose answer would reveal if this becomes a $1B company or a nice small business — e.g. 'Can this become the default infrastructure for X, or will it always be a point solution?'>",

      "founderFirstSteps": {
        "week1": "<specific, concrete action to take in the first week — not 'research the market' but exactly what to do>",
        "month1": "<what to have learned, built, or sold by end of month 1>",
        "90days": "<where to be in 90 days to know if this has legs>",
        "firstHire": "<the first person to bring in and why — who, where to find them>"
      },

      "inspiredBy": "<what real-world event, technology development, or market shift directly inspired this specific idea>",
      "contraryView": "<the smart person's case AGAINST this idea — steelman the opposition>"
    }
  ],

  "generatorNotes": {
    "patternObserved": "<what pattern emerges across these ideas — what does it reveal about where the opportunities are right now?>",
    "wildCard": "<one more idea that didn't make the list — describe it in one sentence as a bonus, even wilder than the others>",
    "advice": "<direct advice to this specific founder about which idea to pursue and why — based on their background if provided>"
  }
}

Generate ideas that are GENUINELY novel. Not derivative. Not "AI for [industry]" unless the AI application is truly transformative. Think about what new primitives (LLMs, CRISPR, cheap satellites, cheap sensors, remote work, the gig economy, climate urgency) make possible that wasn't possible before.`;

    const message = await anthropic.messages.create({
      model:       "claude-sonnet-4-20250514",
      max_tokens:  9000,
      temperature: 0.75,  // Higher temperature for creative ideation
      system:      systemPrompt,
      messages:    [{ role: "user", content: userPrompt }],
    });

    const processingMs = Date.now() - start;
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";

    let result: any;
    try {
      result = JSON.parse(raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim().replace(/,\s*([\]}])/g, "$1"));
    } catch {
      try { result = cleanJSON(raw); }
      catch { result = { error: "Generation failed. Please try again.", ideas: [] }; }
    }

    if (!result.ideas || !Array.isArray(result.ideas)) result.ideas = [];

    await deductTokens(gateResult.dbUserId, TOKEN_COST, "startup-generator/generate", {
      mode: validMode, count: ideaCount, processingMs,
    });
    await trackToolUsage({
      toolId: TOOL_ID, toolName: TOOL_NAME, userId: gateResult.dbUserId,
      ipAddress: getIpFromRequest(req), processingMs, tokenCost: TOKEN_COST, wasSuccess: true,
    });

    return NextResponse.json({
      ok: true, result, mode: validMode,
      metadata: { processingTimeMs: processingMs, tokensUsed: TOKEN_COST, ideaCount: result.ideas.length },
    });

  } catch (err: any) {
    console.error("[startup-generator/generate] Error:", err);
    try {
      await trackToolUsage({
        toolId: TOOL_ID, toolName: TOOL_NAME, ipAddress: getIpFromRequest(req),
        processingMs: Date.now() - start, wasSuccess: false, errorMsg: err.message,
      });
    } catch {}
    return NextResponse.json({ error: err.message ?? "Generation failed" }, { status: 500 });
  }
}