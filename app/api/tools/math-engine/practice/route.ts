// =============================================================================
// isaacpaha.com — Math Understanding Engine — Practice Generator API
// app/api/tools/math-engine/practice/route.ts
//
// POST { topic, conceptName, level, count, difficulty }
// Returns: { questions: [{ question, difficulty, hint, solution, explanation }] }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

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

    return NextResponse.json({ ok: true, questions: data.questions ?? [] });
  } catch (err: any) {
    console.error("[math-engine/practice]", err);
    return NextResponse.json({ error: "Practice generation failed" }, { status: 500 });
  }
}