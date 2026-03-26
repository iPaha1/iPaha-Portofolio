// =============================================================================
// isaacpaha.com — Chemistry Understanding Engine — Experiments & Practice API
// app/api/tools/chemistry-engine/experiments/route.ts
//
// POST { topic, conceptName, level, type }
//   type: "practice" | "theory_questions"
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const {
      topic,
      conceptName,
      level             = "gcse",
      type              = "practice",
      originalQuestion,
    } = await req.json();

    if (!topic && !originalQuestion) {
      return NextResponse.json({ error: "topic or originalQuestion required" }, { status: 400 });
    }

    // ── PRACTICE (calculation/application) questions ──────────────────────────
    if (type === "practice") {
      const prompt = `You are an experienced chemistry teacher creating ${level.toUpperCase()} exam-style practice questions.

Topic: ${topic ?? ""}
Concept: ${conceptName ?? ""}
Original question studied: ${originalQuestion ?? "not provided"}

Generate exactly 5 practice questions. Start with confidence-builders, progress to exam-standard.

Return ONLY valid JSON:
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
        "markScheme": "<key points the examiner awards marks for — use mark scheme language>"
      },
      "commonError": "<the mistake students most often make on this type of question>",
      "examStyle": <true|false>
    }
  ]
}

Rules:
- Include all necessary data within the question (masses, volumes, concentrations, formulae)
- Use correct SI units throughout
- Mark schemes must use proper exam language: e.g. "Award 1 mark for..."
- Q1-2: build confidence — straightforward application of the concept
- Q3: slightly varied parameters or a two-step problem
- Q4-5: multi-step, exam-standard, possibly a longer calculation or "explain why" component
- commonError should be specific — not just "forgetting units"`;

      const msg   = await anthropic.messages.create({ model: "claude-sonnet-4-20250514", max_tokens: 3500, messages: [{ role: "user", content: prompt }] });
      const raw   = msg.content[0].type === "text" ? msg.content[0].text : "{}";
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      let data: any;
      try { data = JSON.parse(clean); }
      catch { const m = clean.match(/\{[\s\S]+\}/); data = m ? JSON.parse(m[0]) : { questions: [] }; }
      return NextResponse.json({ ok: true, questions: data.questions ?? [] });
    }

    // ── THEORY questions ──────────────────────────────────────────────────────
    if (type === "theory_questions") {
      const prompt = `Generate 6 theory/explanation questions for ${level.toUpperCase()} on: ${conceptName ?? topic ?? originalQuestion}

Mix: recall, explain, compare, evaluate, particle-level explanation.

Return ONLY valid JSON:
{
  "questions": [
    {
      "id": 1,
      "question": "<theory question>",
      "type": "<Recall | Explain | Compare | Evaluate | Particle-Level>",
      "marks": <2-6>,
      "modelAnswer": "<2-4 sentence model answer — clear, scientifically precise, appropriate for the level>",
      "keyTerms": ["<key scientific term to include>"],
      "particleAnswer": "<if Particle-Level type: describe what's happening at the atomic/molecular level>"
    }
  ]
}

Include at least 2 particle-level questions — this is what sets top-grade answers apart.`;

      const msg   = await anthropic.messages.create({ model: "claude-sonnet-4-20250514", max_tokens: 2500, messages: [{ role: "user", content: prompt }] });
      const raw   = msg.content[0].type === "text" ? msg.content[0].text : "{}";
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      let data: any;
      try { data = JSON.parse(clean); }
      catch { const m = clean.match(/\{[\s\S]+\}/); data = m ? JSON.parse(m[0]) : { questions: [] }; }
      return NextResponse.json({ ok: true, questions: data.questions ?? [] });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: any) {
    console.error("[chemistry-engine/experiments]", err);
    return NextResponse.json({ error: err.message ?? "Request failed" }, { status: 500 });
  }
}