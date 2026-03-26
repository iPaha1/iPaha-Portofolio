// =============================================================================
// isaacpaha.com — CV Analyser: Interview Prep API
// app/api/tools/cv-analyser/interview/route.ts
// POST { cvText, jobDescription?, roleMode? }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { cvText, jobDescription, roleMode = "general" } = await req.json();

    if (!cvText?.trim() || cvText.trim().length < 50) {
      return NextResponse.json({ error: "CV text required" }, { status: 400 });
    }

    const prompt = `Based on this CV${jobDescription ? " and job description" : ""}, generate 12 highly likely interview questions the candidate will face.

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.slice(0, 1000)}\n\n` : ""}CV:\n${cvText.slice(0, 2500)}

Return ONLY valid JSON (no markdown, no backticks):
{
  "questions": [
    {
      "question": "<interview question>",
      "type": "<Behavioural|Technical|Situational|Motivational|Competency>",
      "difficulty": "<Easy|Medium|Hard>",
      "tip": "<specific 1-2 sentence preparation tip based on their actual CV content>",
      "starHint": "<suggested STAR framework opening — e.g. 'Draw on your experience at X where you...'>"
    }
  ]
}

Rules:
- 4 behavioural (Tell me about a time…)
- 3 technical/role-specific (based on their skills)
- 2 motivational (Why this role? Why this company?)
- 2 situational (What would you do if…)
- 1 curveball (unusual but common in their sector)
- Make STAR hints reference their actual listed experience`;

    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 2500,
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
    console.error("[cv-analyser/interview]", err);
    return NextResponse.json({ error: "Interview prep failed" }, { status: 500 });
  }
}



// // =============================================================================
// // CV Analyser: Interview Prep API
// // app/api/tools/cv-analyser/interview/route.ts
// //
// // POST { cvText, jobDescription?, roleMode? }
// //   Returns 10 likely interview questions with tips
// // =============================================================================

// // PASTE INTO: app/api/tools/cv-analyser/interview/route.ts

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// export async function POST(req: NextRequest) {
//   const { cvText, jobDescription, roleMode = "general" } = await req.json();

//   if (!cvText?.trim()) {
//     return NextResponse.json({ error: "CV text required" }, { status: 400 });
//   }

//   const prompt = `Based on this CV${jobDescription ? " and job description" : ""}, generate 12 highly likely interview questions the candidate will face.

// ${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.slice(0, 1000)}\n\n` : ""}CV:\n${cvText.slice(0, 2500)}

// Return ONLY valid JSON (no markdown):
// {
//   "questions": [
//     {
//       "question": "<interview question>",
//       "type": "<Behavioural|Technical|Situational|Motivational|Competency>",
//       "difficulty": "<Easy|Medium|Hard>",
//       "tip": "<specific tip based on their CV>",
//       "starHint": "<suggested STAR framework opening based on their experience — e.g. 'Draw on your experience at X where you...'>"
//     }
//   ]
// }

// Mix: 4 behavioural, 3 technical/role-specific, 2 motivational, 2 situational, 1 curveball.
// Make the tips specific to their actual CV content.`;

//   try {
//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 2000,
//       messages:   [{ role: "user", content: prompt }],
//     });
//     const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//     const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
//     const data  = JSON.parse(clean);
//     return NextResponse.json({ ok: true, questions: data.questions ?? [] });
//   } catch (err: any) {
//     return NextResponse.json({ error: "Interview prep failed" }, { status: 500 });
//   }
// }
