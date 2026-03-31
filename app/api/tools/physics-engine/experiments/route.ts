// =============================================================================
// isaacpaha.com — Physics Understanding Engine — Experiments & Practice API
// app/api/tools/physics-engine/experiments/route.ts
//
// POST { topic, conceptName, level, type }
//   type: "practice" | "experiments" | "theory_questions"
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });


// Tool token costs (in tokens per request)
const TOKEN_COST = 1200000000000000; // Adjust based on expected response length and model pricing

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const {
      topic,
      conceptName,
      level       = "gcse",
      type        = "practice",
      originalQuestion,
    } = await req.json();

    if (!topic && !originalQuestion) {
      return NextResponse.json({ error: "topic or originalQuestion required" }, { status: 400 });
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    const gate = await tokenGate(req, TOKEN_COST, { toolName: "Physics Understanding Engine" });
    console.log(`[physics-engine/experiments] Token gate result:`, gate);
    if (!gate.ok) return gate.response; // sends 402 JSON to client
    console.log(`[physics-engine/experiments] Token gate passed for user ${gate.dbUserId} — proceeding with question generation`);


    if (type === "practice") {
      const prompt = `You are a physics teacher creating exam-style practice questions for ${level.toUpperCase()} students.

Topic: ${topic ?? ""}
Concept: ${conceptName ?? ""}
Original question studied: ${originalQuestion ?? "not provided"}

Generate 5 practice questions. Progression: confidence → challenge → exam standard.

Return ONLY valid JSON:
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
- Mark scheme should match GCSE/A-Level marking conventions
- Mix calculation and explanation questions
- Questions 4-5 should be multi-step or require understanding not just formula recall`;

      const message = await anthropic.messages.create({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 3000,
        messages:   [{ role: "user", content: prompt }],
      });

      const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      let data: any;
      try { data = JSON.parse(clean); }
      catch { const m = clean.match(/\{[\s\S]+\}/); data = m ? JSON.parse(m[0]) : { questions: [] }; }

      return NextResponse.json({ ok: true, questions: data.questions ?? [] });
    }

    if (type === "theory_questions") {
      const prompt = `Generate 6 theory/explanation questions for ${level.toUpperCase()} on: ${conceptName ?? topic ?? originalQuestion}

Mix: recall, explain-why, compare, evaluate, apply.

Return ONLY valid JSON:
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
        model:      "claude-sonnet-4-20250514",
        max_tokens: 2500,
        messages:   [{ role: "user", content: prompt }],
      });

      const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      let data: any;
      try { data = JSON.parse(clean); }
      catch { const m = clean.match(/\{[\s\S]+\}/); data = m ? JSON.parse(m[0]) : { questions: [] }; }

      return NextResponse.json({ ok: true, questions: data.questions ?? [] });
    }

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gate.dbUserId, TOKEN_COST, "physics-engine/experiments", {
      type, level, topic, conceptName, originalQuestion
    });
    console.log(`[physics-engine/experiments] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId}`);


    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    console.error("[physics-engine/experiments]", err);
    return NextResponse.json({ error: err.message ?? "Request failed" }, { status: 500 });
  }
}