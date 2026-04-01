


// =============================================================================
// isaacpaha.com — Comparative Scripture Explorer: Exploration API
// app/api/tools/scripture-explorer/explore/route.ts
//
// POST { query, traditions?, mode }
// modes: "compare" | "deep-dive" | "figure" | "theme" | "verse"
//
// NEUTRALITY IS ENFORCED AT THE SYSTEM LEVEL.
// The system prompt is immutable — the AI is strictly instructed to:
//   - Never rank, judge, or prefer any tradition
//   - Use "this tradition teaches…" framing at all times
//   - Present differences as differences, not as errors
//   - Source every claim with a specific reference
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "scripture-explorer";
const TOKEN_COST = 100; // Reasonable token cost for scripture exploration
const TOOL_NAME = "Scripture Explorer";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[scripture-explorer/explore] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[scripture-explorer/explore] Failed to load tool ID:`, err);
}

// Valid modes
type ExplorationMode = "compare" | "deep-dive" | "figure" | "theme" | "verse";
const VALID_MODES: ExplorationMode[] = ["compare", "deep-dive", "figure", "theme", "verse"];

// ─── IMMUTABLE SYSTEM PROMPT ──────────────────────────────────────────────────
// This is not configurable. It is the ethical backbone of the tool.

const SYSTEM_PROMPT = `You are a neutral, scholarly educational assistant specialising in comparative Abrahamic religious studies. Your role is to educate — not to advocate, judge, rank, or persuade.

ABSOLUTE RULES (never break these):
1. NEVER suggest any tradition is more correct, more authentic, or superior to another.
2. NEVER use language like "actually", "in reality", "the truth is", "this is wrong", or any phrase that implies one tradition has a privileged claim to truth.
3. NEVER express a personal view on theological questions.
4. ALWAYS use framing like: "In this tradition...", "This tradition teaches...", "From an Islamic perspective...", "In Christian interpretation...", "Jewish scholars understand this as...", "Interpretations vary within this tradition..."
5. NEVER present one interpretation as THE interpretation — always acknowledge internal diversity where relevant.
6. Differences between traditions are DIFFERENCES, not errors. Present them as distinct perspectives, never as contradictions that need resolving.
7. Always cite specific references (book, chapter, verse) for scripture quotations.
8. Scholarly and historical context must be presented neutrally — if scholars disagree, say so.
9. Keep language accessible and clear — this is for a general educated audience, not specialists.
10. End every response with the standard educational disclaimer.

TONE: Warm, thoughtful, scholarly, and genuinely respectful of all traditions explored.
GOAL: Build bridges of understanding. Help people learn. Never inflame.`;

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildComparePrompt(query: string, traditions: string[]): string {
  const traditionList = traditions.length > 0 
    ? traditions.join(", ") 
    : "Christianity (Bible), Islam (Qur'an), and Judaism (Hebrew Bible / Tanakh)";

  return `A user wants to understand the following topic across religious traditions: "${query}"

Please provide a structured educational comparison across: ${traditionList}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")
- Ensure all strings are properly closed with quotes

Return EXACTLY this JSON structure:

{
  "topic": "<clear, neutral title for this topic>",
  "introduction": "<2-3 sentence neutral overview of why this topic appears across traditions and its significance>",

  "traditions": [
    {
      "tradition": "<tradition name>",
      "text": "<full name of the primary text — e.g. 'The Bible (Old and New Testament)'>",
      "emoji": "<single representative emoji — ✝️ for Christianity, ☪️ for Islam, ✡️ for Judaism>",
      "accentColor": "<hex color — #3b82f6 for Christianity, #10b981 for Islam, #f59e0b for Judaism>",
      "summary": "<2-3 sentences summarising this tradition's perspective on the topic. Use 'In this tradition...' framing.>",
      "passages": [
        {
          "reference": "<Book Chapter:Verse or Surah:Ayah>",
          "text": "<The passage text — keep under 50 words, use ... for long passages>",
          "explanation": "<1-2 sentences explaining what this passage means in this tradition's interpretation>"
        }
      ],
      "context": "<2-3 sentences of historical, cultural, or theological context for this tradition's understanding>",
      "internalDiversity": "<1-2 sentences about different schools of thought or denominations within this tradition, if relevant>"
    }
  ],

  "sharedConnections": [
    {
      "type": "<Shared Figure | Shared Theme | Parallel Story | Common Concept>",
      "title": "<short title>",
      "description": "<2-3 sentences describing the connection across traditions — e.g. 'All three traditions recognise Abraham/Ibrahim/Avraham as a patriarch. While the narrative varies...'>"
    }
  ],

  "keyDifferences": [
    {
      "aspect": "<what aspect differs>",
      "description": "<Neutral 2-3 sentence description of how traditions differ on this aspect. Never imply one is right.>"
    }
  ],

  "historicalContext": "<3-4 sentences of broader historical and scholarly context about how these texts developed and why comparative study is valuable>",

  "guidedQuestions": [
    "<a thoughtful follow-up question a curious learner might ask>",
    "<another question>",
    "<another question>"
  ],

  "disclaimer": "This exploration is an educational summary for comparative study. It does not represent all interpretations within each tradition, and should not be taken as theological authority. Readers are encouraged to consult religious scholars, community leaders, and primary texts for deeper understanding."
}

Requirements:
- Include 1-3 passages per tradition (more if the topic has rich scriptural depth)
- sharedConnections: at minimum 1, up to 4
- keyDifferences: at minimum 1, up to 4
- Be specific — cite real references, real passages
- If you are not certain of a specific verse reference, say "cf." before the reference and note that the exact location varies by edition
- The 3 tradition accent colors must be exactly: Christianity #3b82f6, Islam #10b981, Judaism #f59e0b`;
}

function buildDeepDivePrompt(query: string): string {
  return `A user wants a deep dive into: "${query}"

Provide detailed educational commentary in JSON format.

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")

Return EXACTLY this JSON structure:

{
  "topic": "<title>",
  "overview": "<comprehensive 4-5 sentence overview>",
  "scholarlyPerspectives": [
    {
      "scholar": "<scholar name or school of thought>",
      "tradition": "<which tradition this comes from>",
      "insight": "<their perspective in 2-3 sentences>"
    }
  ],
  "historicalEvolution": "<3-4 sentences on how understanding of this topic has evolved historically>",
  "modernInterpretations": "<2-3 sentences on how contemporary communities engage with this topic>",
  "furtherStudy": ["<recommended topic 1>", "<recommended topic 2>", "<recommended topic 3>"],
  "disclaimer": "This is an educational summary for comparative study only."
}`;
}

function buildFigurePrompt(figure: string): string {
  return `A user wants to understand the religious figure "${figure}" across traditions.

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")

Return EXACTLY this JSON structure:

{
  "figure": "<full name as used in the query>",
  "namesAcrossTraditions": [
    { "tradition": "Christianity", "name": "<name used>", "title": "<title/role>" },
    { "tradition": "Islam", "name": "<name used>", "title": "<title/role>" },
    { "tradition": "Judaism", "name": "<name used>", "title": "<title/role>" }
  ],
  "introduction": "<neutral 2-3 sentence introduction to the figure>",
  "traditions": [
    {
      "tradition": "<name>",
      "emoji": "<emoji>",
      "accentColor": "<hex>",
      "role": "<their role and significance in this tradition>",
      "keyPassages": [{ "reference": "<ref>", "text": "<text>", "explanation": "<meaning>" }],
      "uniqueAspects": "<what this tradition emphasises about this figure that others do not>",
      "context": "<historical context>"
    }
  ],
  "sharedElements": "<2-3 sentences on what all traditions share about this figure>",
  "keyDifferences": [{ "aspect": "<aspect>", "description": "<neutral description>" }],
  "guidedQuestions": ["<question>", "<question>", "<question>"],
  "disclaimer": "Educational summary only. Does not represent all interpretations."
}`;
}

function buildThemePrompt(query: string): string {
  return `A user wants to explore the theme "${query}" across Abrahamic traditions.

Provide a structured educational exploration in JSON format focusing on thematic analysis.

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")

Structure the response with:
- Theme overview
- How each tradition approaches this theme
- Key scriptural references
- Comparative insights
- Guided questions for further reflection`;
}

function buildVersePrompt(query: string): string {
  return `A user wants to explore the verse or passage "${query}" across traditions.

Provide a structured educational analysis in JSON format.

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")

Structure the response with:
- The verse/passage as it appears in different traditions
- Interpretations across traditions
- Historical context
- Theological significance
- Connections to other scriptures`;
}

// Helper to clean and parse JSON
function cleanAndParseJSON(rawResponse: string): any {
  // Remove markdown code blocks
  let cleaned = rawResponse.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  
  // Remove trailing commas
  cleaned = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  
  // Remove control characters
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '');
  
  // Try to extract JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]+\}/);
  if (!jsonMatch) {
    throw new Error("No JSON object found in response");
  }
  
  let jsonStr = jsonMatch[0];
  
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
  
  try {
    return JSON.parse(jsonStr);
  } catch (error: any) {
    console.error("[scripture-explorer/explore] JSON parse error after cleaning:", error.message);
    throw new Error(`Malformed JSON: ${error.message}`);
  }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    const {
      query,
      traditions = [],
      mode = "compare",
    } = await req.json();

    // Validate input
    if (!query?.trim() || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Please enter a topic or question to explore (minimum 2 characters)" },
        { status: 400 }
      );
    }

    // Validate mode
    if (!VALID_MODES.includes(mode as ExplorationMode)) {
      return NextResponse.json(
        { error: `Invalid mode. Valid modes: ${VALID_MODES.join(", ")}` },
        { status: 400 }
      );
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    console.log(`[scripture-explorer/explore] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[scripture-explorer/explore] Token gate passed for user ${gateResult.dbUserId}`);

    const cleanQuery = query.trim().slice(0, 500); // cap at 500 chars

    let prompt: string;
    switch (mode) {
      case "deep-dive":
        prompt = buildDeepDivePrompt(cleanQuery);
        break;
      case "figure":
        prompt = buildFigurePrompt(cleanQuery);
        break;
      case "theme":
        prompt = buildThemePrompt(cleanQuery);
        break;
      case "verse":
        prompt = buildVersePrompt(cleanQuery);
        break;
      default:
        prompt = buildComparePrompt(cleanQuery, traditions);
    }

    // ── ② CALL ANTHROPIC API ──────────────────────────────────────────────
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      temperature: 0.3, // Lower temperature for consistent, neutral responses
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const processingMs = Date.now() - start;
    
    // Get raw response
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    console.log(`[scripture-explorer/explore] Raw response length: ${raw.length} chars`);
    
    // Log first 200 chars for debugging in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[scripture-explorer/explore] Response preview: ${raw.slice(0, 200)}...`);
    }

    // ── ③ PARSE JSON WITH ROBUST ERROR HANDLING ───────────────────────────
    let result: any;
    
    try {
      // First attempt with direct parsing
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');
      result = JSON.parse(noTrailing);
      console.log(`[scripture-explorer/explore] Successfully parsed JSON directly`);
    } catch (firstError: any) {
      console.warn(`[scripture-explorer/explore] Direct parse failed: ${firstError.message}`);
      
      try {
        // Second attempt with comprehensive cleaning
        result = cleanAndParseJSON(raw);
        console.log(`[scripture-explorer/explore] Successfully parsed JSON after cleaning`);
      } catch (secondError: any) {
        console.error(`[scripture-explorer/explore] All parsing attempts failed`);
        console.error(`[scripture-explorer/explore] Raw response (first 500 chars):`, raw.slice(0, 500));
        
        return NextResponse.json(
          { 
            error: "Scripture exploration failed — AI returned malformed JSON",
            details: secondError.message,
            preview: raw.slice(0, 500)
          },
          { status: 500 }
        );
      }
    }

    // Enforce disclaimer is present — belt-and-braces
    if (!result.disclaimer) {
      result.disclaimer = "This exploration is an educational summary for comparative study. It does not represent all interpretations within each tradition and should not be taken as theological authority. Readers are encouraged to consult religious scholars, community leaders, and primary texts for deeper understanding.";
    }

    // Validate required fields for compare mode
    if (mode === "compare") {
      if (!result.traditions || !Array.isArray(result.traditions)) {
        console.warn(`[scripture-explorer/explore] Missing traditions array in response`);
        result.traditions = [];
      }
      if (!result.sharedConnections || !Array.isArray(result.sharedConnections)) {
        result.sharedConnections = [];
      }
      if (!result.keyDifferences || !Array.isArray(result.keyDifferences)) {
        result.keyDifferences = [];
      }
      if (!result.guidedQuestions || !Array.isArray(result.guidedQuestions)) {
        result.guidedQuestions = [];
      }
    }

    // ── ④ DEDUCT TOKENS — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "scripture-explorer/explore", {
      queryLength: cleanQuery.length,
      traditions: traditions.length,
      mode,
      processingMs,
    });
    console.log(`[scripture-explorer/explore] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

    // ── ⑤ TRACK USAGE ───────────────────────────────────────────────────────
    await trackToolUsage({
      toolId: TOOL_ID,
      toolName: TOOL_NAME,
      userId: gateResult.dbUserId,
      ipAddress: getIpFromRequest(req),
      processingMs,
      tokenCost: TOKEN_COST,
      wasSuccess: true,
    });
    console.log(`[scripture-explorer/explore] Tracked tool usage for user ${gateResult.dbUserId}`);

    // ── ⑥ RETURN SUCCESS RESPONSE ──────────────────────────────────────────
    return NextResponse.json({ 
      ok: true, 
      result, 
      mode,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        queryLength: cleanQuery.length,
        traditionsCount: traditions.length,
      }
    });
    
  } catch (err: any) {
    console.error("[scripture-explorer/explore] Error:", err);

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
      console.error("[scripture-explorer/explore] Failed to track error:", trackError);
    }
    
    // Return user-friendly error message
    return NextResponse.json(
      { 
        error: err.message ?? "Exploration failed — please try again",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}






// // =============================================================================
// // isaacpaha.com — Comparative Scripture Explorer: Exploration API
// // app/api/tools/scripture-explorer/explore/route.ts
// //
// // POST { query, traditions?, mode }
// // modes: "compare" | "deep-dive" | "figure" | "theme" | "verse"
// //
// // NEUTRALITY IS ENFORCED AT THE SYSTEM LEVEL.
// // The system prompt is immutable — the AI is strictly instructed to:
// //   - Never rank, judge, or prefer any tradition
// //   - Use "this tradition teaches…" framing at all times
// //   - Present differences as differences, not as errors
// //   - Source every claim with a specific reference
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });


// // Tool token costs (in tokens per request)
// const TOKEN_COST = 150000000000000; // Adjust based on expected response length and model pricing

// // ─── IMMUTABLE SYSTEM PROMPT ──────────────────────────────────────────────────
// // This is not configurable. It is the ethical backbone of the tool.

// const SYSTEM_PROMPT = `You are a neutral, scholarly educational assistant specialising in comparative Abrahamic religious studies. Your role is to educate — not to advocate, judge, rank, or persuade.

// ABSOLUTE RULES (never break these):
// 1. NEVER suggest any tradition is more correct, more authentic, or superior to another.
// 2. NEVER use language like "actually", "in reality", "the truth is", "this is wrong", or any phrase that implies one tradition has a privileged claim to truth.
// 3. NEVER express a personal view on theological questions.
// 4. ALWAYS use framing like: "In this tradition...", "This tradition teaches...", "From an Islamic perspective...", "In Christian interpretation...", "Jewish scholars understand this as...", "Interpretations vary within this tradition..."
// 5. NEVER present one interpretation as THE interpretation — always acknowledge internal diversity where relevant.
// 6. Differences between traditions are DIFFERENCES, not errors. Present them as distinct perspectives, never as contradictions that need resolving.
// 7. Always cite specific references (book, chapter, verse) for scripture quotations.
// 8. Scholarly and historical context must be presented neutrally — if scholars disagree, say so.
// 9. Keep language accessible and clear — this is for a general educated audience, not specialists.
// 10. End every response with the standard educational disclaimer.

// TONE: Warm, thoughtful, scholarly, and genuinely respectful of all traditions explored.
// GOAL: Build bridges of understanding. Help people learn. Never inflame.`;

// // ─── Prompt builders ──────────────────────────────────────────────────────────

// function buildComparePrompt(query: string, traditions: string[]): string {
//   const traditionList = traditions.length > 0 ? traditions.join(", ") : "Christianity (Bible), Islam (Qur'an), and Judaism (Hebrew Bible / Tanakh)";

//   return `A user wants to understand the following topic across religious traditions: "${query}"

// Please provide a structured educational comparison across: ${traditionList}

// Return ONLY valid JSON (no markdown, no backticks):

// {
//   "topic": "<clear, neutral title for this topic>",
//   "introduction": "<2-3 sentence neutral overview of why this topic appears across traditions and its significance>",

//   "traditions": [
//     {
//       "tradition": "<tradition name>",
//       "text": "<full name of the primary text — e.g. 'The Bible (Old and New Testament)'>",
//       "emoji": "<single representative emoji — ✝️ for Christianity, ☪️ for Islam, ✡️ for Judaism>",
//       "accentColor": "<hex color — #3b82f6 for Christianity, #10b981 for Islam, #f59e0b for Judaism>",
//       "summary": "<2-3 sentences summarising this tradition's perspective on the topic. Use 'In this tradition...' framing.>",
//       "passages": [
//         {
//           "reference": "<Book Chapter:Verse or Surah:Ayah>",
//           "text": "<The passage text — keep under 50 words, use ... for long passages>",
//           "explanation": "<1-2 sentences explaining what this passage means in this tradition's interpretation>"
//         }
//       ],
//       "context": "<2-3 sentences of historical, cultural, or theological context for this tradition's understanding>",
//       "internalDiversity": "<1-2 sentences about different schools of thought or denominations within this tradition, if relevant>"
//     }
//   ],

//   "sharedConnections": [
//     {
//       "type": "<Shared Figure | Shared Theme | Parallel Story | Common Concept>",
//       "title": "<short title>",
//       "description": "<2-3 sentences describing the connection across traditions — e.g. 'All three traditions recognise Abraham/Ibrahim/Avraham as a patriarch. While the narrative varies...'>"
//     }
//   ],

//   "keyDifferences": [
//     {
//       "aspect": "<what aspect differs>",
//       "description": "<Neutral 2-3 sentence description of how traditions differ on this aspect. Never imply one is right.>"
//     }
//   ],

//   "historicalContext": "<3-4 sentences of broader historical and scholarly context about how these texts developed and why comparative study is valuable>",

//   "guidedQuestions": [
//     "<a thoughtful follow-up question a curious learner might ask>",
//     "<another question>",
//     "<another question>"
//   ],

//   "disclaimer": "This exploration is an educational summary for comparative study. It does not represent all interpretations within each tradition, and should not be taken as theological authority. Readers are encouraged to consult religious scholars, community leaders, and primary texts for deeper understanding."
// }

// Requirements:
// - Include 1-3 passages per tradition (more if the topic has rich scriptural depth)
// - sharedConnections: at minimum 1, up to 4
// - keyDifferences: at minimum 1, up to 4
// - Be specific — cite real references, real passages
// - If you are not certain of a specific verse reference, say "cf." before the reference and note that the exact location varies by edition
// - The 3 tradition accent colors must be exactly: Christianity #3b82f6, Islam #10b981, Judaism #f59e0b`;
// }

// function buildDeepDivePrompt(query: string): string {
//   return `A user wants a deep dive into: "${query}"

// Provide detailed educational commentary in JSON:

// {
//   "topic": "<title>",
//   "overview": "<comprehensive 4-5 sentence overview>",
//   "scholarlyPerspectives": [
//     {
//       "scholar": "<scholar name or school of thought>",
//       "tradition": "<which tradition this comes from>",
//       "insight": "<their perspective in 2-3 sentences>"
//     }
//   ],
//   "historicalEvolution": "<3-4 sentences on how understanding of this topic has evolved historically>",
//   "modernInterpretations": "<2-3 sentences on how contemporary communities engage with this topic>",
//   "furtherStudy": ["<recommended topic 1>", "<recommended topic 2>", "<recommended topic 3>"],
//   "disclaimer": "This is an educational summary for comparative study only."
// }`;
// }

// function buildFigurePrompt(figure: string): string {
//   return `A user wants to understand the religious figure "${figure}" across traditions.

// Return JSON:
// {
//   "figure": "<full name as used in the query>",
//   "namesAcrossTraditions": [
//     { "tradition": "Christianity", "name": "<name used>", "title": "<title/role>" },
//     { "tradition": "Islam",        "name": "<name used>", "title": "<title/role>" },
//     { "tradition": "Judaism",      "name": "<name used>", "title": "<title/role>" }
//   ],
//   "introduction": "<neutral 2-3 sentence introduction to the figure>",
//   "traditions": [
//     {
//       "tradition": "<name>",
//       "emoji": "<emoji>",
//       "accentColor": "<hex>",
//       "role": "<their role and significance in this tradition>",
//       "keyPassages": [{ "reference": "<ref>", "text": "<text>", "explanation": "<meaning>" }],
//       "uniqueAspects": "<what this tradition emphasises about this figure that others do not>",
//       "context": "<historical context>"
//     }
//   ],
//   "sharedElements": "<2-3 sentences on what all traditions share about this figure>",
//   "keyDifferences": [{ "aspect": "<aspect>", "description": "<neutral description>" }],
//   "guidedQuestions": ["<question>", "<question>", "<question>"],
//   "disclaimer": "Educational summary only. Does not represent all interpretations."
// }`;
// }

// // ─── Route handler ────────────────────────────────────────────────────────────

// export async function POST(req: NextRequest) {
//   try {
//     const {
//       query,
//       traditions = [],
//       mode       = "compare",
//     } = await req.json();

//     if (!query?.trim() || query.trim().length < 2) {
//       return NextResponse.json({ error: "Please enter a topic or question to explore" }, { status: 400 });
//     }

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//     const gate = await tokenGate(req, TOKEN_COST, { toolName: "Scripture Explorer" });
//     console.log(`[scripture-explorer/explore] Token gate result:`, gate);
//     if (!gate.ok) return gate.response; // sends 402 JSON to client
//     console.log(`[scripture-explorer/explore] Token gate passed for user ${gate.dbUserId} — proceeding with exploration`);


//     const cleanQuery = query.trim().slice(0, 500); // cap at 500 chars

//     let prompt: string;
//     switch (mode) {
//       case "deep-dive": prompt = buildDeepDivePrompt(cleanQuery);  break;
//       case "figure":    prompt = buildFigurePrompt(cleanQuery);    break;
//       default:          prompt = buildComparePrompt(cleanQuery, traditions);
//     }

//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 4000,
//       system:     SYSTEM_PROMPT,
//       messages:   [{ role: "user", content: prompt }],
//     });

//     const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//     const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

//     let result: any;
//     try { result = JSON.parse(clean); }
//     catch {
//       const match = clean.match(/\{[\s\S]+\}/);
//       if (!match) return NextResponse.json({ error: "Response parsing failed — please try again" }, { status: 500 });
//       result = JSON.parse(match[0]);
//     }

//     // Enforce disclaimer is present — belt-and-braces
//     if (!result.disclaimer) {
//       result.disclaimer = "This exploration is an educational summary for comparative study. It does not represent all interpretations within each tradition and should not be taken as theological authority.";
//     }

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//     await deductTokens(gate.dbUserId, TOKEN_COST, "scripture-explorer/explore", {
//       query,
//       traditions,
//       mode,
//     });
//     console.log(`[scripture-explorer/explore] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId}`);

//     return NextResponse.json({ ok: true, result, mode });
//   } catch (err: any) {
//     console.error("[scripture-explorer/explore]", err);
//     return NextResponse.json({ error: err.message ?? "Exploration failed — please try again" }, { status: 500 });
//   }
// }