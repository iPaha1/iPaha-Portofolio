// =============================================================================
// app/api/tools/job-tracker/ai/route.ts
// POST { mode, targetRole?, sector? }
//   "insights"   → personalised job search analysis
//   "interview"  → interview questions for target role
//   "motivation" → personalised encouragement
//   "next-steps" → what to do this week
// =============================================================================

import { NextRequest, NextResponse }  from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import Anthropic                      from "@anthropic-ai/sdk";
import { getApplicationStats, getOrCreateProfile } from "@/lib/tools/actions/job-tracker-actions";


const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to use AI coaching" }, { status: 401 });

  const { mode, targetRole, sector } = await req.json();

  const [stats, profile] = await Promise.all([
    getApplicationStats(),
    getOrCreateProfile(),
  ]);

  if (!stats && mode !== "interview") {
    return NextResponse.json({ content: "Log some applications first to get personalised insights!" });
  }

  let prompt = "";

  if (mode === "insights" && stats) {
    prompt = `You are a warm but honest career coach analysing a job seeker's data.

Their current stats:
- Total applications submitted: ${stats.total}
- Interview rate: ${stats.interviewRate}% (${stats.byStatus?.INTERVIEW ?? 0} interviews)
- Offer rate: ${stats.offerRate}% (${(stats.byStatus?.OFFER ?? 0) + (stats.byStatus?.ACCEPTED ?? 0)} offers)
- Rejections: ${stats.byStatus?.REJECTED ?? 0}
- Top sectors applied to: ${Object.entries(stats.bySector ?? {}).sort((a,b) => (b[1] as number) - (a[1] as number)).slice(0,4).map(([s,c]) => `${s} (${c})`).join(", ") || "varied"}
- Target role: ${profile?.targetRole ?? "not specified"}
- Status breakdown: ${JSON.stringify(stats.byStatus ?? {})}

Give 4 specific, actionable insights. Be warm, direct, and data-driven:
1. What their data shows is working (be specific)
2. The most impactful change they could make right now
3. A pattern worth paying attention to  
4. One concrete action to take today

Keep each point to 2-3 sentences. Be human — not corporate. No bullet sub-lists.`;
  }

  else if (mode === "interview") {
    const role = targetRole?.trim() || profile?.targetRole || "the target role";
    prompt = `Generate 10 likely interview questions for a ${role}${sector ? ` in ${sector}` : ""} role.

Format as a numbered list. Include:
- 3 behavioural questions (situation-based)
- 3 technical or role-specific questions
- 2 motivation/culture-fit questions
- 2 situational problem-solving questions

After each question, add a one-line tip: "Tip: ..."
Keep tips specific and actionable.`;
  }

  else if (mode === "motivation" && stats) {
    prompt = `Write a short, genuine motivational message (120-160 words) for a job seeker who has:
- Submitted ${stats.total} applications
- Had ${stats.byStatus?.INTERVIEW ?? 0} interviews
- Received ${stats.byStatus?.REJECTED ?? 0} rejections
- ${(stats.byStatus?.OFFER ?? 0) > 0 ? `Has ${stats.byStatus?.OFFER} offer(s) to consider` : "Still waiting for their break"}

Rules:
- Be genuine and specific — reference their actual numbers
- Don't use empty phrases like "keep pushing" or "you've got this"  
- Acknowledge the difficulty honestly before building them up
- End with one actionable thought, not a pep talk cliché
- Write as if you know them personally — warm but real`;
  }

  else if (mode === "next-steps" && stats) {
    prompt = `A job seeker has this job search data:
- ${stats.total} total applications
- ${stats.byStatus?.APPLIED ?? 0} awaiting response
- ${stats.byStatus?.INTERVIEW ?? 0} at interview stage
- ${stats.byStatus?.OFFER ?? 0} offers received
- ${stats.byStatus?.GHOSTED ?? 0} applications with no response (ghosted)
- Target role: ${profile?.targetRole ?? "unspecified"}

Give them 3 prioritised actions for this week. Be specific — not generic.
Number each clearly. 2 sentences max per action.
Think like a career coach who has 5 minutes with them.`;
  }

  else {
    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  }

  try {
    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 700,
      messages:   [{ role: "user", content: prompt }],
    });
    const text = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ content: text });
  } catch (err: any) {
    console.error("[job-tracker/ai]", err);
    return NextResponse.json({ error: "AI generation failed" }, { status: 500 });
  }
}