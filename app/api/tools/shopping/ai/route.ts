// =============================================================================
// isaacpaha.com — Shopping List AI API
// app/api/tools/shopping/ai/route.ts
//
// POST { mode, ... }
//   "meal_suggestions"  → generate a shopping list from a meal plan description
//   "smart_add"         → suggest items to add based on current list + history
//   "store_order"       → reorder items by supermarket aisle flow
//   "budget_tips"       → personalised tips to reduce spend
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "shopping-list-ai";
const TOKEN_COST = 50; // Reasonable token cost for shopping list generation
const TOOL_NAME = "Shopping List AI";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[shopping/ai] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[shopping/ai] Failed to load tool ID:`, err);
}

// Valid modes
type ShoppingMode = "meal_suggestions" | "smart_add" | "store_order" | "budget_tips";
const VALID_MODES: ShoppingMode[] = ["meal_suggestions", "smart_add", "store_order", "budget_tips"];

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
    console.error("[shopping/ai] JSON parse error after cleaning:", error.message);
    throw new Error(`Malformed JSON: ${error.message}`);
  }
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    console.log("[shopping/ai] Received request");
    
    // Read body once
    const body = await req.json();
    const { mode, items = [], meals, storeName, budget, people = 2 } = body;
    
    console.log(`[shopping/ai] Mode: ${mode}, Items: ${items.length}, People: ${people}`);

    // Validate mode
    if (!mode || !VALID_MODES.includes(mode as ShoppingMode)) {
      return NextResponse.json(
        { error: `Invalid mode. Valid modes: ${VALID_MODES.join(", ")}` },
        { status: 400 }
      );
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    console.log(`[shopping/ai] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[shopping/ai] Token gate passed for user ${gateResult.dbUserId}`);

    // Build prompt based on mode
    let prompt = "";

    if (mode === "meal_suggestions") {
      prompt = `You are a practical meal planner. Generate a complete shopping list for this request.

Request: "${meals ?? "5-day healthy meal plan for 2 people"}"
People: ${people}
Budget: ${budget ? `£${budget}` : "not specified"}
${storeName ? `Preferred store: ${storeName}` : ""}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")
- Ensure all strings are properly closed with quotes

Return EXACTLY this JSON structure:
{
  "title": "<friendly list name>",
  "items": [
    {
      "name": "<item name>",
      "quantity": <number>,
      "unit": "<kg|g|l|ml|pack|bunch|can|bottle|box|bag|piece>",
      "category": "<PRODUCE|DAIRY|MEAT_FISH|BAKERY|FROZEN|PANTRY|DRINKS|SNACKS|HOUSEHOLD|OTHER>",
      "estimatedPrice": <price in GBP or null>,
      "notes": "<optional: brand, variety, etc.>"
    }
  ],
  "estimatedTotal": <total GBP>,
  "mealPlan": ["<Day 1: Breakfast — ..., Lunch — ..., Dinner — ...>"]
}

Rules:
- Be specific and realistic (e.g. "free-range eggs" not just "eggs" when appropriate)
- Quantities should be right for ${people} people
- Include condiments and pantry staples people often forget
- Group logically — produce, proteins, dairy, pantry, household
- Provide 10-15 items for a standard weekly shop`;
    }

    else if (mode === "smart_add") {
      const itemNames = items.map((i: any) => i.name).join(", ");
      prompt = `You are a helpful shopping assistant. Look at this shopping list and suggest 5-8 commonly forgotten items that would complement it.

Current list items: ${itemNames || "empty list"}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")
- Ensure all strings are properly closed with quotes

Return EXACTLY this JSON structure:
{
  "suggestions": [
    {
      "name": "<item name>",
      "category": "<PRODUCE|DAIRY|MEAT_FISH|BAKERY|FROZEN|PANTRY|DRINKS|SNACKS|HOUSEHOLD|OTHER>",
      "reason": "<one-line reason — e.g. 'Often bought with pasta'>",
      "unit": "<kg|g|l|ml|pack>",
      "quantity": <number or null>
    }
  ]
}

Rules:
- Suggest practical, everyday items — not luxury items
- Focus on items commonly forgotten (sauces, seasoning, batteries, bin bags, etc.)
- Don't suggest items already on the list
- Maximum 8 suggestions
- Make reasons specific and helpful`;
    }

    else if (mode === "store_order") {
      const itemList = items.map((i: any, idx: number) => `${idx}. ${i.name} (${i.category ?? "OTHER"})`).join("\n");
      prompt = `You are a supermarket navigation expert. Reorder this shopping list to follow the typical flow of a ${storeName ?? "UK supermarket"} — minimising backtracking.

Typical UK supermarket layout: 
Entrance → Produce (fruit & veg) → Bakery → Deli/Meat/Fish → Dairy → Eggs → Frozen → Drinks → Snacks → Household/Cleaning → Pharmacy/Personal Care → Checkout

Current list:
${itemList}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Use proper JSON syntax

Return EXACTLY this JSON structure:
{
  "orderedIndices": [<array of original indices in the new order>],
  "aisleGroups": [
    { "aisle": "<aisle name>", "indices": [<indices>] }
  ]
}`;
    }

    else if (mode === "budget_tips") {
      const itemList = items.map((i: any) => `${i.name}${i.estimatedPrice ? ` (£${i.estimatedPrice})` : ""}`).join(", ");
      prompt = `You are a practical money-saving shopping expert. Analyse this shopping list and give 4-5 specific, actionable tips to reduce the spend.

Shopping list: ${itemList}
${budget ? `Budget: £${budget}` : ""}
${storeName ? `Store: ${storeName}` : ""}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")
- Ensure all strings are properly closed with quotes

Return EXACTLY this JSON structure:
{
  "tips": [
    {
      "tip": "<specific actionable tip>",
      "estimatedSaving": "<e.g. 'Save ~£3-5'>",
      "category": "<Swap Brand|Buy in Bulk|Seasonal|Reduce Quantity|Skip|Better Alternative>"
    }
  ],
  "estimatedSavingsTotal": "<e.g. £8-15>"
}

Rules:
- Be specific and actionable — not generic advice
- Reference actual items from the list when possible
- Provide realistic saving estimates
- Include 4-5 tips`;
    }

    // ── ② CALL ANTHROPIC API ──────────────────────────────────────────────
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      temperature: 0.3, // Lower temperature for consistent JSON
      messages: [{ role: "user", content: prompt }],
    });

    const processingMs = Date.now() - start;
    
    // Get raw response
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    console.log(`[shopping/ai] Raw response length: ${raw.length} chars`);
    
    // Log first 200 chars for debugging in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[shopping/ai] Response preview: ${raw.slice(0, 200)}...`);
    }

    // ── ③ PARSE JSON WITH ROBUST ERROR HANDLING ───────────────────────────
    let data: any;
    
    try {
      // First attempt with direct parsing and trailing comma removal
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');
      data = JSON.parse(noTrailing);
      console.log(`[shopping/ai] Successfully parsed JSON directly`);
    } catch (firstError: any) {
      console.warn(`[shopping/ai] Direct parse failed: ${firstError.message}`);
      
      try {
        // Second attempt with comprehensive cleaning
        data = cleanAndParseJSON(raw);
        console.log(`[shopping/ai] Successfully parsed JSON after cleaning`);
      } catch (secondError: any) {
        console.error(`[shopping/ai] All parsing attempts failed`);
        console.error(`[shopping/ai] Raw response (first 500 chars):`, raw.slice(0, 500));
        
        return NextResponse.json(
          { 
            error: "Shopping AI failed — AI returned malformed JSON",
            details: secondError.message,
            preview: raw.slice(0, 500)
          },
          { status: 500 }
        );
      }
    }

    // ── ④ VALIDATE RESPONSE STRUCTURE ─────────────────────────────────────
    if (mode === "meal_suggestions" && (!data.items || !Array.isArray(data.items))) {
      console.warn(`[shopping/ai] Missing items array in response`);
      data.items = [];
    }
    
    if (mode === "smart_add" && (!data.suggestions || !Array.isArray(data.suggestions))) {
      console.warn(`[shopping/ai] Missing suggestions array in response`);
      data.suggestions = [];
    }
    
    if (mode === "store_order" && (!data.orderedIndices || !Array.isArray(data.orderedIndices))) {
      console.warn(`[shopping/ai] Missing orderedIndices in response`);
      data.orderedIndices = [];
      data.aisleGroups = [];
    }
    
    if (mode === "budget_tips" && (!data.tips || !Array.isArray(data.tips))) {
      console.warn(`[shopping/ai] Missing tips array in response`);
      data.tips = [];
    }

    // ── ⑤ DEDUCT TOKENS — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "shopping-ai", {
      mode,
      itemsCount: items.length,
      processingMs,
      hasBudget: !!budget,
      hasStore: !!storeName,
    });
    console.log(`[shopping/ai] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId} for mode ${mode}`);

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
    console.log(`[shopping/ai] Tracked tool usage for user ${gateResult.dbUserId}`);

    // ── ⑦ RETURN SUCCESS RESPONSE ──────────────────────────────────────────
    return NextResponse.json({ 
      ok: true, 
      ...data,
      metadata: {
        mode,
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        itemsCount: items.length,
      }
    });
    
  } catch (err: any) {
    console.error("[shopping/ai] Error:", err);

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
      console.error("[shopping/ai] Failed to track error:", trackError);
    }
    
    // Return user-friendly error message
    return NextResponse.json(
      { 
        error: err.message ?? "Shopping AI failed",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}





// // =============================================================================
// // isaacpaha.com — Shopping List AI API
// // app/api/tools/shopping/ai/route.ts
// //
// // POST { mode, ... }
// //   "meal_suggestions"  → generate a shopping list from a meal plan description
// //   "smart_add"         → suggest items to add based on current list + history
// //   "store_order"       → reorder items by supermarket aisle flow
// //   "budget_tips"       → personalised tips to reduce spend
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { platform } from "os";
// import { deductTokens } from "@/lib/tokens/token-deduct";


// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// // Tool token cost for shopping list generation is around 200 tokens per request, which is ~£0.10 on the current pricing. Not super cheap but still reasonable for a helpful shopping assistant feature.
// const TOKEN_COST = 2000000000;

// // ─── ROUTE ───────────────────────────────────────────────────────────────────────────────
// export async function POST(req: NextRequest) {
//   try {
//     console.log("[shopping/ai] Received request with body:", await req.clone().text());

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//         const gate = await tokenGate(req, TOKEN_COST, { toolName: "Shopping List AI" });
//         console.log(`[shopping/ai] Token gate result:`, gate);
//         if (!gate.ok) return gate.response; // sends 402 JSON to client
//         console.log(`[shopping/ai] Token gate passed for user ${gate.userId}, proceeding with AI request.`);

//     // ── ② PROCESS REQUEST ───────────────────────────────────────────────────
//     const { mode, items = [], meals, storeName, budget, people = 2 } = await req.json();

//     let prompt = "";

//     if (mode === "meal_suggestions") {
//       prompt = `You are a practical meal planner. Generate a complete shopping list for this request.

// Request: "${meals ?? "5-day healthy meal plan for 2 people"}"
// People: ${people}
// Budget: ${budget ? `£${budget}` : "not specified"}
// ${storeName ? `Preferred store: ${storeName}` : ""}

// Return ONLY valid JSON (no markdown):
// {
//   "title": "<friendly list name>",
//   "items": [
//     {
//       "name": "<item name>",
//       "quantity": <number>,
//       "unit": "<kg|g|l|ml|pack|bunch|can|bottle|box|bag|piece|>",
//       "category": "<PRODUCE|DAIRY|MEAT_FISH|BAKERY|FROZEN|PANTRY|DRINKS|SNACKS|HOUSEHOLD|OTHER>",
//       "estimatedPrice": <price in GBP or null>,
//       "notes": "<optional: brand, variety, etc.>"
//     }
//   ],
//   "estimatedTotal": <total GBP>,
//   "mealPlan": ["<Day 1: Breakfast — ..., Lunch — ..., Dinner — ...>"]
// }

// Rules:
// - Be specific and realistic (e.g. "free-range eggs" not just "eggs" when appropriate)
// - Quantities should be right for ${people} people
// - Include condiments and pantry staples people often forget
// - Group logically — produce, proteins, dairy, pantry, household`;
//     }

//     else if (mode === "smart_add") {
//       const itemNames = items.map((i: any) => i.name).join(", ");
//       prompt = `You are a helpful shopping assistant. Look at this shopping list and suggest 5-8 commonly forgotten items that would complement it.

// Current list items: ${itemNames || "empty list"}

// Return ONLY valid JSON (no markdown):
// {
//   "suggestions": [
//     {
//       "name": "<item name>",
//       "category": "<PRODUCE|DAIRY|MEAT_FISH|BAKERY|FROZEN|PANTRY|DRINKS|SNACKS|HOUSEHOLD|OTHER>",
//       "reason": "<one-line reason — e.g. 'Often bought with pasta'>",
//       "unit": "<kg|g|l|ml|pack|>",
//       "quantity": <number or null>
//     }
//   ]
// }

// Rules:
// - Suggest practical, everyday items — not luxury items
// - Focus on items commonly forgotten (sauces, seasoning, batteries, bin bags, etc.)
// - Don't suggest items already on the list
// - Maximum 8 suggestions`;
//     }

//     else if (mode === "store_order") {
//       const itemList = items.map((i: any, idx: number) => `${idx}. ${i.name} (${i.category ?? "OTHER"})`).join("\n");
//       prompt = `You are a supermarket navigation expert. Reorder this shopping list to follow the typical flow of a ${storeName ?? "UK supermarket"} — minimising backtracking.

// Typical UK supermarket layout: 
// Entrance → Produce (fruit & veg) → Bakery → Deli/Meat/Fish → Dairy → Eggs → Frozen → Drinks → Snacks → Household/Cleaning → Pharmacy/Personal Care → Checkout

// Current list:
// ${itemList}

// Return ONLY valid JSON:
// {
//   "orderedIndices": [<array of original indices in the new order>],
//   "aisleGroups": [
//     { "aisle": "<aisle name>", "indices": [<indices>] }
//   ]
// }`;
//     }

//     else if (mode === "budget_tips") {
//       const itemList = items.map((i: any) => `${i.name}${i.estimatedPrice ? ` (£${i.estimatedPrice})` : ""}`).join(", ");
//       prompt = `You are a practical money-saving shopping expert. Analyse this shopping list and give 4-5 specific, actionable tips to reduce the spend.

// Shopping list: ${itemList}
// ${budget ? `Budget: £${budget}` : ""}
// ${storeName ? `Store: ${storeName}` : ""}

// Return ONLY valid JSON:
// {
//   "tips": [
//     {
//       "tip": "<specific actionable tip>",
//       "estimatedSaving": "<e.g. 'Save ~£3-5'>",
//       "category": "<Swap Brand|Buy in Bulk|Seasonal|Reduce Quantity|Skip|Better Alternative>"
//     }
//   ],
//   "estimatedSavingsTotal": "<e.g. £8-15>"
// }`;
//     }

//     else {
//       return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
//     }

//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 2000,
//       messages:   [{ role: "user", content: prompt }],
//     });

//     const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//     const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

//     let data: any;
//     const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');  // removes , before ] or }

//     try {
//       data = JSON.parse(noTrailing);
//     } catch {
//       const match = noTrailing.match(/\{[\s\S]+\}/);
//       if (match) {
//         try {
//           data = JSON.parse(match[0]);
//         } catch (e2) {
//           console.error("[shopping/ai] Still failed after regex", e2);
//         }
//       }
//     }

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//         await deductTokens(gate.dbUserId, TOKEN_COST, "shopping-ai", {
//           mode, platform: platform(), itemsCount: items.length,
//         });
//         console.log(`[shopping/ai] Deducted ${TOKEN_COST} tokens from user ${gate.userId} for mode ${mode}.`);
        

//     return NextResponse.json({ ok: true, ...data });
//   } catch (err: any) {
//     console.error("[shopping/ai]", err);
//     return NextResponse.json({ error: err.message ?? "AI failed" }, { status: 500 });
//   }
// }