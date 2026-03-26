// =============================================================================
// isaacpaha.com — Now Page AI Draft API
// app/api/admin/now/draft/route.ts
//
// POST { mode, notes, month, year, existingContent? }
//   mode "draft"      → full Now entry draft from bullet notes
//   mode "refine"     → improve/polish existing draft
//   mode "section"    → write a single section (building/reading/thoughts/next)
//   mode "timeline"   → write a timeline event description from notes
//   mode "reflect"    → generate monthly reflection prompts for Isaac
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import Anthropic                     from "@anthropic-ai/sdk";

// ─── Anthropic client ─────────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { role: true },
  });
  return user?.role === "ADMIN";
}

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const ISAAC_VOICE = `You are writing as Isaac Paha — a First-Class Computing & IT graduate from The Open University, and founder of iPaha Ltd (UK), iPahaStores Ltd (UK), and Okpah Ltd (Ghana/West Africa).

Isaac's Now page is a personal, honest monthly snapshot — not a newsletter, not a press release. It reads like a smart, direct journal entry made public. His voice:
- Direct and honest. No preamble, no hype.
- First person throughout. Specific, not vague.
- Intellectually curious — connects observations across different domains
- Comfortable with uncertainty: "I'm not sure yet", "Still working this out"
- Warm but not performative — he cares about the work and the people, not the brand
- Dry wit occasionally. Not self-aggrandising.

The Now page has sections: what he's building, reading, thinking about, learning, listening to/watching, and what's coming next. Each section is 2-4 sentences per item — enough to be meaningful, not so long it becomes an essay.`;

function buildPrompt(
  mode: string, notes: string, month: number, year: number,
  section?: string, existingContent?: string
): string {
  const monthName = MONTH_NAMES[month] ?? "Unknown";

  switch (mode) {
    case "draft":
      return `${ISAAC_VOICE}

Write a full /now page entry for ${monthName} ${year} based on these raw notes from Isaac:

${notes}

Structure the output as a flowing piece with clear section breaks (use "### Building", "### Reading", "### Thinking About", "### Learning", "### What's Next" as headers). 

Rules:
- 2-4 sentences per item within each section — enough depth to be meaningful
- Include specific details from the notes, don't generalise
- Maintain the "honest snapshot" feel — some things aren't finished, some are uncertain, that's real
- The "Thinking About" section should have 2-3 distinct, substantive thoughts — not bullet points, short paragraphs
- "What's Next" should feel grounded in reality, not aspiration theatre
- Total length: 500-800 words`;

    case "refine":
      return `${ISAAC_VOICE}

Refine and improve this existing Now page entry for ${monthName} ${year}. Make it sharper, more specific, and more authentically Isaac's voice. Don't add new content — improve what's there.

Current draft:
${existingContent}

${notes ? `Additional context/notes:\n${notes}` : ""}

Return the improved version in full. Same structure, tighter prose.`;

    case "section":
      const sectionMap: Record<string, string> = {
        building: "What I'm Building",
        reading:  "What I'm Reading",
        thinking: "What I'm Thinking About",
        learning: "What I'm Learning",
        next:     "What's Coming Next",
        listening: "What I'm Listening To",
      };
      const sectionTitle = sectionMap[section ?? "building"] ?? "Current Focus";
      return `${ISAAC_VOICE}

Write the "${sectionTitle}" section of Isaac's /now page for ${monthName} ${year}.

Notes/inputs:
${notes}

Rules:
- 2-4 sentences per item (if multiple items)
- Specific, honest, first-person
- No bullet points — short prose paragraphs
- Include uncertainty where it exists ("Still figuring out", "Not sure yet")
- Length: 80-180 words for the whole section

Return only the section content (no section header needed).`;

    case "timeline":
      return `${ISAAC_VOICE}

Write a concise timeline event description for Isaac's personal journey timeline.

Event notes:
${notes}

Rules:
- 2-3 sentences maximum
- First person or third person — whichever reads more naturally for a timeline
- Include specific details (numbers, names, dates if given)
- Tone: honest, grounded, not boastful
- No preamble, just the description

Return only the description text.`;

    case "reflect":
      return `${ISAAC_VOICE}

Generate 5 thoughtful monthly reflection prompts for Isaac to answer when writing his ${monthName} ${year} Now page update. These should help him think clearly about what actually happened, what he learned, and what matters going forward.

Context about Isaac's current situation:
${notes || "Founder of 3 companies across UK and Ghana. Currently building okSumame (delivery), Paralel Me (AI productivity), and expanding oKadwuma."}

Make the prompts specific and useful — not generic "how are you feeling" questions. They should surface specific insights about building, thinking, and living.

Format: numbered list, 1-2 sentences each.`;

    default:
      return `${ISAAC_VOICE}\n\n${notes}`;
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { mode = "draft", notes, month, year, section, existingContent } = await req.json();

  if (!notes?.trim() && mode !== "reflect") {
    return NextResponse.json({ error: "Notes are required" }, { status: 400 });
  }

  const prompt = buildPrompt(
    mode,
    notes?.trim() ?? "",
    Number(month) || new Date().getMonth() + 1,
    Number(year)  || new Date().getFullYear(),
    section,
    existingContent,
  );

  try {
    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages:   [{ role: "user", content: prompt }],
    });

    const content = message.content[0]?.type === "text" ? message.content[0].text : "";
    return NextResponse.json({ content });
  } catch (err) {
    console.error("[now/draft]", err);
    return NextResponse.json({ error: "Failed to reach AI service" }, { status: 500 });
  }
}