// =============================================================================
// isaacpaha.com — Physics Understanding Engine — Experiments & Practice API
// app/api/tools/physics-engine/experiments/route.ts
//
// POST { topic, conceptName, level, type }
//   type: "practice" | "experiments" | "theory_questions"
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "physics-engine";
const TOKEN_COST = 100; // Reasonable token cost for physics questions
const TOOL_NAME = "Physics Understanding Engine";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[physics-engine/experiments] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[physics-engine/experiments] Failed to load tool ID:`, err);
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

// ─── Main handler ─────────────────────────────────────────────────────────────
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
    const validTypes = ["practice", "theory_questions", "experiments"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Valid types: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    console.log(`[physics-engine/experiments] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[physics-engine/experiments] Token gate passed for user ${gateResult.dbUserId}`);

    let result: any;

    if (type === "practice") {
      const prompt = `You are a physics teacher creating exam-style practice questions for ${validLevel.toUpperCase()} students.

Topic: ${topic ?? ""}
Concept: ${conceptName ?? ""}
Original question studied: ${originalQuestion ?? "not provided"}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")

Generate 5 practice questions. Progression: confidence → challenge → exam standard.

Return EXACTLY this JSON structure:
{
  "questions": [
    {
      "id": 1,
      "question": "<the question — include units and required information>",
      "marks": <1-6>,
      "difficulty": "<Recall | Application | Analysis>",
      "hint": "<helpful hint without giving the answer>",
      "solution": {
        "workingOut": ["<step 1>", "<step 2>", "<step 3>"],
        "finalAnswer": "<answer with units>",
        "markScheme": "<key points an examiner would award marks for>"
      },
      "commonError": "<mistake students typically make on this type of question>",
      "examStyle": <true|false>
    }
  ]
}

Rules:
- Include units in all numerical questions
- Mark scheme should match ${validLevel.toUpperCase()} marking conventions
- Mix calculation and explanation questions
- Questions 4-5 should be multi-step or require understanding not just formula recall`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
      
      try {
        const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');
        result = JSON.parse(noTrailing);
      } catch {
        result = cleanAndParseJSON(raw);
      }
      
      result = { questions: result.questions ?? [] };
    }

    else if (type === "theory_questions") {
      const prompt = `Generate 6 theory/explanation questions for ${validLevel.toUpperCase()} on: ${conceptName ?? topic ?? originalQuestion}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects

Mix: recall, explain-why, compare, evaluate, apply.

Return EXACTLY this JSON structure:
{
  "questions": [
    {
      "id": 1,
      "question": "<theory question>",
      "type": "<Recall | Explain | Compare | Evaluate | Apply>",
      "marks": <2-6>,
      "modelAnswer": "<2-4 sentence model answer — clear and complete>",
      "keyTerms": ["<key term to include in answer>"]
    }
  ]
}`;

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2500,
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
      
      try {
        const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');
        result = JSON.parse(noTrailing);
      } catch {
        result = cleanAndParseJSON(raw);
      }
      
      result = { questions: result.questions ?? [] };
    }

    else {
      // Experiments type - can be implemented similarly
      return NextResponse.json({ error: "Experiments type coming soon" }, { status: 400 });
    }

    const processingMs = Date.now() - start;

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "physics-engine/experiments", {
      type,
      level: validLevel,
      topic,
      conceptName,
      processingMs,
    });
    console.log(`[physics-engine/experiments] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

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
    console.log(`[physics-engine/experiments] Tracked tool usage for user ${gateResult.dbUserId}`);

    return NextResponse.json({ 
      ok: true, 
      ...result,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        type,
        level: validLevel,
        questionCount: result.questions?.length || 0,
      }
    });
  } catch (err: any) {
    console.error("[physics-engine/experiments] Error:", err);

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
      console.error("[physics-engine/experiments] Failed to track error:", trackError);
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
// // isaacpaha.com — Physics Understanding Engine — Experiments & Practice API
// // app/api/tools/physics-engine/experiments/route.ts
// //
// // POST { topic, conceptName, level, type }
// //   type: "practice" | "experiments" | "theory_questions"
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });


// // Tool token costs (in tokens per request)
// const TOKEN_COST = 1200000000000000; // Adjust based on expected response length and model pricing

// // ─── Main handler ─────────────────────────────────────────────────────────────
// export async function POST(req: NextRequest) {
//   try {
//     const {
//       topic,
//       conceptName,
//       level       = "gcse",
//       type        = "practice",
//       originalQuestion,
//     } = await req.json();

//     if (!topic && !originalQuestion) {
//       return NextResponse.json({ error: "topic or originalQuestion required" }, { status: 400 });
//     }

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//     const gate = await tokenGate(req, TOKEN_COST, { toolName: "Physics Understanding Engine" });
//     console.log(`[physics-engine/experiments] Token gate result:`, gate);
//     if (!gate.ok) return gate.response; // sends 402 JSON to client
//     console.log(`[physics-engine/experiments] Token gate passed for user ${gate.dbUserId} — proceeding with question generation`);


//     if (type === "practice") {
//       const prompt = `You are a physics teacher creating exam-style practice questions for ${level.toUpperCase()} students.

// Topic: ${topic ?? ""}
// Concept: ${conceptName ?? ""}
// Original question studied: ${originalQuestion ?? "not provided"}

// Generate 5 practice questions. Progression: confidence → challenge → exam standard.

// Return ONLY valid JSON:
// {
//   "questions": [
//     {
//       "id": 1,
//       "question": "<the question — include units and required information>",
//       "marks": <1-6>,
//       "difficulty": "<Recall | Application | Analysis>",
//       "hint": "<helpful hint without giving the answer>",
//       "solution": {
//         "workingOut": ["<step 1>", "<step 2>", "<step 3>"],
//         "finalAnswer": "<answer with units>",
//         "markScheme": "<key points an examiner would award marks for>"
//       },
//       "commonError": "<mistake students typically make on this type of question>",
//       "examStyle": <true|false>
//     }
//   ]
// }

// Rules:
// - Include units in all numerical questions
// - Mark scheme should match GCSE/A-Level marking conventions
// - Mix calculation and explanation questions
// - Questions 4-5 should be multi-step or require understanding not just formula recall`;

//       const message = await anthropic.messages.create({
//         model:      "claude-sonnet-4-20250514",
//         max_tokens: 3000,
//         messages:   [{ role: "user", content: prompt }],
//       });

//       const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//       const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
//       let data: any;
//       try { data = JSON.parse(clean); }
//       catch { const m = clean.match(/\{[\s\S]+\}/); data = m ? JSON.parse(m[0]) : { questions: [] }; }

//       return NextResponse.json({ ok: true, questions: data.questions ?? [] });
//     }

//     if (type === "theory_questions") {
//       const prompt = `Generate 6 theory/explanation questions for ${level.toUpperCase()} on: ${conceptName ?? topic ?? originalQuestion}

// Mix: recall, explain-why, compare, evaluate, apply.

// Return ONLY valid JSON:
// {
//   "questions": [
//     {
//       "id": 1,
//       "question": "<theory question>",
//       "type": "<Recall | Explain | Compare | Evaluate | Apply>",
//       "marks": <2-6>,
//       "modelAnswer": "<2-4 sentence model answer — clear and complete>",
//       "keyTerms": ["<key term to include in answer>"]
//     }
//   ]
// }`;

//       const message = await anthropic.messages.create({
//         model:      "claude-sonnet-4-20250514",
//         max_tokens: 2500,
//         messages:   [{ role: "user", content: prompt }],
//       });

//       const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//       const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
//       let data: any;
//       try { data = JSON.parse(clean); }
//       catch { const m = clean.match(/\{[\s\S]+\}/); data = m ? JSON.parse(m[0]) : { questions: [] }; }

//       return NextResponse.json({ ok: true, questions: data.questions ?? [] });
//     }

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//     await deductTokens(gate.dbUserId, TOKEN_COST, "physics-engine/experiments", {
//       type, level, topic, conceptName, originalQuestion
//     });
//     console.log(`[physics-engine/experiments] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId}`);


//     return NextResponse.json({ error: "Invalid type" }, { status: 400 });
//   } catch (err: any) {
//     console.error("[physics-engine/experiments]", err);
//     return NextResponse.json({ error: err.message ?? "Request failed" }, { status: 500 });
//   }
// }