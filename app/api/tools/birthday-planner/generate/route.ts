// =============================================================================
// isaacpaha.com — AI Kids Birthday Planner — Generate Plan API
// app/api/tools/birthday-planner/generate/route.ts
//
// POST { childName, childAge, ageGroup, theme, numKids, budgetRange,
//        budgetAmount, country, city, indoor, restrictions, specialNotes }
//
// Returns a complete PartyPlan JSON consumed by the planner tool.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });


// Tool token costs (in tokens per request)
const TOKEN_COST = 4000; // Adjust based on expected response length and model pricing

const BUDGET_LABEL: Record<string, string> = {
  low:    "£50–£100 (keep it fun and affordable — lots of DIY ideas)",
  medium: "£100–£300 (solid party, good mix of bought and DIY)",
  high:   "£300+ (premium — entertainers, full decor, quality catering welcome)",
};

const AGE_NOTES: Record<string, string> = {
  "3-5":  "very short attention spans (5-10 min per activity), simple rules, no elimination games, lots of movement, gentle music",
  "6-8":  "can follow rules, love competition but need encouragement, 15-20 min activities, team games work well",
  "9-12": "longer attention spans, love challenges and strategy, can handle complex games, music tastes matter more",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      childName, childAge, ageGroup = "6-8", theme, customTheme,
      numKids = 10, budgetRange = "medium", budgetAmount,
      country = "UK", city = "",
      indoor = true, restrictions = [], specialNotes = "",
    } = body;

    if (!childName?.trim() || !theme?.trim()) {
      return NextResponse.json({ error: "childName and theme are required" }, { status: 400 });
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
        const gate = await tokenGate(req, TOKEN_COST, { toolName: "Birthday Planner" });
    console.log(`[birthday-planner/generate] Token gate result:`, gate);
    if (!gate.ok) return gate.response; // sends 402 JSON to client
    console.log(`[birthday-planner/generate] Token gate passed for user ${gate.dbUserId}, proceeding with plan generation.`);

    // if (isNaN(childAge) || childAge < 1 || childAge > 18) {
    //   return NextResponse.json({ error: "childAge must be a number between 1 and 18" }, { status: 400 });
    // }
    // if (isNaN(numKids) || numKids < 1 || numKids > 50) {
    //   return NextResponse.json({ error: "numKids must be a number between 1 and 50" }, { status: 400 });
    // }
    // if (budgetAmount && (isNaN(budgetAmount) || budgetAmount < 10)) {
    //   return NextResponse.json({ error: "budgetAmount must be a number greater than 10" }, { status: 400 });
    // }
    // if (!["low", "medium", "high"].includes(budgetRange)) {
    //   return NextResponse.json({ error: "budgetRange must be one of low, medium, high" }, { status: 400 });
    // }
    // if (typeof indoor !== "boolean") {
    //   return NextResponse.json({ error: "indoor must be a boolean" }, { status: 400 });
    // }
    // if (restrictions && !Array.isArray(restrictions)) {
    //   return NextResponse.json({ error: "restrictions must be an array of strings" }, { status: 400 });
    // }
    // if (specialNotes && typeof specialNotes !== "string") {
    //   return NextResponse.json({ error: "specialNotes must be a string" }, { status: 400 });
    // }
    // if (!ageGroup.match(/^\d{1,2}-\d{1,2}$/)) {
    //   return NextResponse.json({ error: "ageGroup must be in format 'X-Y' (e.g. '6-8')" }, { status: 400 });
    // }

    const effectiveTheme = customTheme?.trim() || theme;
    const locationStr    = city ? `${city}, ${country}` : country;
    const restrictionStr = Array.isArray(restrictions) && restrictions.length
      ? restrictions.join(", ") : "none";

    const prompt = `You are a professional children's party planner with 15 years experience. Plan the most memorable, age-appropriate birthday party.

PARTY DETAILS:
- Child: ${childName}, turning ${childAge}
- Theme: ${effectiveTheme}
- Age group of guests: ${ageGroup} years old
- Number of kids: ${numKids}
- Location: ${locationStr} (${indoor ? "INDOOR" : "OUTDOOR"})
- Budget: ${BUDGET_LABEL[budgetRange] ?? "medium budget"}${budgetAmount ? ` (exactly £${budgetAmount})` : ""}
- Restrictions/preferences: ${restrictionStr}
- Special notes: ${specialNotes || "none"}

Age-appropriate guidance: ${AGE_NOTES[ageGroup] ?? AGE_NOTES["6-8"]}

Return ONLY valid JSON (no markdown, no text outside JSON):

{
  "overview": {
    "theme": "${effectiveTheme}",
    "tagline": "<exciting one-line description of the party vibe>",
    "duration": "<e.g. 2 hours>",
    "vibe": "<e.g. high-energy adventure | calm and creative | mix of silly and sweet>",
    "colourScheme": ["<colour 1>", "<colour 2>", "<colour 3>"],
    "decorationIdeas": ["<specific decoration 1>", "<specific decoration 2>", "<specific decoration 3>", "<4>", "<5>"]
  },

  "schedule": [
    {
      "time": "<e.g. 2:00 PM>",
      "duration": "<e.g. 15 min>",
      "title": "<activity or moment name>",
      "description": "<what happens — be specific>",
      "type": "<arrival | icebreaker | game | food | cake | craft | free-play | goodbye>"
    }
  ],

  "activities": [
    {
      "name": "<activity name>",
      "duration": "<e.g. 15 min>",
      "description": "<how to run it>",
      "materials": ["<item>"],
      "ageNote": "<why this works for ${ageGroup} year olds>",
      "budgetTip": "<cost-saving tip or free alternative>",
      "energyLevel": "<low | medium | high>"
    }
  ],

  "food": {
    "mainFood": [
      { "item": "<food item>", "servings": "<e.g. 1 per child>", "allergyNote": "<allergy info or empty string>", "tip": "<prep or serving tip>" }
    ],
    "snacks": [
      { "item": "<snack>", "allergyNote": "<or empty>" }
    ],
    "cake": {
      "suggestion": "<cake idea that fits the theme>",
      "serves": ${numKids + 5},
      "diyTip": "<how to make it simpler/cheaper>",
      "alternatives": ["<cupcake alternative>", "<cake pop alternative>"]
    },
    "drinks": ["<drink 1>", "<drink 2>"],
    "allergySwaps": ["<allergy-safe swap 1>", "<swap 2>"]
  },

  "partyBags": {
    "budgetPerBag": "<e.g. £3–£5 per bag>",
    "items": [
      { "item": "<party bag item>", "diy": <true|false>, "tip": "<where to buy or how to make it>" }
    ],
    "theme": "<how to theme the bag itself>",
    "eco": "<eco-friendly alternative to plastic bags>"
  },

  "music": {
    "vibe": "<e.g. upbeat pop, Disney classics, current kids charts>",
    "suggestedSongs": [
      { "title": "<song title>", "artist": "<artist>", "moment": "<when to play — arrival | games | cake | free-play>" }
    ],
    "playlist": "<Spotify playlist name or style to search for>",
    "tip": "<music tip for the age group>"
  },

  "checklist": [
    {
      "category": "<invites | food | decorations | activities | on-the-day | general>",
      "text": "<checklist item>",
      "weeksBefore": <number — weeks before party to do this>
    }
  ],

  "budget": {
    "total": <estimated total in GBP as a number — no £ sign>,
    "breakdown": [
      { "category": "<e.g. Food & Cake>", "amount": <number>, "tips": "<saving tip>" }
    ],
    "savingTips": ["<specific saving tip 1>", "<tip 2>", "<tip 3>"]
  },

  "inviteMessage": "<beautiful, themed invitation message the host can copy — include time, date placeholders like [DATE] [TIME] [VENUE]>",

  "hostTips": [
    "<practical tip for running the party 1>",
    "<tip 2>",
    "<tip 3>"
  ],

  "emergencyKit": ["<item to have ready just in case 1>", "<item 2>", "<item 3>"],

  "viralMoment": "<one shareable/memorable moment idea that parents will talk about>"
}

RULES:
- Schedule MUST have 8-12 entries covering the full party duration
- Activities: 4-6 age-appropriate activities — be specific about how to run them
- Food: allergy-aware — never suggest nuts unless restrictions say nuts are OK
- Checklist: 12-18 items covering all categories, realistic time windows
- Budget total must be realistic for ${BUDGET_LABEL[budgetRange]}
- Music: 8-10 song suggestions, specific real songs that exist, appropriate for ${ageGroup} year olds
- Everything tailored to ${locationStr} cultural context`;

    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 6000,
      messages:   [{ role: "user", content: prompt }],
    });

    const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let plan: any;
    try { plan = JSON.parse(clean); }
    catch {
      const match = clean.match(/\{[\s\S]+\}/);
      if (!match) return NextResponse.json({ error: "Plan generation failed — please try again" }, { status: 500 });
      try { plan = JSON.parse(match[0]); }
      catch { return NextResponse.json({ error: "Could not parse plan — please try again" }, { status: 500 }); }
    }

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
        await deductTokens(gate.dbUserId, TOKEN_COST, "birthday-planner/generate", { ...body, userId: gate.dbUserId });
    console.log(`[birthday-planner/generate] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for plan generation.`);
    

    return NextResponse.json({ ok: true, plan });
  } catch (err: any) {
    console.error("[birthday-planner/generate]", err);
    return NextResponse.json({ error: err.message ?? "Generation failed" }, { status: 500 });
  }
}