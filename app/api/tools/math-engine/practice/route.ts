// =============================================================================
// isaacpaha.com — Math Understanding Engine — Practice Generator API
// app/api/tools/math-engine/practice/route.ts
//
// POST { topic, conceptName, level, count, difficulty }
// Returns: { questions: [{ question, difficulty, hint, solution, explanation }] }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Tool token costs (in tokens per request)
const TOKEN_COST = 1000; // Adjust based on expected response length and model pricing

export async function POST(req: NextRequest) {
  try {
    const {
      topic,
      conceptName,
      level       = "gcse",
      count       = 5,
      difficulty  = "mixed",
      originalQuestion,
    } = await req.json();

    if (!topic && !originalQuestion) {
      return NextResponse.json({ error: "topic or originalQuestion required" }, { status: 400 });
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────

    const gate = await tokenGate(req, TOKEN_COST, { toolName: "Math Practice Generator" });
    // console.log(`[math-engine/practice] User ${gate.dbUserId} passed token gate for practice generation`);
    if (!gate.ok) return gate.response; // sends 402 JSON to client
    console.log(`[math-engine/practice] Token gate passed for user ${gate.dbUserId} — proceeding with practice generation`);
      

    const prompt = `You are a maths teacher creating practice questions for a ${level.toUpperCase()} student.

Topic: ${topic ?? ""}
Concept: ${conceptName ?? ""}
Original question they studied: ${originalQuestion ?? "not provided"}
Difficulty mix: ${difficulty}

Generate exactly ${Math.min(count, 8)} practice questions. Start similar to the original, then increase difficulty.

Return ONLY valid JSON (no markdown):
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
- Hints should guide thinking, not give the answer`;

    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let data: any;
    try { data = JSON.parse(clean); }
    catch {
      const match = clean.match(/\{[\s\S]+\}/);
      data = match ? JSON.parse(match[0]) : { questions: [] };
    }

    // ── ③ TOKEN DEDUCTION — deduct tokens after successful AI response ──────────────────────
    await deductTokens(gate.dbUserId, TOKEN_COST, "math-engine/practice", {
      topic,
      conceptName,
      level,
      count,
      difficulty,
    });
    console.log(`[math-engine/practice] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId}`);


    return NextResponse.json({ ok: true, questions: data.questions ?? [] });
  } catch (err: any) {
    console.error("[math-engine/practice]", err);
    return NextResponse.json({ error: "Practice generation failed" }, { status: 500 });
  }
}