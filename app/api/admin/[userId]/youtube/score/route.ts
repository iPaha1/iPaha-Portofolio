// =============================================================================
// app/api/admin/[userId]/youtube/score/route.ts
// POST — AI script quality scoring
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { buildScriptScorePrompt, parseAiJson } from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-prompts";

const MODEL = "claude-sonnet-4-20250514";

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { script, title } = await req.json();
    if (!script || !title) {
      return NextResponse.json({ error: "script and title are required" }, { status: 400 });
    }

    const prompt = buildScriptScorePrompt(script, title);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) throw new Error(`AI error: ${response.status}`);
    const data = await response.json();
    const text = data.content
      ?.map((b: { type: string; text?: string }) => (b.type === "text" ? b.text : ""))
      .join("") ?? "";

    const score = parseAiJson<{
      overallScore: number; hookStrength: number; clarity: number;
      originality: number; deliverability: number; seoStrength: number;
      feedback: string; topStrengths: string[]; improvements: string[];
    }>(text);

    return NextResponse.json({ data: score });
  } catch (error) {
    console.error("[youtube/score POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}




// // =============================================================================
// // app/api/admin/[userId]/youtube/score/route.ts
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@clerk/nextjs/server";
// import { buildScriptScorePrompt, parseAiJson } from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-prompts";

// export async function POST_SCORE(req: NextRequest, { params }: { params: { userId: string } }) {
//   try {
//     const { userId: clerkId } = await auth();
//     if (!clerkId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
//     const body = await req.json();

//     const Scrore = buildScriptScorePrompt;
//     const AiJson = parseAiJson;

//     const prompt = buildScriptScorePrompt(body.script, body.title);
//     const response = await fetch("https://api.anthropic.com/v1/messages", {
//       method: "POST",
//       headers: { "Content-Type": "application/json", "anthropic-version": "2023-06-01" },
//       body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800, messages: [{ role: "user", content: prompt }] }),
//     });
//     const data = await response.json();
//     const text = data.content?.map((b: { type: string; text?: string }) => b.type === "text" ? b.text : "").join("") ?? "";
//     return NextResponse.json({ data: parseAiJson(text) });
//   } catch (error) {
//     return NextResponse.json({ error: "Internal server error" }, { status: 500 });
//   }
// }
 