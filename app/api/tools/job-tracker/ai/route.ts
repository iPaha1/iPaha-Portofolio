// =============================================================================
// app/api/tools/job-tracker/ai/route.ts
// POST { mode, targetRole?, sector? }
//   "insights"   → personalised job search analysis
//   "interview"  → interview questions for target role
//   "motivation" → personalised encouragement
//   "next-steps" → what to do this week
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Anthropic from "@anthropic-ai/sdk";
import { getApplicationStats, getOrCreateProfile } from "@/lib/tools/actions/job-tracker-actions";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "job-application-tracker"; // For fetching tool ID and tracking usage
const TOKEN_COST = 100; // Adjust based on expected response length and model pricing
const TOOL_NAME = "Job Application Tracker";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[job-tracker/ai] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[job-tracker/ai] Failed to load tool ID:`, err);
}

// Valid modes
type AIMode = "insights" | "interview" | "motivation" | "next-steps";
const VALID_MODES: AIMode[] = ["insights", "interview", "motivation", "next-steps"];

// Helper to clean AI response
function cleanResponse(text: string): string {
  let cleaned = text.trim();
  
  // Remove markdown code blocks
  cleaned = cleaned.replace(/^```(?:\w+)?\s*/i, "").replace(/\s*```$/i, "").trim();
  
  // Remove quotes if they wrap the entire response
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  
  // Remove common prefixes
  const prefixesToRemove = [
    /^Here (?:are|is) your (?:insights|questions|motivation|next steps):?\s*/i,
    /^Here's your (?:insights|questions|motivation|next steps):?\s*/i,
    /^Your (?:insights|questions|motivation|next steps):?\s*/i,
    /^AI (?:insights|questions|motivation|next steps):?\s*/i,
  ];
  
  for (const prefix of prefixesToRemove) {
    cleaned = cleaned.replace(prefix, "");
  }
  
  return cleaned.trim();
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    console.log("[job-tracker/ai] Received AI request");
    
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Sign in to use AI coaching" }, { status: 401 });
    }

    console.log(`[job-tracker/ai] Authenticated user: ${userId}`);
    
    const { mode, targetRole, sector } = await req.json();
    console.log(`[job-tracker/ai] Request body:`, { mode, targetRole, sector });

    // Validate mode
    if (!mode || !VALID_MODES.includes(mode as AIMode)) {
      return NextResponse.json(
        { error: `Invalid mode. Valid modes: ${VALID_MODES.join(", ")}` },
        { status: 400 }
      );
    }

    // Get user stats and profile
    const [stats, profile] = await Promise.all([
      getApplicationStats(),
      getOrCreateProfile(),
    ]);

    // For insights mode, we need stats
    if (mode === "insights" && (!stats || stats.total === 0)) {
      return NextResponse.json({ 
        content: "Log some applications first to get personalised insights! Your job search data helps me give you meaningful advice." 
      });
    }

    // For other modes, we can still provide value without stats
    if (!stats && mode !== "interview") {
      return NextResponse.json({ 
        content: "Start tracking your applications to get personalised insights! For now, here's some general advice to help you get started." 
      });
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    console.log(`[job-tracker/ai] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[job-tracker/ai] Token gate passed for user ${gateResult.dbUserId}`);

    // Build prompt based on mode
    let prompt = "";

    if (mode === "insights" && stats) {
      const topSectors = Object.entries(stats.bySector ?? {})
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 4)
        .map(([s, c]) => `${s} (${c})`)
        .join(", ") || "varied";

      const interviewCount = stats.byStatus?.INTERVIEW ?? 0;
      const offerCount = (stats.byStatus?.OFFER ?? 0) + (stats.byStatus?.ACCEPTED ?? 0);
      const ghostedCount = stats.byStatus?.GHOSTED ?? 0;
      const pendingCount = stats.byStatus?.APPLIED ?? 0;

      prompt = `You are a warm but honest career coach analysing a job seeker's data.

Their current stats:
- Total applications submitted: ${stats.total}
- Interview rate: ${stats.interviewRate}% (${interviewCount} interviews)
- Offer rate: ${stats.offerRate}% (${offerCount} offers)
- Rejections: ${stats.byStatus?.REJECTED ?? 0}
- Ghosted: ${ghostedCount}
- Pending response: ${pendingCount}
- Top sectors applied to: ${topSectors}
- Target role: ${profile?.targetRole ?? "not specified"}

Give 4 specific, actionable insights. Be warm, direct, and data-driven:

1. What their data shows is working (be specific — reference actual numbers)
2. The most impactful change they could make right now
3. A pattern worth paying attention to (based on their data)
4. One concrete action to take today

Keep each point to 2-3 sentences. Be human — not corporate. No bullet sub-lists.
Use their actual numbers to make it personal and specific.`;
    }

    else if (mode === "interview") {
      const role = targetRole?.trim() || profile?.targetRole || "the target role";
      const sectorContext = sector ? ` in ${sector}` : "";
      
      prompt = `Generate 10 likely interview questions for a ${role}${sectorContext} role.

Format as a numbered list. Include:
- 3 behavioural questions (situation-based)
- 3 technical or role-specific questions
- 2 motivation/culture-fit questions
- 2 situational problem-solving questions

After each question, add a one-line tip: "Tip: [specific advice]"
Keep tips specific and actionable — no generic advice.
Make the questions challenging and realistic for ${role} roles.

Start directly with question 1. No introduction needed.`;
    }

    else if (mode === "motivation" && stats) {
      const interviewCount = stats.byStatus?.INTERVIEW ?? 0;
      const rejectionCount = stats.byStatus?.REJECTED ?? 0;
      const offerCount = (stats.byStatus?.OFFER ?? 0) + (stats.byStatus?.ACCEPTED ?? 0);
      
      prompt = `Write a short, genuine motivational message (120-160 words) for a job seeker who has:
- Submitted ${stats.total} applications
- Had ${interviewCount} interviews
- Received ${rejectionCount} rejections
- ${offerCount > 0 ? `Has ${offerCount} offer(s) to consider` : "Still waiting for their break"}

Rules:
- Be genuine and specific — reference their actual numbers
- Don't use empty phrases like "keep pushing" or "you've got this"  
- Acknowledge the difficulty honestly before building them up
- End with one actionable thought, not a pep talk cliché
- Write as if you know them personally — warm but real
- Use a conversational, human tone — no corporate speak`;
    }

    else if (mode === "next-steps" && stats) {
      const appliedCount = stats.byStatus?.APPLIED ?? 0;
      const interviewCount = stats.byStatus?.INTERVIEW ?? 0;
      const offerCount = (stats.byStatus?.OFFER ?? 0) + (stats.byStatus?.ACCEPTED ?? 0);
      const ghostedCount = stats.byStatus?.GHOSTED ?? 0;
      
      prompt = `A job seeker has this job search data:
- ${stats.total} total applications
- ${appliedCount} awaiting response
- ${interviewCount} at interview stage
- ${offerCount} offers received
- ${ghostedCount} applications with no response (ghosted)
- Target role: ${profile?.targetRole ?? "unspecified"}

Give them 3 prioritised actions for this week. Be specific — not generic.
Number each clearly. 2 sentences max per action.
Think like a career coach who has 5 minutes with them.
Base recommendations on their actual data — if they have ghosted applications, suggest follow-ups; if interview rate is low, suggest application quality improvements; etc.`;
    }

    // ── ② CALL ANTHROPIC API ──────────────────────────────────────────────
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      temperature: 0.7, // Slightly higher for more natural coaching tone
      messages: [{ role: "user", content: prompt }],
    });

    const processingMs = Date.now() - start;
    
    // Extract and clean response
    let text = message.content[0].type === "text" ? message.content[0].text : "";
    text = cleanResponse(text);
    
    console.log(`[job-tracker/ai] Generated response (${text.length} chars) for mode: ${mode}`);

    // Validate response
    if (!text || text.length < 20) {
      console.warn(`[job-tracker/ai] Generated response too short: ${text?.length || 0} chars`);
      throw new Error("Generated response is too short or empty");
    }

    // ── ③ DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "job-tracker/ai", { 
      mode, 
      targetRole, 
      sector,
      processingMs,
      hasStats: !!stats,
    });
    console.log(`[job-tracker/ai] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId} for mode ${mode}`);

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
    console.log(`[job-tracker/ai] Tracked tool usage for user ${gateResult.dbUserId}`);

    // ── ⑤ RETURN SUCCESS RESPONSE ──────────────────────────────────────────
    return NextResponse.json({ 
      content: text,
      metadata: {
        mode,
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        responseLength: text.length,
        hasStats: !!stats,
      }
    });
    
  } catch (err: any) {
    console.error("[job-tracker/ai] Error:", err);

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
      console.error("[job-tracker/ai] Failed to track error:", trackError);
    }
    
    // Return user-friendly error message
    return NextResponse.json(
      { 
        error: err.message ?? "AI generation failed",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}





// // =============================================================================
// // app/api/tools/job-tracker/ai/route.ts
// // POST { mode, targetRole?, sector? }
// //   "insights"   → personalised job search analysis
// //   "interview"  → interview questions for target role
// //   "motivation" → personalised encouragement
// //   "next-steps" → what to do this week
// // =============================================================================

// import { NextRequest, NextResponse }  from "next/server";
// import { auth }                       from "@clerk/nextjs/server";
// import Anthropic                      from "@anthropic-ai/sdk";
// import { getApplicationStats, getOrCreateProfile } from "@/lib/tools/actions/job-tracker-actions";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });


// // Tool token costs (in tokens per request)
// const TOKEN_COST = 80000000000000; // Adjust based on expected response length and model pricing

// export async function POST(req: NextRequest) {
//   console.log("[job-tracker/ai] Received AI request");
//   const { userId } = await auth();
//   if (!userId) return NextResponse.json({ error: "Sign in to use AI coaching" }, { status: 401 });

//   console.log(`[job-tracker/ai] Authenticated user: ${userId}`);
//   const { mode, targetRole, sector } = await req.json();
//   console.log(`[job-tracker/ai] Request body:`, { mode, targetRole, sector });

//   const [stats, profile] = await Promise.all([
//     getApplicationStats(),
//     getOrCreateProfile(),
//   ]);

//   if (!stats && mode !== "interview") {
//     return NextResponse.json({ content: "Log some applications first to get personalised insights!" });
//   }

//   // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//   const gate = await tokenGate(req, TOKEN_COST, { toolName: "Job Tracker AI" });
//   console.log(`[job-tracker/ai] Token gate result:`, gate);
//   if (!gate.ok) return gate.response; // sends 402 JSON to client
//   console.log(`[job-tracker/ai] Token gate passed for user ${gate.dbUserId}, proceeding with AI request.`);


//   let prompt = "";

//   if (mode === "insights" && stats) {
//     prompt = `You are a warm but honest career coach analysing a job seeker's data.

// Their current stats:
// - Total applications submitted: ${stats.total}
// - Interview rate: ${stats.interviewRate}% (${stats.byStatus?.INTERVIEW ?? 0} interviews)
// - Offer rate: ${stats.offerRate}% (${(stats.byStatus?.OFFER ?? 0) + (stats.byStatus?.ACCEPTED ?? 0)} offers)
// - Rejections: ${stats.byStatus?.REJECTED ?? 0}
// - Top sectors applied to: ${Object.entries(stats.bySector ?? {}).sort((a,b) => (b[1] as number) - (a[1] as number)).slice(0,4).map(([s,c]) => `${s} (${c})`).join(", ") || "varied"}
// - Target role: ${profile?.targetRole ?? "not specified"}
// - Status breakdown: ${JSON.stringify(stats.byStatus ?? {})}

// Give 4 specific, actionable insights. Be warm, direct, and data-driven:
// 1. What their data shows is working (be specific)
// 2. The most impactful change they could make right now
// 3. A pattern worth paying attention to  
// 4. One concrete action to take today

// Keep each point to 2-3 sentences. Be human — not corporate. No bullet sub-lists.`;
//   }

//   else if (mode === "interview") {
//     const role = targetRole?.trim() || profile?.targetRole || "the target role";
//     prompt = `Generate 10 likely interview questions for a ${role}${sector ? ` in ${sector}` : ""} role.

// Format as a numbered list. Include:
// - 3 behavioural questions (situation-based)
// - 3 technical or role-specific questions
// - 2 motivation/culture-fit questions
// - 2 situational problem-solving questions

// After each question, add a one-line tip: "Tip: ..."
// Keep tips specific and actionable.`;
//   }

//   else if (mode === "motivation" && stats) {
//     prompt = `Write a short, genuine motivational message (120-160 words) for a job seeker who has:
// - Submitted ${stats.total} applications
// - Had ${stats.byStatus?.INTERVIEW ?? 0} interviews
// - Received ${stats.byStatus?.REJECTED ?? 0} rejections
// - ${(stats.byStatus?.OFFER ?? 0) > 0 ? `Has ${stats.byStatus?.OFFER} offer(s) to consider` : "Still waiting for their break"}

// Rules:
// - Be genuine and specific — reference their actual numbers
// - Don't use empty phrases like "keep pushing" or "you've got this"  
// - Acknowledge the difficulty honestly before building them up
// - End with one actionable thought, not a pep talk cliché
// - Write as if you know them personally — warm but real`;
//   }

//   else if (mode === "next-steps" && stats) {
//     prompt = `A job seeker has this job search data:
// - ${stats.total} total applications
// - ${stats.byStatus?.APPLIED ?? 0} awaiting response
// - ${stats.byStatus?.INTERVIEW ?? 0} at interview stage
// - ${stats.byStatus?.OFFER ?? 0} offers received
// - ${stats.byStatus?.GHOSTED ?? 0} applications with no response (ghosted)
// - Target role: ${profile?.targetRole ?? "unspecified"}

// Give them 3 prioritised actions for this week. Be specific — not generic.
// Number each clearly. 2 sentences max per action.
// Think like a career coach who has 5 minutes with them.`;
//   }

//   else {
//     return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
//   }

//   try {
//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 700,
//       messages:   [{ role: "user", content: prompt }],
//     });
//     const text = message.content[0].type === "text" ? message.content[0].text : "";

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//     await deductTokens(gate.dbUserId, TOKEN_COST, "job-tracker/ai", { mode, targetRole, sector });
//     console.log(`[job-tracker/ai] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for mode ${mode}.`);
    
//     return NextResponse.json({ content: text });
//   } catch (err: any) {
//     console.error("[job-tracker/ai]", err);
//     return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
//   }
// }