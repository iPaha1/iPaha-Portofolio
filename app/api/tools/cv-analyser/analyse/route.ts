// =============================================================================
// isaacpaha.com — AI CV Analyser Pro — Full Analysis API
// app/api/tools/cv-analyser/analyse/route.ts
//
// POST { cvText, jobDescription, roleMode }
// Returns comprehensive JSON analysis:
//   - jobMatchScore, atsScore, keywordScore, languageScore, structureScore
//   - keywordGap: { present, missing, suggested }
//   - sectionFeedback: per-section analysis
//   - bulletRewrites: before/after pairs
//   - languageIssues: weak phrases + stronger alternatives
//   - successPrediction: shortlist likelihood + advice
//   - topImprovements: 5 prioritised actions
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });


// Tool token costs (in tokens per request)
const TOKEN_COST = 2000000000000; // Adjust based on expected response length and model pricing

const ROLE_MODES: Record<string, string> = {
  tech:       "software engineering, data science, cybersecurity, or product management",
  finance:    "finance, accounting, banking, or investment",
  graduate:   "entry-level or graduate roles",
  business:   "business, management, strategy, or operations",
  creative:   "design, marketing, media, or creative industries",
  healthcare: "healthcare, nursing, medicine, or life sciences",
  general:    "general professional roles",
};

function buildPrompt(cvText: string, jobDescription: string, roleMode: string): string {
  const roleContext = ROLE_MODES[roleMode] ?? ROLE_MODES.general;

  return `You are an expert CV analyst and career coach specialising in ${roleContext}. Analyse this CV${jobDescription ? " against the job description" : ""} and return ONLY valid JSON — no markdown, no backticks, no explanation.

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.slice(0, 2000)}\n\n` : ""}CV TEXT:\n${cvText.slice(0, 4000)}

Return this exact JSON structure (fill all fields honestly and specifically):

{
  "jobMatchScore": <0-100, only if job description provided, else 0>,
  "atsScore": <0-100>,
  "keywordScore": <0-100, only if job description provided, else based on general industry keywords>,
  "languageScore": <0-100>,
  "structureScore": <0-100>,
  "overallScore": <weighted average of all scores>,

  "executiveSummary": "<3-4 sentence honest, direct assessment of this CV's strengths and biggest gaps. Be specific, not generic.>",

  "successPrediction": {
    "shortlistLikelihood": "<Low|Medium|High>",
    "confidencePercent": <0-100>,
    "reason": "<specific 1-2 sentence reason based on the data>",
    "topAction": "<single most impactful thing they can do right now>"
  },

  "keywordGap": {
    "present": ["<keyword found in CV that matches JD>"],
    "missing": ["<important keyword in JD not in CV>"],
    "suggested": ["<keyword that would strengthen this CV for this role/industry>"]
  },

  "sectionFeedback": [
    {
      "section": "<Professional Summary|Work Experience|Education|Skills|Projects|Achievements>",
      "score": <0-100>,
      "status": "<Strong|Good|Needs Work|Missing>",
      "feedback": "<2-3 specific sentences of honest feedback>",
      "quickWin": "<one specific change to make right now>"
    }
  ],

  "bulletRewrites": [
    {
      "original": "<exact weak bullet or phrase from CV>",
      "improved": "<stronger, quantified, impact-driven rewrite>",
      "why": "<one sentence explaining what makes the rewrite stronger>"
    }
  ],

  "languageIssues": [
    {
      "weak": "<passive/weak phrase found in CV>",
      "stronger": "<active, stronger alternative>",
      "category": "<Passive Voice|Vague Claim|Overused Phrase|Missing Metrics|Weak Verb>"
    }
  ],

  "atsIssues": [
    "<specific ATS issue found — e.g. tables, columns, non-standard heading>"
  ],

  "topImprovements": [
    {
      "priority": <1-5>,
      "improvement": "<specific, actionable improvement>",
      "impact": "<Low|Medium|High>",
      "effort": "<Quick Fix|1 Hour|Half Day>"
    }
  ],

  "interviewQuestions": [
    {
      "question": "<likely interview question based on CV + JD>",
      "type": "<Behavioural|Technical|Situational|Motivational|Competency>",
      "difficulty": "<Easy|Medium|Hard>",
      "tip": "<specific one-line preparation tip referencing their actual CV experience>",
      "starHint": "<STAR framework opening — e.g. 'Draw on your time at X when you...'>",
      "modelAnswer": "<2-4 sentence model answer using STAR format, tailored to their CV — this is the answer they should study and adapt. Be specific to their background. For technical questions, give a clear, correct technical answer.>"
    }
  ]
}

Rules:
- Be specific, not generic. Reference actual content from the CV.
- bullet rewrites should quote exact text from the CV.
- If no job description is provided, still give keyword and structure feedback based on industry norms.
- Provide 3-5 bullet rewrites, 3-5 language issues, 3-5 ATS issues (if any), 5 top improvements, 12 interview questions.
- sectionFeedback should cover every section present in the CV.
- interviewQuestions: mix 4 behavioural, 3 technical/role-specific, 2 motivational, 2 situational, 1 curveball.
- Model answers must be tailored to the candidate's specific experience from their CV — not generic.`;
}

export async function POST(req: NextRequest) {
  try {
    const { cvText, jobDescription = "", roleMode = "general" } = await req.json();

    if (!cvText?.trim() || cvText.trim().length < 100) {
      return NextResponse.json({ error: "CV text too short — please paste your full CV" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages:   [{ role: "user", content: buildPrompt(cvText, jobDescription, roleMode) }],
    });

    const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let analysis: any;
    try { analysis = JSON.parse(clean); }
    catch {
      // Try extracting JSON object from the response
      const jsonMatch = clean.match(/\{[\s\S]+\}/);
      if (!jsonMatch) return NextResponse.json({ error: "Analysis failed — invalid JSON from AI" }, { status: 500 });
      analysis = JSON.parse(jsonMatch[0]);
    }

    // ── ② TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    const gate = await tokenGate(req, TOKEN_COST, { toolName: "CV Analyser" });
    console.log(`[cv-analyser/analyse] Token gate result:`, gate);
    if (!gate.ok) return gate.response; // sends 402 JSON to client
    console.log(`[cv-analyser/analyse] Token gate passed for user ${gate.dbUserId} — proceeding with analysis`);

    // ── ③ DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gate.dbUserId, TOKEN_COST, "cv-analyser/analyse", {
      messageLength: cvText.length,
      jobDescriptionLength: jobDescription.length,
    });
    console.log(`[cv-analyser/analyse] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for analysis.`);


    return NextResponse.json({ ok: true, analysis });
  } catch (err: any) {
    console.error("[cv-analyser/analyse]", err);
    return NextResponse.json({ error: err.message ?? "Analysis failed" }, { status: 500 });
  }
}