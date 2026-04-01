// =============================================================================
// isaacpaha.com — CV Analyser: Interview Prep API
// app/api/tools/cv-analyser/interview/route.ts
// POST { cvText, jobDescription?, roleMode? }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { prismadb } from "@/lib/db";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "ai-cv-analyser";
const TOKEN_COST = 200;
const TOOL_NAME = "CV Analyser";

// Get tool ID from DB
const ToolId = await prismadb.tool.findUnique({
  where: { slug: ToolSlug },
  select: { id: true },
});
const TOOL_ID = ToolId?.id ?? "unknown-tool-id";
console.log(`[cv-analyser/interview] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);

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
  
  // Remove control characters
  jsonStr = jsonStr.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  
  // Fix unescaped quotes inside strings
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
  jsonStr = escaped;
  
  // Fix missing commas between array elements
  jsonStr = jsonStr.replace(/"\s*\n\s*"/g, '", "');
  
  try {
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("[cv-analyser/interview] JSON parse error after cleaning:", error.message);
    console.error("[cv-analyser/interview] Error position near:", jsonStr.slice(Math.max(0, error.position - 50), error.position + 50));
    throw new Error(`Malformed JSON: ${error.message}`);
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;

  try {
    const { cvText, jobDescription = "", roleMode = "general" } = await req.json();

    // Validate input
    if (!cvText?.trim() || cvText.trim().length < 50) {
      return NextResponse.json(
        { error: "CV text required (minimum 50 characters)" },
        { status: 400 }
      );
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: "CV Interview Prep" });
    console.log(`[cv-analyser/interview] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[cv-analyser/interview] Token gate passed for user ${gateResult.dbUserId}`);

    // Build prompt with role context
    const roleContextMap = {
      tech: "software engineering, data science, cybersecurity, or product management",
      finance: "finance, accounting, banking, or investment",
      graduate: "entry-level or graduate roles",
      business: "business, management, strategy, or operations",
      creative: "design, marketing, media, or creative industries",
      healthcare: "healthcare, nursing, medicine, or life sciences",
      general: "general professional roles",
    } as const;
    
    type RoleMode = keyof typeof roleContextMap;
    const roleContext = roleContextMap[(roleMode as RoleMode) || "general"] || "general professional roles";

    const prompt = `You are an expert interview coach specialising in ${roleContext}. Based on this CV${jobDescription ? " and job description" : ""}, generate 12 highly likely interview questions the candidate will face.

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.slice(0, 1500)}\n\n` : ""}
CV:\n${cvText.slice(0, 3000)}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")
- Ensure all strings are properly closed with quotes
- Use proper JSON syntax - no comments, no JavaScript-specific features

Return EXACTLY this JSON structure (fill all fields based on their actual CV):

{
  "questions": [
    {
      "question": "<interview question>",
      "type": "<Behavioural|Technical|Situational|Motivational|Competency>",
      "difficulty": "<Easy|Medium|Hard>",
      "tip": "<specific 1-2 sentence preparation tip based on their actual CV content — reference their specific experience>",
      "starHint": "<suggested STAR framework opening — e.g. 'Draw on your experience at X where you...'>"
    }
  ]
}

Question Distribution (MUST FOLLOW):
- 4 behavioural questions (Tell me about a time…)
- 3 technical/role-specific questions (based on their actual skills from CV)
- 2 motivational questions (Why this role? Why this company?)
- 2 situational questions (What would you do if…)
- 1 curveball question (unusual but common in ${roleContext})

IMPORTANT RULES:
- Make EVERY tip and starHint reference their ACTUAL listed experience from the CV
- Do NOT use generic tips like "Be prepared to discuss your experience" — be specific
- For technical questions, reference their actual technical skills mentioned in CV
- For behavioural questions, reference specific projects or roles from their CV
- Ensure questions are genuinely challenging and realistic for their experience level
- The curveball should be unexpected but relevant to their industry/role`;

    // ── ② CALL ANTHROPIC API ──────────────────────────────────────────────
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 6000,
      temperature: 0.3, // Lower temperature for more consistent JSON
      messages: [{ role: "user", content: prompt }],
    });

    const processingMs = Date.now() - start;
    
    // Get raw response
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    console.log(`[cv-analyser/interview] Raw response length: ${raw.length} chars`);
    
    // Log first 200 chars for debugging in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[cv-analyser/interview] Response preview: ${raw.slice(0, 200)}...`);
    }

    // ── ③ PARSE JSON WITH ROBUST ERROR HANDLING ───────────────────────────
    let data: any;
    
    try {
      // First attempt with direct parsing
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      data = JSON.parse(clean);
      console.log(`[cv-analyser/interview] Successfully parsed JSON directly`);
    } catch (firstError: any) {
      console.warn(`[cv-analyser/interview] Direct parse failed: ${firstError.message}`);
      
      try {
        // Second attempt with comprehensive cleaning
        data = cleanAndParseJSON(raw);
        console.log(`[cv-analyser/interview] Successfully parsed JSON after cleaning`);
      } catch (secondError: any) {
        console.error(`[cv-analyser/interview] All parsing attempts failed`);
        console.error(`[cv-analyser/interview] Raw response (first 500 chars):`, raw.slice(0, 500));
        console.error(`[cv-analyser/interview] Raw response (last 200 chars):`, raw.slice(-200));
        
        // Try to salvage partial data
        try {
          const match = raw.match(/"questions"\s*:\s*\[[\s\S]*?\]/);
          if (match) {
            const partialData = JSON.parse(`{${match[0]}}`);
            data = { questions: partialData.questions || [] };
            console.log(`[cv-analyser/interview] Using partial data (${data.questions.length} questions found)`);
          } else {
            throw secondError;
          }
        } catch {
          return NextResponse.json(
            { 
              error: "Interview prep failed — AI returned malformed JSON",
              details: secondError.message,
              preview: raw.slice(0, 500)
            },
            { status: 500 }
          );
        }
      }
    }

    // ── ④ VALIDATE RESPONSE STRUCTURE ─────────────────────────────────────
    const questions = data.questions || [];
    
    if (!Array.isArray(questions) || questions.length === 0) {
      console.warn(`[cv-analyser/interview] No questions found in response`);
      return NextResponse.json(
        { 
          ok: true, 
          questions: [],
          warning: "No questions could be generated"
        },
        { status: 200 }
      );
    }
    
    // Validate each question has required fields
    const validatedQuestions = questions.map((q: any, index: number) => ({
      question: q.question || `Question ${index + 1}`,
      type: q.type || "Behavioural",
      difficulty: q.difficulty || "Medium",
      tip: q.tip || "Review your relevant experience for this question",
      starHint: q.starHint || "Use the STAR method: Situation, Task, Action, Result"
    }));
    
    console.log(`[cv-analyser/interview] Successfully generated ${validatedQuestions.length} questions`);

    // ── ⑤ DEDUCT TOKENS — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "cv-analyser/interview", {
      messageLength: prompt.length,
      cvLength: cvText.length,
      jobDescriptionLength: jobDescription?.length ?? 0,
      roleMode,
      processingMs,
    });
    console.log(`[cv-analyser/interview] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

    // ── ⑥ TRACK USAGE ───────────────────────────────────────────────────────
    await trackToolUsage({
      toolId: TOOL_ID,
      toolName: TOOL_NAME,
      userId: gateResult.dbUserId,
      ipAddress: getIpFromRequest(req),
      processingMs,
      tokenCost: TOKEN_COST,
      wasSuccess: true,
    });
    console.log(`[cv-analyser/interview] Tracked tool usage for user ${gateResult.dbUserId}`);

    // ── ⑦ RETURN SUCCESS RESPONSE ──────────────────────────────────────────
    return NextResponse.json({ 
      ok: true, 
      questions: validatedQuestions,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        questionCount: validatedQuestions.length,
        roleMode,
      }
    });
    
  } catch (err: any) {
    console.error("[cv-analyser/interview] Error:", err);

    // Track failed usage (no token deduction on failure)
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
      console.error("[cv-analyser/interview] Failed to track error:", trackError);
    }
    
    // Return user-friendly error message
    return NextResponse.json(
      { 
        error: err.message ?? "Interview prep failed",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}





// // =============================================================================
// // isaacpaha.com — CV Analyser: Interview Prep API
// // app/api/tools/cv-analyser/interview/route.ts
// // POST { cvText, jobDescription?, roleMode? }
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";
// import { prismadb } from "@/lib/db";
// import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });


// const ToolSlug = "ai-cv-analyser";
// const TOKEN_COST = 200; // Adjust based on expected response length and model pricing
// const TOOL_NAME = "CV Analyser";

// // Let's get the tool from the DB using the tool slug to ensure it exists and to get its ID for logging
// const ToolId = await prismadb.tool.findUnique({
//   where: { slug: ToolSlug },
//   select: { id: true },
// });
// const TOOL_ID = ToolId?.id ?? "unknown-tool-id";
// console.log(`[cv-analyser/analyse] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`); 

// export async function POST(req: NextRequest) {
//   const start = Date.now();

//   try {
//     const { cvText, jobDescription, roleMode = "general" } = await req.json();

//     if (!cvText?.trim() || cvText.trim().length < 50) {
//       return NextResponse.json({ error: "CV text required" }, { status: 400 });
//     }

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//         const gate = await tokenGate(req, TOKEN_COST, { toolName: "CV Interview Prep" });
//     console.log(`[cv-analyser/interview] Token gate result:`, gate);
//     if (!gate.ok) return gate.response; // sends 402 JSON to client
//     console.log(`[cv-analyser/interview] Token gate passed for user ${gate.dbUserId}, proceeding with interview prep.`);

//     const prompt = `Based on this CV${jobDescription ? " and job description" : ""}, generate 12 highly likely interview questions the candidate will face.

// ${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.slice(0, 1000)}\n\n` : ""}CV:\n${cvText.slice(0, 2500)}

// Return ONLY valid JSON (no markdown, no backticks):
// {
//   "questions": [
//     {
//       "question": "<interview question>",
//       "type": "<Behavioural|Technical|Situational|Motivational|Competency>",
//       "difficulty": "<Easy|Medium|Hard>",
//       "tip": "<specific 1-2 sentence preparation tip based on their actual CV content>",
//       "starHint": "<suggested STAR framework opening — e.g. 'Draw on your experience at X where you...'>"
//     }
//   ]
// }

// Rules:
// - 4 behavioural (Tell me about a time…)
// - 3 technical/role-specific (based on their skills)
// - 2 motivational (Why this role? Why this company?)
// - 2 situational (What would you do if…)
// - 1 curveball (unusual but common in their sector)
// - Make STAR hints reference their actual listed experience`;

//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 2500,
//       messages:   [{ role: "user", content: prompt }],
//     });

//     const processingMs = Date.now() - start;
    
//     const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//     const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

//     let data: any;
//     try { data = JSON.parse(clean); }
//     catch {
//       const match = clean.match(/\{[\s\S]+\}/);
//       data = match ? JSON.parse(match[0]) : { questions: [] };
//     }

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//     await deductTokens(gate.dbUserId, TOKEN_COST, "cv-analyser/interview", {
//       messageLength: prompt.length,
//       cvLength: cvText.length,
//       jobDescriptionLength: jobDescription?.length ?? 0,
//     });
//     console.log(`[cv-analyser/interview] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for interview prep.`);


//      // ── ④ TRACK USAGE ─────────────────────────────────────────────────────────
//         await trackToolUsage({
//           toolId:       TOOL_ID,
//           toolName:     TOOL_NAME,
//           userId:       gate.dbUserId,
//           ipAddress:    getIpFromRequest(req),
//           processingMs,
//           tokenCost:    TOKEN_COST,
//           wasSuccess:   true,
//         });
//         console.log(`[cv-analyser/analyse] Tracked tool usage for user ${gate.dbUserId}.`);


//     return NextResponse.json({ ok: true, questions: data.questions ?? [] });
//   } catch (err: any) {
//     console.error("[cv-analyser/interview]", err);

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


//     return NextResponse.json({ error: "Interview prep failed" }, { status: 500 });
//   }
// }

