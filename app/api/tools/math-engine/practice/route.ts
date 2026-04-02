// =============================================================================
// isaacpaha.com — Math Understanding Engine — Practice Generator API
// app/api/tools/math-engine/practice/route.ts
//
// POST { topic, conceptName, level, count, difficulty }
// Returns: { questions: [{ question, difficulty, hint, solution, explanation }] }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "math-engine";
const TOKEN_COST = 100; // Reasonable token cost for practice questions
const TOOL_NAME = "Math Practice Generator";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[math-engine/practice] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[math-engine/practice] Failed to load tool ID:`, err);
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

// Generate fallback questions
function generateFallbackQuestions(topic: string, count: number): any {
  const questions = [];
  for (let i = 1; i <= Math.min(count, 3); i++) {
    questions.push({
      id: i,
      question: `Practice question about ${topic || "mathematics"}. Please try again.`,
      difficulty: "Medium",
      hint: "Try refreshing and rephrasing your question",
      solution: { finalAnswer: "Please try again", steps: ["Retry the request"] },
      explanation: "Service temporarily unavailable. Please try again.",
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
      count = 5,
      difficulty = "mixed",
      originalQuestion,
    } = await req.json();

    if (!topic && !originalQuestion) {
      return NextResponse.json(
        { error: "topic or originalQuestion required" },
        { status: 400 }
      );
    }

    // Validate level
    const validLevels = ["gcse", "alevel", "university", "middle_school", "high_school", "college"];
    const validLevel = validLevels.includes(level) ? level : "gcse";

    // Validate difficulty
    const validDifficulties = ["easy", "medium", "hard", "mixed"];
    const validDifficulty = validDifficulties.includes(difficulty) ? difficulty : "mixed";

    // Validate count
    const validCount = Math.min(Math.max(Number(count) || 5, 1), 12);

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    console.log(`[math-engine/practice] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[math-engine/practice] Token gate passed for user ${gateResult.dbUserId}`);

    const prompt = `You are a maths teacher creating practice questions for a ${validLevel.toUpperCase()} student.

Topic: ${topic ?? ""}
Concept: ${conceptName ?? ""}
Original question they studied: ${originalQuestion ?? "not provided"}
Difficulty mix: ${validDifficulty}

Generate exactly ${validCount} practice questions. Start similar to the original, then increase difficulty.

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")

Return EXACTLY this JSON structure:
{
  "questions": [
    {
      "id": 1,
      "question": "<the practice question — clear, precise>",
      "difficulty": "<Easy | Medium | Hard>",
      "hint": "<a helpful hint without giving it away>",
      "solution": {
        "finalAnswer": "<the answer>",
        "steps": ["<step 1>", "<step 2>", "<step 3>"]
      },
      "explanation": "<why this question tests an important aspect of the concept>",
      "examStyle": <true|false>
    }
  ]
}

Rules:
- Question 1 should be very similar to the original (build confidence)
- Questions 2-3 should vary the numbers/parameters
- Questions 4-5 should add a twist or combination
- Later questions should be exam-style or word problems
- Each question must be solvable with the same core concept
- Hints should guide thinking, not give the answer
- For ${validLevel} level, ensure appropriate difficulty and language`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      temperature: 0.4,
      messages: [{ role: "user", content: prompt }],
    });

    const processingMs = Date.now() - start;
    
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    
    let data: any;
    try {
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');
      data = JSON.parse(noTrailing);
    } catch (firstError) {
      try {
        data = cleanAndParseJSON(raw);
      } catch (secondError) {
        console.error(`[math-engine/practice] All parsing attempts failed`);
        console.error(`[math-engine/practice] Raw response (first 500 chars):`, raw.slice(0, 500));
        data = generateFallbackQuestions(topic, validCount);
      }
    }

    // Validate questions array
    if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
      data = generateFallbackQuestions(topic, validCount);
    }

    // Ensure we have exactly validCount questions
    if (data.questions.length > validCount) {
      data.questions = data.questions.slice(0, validCount);
    } else if (data.questions.length < validCount) {
      // Fill with fallbacks if needed
      const fallback = generateFallbackQuestions(topic, validCount - data.questions.length);
      data.questions.push(...fallback.questions);
    }

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "math-engine/practice", {
      topic,
      conceptName,
      level: validLevel,
      count: validCount,
      difficulty: validDifficulty,
      processingMs,
    });
    console.log(`[math-engine/practice] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

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
    console.log(`[math-engine/practice] Tracked tool usage for user ${gateResult.dbUserId}`);

    return NextResponse.json({ 
      ok: true, 
      questions: data.questions,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        level: validLevel,
        count: data.questions.length,
        difficulty: validDifficulty,
      }
    });
  } catch (err: any) {
    console.error("[math-engine/practice] Error:", err);

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
      console.error("[math-engine/practice] Failed to track error:", trackError);
    }
    
    return NextResponse.json(
      { 
        error: err.message ?? "Practice generation failed",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}



// // =============================================================================
// // isaacpaha.com — Math Understanding Engine — Practice Generator API
// // app/api/tools/math-engine/practice/route.ts
// //
// // POST { topic, conceptName, level, count, difficulty }
// // Returns: { questions: [{ question, difficulty, hint, solution, explanation }] }
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// // Tool token costs (in tokens per request)
// const TOKEN_COST = 10000000000000000000; // Adjust based on expected response length and model pricing

// export async function POST(req: NextRequest) {
//   try {
//     const {
//       topic,
//       conceptName,
//       level       = "gcse",
//       count       = 5,
//       difficulty  = "mixed",
//       originalQuestion,
//     } = await req.json();

//     if (!topic && !originalQuestion) {
//       return NextResponse.json({ error: "topic or originalQuestion required" }, { status: 400 });
//     }

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────

//     const gate = await tokenGate(req, TOKEN_COST, { toolName: "Math Practice Generator" });
//     // console.log(`[math-engine/practice] User ${gate.dbUserId} passed token gate for practice generation`);
//     if (!gate.ok) return gate.response; // sends 402 JSON to client
//     console.log(`[math-engine/practice] Token gate passed for user ${gate.dbUserId} — proceeding with practice generation`);
      

//     const prompt = `You are a maths teacher creating practice questions for a ${level.toUpperCase()} student.

// Topic: ${topic ?? ""}
// Concept: ${conceptName ?? ""}
// Original question they studied: ${originalQuestion ?? "not provided"}
// Difficulty mix: ${difficulty}

// Generate exactly ${Math.min(count, 8)} practice questions. Start similar to the original, then increase difficulty.

// Return ONLY valid JSON (no markdown):
// {
//   "questions": [
//     {
//       "id": 1,
//       "question": "<the practice question — clear, precise>",
//       "difficulty": "<Easy | Medium | Hard>",
//       "hint": "<a helpful hint without giving it away>",
//       "solution": {
//         "finalAnswer": "<the answer>",
//         "steps": ["<step 1>", "<step 2>", "<step 3>"]
//       },
//       "explanation": "<why this question tests an important aspect of the concept>",
//       "examStyle": <true|false>
//     }
//   ]
// }

// Rules:
// - Question 1 should be very similar to the original (build confidence)
// - Questions 2-3 should vary the numbers/parameters
// - Questions 4-5 should add a twist or combination
// - Later questions should be exam-style or word problems
// - Each question must be solvable with the same core concept
// - Hints should guide thinking, not give the answer`;

//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 3000,
//       messages:   [{ role: "user", content: prompt }],
//     });

//     const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//     const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

//     let data: any;
//     try { data = JSON.parse(clean); }
//     catch {
//       const match = clean.match(/\{[\s\S]+\}/);
//       data = match ? JSON.parse(match[0]) : { questions: [] };
//     }

//     // ── ③ TOKEN DEDUCTION — deduct tokens after successful AI response ──────────────────────
//     await deductTokens(gate.dbUserId, TOKEN_COST, "math-engine/practice", {
//       topic,
//       conceptName,
//       level,
//       count,
//       difficulty,
//     });
//     console.log(`[math-engine/practice] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId}`);


//     return NextResponse.json({ ok: true, questions: data.questions ?? [] });
//   } catch (err: any) {
//     console.error("[math-engine/practice]", err);
//     return NextResponse.json({ error: "Practice generation failed" }, { status: 500 });
//   }
// }