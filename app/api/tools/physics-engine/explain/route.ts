// =============================================================================
// isaacpaha.com — Physics Understanding Engine — Explanation API
// app/api/tools/physics-engine/explain/route.ts
//
// POST { question, level, mode, explorerMode }
//   level:       "gcse" | "alevel" | "university"
//   mode:        "full" | "simpler" | "deeper" | "tutor"
//   explorerMode: true for Theory Explorer (broad topics like "Relativity")
//
// Returns 8-layer concept breakdown:
//   1. plainDefinition    — plain English "what is it?"
//   2. governingLaw       — the core equation with meaning of each term
//   3. whyItExists        — the motivation (why scientists needed this)
//   4. history            — discovery, key scientists, context
//   5. realWorld          — tangible applications in multiple fields
//   6. intuition          — mental models and analogies
//   7. misconceptions     — common wrong beliefs corrected
//   8. experiments        — simple "try it yourself" activities
//   + conceptLinks, visualisation, levelSummary, whyItMatters
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Tool token costs (in tokens per request)
const TOKEN_COST = 1000; // Adjust based on expected response length and model pricing

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVEL_CFG: Record<string, { label: string; depth: string; vocab: string; math: string }> = {
  gcse:       { label: "GCSE (UK Year 10-11)",    depth: "foundational",   vocab: "plain English, relatable analogies, everyday examples",         math: "simple equations, no calculus, intuitive notation" },
  alevel:     { label: "A-Level (UK Year 12-13)", depth: "intermediate",   vocab: "precise scientific language, some mathematical derivation",     math: "algebra, basic differentiation, vector notation where needed" },
  university: { label: "University / Degree",     depth: "advanced",       vocab: "rigorous, formal, full mathematical treatment when appropriate", math: "full calculus, tensors if relevant, formal proofs and derivations" },
};

// ─── Physics visualisation type detector ─────────────────────────────────────

function detectPhysicsVisType(question: string): string {
  const q = question.toLowerCase();
  if (/wave|frequency|amplitude|oscillat|vibrat|sound|light|em wave|transverse|longitudinal/.test(q)) return "wave";
  if (/motion|velocity|speed|acceleration|displacement|suvat|kinematics|projectile/.test(q)) return "motion_graph";
  if (/circuit|resistor|capacitor|voltage|current|ohm|electric|series|parallel/.test(q)) return "circuit";
  if (/force|vector|resultant|component|resolv/.test(q)) return "vector";
  if (/graph|plot|linear|parabola|f\(x\)|y =/.test(q)) return "function_graph";
  if (/sin|cos|tan|angle|pendulum|circular|rotation/.test(q)) return "geometric";
  return "none";
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const {
      question,
      level        = "gcse",
      mode         = "full",
      explorerMode = false,
      followUpContext = "",
    } = await req.json();

    if (!question?.trim() || question.trim().length < 2) {
      return NextResponse.json({ error: "Please enter a physics topic or question" }, { status: 400 });
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    const gate = await tokenGate(req, TOKEN_COST, { toolName: "Physics Explanation Engine" });
    console.log(`[physics-engine/explain] Token gate result:`, gate);
    if (!gate.ok) return gate.response; // sends 402 JSON to client
    console.log(`[physics-engine/explain] Token gate passed for user ${gate.dbUserId} — proceeding with explanation generation`);


    const lvl    = LEVEL_CFG[level] ?? LEVEL_CFG.gcse;
    const vizType = detectPhysicsVisType(question);

    const systemPrompt = `You are an exceptional physics teacher and science communicator. Your teaching philosophy:
- Physics is the story of how humans understood reality — always teach it that way
- Every law has a human story behind it — show it
- Analogies and mental models are not simplifications, they ARE the understanding
- Students fail physics because they memorise without understanding context or meaning
- Level: ${lvl.label} — ${lvl.vocab}
- Mathematics: ${lvl.math}

Your goal: transform confusion into deep, lasting understanding.`;

    let userPrompt = "";

    // ── SIMPLER mode ─────────────────────────────────────────────────────────
    if (mode === "simpler") {
      userPrompt = `A ${lvl.label} student found the physics explanation too complex. Simplify "${question}" dramatically.
Use the most powerful analogy possible. Make it feel obvious in hindsight.
Return ONLY valid JSON:
{
  "analogy": "<the best possible analogy — specific, vivid, relatable>",
  "simplifiedExplanation": "<2-3 sentences maximum — plain English>",
  "keyInsight": "<the one thing they must remember>",
  "rememberThis": "<memorable one-liner to cement the concept>"
}`;
    }

    // ── DEEPER mode ───────────────────────────────────────────────────────────
    else if (mode === "deeper") {
      userPrompt = `A ${lvl.label} student wants to go deeper on "${question}". Provide the advanced treatment.
Return ONLY valid JSON:
{
  "derivation": "<full mathematical derivation or proof at the next level up>",
  "advancedTheory": "<what lies beneath — the deeper physics>",
  "limitationsOfSimpleModel": "<where the simple model breaks down>",
  "openQuestions": ["<unresolved question 1>", "<unresolved question 2>"],
  "nobelConnections": "<any Nobel Prize-winning work related to this concept>",
  "cuttingEdge": "<how this concept relates to current physics research>"
}`;
    }

    // ── TUTOR mode ────────────────────────────────────────────────────────────
    else if (mode === "tutor") {
      userPrompt = `A ${lvl.label} student is studying "${question}". Context: ${followUpContext}
Respond as a patient, Socratic tutor. Guide them to the answer, don't just give it.
Return ONLY valid JSON:
{
  "response": "<your tutoring response — address their specific confusion>",
  "guidingQuestion": "<a question to help them think it through>",
  "hint": "<a subtle hint if they're stuck>",
  "encouragement": "<genuine, specific encouragement based on what they got right>",
  "nextConcept": "<the next thing they should explore to deepen this understanding>"
}`;
    }

    // ── FULL mode — the 8-layer breakdown ─────────────────────────────────────
    else {
      const isExplorer = explorerMode;

      userPrompt = `${isExplorer
        ? `Provide a complete Theory Explorer breakdown for the physics topic: "${question}"`
        : `Explain this physics question/topic COMPLETELY for a ${lvl.label} student: "${question}"`
      }

Return ONLY valid JSON (no markdown, no backticks, no explanation outside JSON):

{
  "topic": "<branch of physics — e.g. Mechanics, Electromagnetism, Thermodynamics, Quantum Physics>",
  "conceptName": "<specific concept — e.g. Newton's Second Law, Electromagnetic Induction, Wave-Particle Duality>",
  "keyScientists": ["<Scientist 1 with brief role>", "<Scientist 2>"],

  "plainDefinition": {
    "oneLineSummary": "<one sentence: what is this in plain English — no jargon>",
    "expandedDefinition": "<2-3 sentence plain English definition — as if explaining to a curious 14-year-old>",
    "analogy": "<the most powerful, specific analogy that makes this click immediately>"
  },

  "governingLaw": {
    "name": "<name of the law, principle, or equation>",
    "equation": "<the equation — e.g. F = ma>",
    "terms": [
      { "symbol": "<e.g. F>", "meaning": "<what it represents>", "unit": "<SI unit>" }
    ],
    "inWords": "<the equation stated in plain English — 'Force equals mass times acceleration'>",
    "levelNote": "<any additional mathematical treatment specific to ${lvl.label}>"
  },

  "whyItExists": {
    "problem": "<what specific problem or observation forced scientists to develop this concept>",
    "beforeDiscovery": "<what people believed or didn't understand before this>",
    "breakthrough": "<the key insight that changed everything>",
    "significance": "<why this was revolutionary for science>"
  },

  "history": {
    "discovered": "<by whom, roughly when, under what circumstances>",
    "keyMoment": "<the famous moment, experiment, or observation that led to the discovery>",
    "evolution": "<how the understanding deepened or changed over time>",
    "funFact": "<one genuinely surprising or counterintuitive historical fact about this>",
    "scientists": [
      { "name": "<scientist>", "contribution": "<their specific contribution>", "era": "<rough time period>" }
    ]
  },

  "realWorld": [
    {
      "field": "<Engineering | Medicine | Space | Technology | Environment | Everyday Life | etc.>",
      "application": "<specific real application>",
      "example": "<concrete, vivid, relatable example — not abstract>",
      "impact": "<why this application matters>"
    }
  ],

  "intuition": {
    "primaryModel": "<the single best mental model — vivid and specific>",
    "alternativeModel": "<a different way of thinking about it for when the first doesn't work>",
    "thinkAboutItLike": "<complete this: 'Think about it like...' with a specific everyday scenario>",
    "whatChangesWhen": ["<what happens to X when Y increases — building intuition for the relationships>"]
  },

  "misconceptions": [
    {
      "wrongBelief": "<common misconception — stated as students typically believe it>",
      "whyItSeemsTrue": "<why this misconception is understandable — don't dismiss it>",
      "truth": "<the correct understanding>",
      "evidence": "<a simple demonstration or example that disproves the misconception>"
    }
  ],

  "experiments": [
    {
      "title": "<experiment name>",
      "materials": ["<item 1>", "<item 2>"],
      "instructions": "<clear, brief instructions — 2-4 sentences>",
      "whatYoullSee": "<what happens and why — connecting observation to concept>",
      "safetyNote": "<safety note if relevant, empty string if not>"
    }
  ],

  "conceptLinks": [
    {
      "concept": "<related physics concept>",
      "relationship": "<how it connects>",
      "direction": "<prerequisite | builds-on | parallel>"
    }
  ],

  "whyItMatters": "<2-3 sentences on the broader significance — GPS needs relativity, electricity powers civilisation, etc.>",

  "levelSummary": "<2-3 sentence summary pitched exactly at ${lvl.label} — this is what they need for their exam/course>",

  "examTips": [
    "<specific exam tip 1 for ${lvl.label}>",
    "<specific exam tip 2>"
  ],

  "visualisation": {
    "type": "${vizType}",
    "description": "<what should be shown and why it aids understanding>",
    "keyPoints": ["<key visual insight>"],
    "data": ${vizType !== "none" ? `{
      "amplitude": <number if wave>,
      "frequency": <number if wave>,
      "waveType": "<sine|cosine|damped if wave>",
      "motionType": "<displacement-time|velocity-time if motion_graph>",
      "initialValue": <number if motion>,
      "finalValue": <number if motion>,
      "timeRange": <number if motion>,
      "circuitType": "<series|parallel if circuit>",
      "vectors": [{"x": <num>, "y": <num>, "label": "<>", "color": "<hex>"}],
      "functionExpression": "<if function_graph>",
      "xRange": "<if function_graph>"
    }` : "null"}
  },

  "difficulty": "<Introductory | GCSE | A-Level | University | Research>",
  "estimatedReadMinutes": <number>
}

CRITICAL RULES:
- Every field must be filled. Never leave a field empty or null (except visualisation.data when type is "none").
- The plain definition analogy must be SPECIFIC — not "it's like energy" but something vivid and memorable.
- misconceptions must be things students ACTUALLY believe — not trivial errors. Include 2-3.
- experiments must be genuinely doable at home or in a school lab with simple materials.
- realWorld must have 4-6 entries from genuinely diverse fields.
- For ${lvl.label}: vocabulary, depth, and mathematics must feel natural — not too advanced, not too basic.
- History scientists entries: include 2-3 relevant scientists with their actual specific contributions.`;
    }

    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 6000,
      system:     systemPrompt,
      messages:   [{ role: "user", content: userPrompt }],
    });

    const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let result: any;
    try { result = JSON.parse(clean); }
    catch {
      const match = clean.match(/\{[\s\S]+\}/);
      if (!match) return NextResponse.json({ error: "Explanation failed — please try again" }, { status: 500 });
      try { result = JSON.parse(match[0]); }
      catch { return NextResponse.json({ error: "Could not parse AI response — please try again" }, { status: 500 }); }
    }

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gate.dbUserId, TOKEN_COST, "physics-engine/explain", {
      question,
      level,
      mode, 
    });
    console.log(`[physics-engine/explain] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId}`);

    return NextResponse.json({ ok: true, result, mode });
  } catch (err: any) {
    console.error("[physics-engine/explain]", err);
    return NextResponse.json({ error: err.message ?? "Explanation failed" }, { status: 500 });
  }
}