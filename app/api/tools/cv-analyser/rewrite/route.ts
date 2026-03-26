// =============================================================================
// isaacpaha.com — CV Analyser: Section Rewrite API
// app/api/tools/cv-analyser/rewrite/route.ts
//
// POST { section, content, jobDescription?, targetRole? }
//   Returns improved version of a specific CV section
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { section, content, jobDescription, targetRole, mode = "improve" } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    const prompts: Record<string, string> = {
      improve: `You are an expert CV writer. Rewrite this ${section} section to be stronger, more impactful, and professional.
${jobDescription ? `Target job: ${jobDescription.slice(0, 500)}` : ""}
${targetRole ? `Target role: ${targetRole}` : ""}

Original ${section}:
${content}

Rules for the rewrite:
- Use strong action verbs (Led, Built, Delivered, Achieved, Drove, Implemented)
- Add quantified achievements where possible (%, £, numbers)
- Remove passive language and weak phrases like "responsible for" or "helped with"
- Keep it concise but impactful
- Match the tone to the target role/sector

Return ONLY the improved text — no labels, no explanation.`,

      full_rewrite: `You are a senior CV consultant. Rewrite this entire CV section by section, optimising for:
${jobDescription ? `- The target job description\n` : ""}${targetRole ? `- The role: ${targetRole}\n` : ""}- ATS compatibility
- Strong impact language
- Quantified achievements
- Professional structure

Original CV:
${content.slice(0, 4000)}

Return the fully rewritten CV as clean, well-formatted text. No JSON. No labels like "Here is your rewritten CV:".`,

      tailor: `You are a CV tailoring specialist. Take this CV and tailor it specifically for this job description.

Job Description:
${(jobDescription ?? "").slice(0, 1000)}

CV:
${content.slice(0, 3000)}

Rules:
- Highlight experience most relevant to the JD
- Mirror keywords from the JD naturally
- Reorder bullet points to lead with most relevant experience
- Adjust the professional summary to align with the role

Return ONLY the tailored CV text.`,
    };

    const prompt = prompts[mode] ?? prompts.improve;

    const message = await anthropic.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 3000,
      messages:   [{ role: "user", content: prompt }],
    });

    const result = message.content[0].type === "text" ? message.content[0].text : "";
    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    console.error("[cv-analyser/rewrite]", err);
    return NextResponse.json({ error: err.message ?? "Rewrite failed" }, { status: 500 });
  }
}

