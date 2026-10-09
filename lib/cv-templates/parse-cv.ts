// lib/cv-templates/parse-cv.ts
import { getClaudeCompletion } from "@/lib/ai/anthropic-client";
import { CVData } from "./types";

export async function parseCvToStructured(cvText: string): Promise<CVData> {
  const prompt = `Extract this CV into strict JSON matching this shape, nothing else:
{"fullName":"","title":"","email":"","phone":"","location":"","linkedin":"",
"summary":"","experience":[{"role":"","company":"","dates":"","bullets":[""]}],
"education":[{"degree":"","institution":"","dates":""}],"skills":[""]}
Leave fields "" or [] if not found. Do not invent data.
CV:\n${cvText.slice(0, 6000)}`;

  const { text } = await getClaudeCompletion(prompt, { maxTokens: 2000 });
  const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return { ...JSON.parse(clean), raw: cvText };
  } catch {
    // fallback: minimal structure so the template still renders something
    return { fullName: "Your Name", experience: [], education: [], skills: [], raw: cvText };
  }
}