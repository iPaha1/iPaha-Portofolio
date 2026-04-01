// =============================================================================
// isaacpaha.com — Chemistry Understanding Engine — Experiments & Practice API
// app/api/tools/chemistry-engine/experiments/route.ts
//
// POST { topic, conceptName, level, type }
//   type: "practice" | "theory_questions"
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "chemistry-engine";
const TOOL_NAME = "Chemistry Engine";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[chemistry-engine/experiments] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[chemistry-engine/experiments] Failed to load tool ID:`, err);
}

// Tool token costs (in tokens per request)
const MODE_TOKEN_COST: Record<string, number> = {
  practice: 80,           // Practice questions with solutions
  theory_questions: 60,   // Theory questions with model answers
};

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

// Generate fallback questions
function generateFallbackQuestions(topic: string, type: string): any {
  const questions = [];
  for (let i = 1; i <= 3; i++) {
    questions.push({
      id: i,
      question: `Practice question about ${topic || "chemistry"}. Please try again.`,
      marks: 2,
      difficulty: "Medium",
      hint: "Try refreshing and rephrasing your question",
      solution: {
        workingOut: ["Review the concept", "Apply the principle"],
        finalAnswer: "Please try again",
        markScheme: "Award marks for correct application of concept",
      },
      commonError: "Please try again with a more specific question",
      examStyle: false,
    });
  }
  return { questions };
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    const {
      topic,
      conceptName,
      level = "gcse",
      type = "practice",
      originalQuestion,
    } = await req.json();

    if (!topic && !originalQuestion) {
      return NextResponse.json(
        { error: "topic or originalQuestion required" },
        { status: 400 }
      );
    }

    // Validate level
    const validLevels = ["gcse", "alevel", "university"];
    const validLevel = validLevels.includes(level) ? level : "gcse";

    // Validate type
    const validTypes = ["practice", "theory_questions"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Valid types: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const tokenCost = MODE_TOKEN_COST[type] || 80;

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, tokenCost, { toolName: TOOL_NAME });
    console.log(`[chemistry-engine/experiments] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[chemistry-engine/experiments] Token gate passed for user ${gateResult.dbUserId}`);

    let result: any;

    // ── PRACTICE (calculation/application) questions ──────────────────────────
    if (type === "practice") {
      const prompt = `You are an experienced chemistry teacher creating ${validLevel.toUpperCase()} exam-style practice questions.

Topic: ${topic ?? ""}
Concept: ${conceptName ?? ""}
Original question studied: ${originalQuestion ?? "not provided"}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")

Generate exactly 5 practice questions. Start with confidence-builders, progress to exam-standard.

Return EXACTLY this JSON structure:
{
  "questions": [
    {
      "id": 1,
      "question": "<question — include all data needed, with units>",
      "marks": <1-6>,
      "difficulty": "<Recall | Application | Analysis>",
      "hint": "<helpful hint — guides thinking without giving the answer>",
      "solution": {
        "workingOut": ["<step 1 with units>", "<step 2>", "<step 3>"],
        "finalAnswer": "<answer with units>",
        "markScheme": "<key points the examiner awards marks for>"
      },
      "commonError": "<the mistake students most often make>",
      "examStyle": <true|false>
    }
  ]
}

Rules:
- Include all necessary data within the question (masses, volumes, concentrations, formulae)
- Use correct SI units throughout
- Mark schemes must use proper exam language
- Q1-2: build confidence — straightforward application
- Q3: slightly varied parameters or a two-step problem
- Q4-5: multi-step, exam-standard
- commonError should be specific — not just "forgetting units"`;

      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3500,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
      
      try {
        const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');
        result = JSON.parse(noTrailing);
      } catch {
        result = cleanAndParseJSON(raw);
      }
      
      result = { questions: result.questions ?? [] };
    }

    // ── THEORY questions ──────────────────────────────────────────────────────
    else if (type === "theory_questions") {
      const prompt = `Generate 6 theory/explanation questions for ${validLevel.toUpperCase()} on: ${conceptName ?? topic ?? originalQuestion}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects

Mix: recall, explain, compare, evaluate, particle-level explanation.

Return EXACTLY this JSON structure:
{
  "questions": [
    {
      "id": 1,
      "question": "<theory question>",
      "type": "<Recall | Explain | Compare | Evaluate | Particle-Level>",
      "marks": <2-6>,
      "modelAnswer": "<2-4 sentence model answer — clear, scientifically precise>",
      "keyTerms": ["<key scientific term to include>"],
      "particleAnswer": "<if Particle-Level type: describe what's happening at the atomic/molecular level>"
    }
  ]
}

Include at least 2 particle-level questions — this is what sets top-grade answers apart.`;

      const msg = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2500,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = msg.content[0].type === "text" ? msg.content[0].text : "{}";
      
      try {
        const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');
        result = JSON.parse(noTrailing);
      } catch {
        result = cleanAndParseJSON(raw);
      }
      
      result = { questions: result.questions ?? [] };
    }

    const processingMs = Date.now() - start;

    // Validate result
    if (!result.questions || !Array.isArray(result.questions) || result.questions.length === 0) {
      result = generateFallbackQuestions(topic || "chemistry", type);
    }

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, tokenCost, "chemistry-engine/experiments", {
      type,
      level: validLevel,
      topic: topic ?? "",
      concept: conceptName ?? "",
      processingMs,
    });
    console.log(`[chemistry-engine/experiments] Deducted ${tokenCost} tokens from user ${gateResult.dbUserId} for ${type} questions.`);

    // ── ③ TRACK USAGE ───────────────────────────────────────────────────────
    await trackToolUsage({
      toolId: TOOL_ID,
      toolName: TOOL_NAME,
      userId: gateResult.dbUserId,
      ipAddress: getIpFromRequest(req),
      processingMs,
      tokenCost,
      wasSuccess: true,
    });
    console.log(`[chemistry-engine/experiments] Tracked tool usage for user ${gateResult.dbUserId}`);

    return NextResponse.json({ 
      ok: true, 
      questions: result.questions,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: tokenCost,
        type,
        level: validLevel,
        questionCount: result.questions.length,
      }
    });
  } catch (err: any) {
    console.error("[chemistry-engine/experiments] Error:", err);

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
      console.error("[chemistry-engine/experiments] Failed to track error:", trackError);
    }
    
    return NextResponse.json(
      { 
        error: err.message ?? "Request failed",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}


// // =============================================================================
// // isaacpaha.com — Chemistry Understanding Engine — Experiments & Practice API
// // app/api/tools/chemistry-engine/experiments/route.ts
// //
// // POST { topic, conceptName, level, type }
// //   type: "practice" | "theory_questions"
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// // Tool token costs (in tokens per request) — adjust based on expected response length and model pricing
// const MODE_TOKEN_COST: Record<string, number> = {
//   practice: 30000000000000, // Practice questions with solutions are more complex
//   theory_questions: 2000000000000000, // Theory questions with model answers
// };

// export async function POST(req: NextRequest) {
//   try {
//     const {
//       topic,
//       conceptName,
//       level             = "gcse",
//       type              = "practice",
//       originalQuestion,
//     } = await req.json();

//     if (!topic && !originalQuestion) {
//       return NextResponse.json({ error: "topic or originalQuestion required" }, { status: 400 });
//     }

//       // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//       const gate = await tokenGate(req, MODE_TOKEN_COST[type], { toolName: "Chemistry Engine" });
//       console.log(`[chemistry-engine/experiments] Token gate result:`, gate);
//       if (!gate.ok) return gate.response; // sends 402 JSON to client
//       console.log(`[chemistry-engine/experiments] Token gate passed for user ${gate.dbUserId}, proceeding with ${type} questions.`);


//     // ── PRACTICE (calculation/application) questions ──────────────────────────
//     if (type === "practice") {
//       const prompt = `You are an experienced chemistry teacher creating ${level.toUpperCase()} exam-style practice questions.

// Topic: ${topic ?? ""}
// Concept: ${conceptName ?? ""}
// Original question studied: ${originalQuestion ?? "not provided"}

// Generate exactly 5 practice questions. Start with confidence-builders, progress to exam-standard.

// Return ONLY valid JSON:
// {
//   "questions": [
//     {
//       "id": 1,
//       "question": "<question — include all data needed, with units>",
//       "marks": <1-6>,
//       "difficulty": "<Recall | Application | Analysis>",
//       "hint": "<helpful hint — guides thinking without giving the answer>",
//       "solution": {
//         "workingOut": ["<step 1 with units>", "<step 2>", "<step 3>"],
//         "finalAnswer": "<answer with units>",
//         "markScheme": "<key points the examiner awards marks for — use mark scheme language>"
//       },
//       "commonError": "<the mistake students most often make on this type of question>",
//       "examStyle": <true|false>
//     }
//   ]
// }

// Rules:
// - Include all necessary data within the question (masses, volumes, concentrations, formulae)
// - Use correct SI units throughout
// - Mark schemes must use proper exam language: e.g. "Award 1 mark for..."
// - Q1-2: build confidence — straightforward application of the concept
// - Q3: slightly varied parameters or a two-step problem
// - Q4-5: multi-step, exam-standard, possibly a longer calculation or "explain why" component
// - commonError should be specific — not just "forgetting units"`;

//       const msg   = await anthropic.messages.create({ model: "claude-sonnet-4-20250514", max_tokens: 3500, messages: [{ role: "user", content: prompt }] });
//       const raw   = msg.content[0].type === "text" ? msg.content[0].text : "{}";
//       const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
//       let data: any;
//       try { data = JSON.parse(clean); }
//       catch { const m = clean.match(/\{[\s\S]+\}/); data = m ? JSON.parse(m[0]) : { questions: [] }; }
//       return NextResponse.json({ ok: true, questions: data.questions ?? [] });
//     }

//     // ── THEORY questions ──────────────────────────────────────────────────────
//     if (type === "theory_questions") {
//       const prompt = `Generate 6 theory/explanation questions for ${level.toUpperCase()} on: ${conceptName ?? topic ?? originalQuestion}

// Mix: recall, explain, compare, evaluate, particle-level explanation.

// Return ONLY valid JSON:
// {
//   "questions": [
//     {
//       "id": 1,
//       "question": "<theory question>",
//       "type": "<Recall | Explain | Compare | Evaluate | Particle-Level>",
//       "marks": <2-6>,
//       "modelAnswer": "<2-4 sentence model answer — clear, scientifically precise, appropriate for the level>",
//       "keyTerms": ["<key scientific term to include>"],
//       "particleAnswer": "<if Particle-Level type: describe what's happening at the atomic/molecular level>"
//     }
//   ]
// }

// Include at least 2 particle-level questions — this is what sets top-grade answers apart.`;

//       const msg   = await anthropic.messages.create({ model: "claude-sonnet-4-20250514", max_tokens: 2500, messages: [{ role: "user", content: prompt }] });
//       const raw   = msg.content[0].type === "text" ? msg.content[0].text : "{}";
//       const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
//       let data: any;
//       try { data = JSON.parse(clean); }
//       catch { const m = clean.match(/\{[\s\S]+\}/); data = m ? JSON.parse(m[0]) : { questions: [] }; }
//       return NextResponse.json({ ok: true, questions: data.questions ?? [] });
//     }

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//     await deductTokens(gate.dbUserId, MODE_TOKEN_COST[type], "chemistry-engine/experiments", { type, level, topic: topic ?? "", concept: conceptName ?? "" });
//     console.log(`[chemistry-engine/experiments] Deducted ${MODE_TOKEN_COST[type]} tokens from user ${gate.dbUserId} for ${type} questions.`);


//     return NextResponse.json({ error: "Invalid type" }, { status: 400 });
//   } catch (err: any) {
//     console.error("[chemistry-engine/experiments]", err);
//     return NextResponse.json({ error: err.message ?? "Request failed" }, { status: 500 });
//   }
// }