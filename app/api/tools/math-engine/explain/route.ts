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
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "math-engine";
const TOKEN_COST = 120; // Reasonable token cost for math explanations
const TOOL_NAME = "Math Explanation Engine";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[math-engine/explain] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[math-engine/explain] Failed to load tool ID:`, err);
}

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVEL_CFG: Record<string, { label: string; depth: string; vocab: string }> = {
  gcse: { label: "GCSE (UK Year 10-11)", depth: "foundational", vocab: "accessible, clear, no heavy notation" },
  alevel: { label: "A-Level (UK Year 12-13)", depth: "intermediate", vocab: "standard mathematical notation, proofs when relevant" },
  university: { label: "University / Degree", depth: "advanced", vocab: "rigorous, formal notation, deeper theory" },
  middle_school: { label: "Middle School (US)", depth: "foundational", vocab: "simple, relatable, lots of analogies" },
  high_school: { label: "High School (US)", depth: "intermediate", vocab: "clear notation, practical examples" },
  college: { label: "College / University (US)", depth: "advanced", vocab: "rigorous, formal, theoretical depth" },
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

// Helper to clean and parse JSON
function cleanAndParseJSON(rawResponse: string): any {
  let cleaned = rawResponse.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  
  const jsonMatch = cleaned.match(/\{[\s\S]+\}/);
  if (!jsonMatch) throw new Error("No JSON object found");
  
  let jsonStr = jsonMatch[0];
  let inString = false;
  let escaped = '';
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    const prevChar = i > 0 ? jsonStr[i - 1] : '';
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
      escaped += char;
    } else {
      escaped += char;
    }
  }
  
  return JSON.parse(escaped);
}

// Generate fallback response
function generateFallbackExplanation(question: string, level: string): any {
  return {
    topic: "General Mathematics",
    conceptName: "Math Explanation",
    answer: { finalAnswer: "Please try again", notation: "" },
    steps: [{ step: 1, title: "Retry", explanation: "We couldn't generate a full explanation. Please try again.", notation: "", whyThisStep: "" }],
    whyItWorks: { coreIdea: "Service temporarily unavailable", deeperReason: "", commonMistake: "" },
    history: { origin: "", motivation: "", evolution: "", funFact: "" },
    realWorld: [{ field: "General", application: "Try again", example: "Please refresh and retry" }],
    conceptLinks: [],
    levelSummary: `Explanation for ${level} level is temporarily unavailable.`,
    examTip: "Please try again",
    visualisation: { type: "none", description: "", keyPoints: [], data: null },
    difficulty: "Medium",
    estimatedTimeMinutes: 2,
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    const { question, level = "gcse", mode = "full", followUpContext = "" } = await req.json();

    if (!question?.trim() || question.trim().length < 2) {
      return NextResponse.json(
        { error: "Please enter a maths question (minimum 2 characters)" },
        { status: 400 }
      );
    }

    // Validate level
    const validLevels = ["gcse", "alevel", "university", "middle_school", "high_school", "college"];
    const validLevel = validLevels.includes(level) ? level : "gcse";

    // Validate mode
    const validModes = ["full", "simpler", "deeper", "tutor"];
    const validMode = validModes.includes(mode) ? mode : "full";

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    console.log(`[math-engine/explain] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[math-engine/explain] Token gate passed for user ${gateResult.dbUserId}`);

    const lvl = LEVEL_CFG[validLevel] ?? LEVEL_CFG.gcse;
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

    if (validMode === "simpler") {
      userPrompt = `A student asked about "${question}" and found the explanation too complex. 
Explain it again but simpler — like explaining to a younger student. Use a very clear analogy.

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas

Return EXACTLY this JSON structure:
{
  "steps": [
    {
      "step": 1,
      "title": "<step title>",
      "explanation": "<clear explanation>",
      "notation": "<mathematical notation if applicable>"
    }
  ],
  "analogy": "<simple, relatable analogy>",
  "keyInsight": "<the one thing they must remember>"
}`;
    }

    else if (validMode === "deeper") {
      userPrompt = `A student asked about "${question}" and wants to go deeper beyond ${lvl.label}.
Provide: advanced theory, proofs where applicable, connections to higher mathematics, open questions.

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas

Return EXACTLY this JSON structure:
{
  "deepDive": "<detailed advanced explanation>",
  "proof": "<mathematical proof if applicable>",
  "advancedConnections": ["<connection to higher math>"],
  "openQuestions": ["<unresolved question>"]
}`;
    }

    else if (validMode === "tutor") {
      userPrompt = `A student is working on "${question}". They had this context: ${followUpContext || "none"}
They're asking a follow-up question. Act as their personal tutor: patient, encouraging, Socratic.

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas

Return EXACTLY this JSON structure:
{
  "response": "<your tutoring response>",
  "hint": "<helpful hint>",
  "encouragement": "<specific encouragement>",
  "nextQuestion": "<what they should explore next>"
}`;
    }

    else {
      // FULL mode — the main comprehensive explanation
      userPrompt = `Explain this maths question/topic COMPLETELY for a ${lvl.label} student:

"${question}"

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")
- Ensure all strings are properly closed with quotes

Return EXACTLY this JSON structure (every field must be filled):

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
      model: "claude-sonnet-4-20250514",
      max_tokens: 5000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const processingMs = Date.now() - start;
    
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    
    let result: any;
    try {
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');
      result = JSON.parse(noTrailing);
    } catch (firstError) {
      try {
        result = cleanAndParseJSON(raw);
      } catch (secondError) {
        console.error(`[math-engine/explain] All parsing attempts failed`);
        console.error(`[math-engine/explain] Raw response (first 500 chars):`, raw.slice(0, 500));
        result = generateFallbackExplanation(question, validLevel);
      }
    }

    // Validate and fill missing fields for FULL mode
    if (validMode === "full") {
      if (!result.steps || !Array.isArray(result.steps)) result.steps = [];
      if (!result.realWorld || !Array.isArray(result.realWorld)) result.realWorld = [];
      if (!result.conceptLinks || !Array.isArray(result.conceptLinks)) result.conceptLinks = [];
    }

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "math-engine/explain", {
      questionLength: question.length,
      level: validLevel,
      mode: validMode,
      processingMs,
    });
    console.log(`[math-engine/explain] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

    // ── ③ TRACK USAGE ───────────────────────────────────────────────────────
    await trackToolUsage({
      toolId: TOOL_ID,
      toolName: TOOL_NAME,
      userId: gateResult.dbUserId,
      ipAddress: getIpFromRequest(req),
      processingMs,
      tokenCost: TOKEN_COST,
      wasSuccess: true,
    });
    console.log(`[math-engine/explain] Tracked tool usage for user ${gateResult.dbUserId}`);

    return NextResponse.json({ 
      ok: true, 
      result, 
      mode: validMode,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        level: validLevel,
        mode: validMode,
      }
    });
  } catch (err: any) {
    console.error("[math-engine/explain] Error:", err);

    try {
      await trackToolUsage({
        toolId: TOOL_ID,
        toolName: TOOL_NAME,
        ipAddress: getIpFromRequest(req),
        processingMs: Date.now() - start,
        wasSuccess: false,
        errorMsg: err.message || "Unknown error",
      });
    } catch (trackError) {
      console.error("[math-engine/explain] Failed to track error:", trackError);
    }
    
    return NextResponse.json(
      { 
        error: err.message ?? "Explanation failed",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}






// // =============================================================================
// // isaacpaha.com — Math Understanding Engine — Explanation API
// // app/api/tools/math-engine/explain/route.ts
// //
// // POST { question, level, mode }
// //   level: "gcse" | "alevel" | "university" | "middle_school" | "high_school" | "college"
// //   mode:  "full" | "simpler" | "deeper" | "tutor" (for follow-up questions)
// //
// // Returns comprehensive JSON with:
// //   - answer, steps, whyItWorks, history, realWorld
// //   - conceptLinks, visualisationType, visualisationData
// //   - practicePreview, learningPath
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// // Tool token costs (in tokens per request)
// const TOKEN_COST = 10000000000000000000; // Adjust based on expected response length and model pricing

// // ─── Level config ─────────────────────────────────────────────────────────────

// const LEVEL_CFG: Record<string, { label: string; depth: string; vocab: string }> = {
//   gcse:         { label: "GCSE (UK Year 10-11)",    depth: "foundational",   vocab: "accessible, clear, no heavy notation" },
//   alevel:       { label: "A-Level (UK Year 12-13)", depth: "intermediate",   vocab: "standard mathematical notation, proofs when relevant" },
//   university:   { label: "University / Degree",     depth: "advanced",       vocab: "rigorous, formal notation, deeper theory" },
//   middle_school:{ label: "Middle School (US)",       depth: "foundational",   vocab: "simple, relatable, lots of analogies" },
//   high_school:  { label: "High School (US)",         depth: "intermediate",   vocab: "clear notation, practical examples" },
//   college:      { label: "College / University (US)",depth: "advanced",       vocab: "rigorous, formal, theoretical depth" },
// };

// // ─── Visualisation type detector ─────────────────────────────────────────────

// function detectVisualisationType(question: string): string {
//   const q = question.toLowerCase();
//   if (/quadratic|parabola|y\s*=|f\(x\)|function|graph|plot|curve/.test(q)) return "function_graph";
//   if (/linear|straight line|gradient|slope|intercept/.test(q)) return "linear_graph";
//   if (/circle|circumference|radius|diameter|pi|trigon|sin|cos|tan/.test(q)) return "geometric";
//   if (/probability|statistics|data|frequency|histogram|bar chart/.test(q)) return "statistical";
//   if (/vector|matrix|transform/.test(q)) return "vector";
//   if (/sequence|series|fibonacci|arithmetic|geometric/.test(q)) return "sequence";
//   if (/fraction|ratio|proportion/.test(q)) return "ratio";
//   return "none";
// }

// // ─── Main handler ─────────────────────────────────────────────────────────────

// export async function POST(req: NextRequest) {
//   try {
//     const { question, level = "gcse", mode = "full", followUpContext = "" } = await req.json();

//     if (!question?.trim() || question.trim().length < 2) {
//       return NextResponse.json({ error: "Please enter a maths question" }, { status: 400 });
//     }

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//         const gate = await tokenGate(req, TOKEN_COST, { toolName: "Math Explanation Engine" });
//         console.log(`[math-engine/explain] Token gate result:`, gate);
//         if (!gate.ok) return gate.response; // sends 402 JSON to client
//         console.log(`[math-engine/explain] Passed token gate, proceeding with explanation...`);

//     const lvl    = LEVEL_CFG[level] ?? LEVEL_CFG.gcse;
//     const vizType = detectVisualisationType(question);

//     const systemPrompt = `You are an exceptional mathematics teacher and educator. Your teaching philosophy:
// - Every student CAN understand maths if it's explained well
// - Context and "why" matter as much as "how"
// - Real-world connections make abstract concepts stick
// - History gives maths humanity
// - You adapt your language to the student's level: ${lvl.label}

// Communication style: ${lvl.vocab}
// Depth level: ${lvl.depth}`;

//     let userPrompt = "";

//     if (mode === "simpler") {
//       userPrompt = `A student asked about "${question}" and found the explanation too complex. 
// Explain it again but simpler — like explaining to a younger student. Use a very clear analogy.
// Return ONLY valid JSON (no markdown):
// { "steps": [{"step": 1, "title": "", "explanation": "", "notation": ""}], "analogy": "", "keyInsight": "" }`;
//     }

//     else if (mode === "deeper") {
//       userPrompt = `A student asked about "${question}" and wants to go deeper beyond ${lvl.label}.
// Provide: advanced theory, proofs where applicable, connections to higher mathematics, open questions.
// Return ONLY valid JSON:
// { "deepDive": "", "proof": "", "advancedConnections": [""], "openQuestions": [""] }`;
//     }

//     else if (mode === "tutor") {
//       userPrompt = `A student is working on "${question}". They had this context: ${followUpContext}
// They're asking a follow-up question. Act as their personal tutor: patient, encouraging, Socratic.
// Return ONLY valid JSON:
// { "response": "", "hint": "", "encouragement": "", "nextQuestion": "" }`;
//     }

//     else {
//       // FULL mode — the main comprehensive explanation
//       userPrompt = `Explain this maths question/topic COMPLETELY for a ${lvl.label} student:

// "${question}"

// Return ONLY valid JSON (no markdown, no backticks). Every field must be filled:

// {
//   "topic": "<what branch of maths this is — e.g. Algebra, Calculus, Trigonometry>",
//   "conceptName": "<the specific concept — e.g. Quadratic Equations, Differentiation>",

//   "answer": {
//     "finalAnswer": "<the direct answer to the question>",
//     "notation": "<mathematical notation of the answer if applicable>"
//   },

//   "steps": [
//     {
//       "step": 1,
//       "title": "<short step title>",
//       "explanation": "<clear explanation of this step in plain language>",
//       "notation": "<the mathematical working for this step>",
//       "whyThisStep": "<why we do this step — not just what>"
//     }
//   ],

//   "whyItWorks": {
//     "coreIdea": "<the fundamental reason this method/formula works — the intuition>",
//     "deeperReason": "<the mathematical truth underneath — appropriate for ${lvl.label}>",
//     "commonMistake": "<the most common mistake students make and why>"
//   },

//   "history": {
//     "origin": "<who discovered/developed this concept and roughly when>",
//     "motivation": "<what real problem they were trying to solve>",
//     "evolution": "<how the concept evolved or was refined over time>",
//     "funFact": "<one genuinely interesting or surprising historical fact>"
//   },

//   "realWorld": [
//     {
//       "field": "<e.g. Engineering, Finance, Physics, Computer Science, Medicine>",
//       "application": "<specific real application>",
//       "example": "<concrete, relatable example>"
//     }
//   ],

//   "conceptLinks": [
//     {
//       "concept": "<related maths concept>",
//       "relationship": "<how this concept connects to what we just learned>",
//       "direction": "<prerequisite | builds-on | parallel>"
//     }
//   ],

//   "levelSummary": "<2-3 sentence summary pitched exactly at ${lvl.label} level>",

//   "examTip": "<most important exam/test tip for this type of question at ${lvl.label} level>",

//   "visualisation": {
//     "type": "${vizType}",
//     "description": "<what should be visualised and what it shows>",
//     "keyPoints": ["<key visual insight 1>", "<key visual insight 2>"],
//     "data": ${vizType !== "none" ? `{
//       "functionExpression": "<if function: the expression e.g. 'x^2 - 4x + 3'>",
//       "xRange": "<if graph: suggested x range e.g. '-5 to 10'>",
//       "keyValues": {"<label>": <value>},
//       "annotations": ["<what to highlight on the graph>"]
//     }` : "null"}
//   },

//   "difficulty": "<Easy | Medium | Hard | Very Hard>",
//   "estimatedTimeMinutes": <number>
// }

// Rules:
// - Steps must be thorough — never skip reasoning. Aim for 4-8 steps for most problems.
// - whyItWorks.coreIdea should use an analogy if helpful.
// - realWorld should have 3-5 entries from different fields.
// - conceptLinks should have 3-4 entries spanning prerequisites and extensions.
// - Be specific, not generic. Reference actual numbers/expressions from the question.
// - For ${lvl.label}, vocabulary and depth should feel completely natural — not too advanced, not too basic.`;
//     }

//     const message = await anthropic.messages.create({
//       model:  "claude-sonnet-4-20250514",
//       max_tokens: 5000,
//       system: systemPrompt,
//       messages: [{ role: "user", content: userPrompt }],
//     });

//     const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//     const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

//     let result: any;
//     try { result = JSON.parse(clean); }
//     catch {
//       const match = clean.match(/\{[\s\S]+\}/);
//       if (!match) return NextResponse.json({ error: "Explanation failed — please try again" }, { status: 500 });
//       result = JSON.parse(match[0]);
//     }

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//         await deductTokens(gate.dbUserId, TOKEN_COST, "math-engine/explain", {
//           question,
//           level,
//           mode, 
//         });
//         console.log(`[math-engine/explain] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId}`);

//     return NextResponse.json({ ok: true, result, mode });
//   } catch (err: any) {
//     console.error("[math-engine/explain]", err);
//     return NextResponse.json({ error: err.message ?? "Explanation failed" }, { status: 500 });
//   }
// }