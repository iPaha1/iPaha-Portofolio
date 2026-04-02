// =============================================================================
// isaacpaha.com — AI CV Analyser: Cover Letter API
// app/api/tools/cv-analyser/cover-letter/route.ts
//
// POST { cvText, jobDescription, style, targetRole?, companyName? }
// style: "professional" | "creative" | "concise"
// Returns: { coverLetter: string }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { prismadb } from "@/lib/db";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "ai-cv-analyser";
const TOKEN_COST = 100;
const TOOL_NAME = "AI CV Analyser";

// Get tool ID from DB
const ToolId = await prismadb.tool.findUnique({
  where: { slug: ToolSlug },
  select: { id: true },
});
const TOOL_ID = ToolId?.id ?? "unknown-tool-id";
console.log(`[cv-analyser/cover-letter] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);

const STYLE_PROMPTS = {
  professional: {
    desc: "formal, structured, and traditional — appropriate for corporate, finance, legal, or government roles",
    rules: [
      "Use a formal opening: 'Dear Hiring Manager,' or 'Dear [Name],'",
      "Three structured paragraphs: why this role, what you bring, strong close",
      "Measured, professional tone throughout — confident but not boastful",
      "End with: 'I would welcome the opportunity to discuss how my experience aligns with your needs.'",
    ],
  },
  creative: {
    desc: "engaging, personality-led, and modern — appropriate for marketing, design, media, startup, or creative roles",
    rules: [
      "Open with a hook — a specific story, insight, or bold statement (NOT 'I am writing to apply for')",
      "Show genuine enthusiasm for the company/product — reference something specific",
      "Let personality come through — the letter should sound like a real human, not a template",
      "End with confidence and energy, not deference",
    ],
  },
  concise: {
    desc: "short, punchy, and direct — 3 short paragraphs maximum, ideal for senior roles or time-pressed readers",
    rules: [
      "Maximum 250 words total",
      "Paragraph 1: Why this role + company (2 sentences)",
      "Paragraph 2: Your most relevant achievement with numbers (2-3 sentences)",
      "Paragraph 3: Call to action (1-2 sentences)",
      "No fluff, no padding — every sentence must earn its place",
    ],
  },
};

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    const {
      cvText,
      jobDescription = "",
      style = "professional",
      targetRole = "",
      companyName = "",
    } = await req.json();

    // Validate input
    if (!cvText?.trim() || cvText.trim().length < 50) {
      return NextResponse.json(
        { error: "CV text required (minimum 50 characters)" },
        { status: 400 }
      );
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: "CV Cover Letter Generator" });
    console.log(`[cv-analyser/cover-letter] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[cv-analyser/cover-letter] Token gate passed for user ${gateResult.dbUserId}`);

    // Validate style
    const cfg = STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS] ?? STYLE_PROMPTS.professional;

    // Build prompt
    const prompt = `You are an expert career coach and professional writer. Write a compelling cover letter for this candidate.

COVER LETTER STYLE: ${style.toUpperCase()} — ${cfg.desc}

STYLE RULES:
${cfg.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.slice(0, 1500)}\n\n` : ""}
${targetRole ? `TARGET ROLE: ${targetRole}\n\n` : ""}
${companyName ? `COMPANY: ${companyName}\n\n` : ""}

CANDIDATE'S CV:
${cvText.slice(0, 3000)}

COVER LETTER WRITING RULES:
- Extract the 2-3 most compelling and relevant achievements from their CV
- If a job description is provided, directly address 2-3 of its key requirements
- Match keywords from the JD naturally — do NOT keyword-stuff
- Use specific numbers and metrics from the CV wherever possible
- NEVER start with "I am writing to apply for..." — that is the weakest possible opening
- Write as if you know this person — give their letter a human voice
- The letter should feel tailored, not templated
- Do NOT include a date, address blocks, or [Your Name] placeholders — just the body text

CRITICAL FORMATTING INSTRUCTIONS:
- Output ONLY the cover letter body text — no labels, no explanations, no "Here is your cover letter:"
- Start directly with the opening line of the letter
- Do NOT wrap the response in quotes or code blocks
- Return clean, properly formatted text with appropriate paragraph breaks`;

    // ── ② CALL ANTHROPIC API ──────────────────────────────────────────────
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 6000,
      temperature: 0.3, // Lower temperature for more consistent output
      messages: [{ role: "user", content: prompt }],
    });

    const processingMs = Date.now() - start;

    // Extract and clean cover letter
    let coverLetter = message.content[0].type === "text" ? message.content[0].text.trim() : "";
    
    // Remove any markdown formatting if present
    coverLetter = coverLetter.replace(/^```(?:\w+)?\s*/i, "").replace(/\s*```$/i, "").trim();
    
    // Remove any quotes around the entire response
    if ((coverLetter.startsWith('"') && coverLetter.endsWith('"')) ||
        (coverLetter.startsWith("'") && coverLetter.endsWith("'"))) {
      coverLetter = coverLetter.slice(1, -1);
    }
    
    // Validate cover letter is not empty
    if (!coverLetter || coverLetter.length < 50) {
      console.warn(`[cv-analyser/cover-letter] Generated cover letter too short: ${coverLetter?.length || 0} chars`);
      throw new Error("Generated cover letter is too short or empty");
    }
    
    console.log(`[cv-analyser/cover-letter] Successfully generated cover letter (${coverLetter.length} chars)`);

    // ── ③ DEDUCT TOKENS — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "cv-analyser/cover-letter", {
      messageLength: prompt.length,
      cvLength: cvText.length,
      jobDescriptionLength: jobDescription.length,
      style,
      processingMs,
    });
    console.log(`[cv-analyser/cover-letter] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

    // ── ④ TRACK USAGE ───────────────────────────────────────────────────────
    await trackToolUsage({
      toolId: TOOL_ID,
      toolName: TOOL_NAME,
      userId: gateResult.dbUserId,
      ipAddress: getIpFromRequest(req),
      processingMs,
      tokenCost: TOKEN_COST,
      wasSuccess: true,
    });
    console.log(`[cv-analyser/cover-letter] Tracked tool usage for user ${gateResult.dbUserId}`);

    // ── ⑤ RETURN SUCCESS RESPONSE ──────────────────────────────────────────
    return NextResponse.json({ 
      ok: true, 
      coverLetter,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        style,
        characterCount: coverLetter.length,
      }
    });
    
  } catch (err: any) {
    console.error("[cv-analyser/cover-letter] Error:", err);
    
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
      console.error("[cv-analyser/cover-letter] Failed to track error:", trackError);
    }
    
    // Return user-friendly error message
    return NextResponse.json(
      { 
        error: err.message ?? "Cover letter generation failed",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}






// // =============================================================================
// // isaacpaha.com — AI CV Analyser: Cover Letter API
// // app/api/tools/cv-analyser/cover-letter/route.ts
// //
// // POST { cvText, jobDescription, style, targetRole?, companyName? }
// // style: "professional" | "creative" | "concise"
// // Returns: { coverLetter: string }
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
// const TOOL_NAME = "AI CV Analyser";

// // Let's get the tool from the DB using the tool slug to ensure it exists and to get its ID for logging
// const ToolId = await prismadb.tool.findUnique({
//   where: { slug: ToolSlug },
//   select: { id: true },
// });
// const TOOL_ID = ToolId?.id ?? "unknown-tool-id";
// console.log(`[cv-analyser/analyse] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`); 

// const STYLE_PROMPTS = {
//   professional: {
//     desc:  "formal, structured, and traditional — appropriate for corporate, finance, legal, or government roles",
//     rules: [
//       "Use a formal opening: 'Dear Hiring Manager,' or 'Dear [Name],'",
//       "Three structured paragraphs: why this role, what you bring, strong close",
//       "Measured, professional tone throughout — confident but not boastful",
//       "End with: 'I would welcome the opportunity to discuss how my experience aligns with your needs.'",
//     ],
//   },
//   creative: {
//     desc:  "engaging, personality-led, and modern — appropriate for marketing, design, media, startup, or creative roles",
//     rules: [
//       "Open with a hook — a specific story, insight, or bold statement (NOT 'I am writing to apply for')",
//       "Show genuine enthusiasm for the company/product — reference something specific",
//       "Let personality come through — the letter should sound like a real human, not a template",
//       "End with confidence and energy, not deference",
//     ],
//   },
//   concise: {
//     desc:  "short, punchy, and direct — 3 short paragraphs maximum, ideal for senior roles or time-pressed readers",
//     rules: [
//       "Maximum 250 words total",
//       "Paragraph 1: Why this role + company (2 sentences)",
//       "Paragraph 2: Your most relevant achievement with numbers (2-3 sentences)",
//       "Paragraph 3: Call to action (1-2 sentences)",
//       "No fluff, no padding — every sentence must earn its place",
//     ],
//   },
// };

// export async function POST(req: NextRequest) {
//   const start = Date.now();
//   try {
//     const {
//       cvText,
//       jobDescription = "",
//       style         = "professional",
//       targetRole    = "",
//       companyName   = "",
//     } = await req.json();

//     if (!cvText?.trim() || cvText.trim().length < 50) {
//       return NextResponse.json({ error: "CV text required" }, { status: 400 });
//     }

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//         const gate = await tokenGate(req, TOKEN_COST, { toolName: "CV Cover Letter Generator" });
//     console.log(`[cv-analyser/cover-letter] Token gate result:`, gate);
//     if (!gate.ok) return gate.response; // sends 402 JSON to client
//     console.log(`[cv-analyser/cover-letter] Token gate passed for user ${gate.dbUserId}, proceeding with cover letter generation.`);

//     const cfg = STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS] ?? STYLE_PROMPTS.professional;

//     const prompt = `You are an expert career coach and professional writer. Write a compelling cover letter for this candidate.

// COVER LETTER STYLE: ${style.toUpperCase()} — ${cfg.desc}

// STYLE RULES:
// ${cfg.rules.map((r, i) => `${i + 1}. ${r}`).join("\n")}

// ${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.slice(0, 1500)}\n\n` : ""}${targetRole ? `TARGET ROLE: ${targetRole}\n\n` : ""}${companyName ? `COMPANY: ${companyName}\n\n` : ""}CANDIDATE'S CV:
// ${cvText.slice(0, 3000)}

// COVER LETTER WRITING RULES:
// - Extract the 2-3 most compelling and relevant achievements from their CV
// - If a job description is provided, directly address 2-3 of its key requirements
// - Match keywords from the JD naturally — do NOT keyword-stuff
// - Use specific numbers and metrics from the CV wherever possible
// - NEVER start with "I am writing to apply for..." — that is the weakest possible opening
// - Write as if you know this person — give their letter a human voice
// - The letter should feel tailored, not templated
// - Do NOT include a date, address blocks, or [Your Name] placeholders — just the body text

// Output ONLY the cover letter body text — no labels, no explanations, no "Here is your cover letter:".
// Start directly with the opening line of the letter.`;

//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 1200,
//       messages:   [{ role: "user", content: prompt }],
//     });

//     const processingMs = Date.now() - start;

//     const coverLetter = message.content[0].type === "text" ? message.content[0].text.trim() : "";

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//     await deductTokens(gate.dbUserId, TOKEN_COST, "cv-analyser/cover-letter", {
//       messageLength: prompt.length,
//       cvLength: cvText.length,
//       jobDescriptionLength: jobDescription.length,
//     });
//     console.log(`[cv-analyser/cover-letter] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for cover letter generation.`);
    
//     // ── 3 TRACK USAGE ─────────────────────────────────────────────────────────
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
    

//     return NextResponse.json({ ok: true, coverLetter });
//   } catch (err: any) {
//     console.error("[cv-analyser/cover-letter]", err);

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

//     return NextResponse.json({ error: err.message ?? "Cover letter generation failed" }, { status: 500 });
//   }
// }