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
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "ai-cv-analyser";
const TOKEN_COST = 200;
const TOOL_NAME = "AI CV Analyser";

// Get tool ID from DB
const ToolId = await prismadb.tool.findUnique({
  where: { slug: ToolSlug },
  select: { id: true },
});
const TOOL_ID = ToolId?.id ?? "unknown-tool-id";
console.log(`[cv-analyser/analyse] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);

const ROLE_MODES: Record<string, string> = {
  tech: "software engineering, data science, cybersecurity, or product management",
  finance: "finance, accounting, banking, or investment",
  graduate: "entry-level or graduate roles",
  business: "business, management, strategy, or operations",
  creative: "design, marketing, media, or creative industries",
  healthcare: "healthcare, nursing, medicine, or life sciences",
  general: "general professional roles",
};

function cleanAndParseJSON(rawResponse: string): any {
  // Remove markdown code blocks
  let cleaned = rawResponse.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  
  // Try to extract JSON object if there's extra text
  const jsonMatch = cleaned.match(/\{[\s\S]+\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in response");
  }
  
  let jsonStr = jsonMatch[0];
  
  // Remove trailing commas (common JSON issue)
  jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  
  // Remove control characters (ASCII 0-31 except tab, newline, carriage return)
  jsonStr = jsonStr.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  
  // Fix unescaped quotes inside strings (simplified approach)
  let inString = false;
  let escaped = '';
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    const prevChar = i > 0 ? jsonStr[i - 1] : '';
    
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
      escaped += char;
    } else if (inString && char === '"' && prevChar === '\\') {
      // Already escaped, keep as is
      escaped += char;
    } else if (inString && char === '\\' && jsonStr[i + 1] === '"') {
      // This is an escaped quote, skip adding extra backslash
      escaped += char;
    } else {
      escaped += char;
    }
  }
  jsonStr = escaped;
  
  // Fix missing commas between array elements (if they're on new lines)
  jsonStr = jsonStr.replace(/"\s*\n\s*"/g, '", "');
  
  // Ensure property names are quoted (optional - if needed)
  // jsonStr = jsonStr.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  try {
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("[cv-analyser/analyse] JSON parse error after cleaning:", error.message);
    console.error("[cv-analyser/analyse] Error position near:", jsonStr.slice(Math.max(0, error.position - 50), error.position + 50));
    throw new Error(`Malformed JSON: ${error.message}`);
  }
}

function buildPrompt(cvText: string, jobDescription: string, roleMode: string): string {
  const roleContext = ROLE_MODES[roleMode] ?? ROLE_MODES.general;
  
  const jobDescSection = jobDescription
    ? `JOB DESCRIPTION:\n${jobDescription.slice(0, 2000)}\n\n`
    : "";

  return `You are an expert CV analyst and career coach specialising in ${roleContext}. Analyse this CV${jobDescription ? " against the job description" : ""} and return ONLY valid JSON — no markdown, no backticks, no explanation, no trailing commas.

${jobDescSection}CV TEXT:\n${cvText.slice(0, 4000)}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")
- Ensure all strings are properly closed with quotes
- Use proper JSON syntax - no comments, no JavaScript-specific features

Return this exact JSON structure (fill all fields honestly and specifically):

{
  "jobMatchScore": 85,
  "atsScore": 78,
  "keywordScore": 82,
  "languageScore": 75,
  "structureScore": 88,
  "overallScore": 82,
  "executiveSummary": "Your CV shows strong technical experience in Python and AWS, but lacks quantified achievements. The work experience section is well-structured but needs more impact metrics.",
  "successPrediction": {
    "shortlistLikelihood": "Medium",
    "confidencePercent": 75,
    "reason": "Strong technical skills alignment but missing key leadership examples",
    "topAction": "Add specific metrics to each role (e.g., 'increased efficiency by 30%')"
  },
  "keywordGap": {
    "present": ["Python", "AWS", "Agile"],
    "missing": ["Kubernetes", "Terraform"],
    "suggested": ["CI/CD", "Docker", "Microservices"]
  },
  "sectionFeedback": [
    {
      "section": "Professional Summary",
      "score": 72,
      "status": "Good",
      "feedback": "Your summary mentions technical skills but lacks career narrative and value proposition.",
      "quickWin": "Add a sentence about what you're passionate about achieving"
    }
  ],
  "bulletRewrites": [
    {
      "original": "Responsible for maintaining servers",
      "improved": "Maintained 50+ Linux servers with 99.9% uptime, reducing incidents by 40%",
      "why": "Adds quantifiable impact and specific metrics"
    }
  ],
  "languageIssues": [
    {
      "weak": "was responsible for",
      "stronger": "led, managed, implemented",
      "category": "Passive Voice"
    }
  ],
  "atsIssues": [
    "Complex tables that may not parse correctly",
    "Unusual section headings like 'My Journey'"
  ],
  "topImprovements": [
    {
      "priority": 1,
      "improvement": "Add metrics to work experience bullet points",
      "impact": "High",
      "effort": "1 Hour"
    }
  ],
  "interviewQuestions": [
    {
      "question": "Tell me about a time you solved a complex technical problem",
      "type": "Behavioural",
      "difficulty": "Medium",
      "tip": "Use the project where you migrated the database",
      "starHint": "Draw on your time at [Company Name] when you...",
      "modelAnswer": "At [Company], we faced a database performance issue. I led the investigation, identified the root cause as unoptimized queries, and implemented indexing strategies that reduced query time from 5 seconds to 200ms."
    }
  ]
}

Important Requirements:
- Be specific - reference actual content from the CV
- Provide 3-5 bullet rewrites, 3-5 language issues, 3-5 ATS issues, 5 top improvements, 12 interview questions
- Interview questions: include 4 behavioural, 3 technical, 2 motivational, 2 situational, 1 curveball
- Model answers must reference candidate's actual experience
- If no job description, base keywords on industry standards for ${roleContext}
- Section feedback must cover all sections present in the CV`;
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    const { cvText, jobDescription = "", roleMode = "general" } = await req.json();

    // Validate input
    if (!cvText?.trim() || cvText.trim().length < 100) {
      return NextResponse.json(
        { error: "CV text too short — please paste your full CV (minimum 100 characters)" },
        { status: 400 }
      );
    }

    // ── ① TOKEN GATE — check BEFORE doing AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: "CV Analyser" });
    console.log(`[cv-analyser/analyse] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[cv-analyser/analyse] Token gate passed for user ${gateResult.dbUserId}`);

    // ── ② CALL ANTHROPIC API ──────────────────────────────────────────
    const prompt = buildPrompt(cvText, jobDescription, roleMode);
    
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 6000,
      temperature: 0.3, // Lower temperature for more consistent JSON
      messages: [{ role: "user", content: prompt }],
    });

    const processingMs = Date.now() - start;

    // Get raw response
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    console.log(`[cv-analyser/analyse] Raw response length: ${raw.length} chars`);
    
    // Log first 200 chars for debugging
    if (process.env.NODE_ENV === "development") {
      console.log(`[cv-analyser/analyse] Response preview: ${raw.slice(0, 200)}...`);
    }

    // ── ③ PARSE JSON WITH ROBUST ERROR HANDLING ───────────────────────
    let analysis: any;
    
    try {
      // First attempt with direct parsing
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      analysis = JSON.parse(clean);
      console.log(`[cv-analyser/analyse] Successfully parsed JSON directly`);
    } catch (firstError: any) {
      console.warn(`[cv-analyser/analyse] Direct parse failed: ${firstError.message}`);
      
      try {
        // Second attempt with comprehensive cleaning
        analysis = cleanAndParseJSON(raw);
        console.log(`[cv-analyser/analyse] Successfully parsed JSON after cleaning`);
      } catch (secondError: any) {
        console.error(`[cv-analyser/analyse] All parsing attempts failed`);
        console.error(`[cv-analyser/analyse] Raw response (first 500 chars):`, raw.slice(0, 500));
        console.error(`[cv-analyser/analyse] Raw response (last 200 chars):`, raw.slice(-200));
        
        // Try to salvage partial analysis
        try {
          const partialMatch = raw.match(/\{[\s\S]*?(?=,"interviewQuestions":)/);
          if (partialMatch) {
            const partialJson = partialMatch[0] + "}";
            analysis = JSON.parse(partialJson);
            console.log(`[cv-analyser/analyse] Using partial analysis (missing interview questions)`);
            // Add placeholder for missing data
            analysis.interviewQuestions = [];
            analysis.topImprovements = analysis.topImprovements || [];
          } else {
            throw secondError;
          }
        } catch {
          return NextResponse.json(
            { 
              error: "Analysis failed — AI returned malformed JSON",
              details: secondError.message,
              preview: raw.slice(0, 500)
            },
            { status: 500 }
          );
        }
      }
    }

    // ── ④ VALIDATE REQUIRED FIELDS ────────────────────────────────────
    const requiredFields = ["executiveSummary", "successPrediction", "topImprovements"];
    for (const field of requiredFields) {
      if (!analysis[field]) {
        console.warn(`[cv-analyser/analyse] Missing required field: ${field}`);
        // Add default values for missing fields
        if (field === "executiveSummary") analysis.executiveSummary = "Analysis completed but some fields are missing.";
        if (field === "successPrediction") {
          analysis.successPrediction = {
            shortlistLikelihood: "Medium",
            confidencePercent: 50,
            reason: "Analysis partially completed",
            topAction: "Review the full analysis when available"
          };
        }
        if (field === "topImprovements") analysis.topImprovements = [];
      }
    }

    // ── ⑤ DEDUCT TOKENS ───────────────────────────────────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "cv-analyser/analyse", {
      messageLength: cvText.length,
      jobDescriptionLength: jobDescription.length,
      processingMs,
    });
    console.log(`[cv-analyser/analyse] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

    // ── ⑥ TRACK USAGE ──────────────────────────────────────────────────
    await trackToolUsage({
      toolId: TOOL_ID,
      toolName: TOOL_NAME,
      userId: gateResult.dbUserId,
      ipAddress: getIpFromRequest(req),
      processingMs,
      tokenCost: TOKEN_COST,
      wasSuccess: true,
    });
    console.log(`[cv-analyser/analyse] Tracked tool usage for user ${gateResult.dbUserId}`);

    // ── ⑦ RETURN SUCCESS RESPONSE ─────────────────────────────────────
    return NextResponse.json({ 
      ok: true, 
      analysis,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        responseLength: raw.length
      }
    });
    
  } catch (err: any) {
    console.error("[cv-analyser/analyse] Fatal error:", err);
    
    // Track failed usage
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
      console.error("[cv-analyser/analyse] Failed to track error:", trackError);
    }
    
    // Don't deduct tokens on failure
    return NextResponse.json(
      { 
        error: err.message ?? "Analysis failed",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}





// // =============================================================================
// // isaacpaha.com — AI CV Analyser Pro — Full Analysis API
// // app/api/tools/cv-analyser/analyse/route.ts
// //
// // POST { cvText, jobDescription, roleMode }
// // Returns comprehensive JSON analysis:
// //   - jobMatchScore, atsScore, keywordScore, languageScore, structureScore
// //   - keywordGap: { present, missing, suggested }
// //   - sectionFeedback: per-section analysis
// //   - bulletRewrites: before/after pairs
// //   - languageIssues: weak phrases + stronger alternatives
// //   - successPrediction: shortlist likelihood + advice
// //   - topImprovements: 5 prioritised actions
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";
// import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
// import { prismadb } from "@/lib/db";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });



// const ToolSlug = "ai-cv-analyser";
// const TOKEN_COST = 200; // Adjust based on expected response length and model pricing
// const TOOL_NAME = "AI CV Analyser";

// // Let's get the tool from the DB using the tool slug to ensure it exists and to get its ID for logging
// const ToolId = await prismadb.tool.findUnique({
//   where: { slug: ToolSlug },
//   select: { id: true },
// });
// const TOOL_ID = ToolId?.id ?? "unknown-tool-id";
// console.log(`[cv-analyser/analyse] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);  

// const ROLE_MODES: Record<string, string> = {
//   tech:       "software engineering, data science, cybersecurity, or product management",
//   finance:    "finance, accounting, banking, or investment",
//   graduate:   "entry-level or graduate roles",
//   business:   "business, management, strategy, or operations",
//   creative:   "design, marketing, media, or creative industries",
//   healthcare: "healthcare, nursing, medicine, or life sciences",
//   general:    "general professional roles",
// };

// function buildPrompt(cvText: string, jobDescription: string, roleMode: string): string {
//   const roleContext = ROLE_MODES[roleMode] ?? ROLE_MODES.general;

//   return `You are an expert CV analyst and career coach specialising in ${roleContext}. Analyse this CV${jobDescription ? " against the job description" : ""} and return ONLY valid JSON — no markdown, no backticks, no explanation.

// ${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.slice(0, 2000)}\n\n` : ""}CV TEXT:\n${cvText.slice(0, 4000)}

// Return this exact JSON structure (fill all fields honestly and specifically):

// {
//   "jobMatchScore": <0-100, only if job description provided, else 0>,
//   "atsScore": <0-100>,
//   "keywordScore": <0-100, only if job description provided, else based on general industry keywords>,
//   "languageScore": <0-100>,
//   "structureScore": <0-100>,
//   "overallScore": <weighted average of all scores>,

//   "executiveSummary": "<3-4 sentence honest, direct assessment of this CV's strengths and biggest gaps. Be specific, not generic.>",

//   "successPrediction": {
//     "shortlistLikelihood": "<Low|Medium|High>",
//     "confidencePercent": <0-100>,
//     "reason": "<specific 1-2 sentence reason based on the data>",
//     "topAction": "<single most impactful thing they can do right now>"
//   },

//   "keywordGap": {
//     "present": ["<keyword found in CV that matches JD>"],
//     "missing": ["<important keyword in JD not in CV>"],
//     "suggested": ["<keyword that would strengthen this CV for this role/industry>"]
//   },

//   "sectionFeedback": [
//     {
//       "section": "<Professional Summary|Work Experience|Education|Skills|Projects|Achievements>",
//       "score": <0-100>,
//       "status": "<Strong|Good|Needs Work|Missing>",
//       "feedback": "<2-3 specific sentences of honest feedback>",
//       "quickWin": "<one specific change to make right now>"
//     }
//   ],

//   "bulletRewrites": [
//     {
//       "original": "<exact weak bullet or phrase from CV>",
//       "improved": "<stronger, quantified, impact-driven rewrite>",
//       "why": "<one sentence explaining what makes the rewrite stronger>"
//     }
//   ],

//   "languageIssues": [
//     {
//       "weak": "<passive/weak phrase found in CV>",
//       "stronger": "<active, stronger alternative>",
//       "category": "<Passive Voice|Vague Claim|Overused Phrase|Missing Metrics|Weak Verb>"
//     }
//   ],

//   "atsIssues": [
//     "<specific ATS issue found — e.g. tables, columns, non-standard heading>"
//   ],

//   "topImprovements": [
//     {
//       "priority": <1-5>,
//       "improvement": "<specific, actionable improvement>",
//       "impact": "<Low|Medium|High>",
//       "effort": "<Quick Fix|1 Hour|Half Day>"
//     }
//   ],

//   "interviewQuestions": [
//     {
//       "question": "<likely interview question based on CV + JD>",
//       "type": "<Behavioural|Technical|Situational|Motivational|Competency>",
//       "difficulty": "<Easy|Medium|Hard>",
//       "tip": "<specific one-line preparation tip referencing their actual CV experience>",
//       "starHint": "<STAR framework opening — e.g. 'Draw on your time at X when you...'>",
//       "modelAnswer": "<2-4 sentence model answer using STAR format, tailored to their CV — this is the answer they should study and adapt. Be specific to their background. For technical questions, give a clear, correct technical answer.>"
//     }
//   ]
// }

// Rules:
// - Be specific, not generic. Reference actual content from the CV.
// - bullet rewrites should quote exact text from the CV.
// - If no job description is provided, still give keyword and structure feedback based on industry norms.
// - Provide 3-5 bullet rewrites, 3-5 language issues, 3-5 ATS issues (if any), 5 top improvements, 12 interview questions.
// - sectionFeedback should cover every section present in the CV.
// - interviewQuestions: mix 4 behavioural, 3 technical/role-specific, 2 motivational, 2 situational, 1 curveball.
// - Model answers must be tailored to the candidate's specific experience from their CV — not generic.`;
// }

// export async function POST(req: NextRequest) {
//   const start = Date.now();
//   try {
//     const { cvText, jobDescription = "", roleMode = "general" } = await req.json();

//     if (!cvText?.trim() || cvText.trim().length < 100) {
//       return NextResponse.json({ error: "CV text too short — please paste your full CV" }, { status: 400 });
//     }

//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 4000,
//       messages:   [{ role: "user", content: buildPrompt(cvText, jobDescription, roleMode) }],
//     });

//     const processingMs = Date.now() - start;

//     const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//     const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

//     let analysis: any;
//     try { analysis = JSON.parse(clean); }
//     catch {
//       // Try extracting JSON object from the response
//       const jsonMatch = clean.match(/\{[\s\S]+\}/);
//       if (!jsonMatch) return NextResponse.json({ error: "Analysis failed — invalid JSON from AI" }, { status: 500 });
//       analysis = JSON.parse(jsonMatch[0]);
//     }

//     // ── ② TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//     const gate = await tokenGate(req, TOKEN_COST, { toolName: "CV Analyser" });
//     console.log(`[cv-analyser/analyse] Token gate result:`, gate);
//     if (!gate.ok) return gate.response; // sends 402 JSON to client
//     console.log(`[cv-analyser/analyse] Token gate passed for user ${gate.dbUserId} — proceeding with analysis`);

//     // ── ③ DEDUCT tokens — only after successful AI response ─────────────────
//     await deductTokens(gate.dbUserId, TOKEN_COST, "cv-analyser/analyse", {
//       messageLength: cvText.length,
//       jobDescriptionLength: jobDescription.length,
//     });
//     console.log(`[cv-analyser/analyse] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for analysis.`);

//     // ── ④ TRACK USAGE ─────────────────────────────────────────────────────────
//     await trackToolUsage({
//       toolId:       TOOL_ID,
//       toolName:     TOOL_NAME,
//       userId:       gate.dbUserId,
//       ipAddress:    getIpFromRequest(req),
//       processingMs,
//       tokenCost:    TOKEN_COST,
//       wasSuccess:   true,
//     });
//     console.log(`[cv-analyser/analyse] Tracked tool usage for user ${gate.dbUserId}.`);

//     return NextResponse.json({ ok: true, analysis });
//   } catch (err: any) {
//     console.error("[cv-analyser/analyse]", err);

//     // Track failed usage too (no token deduction on failure)
//     if (TOOL_ID) {
//       await trackToolUsage({
//         toolId:       TOOL_ID,
//         toolName:     TOOL_NAME,
//         ipAddress:    getIpFromRequest(req),
//         processingMs: Date.now() - start,
//         wasSuccess:   false,
//         errorMsg:     err instanceof Error ? err.message : "Unknown error",
//       });
//     }

//     return NextResponse.json({ error: err.message ?? "Analysis failed" }, { status: 500 });
//   }
// }