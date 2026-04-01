// =============================================================================
// isaacpaha.com — CV Analyser: Section Rewrite API
// app/api/tools/cv-analyser/rewrite/route.ts
//
// POST { section, content, jobDescription?, targetRole?, mode? }
//   Returns improved version of a specific CV section
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
const TOOL_NAME = "AI CV Analyser";

// Get tool ID from DB
const ToolId = await prismadb.tool.findUnique({
  where: { slug: ToolSlug },
  select: { id: true },
});
const TOOL_ID = ToolId?.id ?? "unknown-tool-id";
console.log(`[cv-analyser/rewrite] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);

// Define valid modes
type RewriteMode = "improve" | "full_rewrite" | "tailor";
const VALID_MODES: RewriteMode[] = ["improve", "full_rewrite", "tailor"];

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    const { 
      section, 
      content, 
      jobDescription = "", 
      targetRole = "", 
      mode = "improve" 
    } = await req.json();

    // Validate input
    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Content required" },
        { status: 400 }
      );
    }

    if (content.trim().length < 20) {
      return NextResponse.json(
        { error: "Content too short (minimum 20 characters)" },
        { status: 400 }
      );
    }

    // Validate mode
    const validMode: RewriteMode = VALID_MODES.includes(mode as RewriteMode) ? (mode as RewriteMode) : "improve";

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: "CV Rewrite" });
    console.log(`[cv-analyser/rewrite] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[cv-analyser/rewrite] Token gate passed for user ${gateResult.dbUserId}`);

    // Build prompts with enhanced instructions
    const prompts: Record<RewriteMode, string> = {
      improve: `You are an expert CV writer. Rewrite this ${section || "CV"} section to be stronger, more impactful, and professional.

${jobDescription ? `Target job description (focus on matching these requirements):\n${jobDescription.slice(0, 800)}\n\n` : ""}
${targetRole ? `Target role: ${targetRole}\n\n` : ""}

ORIGINAL ${(section || "SECTION").toUpperCase()}:
${content}

REWRITE RULES:
- Use strong action verbs (Led, Built, Delivered, Achieved, Drove, Implemented, Architected, Optimized)
- Add quantified achievements wherever possible (%, numbers, time saved, revenue impact)
- Remove passive language and weak phrases like "responsible for", "helped with", "assisted in"
- Make every bullet point start with a strong action verb
- Keep it concise but impactful — each sentence should earn its place
- Match tone to the target role/sector — be professional but not robotic
- If metrics are missing, suggest reasonable metrics based on the context

CRITICAL FORMATTING:
- Return ONLY the rewritten text — no labels, no explanations, no quotes around the response
- Maintain the original structure (bullets or paragraphs)
- Do NOT add "Here is your rewritten section:" or any prefix
- Start directly with the improved content`,

      full_rewrite: `You are a senior CV consultant. Perform a complete rewrite of this CV, section by section, optimizing for maximum impact.

${jobDescription ? `TARGET JOB DESCRIPTION (tailor for this role):\n${jobDescription.slice(0, 800)}\n\n` : ""}
${targetRole ? `TARGET ROLE: ${targetRole}\n\n` : ""}

ORIGINAL CV:
${content.slice(0, 4000)}

REWRITE OPTIMIZATION GOALS:
- ATS compatibility — use standard section headings and clean formatting
- Strong impact language — every bullet point should show achievement, not just duties
- Quantified achievements — add metrics where possible (%, numbers, results)
- Professional structure — clear hierarchy and flow
- Keyword optimization — naturally incorporate relevant keywords
- Remove redundancy and fluff

CRITICAL FORMATTING:
- Return the fully rewritten CV as clean, well-formatted text
- Use standard section headings: Professional Summary, Work Experience, Education, Skills, etc.
- Maintain bullet points for achievements
- Do NOT use markdown code blocks
- Do NOT add any labels like "Here is your rewritten CV:"
- Start directly with the first section heading`,

      tailor: `You are a CV tailoring specialist. Take this CV and tailor it specifically for this job description to maximize interview chances.

JOB DESCRIPTION (tailor specifically for this):
${(jobDescription || "").slice(0, 1000)}

${targetRole ? `TARGET ROLE: ${targetRole}\n\n` : ""}

CV TO TAILOR:
${content.slice(0, 3000)}

TAILORING RULES:
- Prioritize experience most relevant to the job description — move the most relevant points to the top
- Mirror keywords from the JD naturally throughout the CV — don't keyword stuff
- Adjust the professional summary to directly address the role requirements
- Add context that connects your experience to their needs
- Remove or de-emphasize experience that isn't relevant to this specific role
- Quantify achievements that align with the JD's requirements
- Use language and terminology from the job description

CRITICAL FORMATTING:
- Return ONLY the tailored CV text — no labels, no explanations
- Maintain professional formatting with clear section headings
- Do NOT add "Here is your tailored CV:" or any prefix
- Start directly with the professional summary or first section`,

      // Note: "improve" is the default, so we define all three
    };

    const prompt = prompts[validMode];

    // ── ② CALL ANTHROPIC API ──────────────────────────────────────────────
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 6000,
      temperature: 0.3, // Lower temperature for more consistent output
      messages: [{ role: "user", content: prompt }],
    });

    const processingMs = Date.now() - start;
    
    // Get raw response
    let result = message.content[0].type === "text" ? message.content[0].text : "";
    
    // Clean up the response
    result = result.trim();
    
    // Remove any markdown formatting
    result = result.replace(/^```(?:\w+)?\s*/i, "").replace(/\s*```$/i, "").trim();
    
    // Remove quotes if they wrap the entire response
    if ((result.startsWith('"') && result.endsWith('"')) ||
        (result.startsWith("'") && result.endsWith("'"))) {
      result = result.slice(1, -1);
    }
    
    // Remove common prefix labels
    const prefixesToRemove = [
      /^Here is your (?:rewritten|tailored|improved) (?:CV|section):?\s*/i,
      /^Here's your (?:rewritten|tailored|improved) (?:CV|section):?\s*/i,
      /^Rewritten (?:CV|section):?\s*/i,
      /^Tailored (?:CV|section):?\s*/i,
      /^Improved (?:CV|section):?\s*/i,
    ];
    
    for (const prefix of prefixesToRemove) {
      result = result.replace(prefix, "");
    }
    
    result = result.trim();
    
    // Validate result is not empty
    if (!result || result.length < 20) {
      console.warn(`[cv-analyser/rewrite] Generated result too short: ${result?.length || 0} chars`);
      throw new Error("Generated rewrite is too short or empty");
    }
    
    console.log(`[cv-analyser/rewrite] Successfully generated rewrite (${result.length} chars) in mode: ${validMode}`);

    // ── ③ DEDUCT TOKENS — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "cv-analyser/rewrite", {
      messageLength: prompt.length,
      contentLength: content.length,
      jobDescriptionLength: jobDescription?.length ?? 0,
      section: section || "unknown",
      mode: validMode,
      processingMs,
    });
    console.log(`[cv-analyser/rewrite] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

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
    console.log(`[cv-analyser/rewrite] Tracked tool usage for user ${gateResult.dbUserId}`);

    // ── ⑤ RETURN SUCCESS RESPONSE ──────────────────────────────────────────
    return NextResponse.json({ 
      ok: true, 
      result,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        mode: validMode,
        section: section || "full_cv",
        characterCount: result.length,
      }
    });
    
  } catch (err: any) {
    console.error("[cv-analyser/rewrite] Error:", err);

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
      console.error("[cv-analyser/rewrite] Failed to track error:", trackError);
    }
    
    // Return user-friendly error message
    return NextResponse.json(
      { 
        error: err.message ?? "Rewrite failed",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}








// // =============================================================================
// // isaacpaha.com — CV Analyser: Section Rewrite API
// // app/api/tools/cv-analyser/rewrite/route.ts
// //
// // POST { section, content, jobDescription?, targetRole? }
// //   Returns improved version of a specific CV section
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

// export async function POST(req: NextRequest) {
//   const start = Date.now();
//   try {
//     const { section, content, jobDescription, targetRole, mode = "improve" } = await req.json();

//     if (!content?.trim()) {
//       return NextResponse.json({ error: "content required" }, { status: 400 });
//     }

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//         const gate = await tokenGate(req, TOKEN_COST, { toolName: "CV Rewrite" });
//     console.log(`[cv-analyser/rewrite] Token gate result:`, gate);
//     if (!gate.ok) return gate.response; // sends 402 JSON to client
//     console.log(`[cv-analyser/rewrite] Token gate passed for user ${gate.dbUserId}, proceeding with rewrite.`);


//     const prompts: Record<string, string> = {
//       improve: `You are an expert CV writer. Rewrite this ${section} section to be stronger, more impactful, and professional.
// ${jobDescription ? `Target job: ${jobDescription.slice(0, 500)}` : ""}
// ${targetRole ? `Target role: ${targetRole}` : ""}

// Original ${section}:
// ${content}

// Rules for the rewrite:
// - Use strong action verbs (Led, Built, Delivered, Achieved, Drove, Implemented)
// - Add quantified achievements where possible (%, £, numbers)
// - Remove passive language and weak phrases like "responsible for" or "helped with"
// - Keep it concise but impactful
// - Match the tone to the target role/sector

// Return ONLY the improved text — no labels, no explanation.`,

//       full_rewrite: `You are a senior CV consultant. Rewrite this entire CV section by section, optimising for:
// ${jobDescription ? `- The target job description\n` : ""}${targetRole ? `- The role: ${targetRole}\n` : ""}- ATS compatibility
// - Strong impact language
// - Quantified achievements
// - Professional structure

// Original CV:
// ${content.slice(0, 4000)}

// Return the fully rewritten CV as clean, well-formatted text. No JSON. No labels like "Here is your rewritten CV:".`,

//       tailor: `You are a CV tailoring specialist. Take this CV and tailor it specifically for this job description.

// Job Description:
// ${(jobDescription ?? "").slice(0, 1000)}

// CV:
// ${content.slice(0, 3000)}

// Rules:
// - Highlight experience most relevant to the JD
// - Mirror keywords from the JD naturally
// - Reorder bullet points to lead with most relevant experience
// - Adjust the professional summary to align with the role

// Return ONLY the tailored CV text.`,
//     };

//     const prompt = prompts[mode] ?? prompts.improve;

//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 3000,
//       messages:   [{ role: "user", content: prompt }],
//     });

//     const result = message.content[0].type === "text" ? message.content[0].text : "";

//     const processingMs = Date.now() - start;

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//     await deductTokens(gate.dbUserId, TOKEN_COST, "cv-analyser/rewrite", {
//       messageLength: prompt.length,
//       contentLength: content.length,
//       jobDescriptionLength: jobDescription?.length ?? 0,
//     });
//     console.log(`[cv-analyser/rewrite] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for CV rewrite.`);
    
//       // ── ④ TRACK USAGE ─────────────────────────────────────────────────────────
//       await trackToolUsage({
//         toolId:       TOOL_ID,
//         toolName:     TOOL_NAME,
//         userId:       gate.dbUserId,
//         ipAddress:    getIpFromRequest(req),
//         processingMs,
//         tokenCost:    TOKEN_COST,
//         wasSuccess:   true,
//       });
//       console.log(`[cv-analyser/rewrite] Tracked tool usage for user ${gate.dbUserId}.`);

//     return NextResponse.json({ ok: true, result });
//   } catch (err: any) {
//     console.error("[cv-analyser/rewrite]", err);

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

//     return NextResponse.json({ error: err.message ?? "Rewrite failed" }, { status: 500 });
//   }
// }

