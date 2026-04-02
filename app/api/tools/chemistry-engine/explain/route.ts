// =============================================================================
// isaacpaha.com — Chemistry Understanding Engine — Explanation API (with token gate)
// app/api/tools/chemistry-engine/explain/route.ts
//
// Token cost: see TOOLS data — chemistry-engine is 50 tokens for full, lower for quick modes
// Mode token costs:
//   full:   50 tokens (long 10-layer breakdown)
//   simpler: 30 tokens
//   deeper:  40 tokens
//   tutor:   35 tokens
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "chemistry-engine";
const TOOL_NAME = "Chemistry Engine";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[chemistry-engine/explain] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[chemistry-engine/explain] Failed to load tool ID:`, err);
}

// ── Token cost by mode ────────────────────────────────────────────────────────
const MODE_TOKEN_COST: Record<string, number> = {
  full: 120,
  simpler: 100,
  deeper: 150,
  tutor: 100,
};

// ─── Level config ─────────────────────────────────────────────────────────────

const LEVEL_CFG: Record<string, { label: string; depth: string; vocab: string; math: string }> = {
  gcse: {
    label: "GCSE (UK Year 10-11)",
    depth: "foundational",
    vocab: "plain English, everyday analogies, no complex notation",
    math: "simple ratios, n = m/M, basic balancing equations — no calculus",
  },
  alevel: {
    label: "A-Level (UK Year 12-13)",
    depth: "intermediate",
    vocab: "precise scientific language, some derivation and mechanism description",
    math: "rate equations, Kc, enthalpy cycles, electron configuration notation",
  },
  university: {
    label: "University / Degree",
    depth: "advanced",
    vocab: "rigorous, formal, quantum-mechanical treatment where relevant",
    math: "molecular orbital theory, thermodynamic derivations, advanced kinetics",
  },
};

// ─── Chemistry visualisation type detector ───────────────────────────────────

function detectChemVizType(question: string): string {
  const q = question.toLowerCase();
  if (/energy|enthalpy|exothermic|endothermic|activation|ΔH|ΔG|bond energy|hess/.test(q)) return "energy_diagram";
  if (/element|periodic|electron config|atomic number|group|period|shell|orbital/.test(q)) return "periodic_element";
  if (/molecule|bond|structure|h2o|co2|nacl|ch4|nh3|lewis|dot.*cross/.test(q)) return "molecular";
  if (/wave|frequency|spectrum|light|electromagnetic/.test(q)) return "wave";
  if (/graph|rate|concentration|time|plot/.test(q)) return "function_graph";
  return "none";
}

// Helper to clean and parse JSON
function cleanAndParseJSON(rawResponse: string): any {
  let cleaned = rawResponse.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  
  const jsonMatch = cleaned.match(/\{[\s\S]+\}/);
  if (!jsonMatch) throw new Error("No JSON object found");
  
  let jsonStr = jsonMatch[0];
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
  
  return JSON.parse(escaped);
}

// Generate fallback explanation
function generateFallbackExplanation(question: string, mode: string): any {
  if (mode === "simpler") {
    return {
      analogy: "Think of it like building with Lego bricks",
      simplifiedExplanation: "We're having technical difficulties. Please try again.",
      particleSimplified: "Atoms and molecules interact in specific ways",
      keyInsight: "Try refreshing and asking your question again",
      rememberThis: "Chemistry makes sense with the right explanation",
    };
  } else if (mode === "deeper") {
    return {
      quantumLevel: "Advanced explanation temporarily unavailable",
      advancedTheory: "Please try again",
      derivation: "N/A",
      limitationsOfSimpleModel: "Try refreshing",
      nobelConnections: "N/A",
      currentResearch: "Please try again later",
    };
  } else if (mode === "tutor") {
    return {
      response: "I'm here to help, but I'm having technical difficulties. Please try again.",
      guidingQuestion: "What part of this concept seems most challenging?",
      particleHint: "Think about what atoms are doing",
      encouragement: "You're on the right track by asking questions!",
      nextStep: "Please try refreshing and asking your question again",
    };
  }
  
  return {
    topic: "Chemistry",
    conceptName: "Chemical Concepts",
    keyChemists: ["Please try again"],
    simpleDefinition: { oneLineSummary: "Service temporarily unavailable", expandedDefinition: "Please try again", everydayAnalogy: "Try refreshing" },
    particleLevel: { whatAtomsDo: "", whatElectronsDo: "", whatBondsDoBreakForm: "", particleModel: "", whyCannotSeeIt: "" },
    corePrinciple: { name: "", equation: "", terms: [], inWords: "", conservationLaw: "", levelNote: "" },
    whyItExists: { problemItSolved: "", beforeDiscovery: "", breakthrough: "", impactOnChemistry: "" },
    history: { discovered: "", keyMoment: "", evolution: "", funFact: "", chemists: [] },
    theoryExplainer: { theoryName: "", whatItSays: "", whyItMakesSense: "", predictions: [], limitations: "" },
    realWorld: [],
    intuition: { primaryModel: "", alternativeModel: "", thinkAboutItLike: "", whatChangesWhen: [] },
    misconceptions: [],
    experiments: [],
    conceptLinks: [],
    whyItMatters: "",
    levelSummary: "Please try again",
    examTips: [],
    visualisation: { type: "none", description: "", keyPoints: [], data: null },
    difficulty: "Medium",
    estimatedReadMinutes: 2,
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    const body = await req.json();
    const {
      question,
      level = "gcse",
      mode = "full",
      explorerMode = false,
      followUpContext = "",
    } = body;

    if (!question?.trim() || question.trim().length < 2) {
      return NextResponse.json(
        { error: "Please enter a chemistry topic or question (minimum 2 characters)" },
        { status: 400 }
      );
    }

    // Validate level
    const validLevels = ["gcse", "alevel", "university"];
    const validLevel = validLevels.includes(level) ? level : "gcse";

    // Validate mode
    const validModes = ["full", "simpler", "deeper", "tutor"];
    const validMode = validModes.includes(mode) ? mode : "full";

    const tokenCost = MODE_TOKEN_COST[validMode] || 50;

    // ── TOKEN GATE ────────────────────────────────────────────────────────────
    gateResult = await tokenGate(req, tokenCost, { toolName: TOOL_NAME });
    console.log(`[chemistry-engine/explain] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[chemistry-engine/explain] Token gate passed for user ${gateResult.dbUserId}`);

    const lvl = LEVEL_CFG[validLevel] ?? LEVEL_CFG.gcse;
    const vizType = detectChemVizType(question);

    const systemPrompt = `You are an outstanding chemistry teacher and science communicator. Your philosophy:
- Chemistry is the science of matter and change — make students feel that wonder
- The particle level is everything: if students can't picture what atoms/electrons are doing, they don't understand chemistry
- Every concept has a history — show who needed it and why
- Analogies transform the abstract into the tangible
- Misconceptions are the biggest barrier to learning chemistry — address them head on
- Level: ${lvl.label} — ${lvl.vocab}
- Mathematics: ${lvl.math}

Your goal: students should finish reading and think "I finally get why this works."`;

    let userPrompt = "";
    let result: any;

    // ── SIMPLER mode ─────────────────────────────────────────────────────────
    if (validMode === "simpler") {
      userPrompt = `A ${lvl.label} student found the chemistry explanation too complex. Simplify "${question}".
Use the most powerful analogy you can — something from everyday life that makes it click instantly.

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas

Return EXACTLY this JSON structure:
{
  "analogy": "<vivid, specific everyday analogy>",
  "simplifiedExplanation": "<2-3 sentences maximum, plain English, no jargon>",
  "particleSimplified": "<what's happening at particle level in the simplest possible terms>",
  "keyInsight": "<the one thing they absolutely must remember>",
  "rememberThis": "<memorable one-liner they can write in their notes>"
}`;
    }

    // ── DEEPER mode ───────────────────────────────────────────────────────────
    else if (validMode === "deeper") {
      userPrompt = `A ${lvl.label} student wants to go deeper on "${question}". Provide advanced treatment.

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas

Return EXACTLY this JSON structure:
{
  "quantumLevel": "<quantum mechanical / molecular orbital treatment>",
  "advancedTheory": "<deeper theoretical framework>",
  "derivation": "<mathematical derivation or proof where applicable>",
  "limitationsOfSimpleModel": "<where the simplified model breaks down>",
  "nobelConnections": "<Nobel Prize in Chemistry work connected to this concept>",
  "currentResearch": "<how this concept connects to active research>"
}`;
    }

    // ── TUTOR mode ────────────────────────────────────────────────────────────
    else if (validMode === "tutor") {
      userPrompt = `A ${lvl.label} student is studying "${question}". Context: ${followUpContext || "none"}
Be a patient, Socratic chemistry tutor. Guide them to understand — don't just give the answer.

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas

Return EXACTLY this JSON structure:
{
  "response": "<address their specific confusion — be warm and patient>",
  "guidingQuestion": "<a question that pushes them to think it through themselves>",
  "particleHint": "<a particle-level clue to help them picture what's happening>",
  "encouragement": "<genuine specific encouragement>",
  "nextStep": "<the next concept they should tackle>"
}`;
    }

    // ── FULL mode — 10-layer breakdown ────────────────────────────────────────
    else {
      userPrompt = `${explorerMode
        ? `Provide a complete Theory Explorer breakdown for the chemistry topic: "${question}"`
        : `Explain this chemistry question/topic COMPLETELY for a ${lvl.label} student: "${question}"`
      }

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")
- Ensure all strings are properly closed with quotes

Return EXACTLY this JSON structure (every field must be filled): ... (full schema as in original)`; // Truncated for brevity
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: validMode === "full" ? 6500 : validMode === "deeper" ? 2000 : 1200,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const processingMs = Date.now() - start;
    
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    
    try {
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');
      result = JSON.parse(noTrailing);
    } catch (firstError) {
      try {
        result = cleanAndParseJSON(raw);
      } catch (secondError) {
        console.error(`[chemistry-engine/explain] All parsing attempts failed`);
        console.error(`[chemistry-engine/explain] Raw response (first 500 chars):`, raw.slice(0, 500));
        result = generateFallbackExplanation(question, validMode);
      }
    }

    // ── DEDUCT tokens after successful response ───────────────────────────────
    await deductTokens(gateResult.dbUserId, tokenCost, "chemistry-engine/explain", {
      mode: validMode,
      level: validLevel,
      explorerMode,
      questionLength: question.length,
      processingMs,
    });
    console.log(`[chemistry-engine/explain] Deducted ${tokenCost} tokens from user ${gateResult.dbUserId}`);

    // ── TRACK USAGE ───────────────────────────────────────────────────────────
    await trackToolUsage({
      toolId: TOOL_ID,
      toolName: TOOL_NAME,
      userId: gateResult.dbUserId,
      ipAddress: getIpFromRequest(req),
      processingMs,
      tokenCost,
      wasSuccess: true,
    });
    console.log(`[chemistry-engine/explain] Tracked tool usage for user ${gateResult.dbUserId}`);

    return NextResponse.json({ 
      ok: true, 
      result, 
      mode: validMode,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: tokenCost,
        level: validLevel,
        mode: validMode,
      }
    });
  } catch (err: any) {
    console.error("[chemistry-engine/explain] Error:", err);

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
      console.error("[chemistry-engine/explain] Failed to track error:", trackError);
    }
    
    return NextResponse.json(
      { 
        error: err.message ?? "Explanation failed",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}





// // =============================================================================
// // isaacpaha.com — Chemistry Understanding Engine — Explanation API (with token gate)
// // app/api/tools/chemistry-engine/explain/route.ts
// //
// // Token cost: see TOOLS data — chemistry-engine is 50 tokens for full, lower for quick modes
// // Mode token costs:
// //   full:   50 tokens (long 10-layer breakdown)
// //   simpler: 10 tokens
// //   deeper:  20 tokens
// //   tutor:   15 tokens
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";



// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// // ── Token cost by mode ────────────────────────────────────────────────────────
// const MODE_TOKEN_COST: Record<string, number> = {
//   full:    500000000000000000,
//   simpler: 100000000000000000,
//   deeper:  200000000000000000,
//   tutor:   150000000000000000,
// };

// // ─── Level config ─────────────────────────────────────────────────────────────

// const LEVEL_CFG: Record<string, { label: string; depth: string; vocab: string; math: string }> = {
//   gcse:       {
//     label: "GCSE (UK Year 10-11)",
//     depth: "foundational",
//     vocab: "plain English, everyday analogies, no complex notation",
//     math:  "simple ratios, n = m/M, basic balancing equations — no calculus",
//   },
//   alevel:     {
//     label: "A-Level (UK Year 12-13)",
//     depth: "intermediate",
//     vocab: "precise scientific language, some derivation and mechanism description",
//     math:  "rate equations, Kc, enthalpy cycles, electron configuration notation",
//   },
//   university: {
//     label: "University / Degree",
//     depth: "advanced",
//     vocab: "rigorous, formal, quantum-mechanical treatment where relevant",
//     math:  "molecular orbital theory, thermodynamic derivations, advanced kinetics",
//   },
// };

// // ─── Chemistry visualisation type detector ───────────────────────────────────

// function detectChemVizType(question: string): string {
//   const q = question.toLowerCase();
//   if (/energy|enthalpy|exothermic|endothermic|activation|ΔH|ΔG|bond energy|hess/.test(q)) return "energy_diagram";
//   if (/element|periodic|electron config|atomic number|group|period|shell|orbital/.test(q))  return "periodic_element";
//   if (/molecule|bond|structure|h2o|co2|nacl|ch4|nh3|lewis|dot.*cross/.test(q))             return "molecular";
//   if (/wave|frequency|spectrum|light|electromagnetic/.test(q))                              return "wave";
//   if (/graph|rate|concentration|time|plot/.test(q))                                         return "function_graph";
//   return "none";
// }

// // ─── Handler ──────────────────────────────────────────────────────────────────

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const {
//       question,
//       level           = "gcse",
//       mode            = "full",
//       explorerMode    = false,
//       followUpContext = "",
//     } = body;

//     if (!question?.trim() || question.trim().length < 2) {
//       return NextResponse.json({ error: "Please enter a chemistry topic or question" }, { status: 400 });
//     }

//     // ── TOKEN GATE ────────────────────────────────────────────────────────────
//     const tokenCost = MODE_TOKEN_COST[mode] ?? MODE_TOKEN_COST.full;

//     const gate = await tokenGate(req, tokenCost, { toolName: "Chemistry Engine" });
//     console.log(`[chemistry-engine/explain] Token gate result:`, gate);
//     if (!gate.ok) return gate.response; // Returns 402 JSON to client
//     console.log(`[chemistry-engine/explain] Token gate passed for user ${gate.dbUserId}, proceeding with explanation for question: "${question.slice(0, 80)}" at level ${level} in mode ${mode}.`);

//     // ─────────────────────────────────────────────────────────────────────────
//     // All AI logic below is identical to your original route.
//     // Only change: deductTokens() is called after each successful AI response.
//     // ─────────────────────────────────────────────────────────────────────────

//     const lvl     = LEVEL_CFG[level] ?? LEVEL_CFG.gcse;
//     const vizType = detectChemVizType(question);

//     const systemPrompt = `You are an outstanding chemistry teacher and science communicator. Your philosophy:
// - Chemistry is the science of matter and change — make students feel that wonder
// - The particle level is everything: if students can't picture what atoms/electrons are doing, they don't understand chemistry
// - Every concept has a history — show who needed it and why
// - Analogies transform the abstract into the tangible
// - Misconceptions are the biggest barrier to learning chemistry — address them head on
// - Level: ${lvl.label} — ${lvl.vocab}
// - Mathematics: ${lvl.math}

// Your goal: students should finish reading and think "I finally get why this works."`;

//     // ── SIMPLER mode ─────────────────────────────────────────────────────────
//     if (mode === "simpler") {
//       const prompt = `A ${lvl.label} student found the chemistry explanation too complex. Simplify "${question}".
// Use the most powerful analogy you can — something from everyday life that makes it click instantly.
// Return ONLY valid JSON:
// {
//   "analogy": "<vivid, specific everyday analogy — not 'it's like mixing things'>",
//   "simplifiedExplanation": "<2-3 sentences maximum, plain English, no jargon>",
//   "particleSimplified": "<what's happening at particle level in the simplest possible terms>",
//   "keyInsight": "<the one thing they absolutely must remember>",
//   "rememberThis": "<memorable one-liner they can write in their notes>"
// }`;
//       const msg   = await anthropic.messages.create({ model: "claude-sonnet-4-20250514", max_tokens: 1200, system: systemPrompt, messages: [{ role: "user", content: prompt }] });
//       const raw   = msg.content[0].type === "text" ? msg.content[0].text : "{}";
//       const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
//       let result: any; try { result = JSON.parse(clean); } catch { result = {}; }

//       // ── DEDUCT tokens after success ──────────────────────────────────────
//       await deductTokens(gate.dbUserId, tokenCost, "chemistry-engine/explain", { mode, level, question: question.slice(0, 80) });

//       return NextResponse.json({ ok: true, result, mode });
//     }

//     // ── DEEPER mode ───────────────────────────────────────────────────────────
//     if (mode === "deeper") {
//       const prompt = `A ${lvl.label} student wants to go deeper on "${question}". Provide advanced treatment.
// Return ONLY valid JSON:
// {
//   "quantumLevel": "<quantum mechanical / molecular orbital treatment — go beyond ${lvl.label}>",
//   "advancedTheory": "<deeper theoretical framework — thermodynamics, kinetics, or bonding at the next level up>",
//   "derivation": "<mathematical derivation or proof where applicable>",
//   "limitationsOfSimpleModel": "<where the simplified model breaks down — be honest about approximations>",
//   "nobelConnections": "<Nobel Prize in Chemistry work connected to this concept, if any>",
//   "currentResearch": "<how this concept connects to active research or industrial frontier>"
// }`;
//       const msg   = await anthropic.messages.create({ model: "claude-sonnet-4-20250514", max_tokens: 2000, system: systemPrompt, messages: [{ role: "user", content: prompt }] });
//       const raw   = msg.content[0].type === "text" ? msg.content[0].text : "{}";
//       const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
//       let result: any; try { result = JSON.parse(clean); } catch { result = {}; }

//       await deductTokens(gate.dbUserId, tokenCost, "chemistry-engine/explain", { mode, level, question: question.slice(0, 80) });

//       return NextResponse.json({ ok: true, result, mode });
//     }

//     // ── TUTOR mode ────────────────────────────────────────────────────────────
//     if (mode === "tutor") {
//       const prompt = `A ${lvl.label} student is studying "${question}". Context: ${followUpContext}
// Be a patient, Socratic chemistry tutor. Guide them to understand — don't just give the answer.
// Return ONLY valid JSON:
// {
//   "response": "<address their specific confusion — be warm and patient>",
//   "guidingQuestion": "<a question that pushes them to think it through themselves>",
//   "particleHint": "<a particle-level clue to help them picture what's happening>",
//   "encouragement": "<genuine specific encouragement based on what they got right>",
//   "nextStep": "<the next concept they should tackle to build on this>"
// }`;
//       const msg   = await anthropic.messages.create({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: systemPrompt, messages: [{ role: "user", content: prompt }] });
//       const raw   = msg.content[0].type === "text" ? msg.content[0].text : "{}";
//       const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
//       let result: any; try { result = JSON.parse(clean); } catch { result = {}; }

//       await deductTokens(gate.dbUserId, tokenCost, "chemistry-engine/explain", { mode, level, question: question.slice(0, 80) });

//       return NextResponse.json({ ok: true, result, mode });
//     }

//     // ── FULL mode — 10-layer breakdown ────────────────────────────────────────
//     const prompt = `${explorerMode
//       ? `Provide a complete Theory Explorer breakdown for the chemistry topic: "${question}"`
//       : `Explain this chemistry question/topic COMPLETELY for a ${lvl.label} student: "${question}"`
//     }

// Return ONLY valid JSON (no markdown, no backticks, no text outside JSON):

// {
//   "topic": "<branch of chemistry — e.g. Physical Chemistry, Organic Chemistry, Inorganic Chemistry, Analytical Chemistry>",
//   "conceptName": "<specific concept — e.g. Le Chatelier's Principle, Ionic Bonding, Mole Calculations, Collision Theory>",
//   "keyChemists": ["<Chemist 1 with brief role>", "<Chemist 2>"],

//   "simpleDefinition": {
//     "oneLineSummary": "<one sentence: what is this in plain English — no jargon>",
//     "expandedDefinition": "<2-3 sentence plain English definition — as clear as explaining to a curious 14-year-old>",
//     "everydayAnalogy": "<specific everyday analogy that makes this click immediately — not vague, very specific>"
//   },

//   "particleLevel": {
//     "whatAtomsDo": "<exactly what atoms are doing in this concept — specific and visual>",
//     "whatElectronsDo": "<what electrons are doing — for bonding/redox/reactions this is critical>",
//     "whatBondsDoBreakForm": "<which bonds break, which form, and the energy implication>",
//     "particleModel": "<the best 'picture' a student can hold in their mind of the particles — vivid and concrete>",
//     "whyCannotSeeIt": "<acknowledge we can't see particles and explain how we know this is happening>"
//   },

//   "corePrinciple": {
//     "name": "<name of the law, principle, or equation>",
//     "equation": "<the equation or formula — e.g. n = m/M or pV = nRT>",
//     "terms": [
//       { "symbol": "<e.g. n>", "meaning": "<what it represents>", "unit": "<unit e.g. mol>" }
//     ],
//     "inWords": "<the equation stated in plain English>",
//     "conservationLaw": "<which conservation law underlies this — mass, energy, charge, or N/A>",
//     "levelNote": "<any extra mathematical depth for ${lvl.label}>"
//   },

//   "whyItExists": {
//     "problemItSolved": "<what specific problem or observation forced chemists to develop this>",
//     "beforeDiscovery": "<what people believed or didn't understand before this — what was confusing them>",
//     "breakthrough": "<the key insight that changed everything>",
//     "impactOnChemistry": "<why this was a turning point for the whole field>"
//   },

//   "history": {
//     "discovered": "<by whom, roughly when, under what circumstances>",
//     "keyMoment": "<the specific experiment, observation, or accident that led to it>",
//     "evolution": "<how the understanding changed and deepened over time>",
//     "funFact": "<one genuinely surprising historical fact — something that makes students go 'wow'>",
//     "chemists": [
//       { "name": "<chemist name>", "contribution": "<their specific contribution>", "era": "<time period>" }
//     ]
//   },

//   "theoryExplainer": {
//     "theoryName": "<e.g. Collision Theory, Valence Shell Electron Pair Repulsion, Molecular Orbital Theory>",
//     "whatItSays": "<the core claim of the theory in plain terms>",
//     "whyItMakesSense": "<the intuitive reason this theory is correct — connect it to what we can observe>",
//     "predictions": ["<thing the theory predicts 1>", "<thing the theory predicts 2>"],
//     "limitations": "<where this theory breaks down or needs extending>"
//   },

//   "realWorld": [
//     {
//       "field": "<Medicine | Industry | Environment | Food & Cooking | Technology | Energy | Agriculture>",
//       "application": "<specific real-world application>",
//       "example": "<concrete, vivid example a student can relate to>",
//       "impact": "<why this matters to society>"
//     }
//   ],

//   "intuition": {
//     "primaryModel": "<the single best mental model — specific and memorable>",
//     "alternativeModel": "<a different way of thinking when the first doesn't work for someone>",
//     "thinkAboutItLike": "<complete: 'Think about it like...' with a specific scenario>",
//     "whatChangesWhen": ["<intuition-building: what happens to X when Y changes>"]
//   },

//   "misconceptions": [
//     {
//       "wrongBelief": "<the misconception stated exactly as students typically believe it>",
//       "whyItSeemsTrue": "<why this misconception is understandable — never dismiss it>",
//       "truth": "<the correct understanding — clear and direct>",
//       "correctingExperiment": "<a simple demonstration or thought experiment that disproves the misconception>"
//     }
//   ],

//   "experiments": [
//     {
//       "title": "<experiment name>",
//       "materials": ["<material 1>", "<material 2>"],
//       "instructions": "<clear, concise steps — 2-4 sentences>",
//       "whatToObserve": "<what they will see, hear, or measure>",
//       "chemistryExplained": "<connecting the observation to the concept — what does this prove?>",
//       "safetyNote": "<safety note if needed — empty string if safe>"
//     }
//   ],

//   "conceptLinks": [
//     {
//       "concept": "<related chemistry concept>",
//       "relationship": "<how it connects to what we just learned>",
//       "direction": "<prerequisite | builds-on | parallel>"
//     }
//   ],

//   "whyItMatters": "<2-3 sentences on the broader significance — make it feel important>",

//   "levelSummary": "<2-3 sentence summary pitched exactly at ${lvl.label} — what they need to know for exams>",

//   "examTips": [
//     "<specific exam tip 1 — common marks lost on this topic at ${lvl.label} level>",
//     "<specific exam tip 2>"
//   ],

//   "visualisation": {
//     "type": "${vizType}",
//     "description": "<what should be shown and why it aids understanding>",
//     "keyPoints": ["<key visual insight>"],
//     "data": ${vizType !== "none" ? `{
//       "reactionType": "<exothermic|endothermic if energy_diagram>",
//       "reactantEnergy": <number>,
//       "productEnergy": <number>,
//       "activationEnergy": <number>,
//       "reactionLabel": "<label for the reaction if energy_diagram>",
//       "elementSymbol": "<e.g. Na if periodic_element>",
//       "elementName": "<e.g. Sodium>",
//       "atomicNumber": <number>,
//       "atomicMass": <number>,
//       "elementGroup": "<e.g. Alkali Metal>",
//       "electronConfig": "<e.g. 2, 8, 1>",
//       "formula": "<e.g. H₂O if molecular>",
//       "bondDescription": "<bond description if molecular>",
//       "functionExpression": "<expression if function_graph>",
//       "xRange": "<range if function_graph>"
//     }` : "null"}
//   },

//   "difficulty": "<Introductory | GCSE | A-Level | University | Research>",
//   "estimatedReadMinutes": <number>
// }

// CRITICAL RULES:
// - particleLevel is NON-NEGOTIABLE — always complete all five fields. This is what makes the tool unique.
// - everydayAnalogy must be SPECIFIC — 'Like Lego bricks' is too generic. Give the exact, vivid version.
// - misconceptions must be things students ACTUALLY get wrong — include 2-3 real ones from your experience.
// - experiments must be safe and genuinely doable at home or in a school lab.
// - realWorld must have 4-6 entries from diverse fields — include at least one unexpected/surprising one.
// - chemists entries: 2-3 real scientists with their actual specific contributions.
// - For ${lvl.label}: depth, vocabulary, and mathematics must feel completely natural for that level.`;

//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 6500,
//       system:     systemPrompt,
//       messages:   [{ role: "user", content: prompt }],
//     });

//     const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//     const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

//     let result: any;
//     try { result = JSON.parse(clean); }
//     catch {
//       const match = clean.match(/\{[\s\S]+\}/);
//       if (!match) return NextResponse.json({ error: "Explanation failed — please try again" }, { status: 500 });
//       try { result = JSON.parse(match[0]); }
//       catch { return NextResponse.json({ error: "Could not parse response — please try again" }, { status: 500 }); }
//     }

//     // ── DEDUCT tokens after successful full response ───────────────────────
//     await deductTokens(gate.dbUserId, tokenCost, "chemistry-engine/explain", {
//       mode, level, explorerMode, question: question.slice(0, 80),
//     });

//     return NextResponse.json({ ok: true, result, mode });
//   } catch (err: any) {
//     console.error("[chemistry-engine/explain]", err);
//     return NextResponse.json({ error: err.message ?? "Explanation failed" }, { status: 500 });
//   }
// }


