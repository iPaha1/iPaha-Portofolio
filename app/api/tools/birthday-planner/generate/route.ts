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
import Anthropic from "@anthropic-ai/sdk";
import { tokenGate } from "@/lib/tokens/token-gate";
import { deductTokens } from "@/lib/tokens/token-deduct";
import { getIpFromRequest, trackToolUsage } from "@/lib/tools/track-tool-usage";
import { prismadb } from "@/lib/db";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const ToolSlug = "birthday-planner";
const TOKEN_COST = 120; // Reasonable token cost for comprehensive party planning
const TOOL_NAME = "Birthday Planner";

// Get tool ID from DB
let TOOL_ID = "unknown-tool-id";
try {
  const ToolId = await prismadb.tool.findUnique({
    where: { slug: ToolSlug },
    select: { id: true },
  });
  TOOL_ID = ToolId?.id ?? "unknown-tool-id";
  console.log(`[birthday-planner/generate] Loaded tool ID: ${TOOL_ID} for slug: ${ToolSlug}`);
} catch (err) {
  console.error(`[birthday-planner/generate] Failed to load tool ID:`, err);
}

const BUDGET_LABEL: Record<string, string> = {
  low: "£50–£100 (keep it fun and affordable — lots of DIY ideas)",
  medium: "£100–£300 (solid party, good mix of bought and DIY)",
  high: "£300+ (premium — entertainers, full decor, quality catering welcome)",
};

const AGE_NOTES: Record<string, string> = {
  "3-5": "very short attention spans (5-10 min per activity), simple rules, no elimination games, lots of movement, gentle music",
  "6-8": "can follow rules, love competition but need encouragement, 15-20 min activities, team games work well",
  "9-12": "longer attention spans, love challenges and strategy, can handle complex games, music tastes matter more",
};

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

// Generate fallback plan
function generateFallbackPlan(body: any): any {
  const effectiveTheme = body.customTheme?.trim() || body.theme;
  const numKids = Math.min(Math.max(body.numKids || 10, 1), 50);
  
  return {
    overview: {
      theme: effectiveTheme,
      tagline: `A wonderful ${effectiveTheme} birthday party for ${body.childName || "your child"}!`,
      duration: "2 hours",
      vibe: "Fun and memorable",
      colourScheme: ["#FFB6C1", "#FFD700", "#98FB98"],
      decorationIdeas: ["Balloons", "Banners", "Table decorations"],
    },
    schedule: [
      { time: "2:00 PM", duration: "15 min", title: "Welcome", description: "Greet guests as they arrive", type: "arrival" },
      { time: "2:15 PM", duration: "30 min", title: "Party Games", description: "Fun icebreaker games", type: "game" },
      { time: "2:45 PM", duration: "15 min", title: "Food Time", description: "Enjoy party snacks", type: "food" },
      { time: "3:00 PM", duration: "15 min", title: "Cake", description: "Sing Happy Birthday", type: "cake" },
      { time: "3:15 PM", duration: "15 min", title: "Activities", description: "Crafts or activities", type: "craft" },
      { time: "3:30 PM", duration: "15 min", title: "Free Play", description: "Kids play together", type: "free-play" },
      { time: "3:45 PM", duration: "15 min", title: "Party Bags", description: "Distribute party bags", type: "goodbye" },
    ],
    activities: [
      { name: "Party Games", duration: "20-30 min", description: "Classic party games", materials: ["Basic game supplies"], ageNote: "Adaptable for all ages", budgetTip: "Use household items", energyLevel: "high" },
    ],
    food: {
      mainFood: [{ item: "Sandwiches", servings: "1 per child", allergyNote: "Check allergies", tip: "Prepare in advance" }],
      snacks: [{ item: "Crisps", allergyNote: "Check for allergies" }],
      cake: { suggestion: `${effectiveTheme} themed cake`, serves: numKids + 5, diyTip: "Bake simple cake and decorate", alternatives: ["Cupcakes", "Cake pops"] },
      drinks: ["Juice", "Water"],
      allergySwaps: ["Gluten-free options", "Dairy-free alternatives"],
    },
    partyBags: {
      budgetPerBag: "£2-3 per bag",
      items: [{ item: "Small toy", diy: false, tip: "Buy in bulk" }, { item: "Sweet treats", diy: true, tip: "Homemade cookies" }],
      theme: `${effectiveTheme} themed bag`,
      eco: "Paper bags or reusable fabric bags",
    },
    music: {
      vibe: "Upbeat kids' music",
      suggestedSongs: [{ title: "Happy Birthday", artist: "Traditional", moment: "cake" }],
      playlist: "Kids Party Playlist",
      tip: "Keep volume moderate",
    },
    checklist: [
      { category: "invites", text: "Send invitations", weeksBefore: 3 },
      { category: "food", text: "Order cake", weeksBefore: 1 },
      { category: "decorations", text: "Buy decorations", weeksBefore: 1 },
      { category: "activities", text: "Prepare games", weeksBefore: 1 },
    ],
    budget: {
      total: 150,
      breakdown: [{ category: "Food & Cake", amount: 80, tips: "Shop for deals" }],
      savingTips: ["DIY decorations", "Make your own cake", "Buy in bulk"],
    },
    inviteMessage: `🎉 You're invited to ${body.childName || "my"} ${body.childAge || ""}th birthday party!\n\nTheme: ${effectiveTheme}\nDate: [DATE]\nTime: [TIME]\nVenue: [VENUE]\n\nPlease RSVP by [DATE]`,
    hostTips: ["Arrive early to set up", "Have extra supplies ready", "Keep the schedule flexible"],
    emergencyKit: ["First aid kit", "Wipes", "Extra snacks", "Spare clothes"],
    viralMoment: "A group photo with themed props",
  };
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let gateResult = null;
  
  try {
    const body = await req.json();
    const {
      childName, childAge, ageGroup = "6-8", theme, customTheme,
      numKids = 10, budgetRange = "medium", budgetAmount,
      country = "UK", city = "",
      indoor = true, restrictions = [], specialNotes = "",
    } = body;

    // Validate required fields
    if (!childName?.trim()) {
      return NextResponse.json({ error: "childName is required" }, { status: 400 });
    }
    
    if (!theme?.trim() && !customTheme?.trim()) {
      return NextResponse.json({ error: "theme is required" }, { status: 400 });
    }

    // Validate age
    const parsedAge = parseInt(childAge);
    if (isNaN(parsedAge) || parsedAge < 1 || parsedAge > 18) {
      return NextResponse.json({ error: "childAge must be a number between 1 and 18" }, { status: 400 });
    }

    // Validate numKids
    const parsedNumKids = parseInt(numKids);
    if (isNaN(parsedNumKids) || parsedNumKids < 1 || parsedNumKids > 50) {
      return NextResponse.json({ error: "numKids must be a number between 1 and 50" }, { status: 400 });
    }

    // Validate budget
    if (budgetAmount && (isNaN(parseFloat(budgetAmount)) || parseFloat(budgetAmount) < 10)) {
      return NextResponse.json({ error: "budgetAmount must be a number greater than 10" }, { status: 400 });
    }

    // Validate budgetRange
    const validBudgetRanges = ["low", "medium", "high"];
    if (!validBudgetRanges.includes(budgetRange)) {
      return NextResponse.json({ error: "budgetRange must be one of low, medium, high" }, { status: 400 });
    }

    // Validate ageGroup format
    const ageGroupPattern = /^\d{1,2}-\d{1,2}$/;
    if (!ageGroupPattern.test(ageGroup)) {
      return NextResponse.json({ error: "ageGroup must be in format 'X-Y' (e.g. '6-8')" }, { status: 400 });
    }

    // Validate restrictions is array
    if (restrictions && !Array.isArray(restrictions)) {
      return NextResponse.json({ error: "restrictions must be an array of strings" }, { status: 400 });
    }

    // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
    gateResult = await tokenGate(req, TOKEN_COST, { toolName: TOOL_NAME });
    console.log(`[birthday-planner/generate] Token gate result:`, gateResult);
    
    if (!gateResult.ok) {
      return gateResult.response;
    }
    
    console.log(`[birthday-planner/generate] Token gate passed for user ${gateResult.dbUserId}`);

    const effectiveTheme = customTheme?.trim() || theme;
    const locationStr = city ? `${city}, ${country}` : country;
    const restrictionStr = Array.isArray(restrictions) && restrictions.length
      ? restrictions.join(", ") : "none";

    const prompt = `You are a professional children's party planner with 15 years experience. Plan the most memorable, age-appropriate birthday party.

PARTY DETAILS:
- Child: ${childName}, turning ${parsedAge}
- Theme: ${effectiveTheme}
- Age group of guests: ${ageGroup} years old
- Number of kids: ${parsedNumKids}
- Location: ${locationStr} (${indoor ? "INDOOR" : "OUTDOOR"})
- Budget: ${BUDGET_LABEL[budgetRange] ?? "medium budget"}${budgetAmount ? ` (exactly £${budgetAmount})` : ""}
- Restrictions/preferences: ${restrictionStr}
- Special notes: ${specialNotes || "none"}

Age-appropriate guidance: ${AGE_NOTES[ageGroup] ?? AGE_NOTES["6-8"]}

CRITICAL JSON FORMATTING RULES:
- Return ONLY a valid JSON object - no other text
- Do NOT use trailing commas in arrays or objects
- Escape all double quotes inside strings with backslashes (\\")
- Ensure all strings are properly closed with quotes

Return EXACTLY this JSON structure:

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
      "serves": ${parsedNumKids + 5},
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
      model: "claude-sonnet-4-20250514",
      max_tokens: 6000,
      temperature: 0.4, // Slightly higher for creative party ideas
      messages: [{ role: "user", content: prompt }],
    });

    const processingMs = Date.now() - start;
    
    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    
    let plan: any;
    try {
      const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      const noTrailing = clean.replace(/,\s*([\]}])/g, '$1');
      plan = JSON.parse(noTrailing);
    } catch (firstError) {
      try {
        plan = cleanAndParseJSON(raw);
      } catch (secondError) {
        console.error(`[birthday-planner/generate] All parsing attempts failed`);
        console.error(`[birthday-planner/generate] Raw response (first 500 chars):`, raw.slice(0, 500));
        plan = generateFallbackPlan(body);
      }
    }

    // Validate required fields in plan
    if (!plan.overview) plan.overview = {};
    if (!plan.schedule) plan.schedule = [];
    if (!plan.activities) plan.activities = [];
    if (!plan.food) plan.food = {};
    if (!plan.partyBags) plan.partyBags = {};
    if (!plan.music) plan.music = {};
    if (!plan.checklist) plan.checklist = [];
    if (!plan.budget) plan.budget = {};
    if (!plan.inviteMessage) plan.inviteMessage = `🎉 You're invited to ${childName}'s birthday party!`;
    if (!plan.hostTips) plan.hostTips = [];
    if (!plan.emergencyKit) plan.emergencyKit = [];
    if (!plan.viralMoment) plan.viralMoment = "A memorable moment for photos";

    // Ensure budget total is a number
    if (plan.budget.total && typeof plan.budget.total === "string") {
      plan.budget.total = parseFloat(plan.budget.total);
    }

    // Ensure schedule has enough entries
    if (plan.schedule.length < 6) {
      plan.schedule = generateFallbackPlan(body).schedule;
    }

    // ── ② DEDUCT tokens — only after successful AI response ─────────────────
    await deductTokens(gateResult.dbUserId, TOKEN_COST, "birthday-planner/generate", {
      childAge: parsedAge,
      ageGroup,
      theme: effectiveTheme,
      numKids: parsedNumKids,
      budgetRange,
      location: locationStr,
      processingMs,
    });
    console.log(`[birthday-planner/generate] Deducted ${TOKEN_COST} tokens from user ${gateResult.dbUserId}`);

    // ── ③ TRACK USAGE ───────────────────────────────────────────────────────
    await trackToolUsage({
      toolId: TOOL_ID,
      toolName: TOOL_NAME,
      userId: gateResult.dbUserId,
      ipAddress: getIpFromRequest(req),
      processingMs,
      tokenCost: TOKEN_COST,
      wasSuccess: true,
    });
    console.log(`[birthday-planner/generate] Tracked tool usage for user ${gateResult.dbUserId}`);

    return NextResponse.json({ 
      ok: true, 
      plan,
      metadata: {
        processingTimeMs: processingMs,
        tokensUsed: TOKEN_COST,
        theme: effectiveTheme,
        ageGroup,
        numKids: parsedNumKids,
        budgetRange,
      }
    });
  } catch (err: any) {
    console.error("[birthday-planner/generate] Error:", err);

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
      console.error("[birthday-planner/generate] Failed to track error:", trackError);
    }
    
    return NextResponse.json(
      { 
        error: err.message ?? "Generation failed",
        type: err.name ?? "UnknownError"
      },
      { status: 500 }
    );
  }
}






// // =============================================================================
// // isaacpaha.com — AI Kids Birthday Planner — Generate Plan API
// // app/api/tools/birthday-planner/generate/route.ts
// //
// // POST { childName, childAge, ageGroup, theme, numKids, budgetRange,
// //        budgetAmount, country, city, indoor, restrictions, specialNotes }
// //
// // Returns a complete PartyPlan JSON consumed by the planner tool.
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import Anthropic                     from "@anthropic-ai/sdk";
// import { tokenGate } from "@/lib/tokens/token-gate";
// import { deductTokens } from "@/lib/tokens/token-deduct";

// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });


// // Tool token costs (in tokens per request)
// const TOKEN_COST = 4000000000000000; // Adjust based on expected response length and model pricing

// const BUDGET_LABEL: Record<string, string> = {
//   low:    "£50–£100 (keep it fun and affordable — lots of DIY ideas)",
//   medium: "£100–£300 (solid party, good mix of bought and DIY)",
//   high:   "£300+ (premium — entertainers, full decor, quality catering welcome)",
// };

// const AGE_NOTES: Record<string, string> = {
//   "3-5":  "very short attention spans (5-10 min per activity), simple rules, no elimination games, lots of movement, gentle music",
//   "6-8":  "can follow rules, love competition but need encouragement, 15-20 min activities, team games work well",
//   "9-12": "longer attention spans, love challenges and strategy, can handle complex games, music tastes matter more",
// };

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const {
//       childName, childAge, ageGroup = "6-8", theme, customTheme,
//       numKids = 10, budgetRange = "medium", budgetAmount,
//       country = "UK", city = "",
//       indoor = true, restrictions = [], specialNotes = "",
//     } = body;

//     if (!childName?.trim() || !theme?.trim()) {
//       return NextResponse.json({ error: "childName and theme are required" }, { status: 400 });
//     }

//     // ── ① TOKEN GATE — check BEFORE doing any AI work ──────────────────────
//         const gate = await tokenGate(req, TOKEN_COST, { toolName: "Birthday Planner" });
//     console.log(`[birthday-planner/generate] Token gate result:`, gate);
//     if (!gate.ok) return gate.response; // sends 402 JSON to client
//     console.log(`[birthday-planner/generate] Token gate passed for user ${gate.dbUserId}, proceeding with plan generation.`);

//     // if (isNaN(childAge) || childAge < 1 || childAge > 18) {
//     //   return NextResponse.json({ error: "childAge must be a number between 1 and 18" }, { status: 400 });
//     // }
//     // if (isNaN(numKids) || numKids < 1 || numKids > 50) {
//     //   return NextResponse.json({ error: "numKids must be a number between 1 and 50" }, { status: 400 });
//     // }
//     // if (budgetAmount && (isNaN(budgetAmount) || budgetAmount < 10)) {
//     //   return NextResponse.json({ error: "budgetAmount must be a number greater than 10" }, { status: 400 });
//     // }
//     // if (!["low", "medium", "high"].includes(budgetRange)) {
//     //   return NextResponse.json({ error: "budgetRange must be one of low, medium, high" }, { status: 400 });
//     // }
//     // if (typeof indoor !== "boolean") {
//     //   return NextResponse.json({ error: "indoor must be a boolean" }, { status: 400 });
//     // }
//     // if (restrictions && !Array.isArray(restrictions)) {
//     //   return NextResponse.json({ error: "restrictions must be an array of strings" }, { status: 400 });
//     // }
//     // if (specialNotes && typeof specialNotes !== "string") {
//     //   return NextResponse.json({ error: "specialNotes must be a string" }, { status: 400 });
//     // }
//     // if (!ageGroup.match(/^\d{1,2}-\d{1,2}$/)) {
//     //   return NextResponse.json({ error: "ageGroup must be in format 'X-Y' (e.g. '6-8')" }, { status: 400 });
//     // }

//     const effectiveTheme = customTheme?.trim() || theme;
//     const locationStr    = city ? `${city}, ${country}` : country;
//     const restrictionStr = Array.isArray(restrictions) && restrictions.length
//       ? restrictions.join(", ") : "none";

//     const prompt = `You are a professional children's party planner with 15 years experience. Plan the most memorable, age-appropriate birthday party.

// PARTY DETAILS:
// - Child: ${childName}, turning ${childAge}
// - Theme: ${effectiveTheme}
// - Age group of guests: ${ageGroup} years old
// - Number of kids: ${numKids}
// - Location: ${locationStr} (${indoor ? "INDOOR" : "OUTDOOR"})
// - Budget: ${BUDGET_LABEL[budgetRange] ?? "medium budget"}${budgetAmount ? ` (exactly £${budgetAmount})` : ""}
// - Restrictions/preferences: ${restrictionStr}
// - Special notes: ${specialNotes || "none"}

// Age-appropriate guidance: ${AGE_NOTES[ageGroup] ?? AGE_NOTES["6-8"]}

// Return ONLY valid JSON (no markdown, no text outside JSON):

// {
//   "overview": {
//     "theme": "${effectiveTheme}",
//     "tagline": "<exciting one-line description of the party vibe>",
//     "duration": "<e.g. 2 hours>",
//     "vibe": "<e.g. high-energy adventure | calm and creative | mix of silly and sweet>",
//     "colourScheme": ["<colour 1>", "<colour 2>", "<colour 3>"],
//     "decorationIdeas": ["<specific decoration 1>", "<specific decoration 2>", "<specific decoration 3>", "<4>", "<5>"]
//   },

//   "schedule": [
//     {
//       "time": "<e.g. 2:00 PM>",
//       "duration": "<e.g. 15 min>",
//       "title": "<activity or moment name>",
//       "description": "<what happens — be specific>",
//       "type": "<arrival | icebreaker | game | food | cake | craft | free-play | goodbye>"
//     }
//   ],

//   "activities": [
//     {
//       "name": "<activity name>",
//       "duration": "<e.g. 15 min>",
//       "description": "<how to run it>",
//       "materials": ["<item>"],
//       "ageNote": "<why this works for ${ageGroup} year olds>",
//       "budgetTip": "<cost-saving tip or free alternative>",
//       "energyLevel": "<low | medium | high>"
//     }
//   ],

//   "food": {
//     "mainFood": [
//       { "item": "<food item>", "servings": "<e.g. 1 per child>", "allergyNote": "<allergy info or empty string>", "tip": "<prep or serving tip>" }
//     ],
//     "snacks": [
//       { "item": "<snack>", "allergyNote": "<or empty>" }
//     ],
//     "cake": {
//       "suggestion": "<cake idea that fits the theme>",
//       "serves": ${numKids + 5},
//       "diyTip": "<how to make it simpler/cheaper>",
//       "alternatives": ["<cupcake alternative>", "<cake pop alternative>"]
//     },
//     "drinks": ["<drink 1>", "<drink 2>"],
//     "allergySwaps": ["<allergy-safe swap 1>", "<swap 2>"]
//   },

//   "partyBags": {
//     "budgetPerBag": "<e.g. £3–£5 per bag>",
//     "items": [
//       { "item": "<party bag item>", "diy": <true|false>, "tip": "<where to buy or how to make it>" }
//     ],
//     "theme": "<how to theme the bag itself>",
//     "eco": "<eco-friendly alternative to plastic bags>"
//   },

//   "music": {
//     "vibe": "<e.g. upbeat pop, Disney classics, current kids charts>",
//     "suggestedSongs": [
//       { "title": "<song title>", "artist": "<artist>", "moment": "<when to play — arrival | games | cake | free-play>" }
//     ],
//     "playlist": "<Spotify playlist name or style to search for>",
//     "tip": "<music tip for the age group>"
//   },

//   "checklist": [
//     {
//       "category": "<invites | food | decorations | activities | on-the-day | general>",
//       "text": "<checklist item>",
//       "weeksBefore": <number — weeks before party to do this>
//     }
//   ],

//   "budget": {
//     "total": <estimated total in GBP as a number — no £ sign>,
//     "breakdown": [
//       { "category": "<e.g. Food & Cake>", "amount": <number>, "tips": "<saving tip>" }
//     ],
//     "savingTips": ["<specific saving tip 1>", "<tip 2>", "<tip 3>"]
//   },

//   "inviteMessage": "<beautiful, themed invitation message the host can copy — include time, date placeholders like [DATE] [TIME] [VENUE]>",

//   "hostTips": [
//     "<practical tip for running the party 1>",
//     "<tip 2>",
//     "<tip 3>"
//   ],

//   "emergencyKit": ["<item to have ready just in case 1>", "<item 2>", "<item 3>"],

//   "viralMoment": "<one shareable/memorable moment idea that parents will talk about>"
// }

// RULES:
// - Schedule MUST have 8-12 entries covering the full party duration
// - Activities: 4-6 age-appropriate activities — be specific about how to run them
// - Food: allergy-aware — never suggest nuts unless restrictions say nuts are OK
// - Checklist: 12-18 items covering all categories, realistic time windows
// - Budget total must be realistic for ${BUDGET_LABEL[budgetRange]}
// - Music: 8-10 song suggestions, specific real songs that exist, appropriate for ${ageGroup} year olds
// - Everything tailored to ${locationStr} cultural context`;

//     const message = await anthropic.messages.create({
//       model:      "claude-sonnet-4-20250514",
//       max_tokens: 6000,
//       messages:   [{ role: "user", content: prompt }],
//     });

//     const raw   = message.content[0].type === "text" ? message.content[0].text : "{}";
//     const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

//     let plan: any;
//     try { plan = JSON.parse(clean); }
//     catch {
//       const match = clean.match(/\{[\s\S]+\}/);
//       if (!match) return NextResponse.json({ error: "Plan generation failed — please try again" }, { status: 500 });
//       try { plan = JSON.parse(match[0]); }
//       catch { return NextResponse.json({ error: "Could not parse plan — please try again" }, { status: 500 }); }
//     }

//     // ── ② DEDUCT tokens — only after successful AI response ─────────────────
//         await deductTokens(gate.dbUserId, TOKEN_COST, "birthday-planner/generate", { ...body, userId: gate.dbUserId });
//     console.log(`[birthday-planner/generate] Deducted ${TOKEN_COST} tokens from user ${gate.dbUserId} for plan generation.`);
    

//     return NextResponse.json({ ok: true, plan });
//   } catch (err: any) {
//     console.error("[birthday-planner/generate]", err);
//     return NextResponse.json({ error: err.message ?? "Generation failed" }, { status: 500 });
//   }
// }