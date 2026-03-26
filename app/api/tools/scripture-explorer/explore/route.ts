// =============================================================================
// isaacpaha.com — Comparative Scripture Explorer: Exploration API
// app/api/tools/scripture-explorer/explore/route.ts
//
// POST { query, traditions?, mode }
// modes: "compare" | "deep-dive" | "figure" | "theme" | "verse"
//
// NEUTRALITY IS ENFORCED AT THE SYSTEM LEVEL.
// The system prompt is immutable — the AI is strictly instructed to:
//   - Never rank, judge, or prefer any tradition
//   - Use "this tradition teaches…" framing at all times
//   - Present differences as differences, not as errors
//   - Source every claim with a specific reference
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ─── IMMUTABLE SYSTEM PROMPT ──────────────────────────────────────────────────
// This is not configurable. It is the ethical backbone of the tool.

const SYSTEM_PROMPT = `You are a neutral, scholarly educational assistant specialising in comparative Abrahamic religious studies. Your role is to educate — not to advocate, judge, rank, or persuade.

ABSOLUTE RULES (never break these):
1. NEVER suggest any tradition is more correct, more authentic, or superior to another.
2. NEVER use language like "actually", "in reality", "the truth is", "this is wrong", or any phrase that implies one tradition has a privileged claim to truth.
3. NEVER express a personal view on theological questions.
4. ALWAYS use framing like: "In this tradition...", "This tradition teaches...", "From an Islamic perspective...", "In Christian interpretation...", "Jewish scholars understand this as...", "Interpretations vary within this tradition..."
5. NEVER present one interpretation as THE interpretation — always acknowledge internal diversity where relevant.
6. Differences between traditions are DIFFERENCES, not errors. Present them as distinct perspectives, never as contradictions that need resolving.
7. Always cite specific references (book, chapter, verse) for scripture quotations.
8. Scholarly and historical context must be presented neutrally — if scholars disagree, say so.
9. Keep language accessible and clear — this is for a general educated audience, not specialists.
10. End every response with the standard educational disclaimer.

TONE: Warm, thoughtful, scholarly, and genuinely respectful of all traditions explored.
GOAL: Build bridges of understanding. Help people learn. Never inflame.`;

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildComparePrompt(query: string, traditions: string[]): string {
  const traditionList = traditions.length > 0 ? traditions.join(", ") : "Christianity (Bible), Islam (Qur'an), and Judaism (Hebrew Bible / Tanakh)";

  return `A user wants to understand the following topic across religious traditions: "${query}"

Please provide a structured educational comparison across: ${traditionList}

Return ONLY valid JSON (no markdown, no backticks):

{
  "topic": "<clear, neutral title for this topic>",
  "introduction": "<2-3 sentence neutral overview of why this topic appears across traditions and its significance>",

  "traditions": [
    {
      "tradition": "<tradition name>",
      "text": "<full name of the primary text — e.g. 'The Bible (Old and New Testament)'>",
      "emoji": "<single representative emoji — ✝️ for Christianity, ☪️ for Islam, ✡️ for Judaism>",
      "accentColor": "<hex color — #3b82f6 for Christianity, #10b981 for Islam, #f59e0b for Judaism>",
      "summary": "<2-3 sentences summarising this tradition's perspective on the topic. Use 'In this tradition...' framing.>",
      "passages": [
        {
          "reference": "<Book Chapter:Verse or Surah:Ayah>",
          "text": "<The passage text — keep under 50 words, use ... for long passages>",
          "explanation": "<1-2 sentences explaining what this passage means in this tradition's interpretation>"
        }
      ],
      "context": "<2-3 sentences of historical, cultural, or theological context for this tradition's understanding>",
      "internalDiversity": "<1-2 sentences about different schools of thought or denominations within this tradition, if relevant>"
    }
  ],

  "sharedConnections": [
    {
      "type": "<Shared Figure | Shared Theme | Parallel Story | Common Concept>",
      "title": "<short title>",
      "description": "<2-3 sentences describing the connection across traditions — e.g. 'All three traditions recognise Abraham/Ibrahim/Avraham as a patriarch. While the narrative varies...'>"
    }
  ],

  "keyDifferences": [
    {
      "aspect": "<what aspect differs>",
      "description": "<Neutral 2-3 sentence description of how traditions differ on this aspect. Never imply one is right.>"
    }
  ],

  "historicalContext": "<3-4 sentences of broader historical and scholarly context about how these texts developed and why comparative study is valuable>",

  "guidedQuestions": [
    "<a thoughtful follow-up question a curious learner might ask>",
    "<another question>",
    "<another question>"
  ],

  "disclaimer": "This exploration is an educational summary for comparative study. It does not represent all interpretations within each tradition, and should not be taken as theological authority. Readers are encouraged to consult religious scholars, community leaders, and primary texts for deeper understanding."
}

Requirements:
- Include 1-3 passages per tradition (more if the topic has rich scriptural depth)
- sharedConnections: at minimum 1, up to 4
- keyDifferences: at minimum 1, up to 4
- Be specific — cite real references, real passages
- If you are not certain of a specific verse reference, say "cf." before the reference and note that the exact location varies by edition
- The 3 tradition accent colors must be exactly: Christianity #3b82f6, Islam #10b981, Judaism #f59e0b`;
}

function buildDeepDivePrompt(query: string): string {
  return `A user wants a deep dive into: "${query}"

Provide detailed educational commentary in JSON:

{
  "topic": "<title>",
  "overview": "<comprehensive 4-5 sentence overview>",
  "scholarlyPerspectives": [
    {
      "scholar": "<scholar name or school of thought>",
      "tradition": "<which tradition this comes from>",
      "insight": "<their perspective in 2-3 sentences>"
    }
  ],
  "historicalEvolution": "<3-4 sentences on how understanding of this topic has evolved historically>",
  "modernInterpretations": "<2-3 sentences on how contemporary communities engage with this topic>",
  "furtherStudy": ["<recommended topic 1>", "<recommended topic 2>", "<recommended topic 3>"],
  "disclaimer": "This is an educational summary for comparative study only."
}`;
}

function buildFigurePrompt(figure: string): string {
  return `A user wants to understand the religious figure "${figure}" across traditions.

Return JSON:
{
  "figure": "<full name as used in the query>",
  "namesAcrossTraditions": [
    { "tradition": "Christianity", "name": "<name used>", "title": "<title/role>" },
    { "tradition": "Islam",        "name": "<name used>", "title": "<title/role>" },
    { "tradition": "Judaism",      "name": "<name used>", "title": "<title/role>" }
  ],
  "introduction": "<neutral 2-3 sentence introduction to the figure>",
  "traditions": [
    {
      "tradition": "<name>",
      "emoji": "<emoji>",
      "accentColor": "<hex>",
      "role": "<their role and significance in this tradition>",
      "keyPassages": [{ "reference": "<ref>", "text": "<text>", "explanation": "<meaning>" }],
      "uniqueAspects": "<what this tradition emphasises about this figure that others do not>",
      "context": "<historical context>"
    }
  ],
  "sharedElements": "<2-3 sentences on what all traditions share about this figure>",
  "keyDifferences": [{ "aspect": "<aspect>", "description": "<neutral description>" }],
  "guidedQuestions": ["<question>", "<question>", "<question>"],
  "disclaimer": "Educational summary only. Does not represent all interpretations."
}`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const {
      query,
      traditions = [],
      mode       = "compare",
    } = await req.json();

    if (!query?.trim() || query.trim().length < 2) {
      return NextResponse.json({ error: "Please enter a topic or question to explore" }, { status: 400 });
    }

    const cleanQuery = query.trim().slice(0, 500); // cap at 500 chars

    let prompt: string;
    switch (mode) {
      case "deep-dive": prompt = buildDeepDivePrompt(cleanQuery);  break;
      case "figure":    prompt = buildFigurePrompt(cleanQuery);    break;
      default:          prompt = buildComparePrompt(cleanQuery, traditions);
    }

    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 4000,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let result: any;
    try { result = JSON.parse(clean); }
    catch {
      const match = clean.match(/\{[\s\S]+\}/);
      if (!match) return NextResponse.json({ error: "Response parsing failed — please try again" }, { status: 500 });
      result = JSON.parse(match[0]);
    }

    // Enforce disclaimer is present — belt-and-braces
    if (!result.disclaimer) {
      result.disclaimer = "This exploration is an educational summary for comparative study. It does not represent all interpretations within each tradition and should not be taken as theological authority.";
    }

    return NextResponse.json({ ok: true, result, mode });
  } catch (err: any) {
    console.error("[scripture-explorer/explore]", err);
    return NextResponse.json({ error: err.message ?? "Exploration failed — please try again" }, { status: 500 });
  }
}