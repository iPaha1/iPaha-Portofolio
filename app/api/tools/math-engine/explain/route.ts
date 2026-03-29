// =============================================================================
// isaacpaha.com — Math Understanding Engine — Explanation API
// app/api/tools/math-engine/explain/route.ts
//
// POST { question, level, mode }
//   level: "gcse" | "alevel" | "university" | "middle_school" | "high_school" | "college"
//   mode:  "full" | "simpler" | "deeper" | "tutor" (for follow-up questions)
//
// Returns comprehensive JSON with:
//   - answer, steps, whyItWorks, history, realWorld
//   - conceptLinks, visualisationType, visualisationData
//   - practicePreview, learningPath
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Tool token costs (in tokens per request)
const TOKEN_COST = 1000; // Adjust based on expected response length and model pricing

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVEL_CFG: Record<string, { label: string; depth: string; vocab: string }> = {
  gcse:         { label: "GCSE (UK Year 10-11)",    depth: "foundational",   vocab: "accessible, clear, no heavy notation" },
  alevel:       { label: "A-Level (UK Year 12-13)", depth: "intermediate",   vocab: "standard mathematical notation, proofs when relevant" },
  university:   { label: "University / Degree",     depth: "advanced",       vocab: "rigorous, formal notation, deeper theory" },
  middle_school:{ label: "Middle School (US)",       depth: "foundational",   vocab: "simple, relatable, lots of analogies" },
  high_school:  { label: "High School (US)",         depth: "intermediate",   vocab: "clear notation, practical examples" },
  college:      { label: "College / University (US)",depth: "advanced",       vocab: "rigorous, formal, theoretical depth" },
};

// ─── Visualisation type detector ─────────────────────────────────────────────

function detectVisualisationType(question: string): string {
  const q = question.toLowerCase();
  if (/quadratic|parabola|y\s*=|f\(x\)|function|graph|plot|curve/.test(q)) return "function_graph";
  if (/linear|straight line|gradient|slope|intercept/.test(q)) return "linear_graph";
  if (/circle|circumference|radius|diameter|pi|trigon|sin|cos|tan/.test(q)) return "geometric";
  if (/probability|statistics|data|frequency|histogram|bar chart/.test(q)) return "statistical";
  if (/vector|matrix|transform/.test(q)) return "vector";
  if (/sequence|series|fibonacci|arithmetic|geometric/.test(q)) return "sequence";
  if (/fraction|ratio|proportion/.test(q)) return "ratio";
  return "none";
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { question, level = "gcse", mode = "full", followUpContext = "" } = await req.json();

    if (!question?.trim() || question.trim().length < 2) {
      return NextResponse.json({ error: "Please enter a maths question" }, { status: 400 });
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
        const gate = await tokenGate(req, TOKEN_COST, { toolName: "Math Explanation Engine" });
        console.log(`[math-engine/explain] Token gate result:`, gate);
        if (!gate.ok) return gate.response; // sends 402 JSON to client
        console.log(`[math-engine/explain] Passed token gate, proceeding with explanation...`);

    const lvl    = LEVEL_CFG[level] ?? LEVEL_CFG.gcse;
    const vizType = detectVisualisationType(question);

    const systemPrompt = `You are an exceptional mathematics teacher and educator. Your teaching philosophy:
- Every student CAN understand maths if it's explained well
- Context and "why" matter as much as "how"
- Real-world connections make abstract concepts stick
- History gives maths humanity
- You adapt your language to the student's level: ${lvl.label}

Communication style: ${lvl.vocab}
Depth level: ${lvl.depth}`;

    let userPrompt = "";

    if (mode === "simpler") {
      userPrompt = `A student asked about "${question}" and found the explanation too complex. 
Explain it again but simpler — like explaining to a younger student. Use a very clear analogy.
Return ONLY valid JSON (no markdown):
{ "steps": [{"step": 1, "title": "", "explanation": "", "notation": ""}], "analogy": "", "keyInsight": "" }`;
    }

    else if (mode === "deeper") {
      userPrompt = `A student asked about "${question}" and wants to go deeper beyond ${lvl.label}.
Provide: advanced theory, proofs where applicable, connections to higher mathematics, open questions.
Return ONLY valid JSON:
{ "deepDive": "", "proof": "", "advancedConnections": [""], "openQuestions": [""] }`;
    }

    else if (mode === "tutor") {
      userPrompt = `A student is working on "${question}". They had this context: ${followUpContext}
They're asking a follow-up question. Act as their personal tutor: patient, encouraging, Socratic.
Return ONLY valid JSON:
{ "response": "", "hint": "", "encouragement": "", "nextQuestion": "" }`;
    }

    else {
      // FULL mode — the main comprehensive explanation
      userPrompt = `Explain this maths question/topic COMPLETELY for a ${lvl.label} student:

"${question}"

Return ONLY valid JSON (no markdown, no backticks). Every field must be filled:

{
  "topic": "<what branch of maths this is — e.g. Algebra, Calculus, Trigonometry>",
  "conceptName": "<the specific concept — e.g. Quadratic Equations, Differentiation>",

  "answer": {
    "finalAnswer": "<the direct answer to the question>",
    "notation": "<mathematical notation of the answer if applicable>"
  },

  "steps": [
    {
      "step": 1,
      "title": "<short step title>",
      "explanation": "<clear explanation of this step in plain language>",
      "notation": "<the mathematical working for this step>",
      "whyThisStep": "<why we do this step — not just what>"
    }
  ],

  "whyItWorks": {
    "coreIdea": "<the fundamental reason this method/formula works — the intuition>",
    "deeperReason": "<the mathematical truth underneath — appropriate for ${lvl.label}>",
    "commonMistake": "<the most common mistake students make and why>"
  },

  "history": {
    "origin": "<who discovered/developed this concept and roughly when>",
    "motivation": "<what real problem they were trying to solve>",
    "evolution": "<how the concept evolved or was refined over time>",
    "funFact": "<one genuinely interesting or surprising historical fact>"
  },

  "realWorld": [
    {
      "field": "<e.g. Engineering, Finance, Physics, Computer Science, Medicine>",
      "application": "<specific real application>",
      "example": "<concrete, relatable example>"
    }
  ],

  "conceptLinks": [
    {
      "concept": "<related maths concept>",
      "relationship": "<how this concept connects to what we just learned>",
      "direction": "<prerequisite | builds-on | parallel>"
    }
  ],

  "levelSummary": "<2-3 sentence summary pitched exactly at ${lvl.label} level>",

  "examTip": "<most important exam/test tip for this type of question at ${lvl.label} level>",

  "visualisation": {
    "type": "${vizType}",
    "description": "<what should be visualised and what it shows>",
    "keyPoints": ["<key visual insight 1>", "<key visual insight 2>"],
    "data": ${vizType !== "none" ? `{
      "functionExpression": "<if function: the expression e.g. 'x^2 - 4x + 3'>",
      "xRange": "<if graph: suggested x range e.g. '-5 to 10'>",
      "keyValues": {"<label>": <value>},
      "annotations": ["<what to highlight on the graph>"]
    }` : "null"}
  },

  "difficulty": "<Easy | Medium | Hard | Very Hard>",
  "estimatedTimeMinutes": <number>
}

Rules:
- Steps must be thorough — never skip reasoning. Aim for 4-8 steps for most problems.
- whyItWorks.coreIdea should use an analogy if helpful.
- realWorld should have 3-5 entries from different fields.
- conceptLinks should have 3-4 entries spanning prerequisites and extensions.
- Be specific, not generic. Reference actual numbers/expressions from the question.
- For ${lvl.label}, vocabulary and depth should feel completely natural — not too advanced, not too basic.`;
    }

    const message = await anthropic.messages.create({
      model:  "claude-sonnet-4-20250514",
      max_tokens: 5000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let result: any;
    try { result = JSON.parse(clean); }
    catch {
      const match = clean.match(/\{[\s\S]+\}/);
      if (!match) return NextResponse.json({ error: "Explanation failed — please try again" }, { status: 500 });
      result = JSON.parse(match[0]);
    }

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
        await deductTokens(gate.dbUserId, TOKEN_COST, "math-engine/explain", {
          question,
          level,
          mode, 
        });
        console.log(`[math-engine/explain] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId}`);

    return NextResponse.json({ ok: true, result, mode });
  } catch (err: any) {
    console.error("[math-engine/explain]", err);
    return NextResponse.json({ error: err.message ?? "Explanation failed" }, { status: 500 });
  }
}