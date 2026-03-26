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
import Anthropic                     from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { mode, items = [], meals, storeName, budget, people = 2 } = await req.json();

    let prompt = "";

    if (mode === "meal_suggestions") {
      prompt = `You are a practical meal planner. Generate a complete shopping list for this request.

Request: "${meals ?? "5-day healthy meal plan for 2 people"}"
People: ${people}
Budget: ${budget ? `£${budget}` : "not specified"}
${storeName ? `Preferred store: ${storeName}` : ""}

Return ONLY valid JSON (no markdown):
{
  "title": "<friendly list name>",
  "items": [
    {
      "name": "<item name>",
      "quantity": <number>,
      "unit": "<kg|g|l|ml|pack|bunch|can|bottle|box|bag|piece|>",
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
- Group logically — produce, proteins, dairy, pantry, household`;
    }

    else if (mode === "smart_add") {
      const itemNames = items.map((i: any) => i.name).join(", ");
      prompt = `You are a helpful shopping assistant. Look at this shopping list and suggest 5-8 commonly forgotten items that would complement it.

Current list items: ${itemNames || "empty list"}

Return ONLY valid JSON (no markdown):
{
  "suggestions": [
    {
      "name": "<item name>",
      "category": "<PRODUCE|DAIRY|MEAT_FISH|BAKERY|FROZEN|PANTRY|DRINKS|SNACKS|HOUSEHOLD|OTHER>",
      "reason": "<one-line reason — e.g. 'Often bought with pasta'>",
      "unit": "<kg|g|l|ml|pack|>",
      "quantity": <number or null>
    }
  ]
}

Rules:
- Suggest practical, everyday items — not luxury items
- Focus on items commonly forgotten (sauces, seasoning, batteries, bin bags, etc.)
- Don't suggest items already on the list
- Maximum 8 suggestions`;
    }

    else if (mode === "store_order") {
      const itemList = items.map((i: any, idx: number) => `${idx}. ${i.name} (${i.category ?? "OTHER"})`).join("\n");
      prompt = `You are a supermarket navigation expert. Reorder this shopping list to follow the typical flow of a ${storeName ?? "UK supermarket"} — minimising backtracking.

Typical UK supermarket layout: 
Entrance → Produce (fruit & veg) → Bakery → Deli/Meat/Fish → Dairy → Eggs → Frozen → Drinks → Snacks → Household/Cleaning → Pharmacy/Personal Care → Checkout

Current list:
${itemList}

Return ONLY valid JSON:
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

Return ONLY valid JSON:
{
  "tips": [
    {
      "tip": "<specific actionable tip>",
      "estimatedSaving": "<e.g. 'Save ~£3-5'>",
      "category": "<Swap Brand|Buy in Bulk|Seasonal|Reduce Quantity|Skip|Better Alternative>"
    }
  ],
  "estimatedSavingsTotal": "<e.g. £8-15>"
}`;
    }

    else {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let data: any;
    const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');  // removes , before ] or }

    try {
      data = JSON.parse(noTrailing);
    } catch {
      const match = noTrailing.match(/\{[\s\S]+\}/);
      if (match) {
        try {
          data = JSON.parse(match[0]);
        } catch (e2) {
          console.error("[shopping/ai] Still failed after regex", e2);
        }
      }
    }

    return NextResponse.json({ ok: true, ...data });
  } catch (err: any) {
    console.error("[shopping/ai]", err);
    return NextResponse.json({ error: err.message ?? "AI failed" }, { status: 500 });
  }
}