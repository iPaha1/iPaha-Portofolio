// =============================================================================
// isaacpaha.com — Prompt Architect — Save / Workspace API
// app/api/tools/prompt-architect/save/route.ts
//
// GET    → fetch saved prompts + workspace
// POST   → save a prompt project
// DELETE ?id=xxx → delete
// PATCH  ?id=xxx&action=star|notes|title|tags|incrementCopy
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ projects: [], workspace: null });

  const [projects, workspace] = await Promise.all([
    prismadb.promptProject.findMany({
      where:   { userId: user.id, isSaved: true },
      orderBy: { updatedAt: "desc" },
      take:    50,
    }),
    prismadb.promptWorkspace.findUnique({ where: { userId: user.id } }),
  ]);

  return NextResponse.json({ projects, workspace });
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to save" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json();
  const { rawIdea, category, targetModel, techniques, result, title } = body;

  if (!result) return NextResponse.json({ error: "result required" }, { status: 400 });

  const count = await prismadb.promptProject.count({ where: { userId: user.id, isSaved: true } });
  if (count >= 50) {
    return NextResponse.json({ error: "50 saved prompts limit reached. Delete an older one first." }, { status: 429 });
  }

  const CATEGORY_MAP: Record<string, string> = {
    CODING_APP: "CODING_APP", WRITING_CONTENT: "WRITING_CONTENT", IMAGE_GENERATION: "IMAGE_GENERATION",
    BUSINESS_STRATEGY: "BUSINESS_STRATEGY", DATA_ANALYSIS: "DATA_ANALYSIS", CREATIVE_FICTION: "CREATIVE_FICTION",
    RESEARCH: "RESEARCH", VIDEO_SCRIPT: "VIDEO_SCRIPT", EDUCATION_TEACHING: "EDUCATION_TEACHING",
    PRODUCTIVITY: "PRODUCTIVITY", ROLEPLAY_PERSONA: "ROLEPLAY_PERSONA", GENERAL: "GENERAL",
  };
  const MODEL_MAP: Record<string, string> = {
    CLAUDE: "CLAUDE", CHATGPT_GPT4: "CHATGPT_GPT4", GEMINI: "GEMINI", MIDJOURNEY: "MIDJOURNEY",
    DALL_E: "DALL_E", STABLE_DIFFUSION: "STABLE_DIFFUSION", LLAMA: "LLAMA",
    MISTRAL: "MISTRAL", PERPLEXITY: "PERPLEXITY", ANY: "ANY",
  };
  const QUALITY_MAP: Record<string, string> = {
    POOR: "POOR", BASIC: "BASIC", DECENT: "DECENT", STRONG: "STRONG", EXPERT: "EXPERT",
  };

  const saved = await prismadb.promptProject.create({
    data: {
      userId:          user.id,
      rawIdea:         (rawIdea ?? "").slice(0, 2000),
      category:        (CATEGORY_MAP[category] ?? "GENERAL") as any,
      targetModel:     (MODEL_MAP[targetModel] ?? "ANY") as any,
      techniques:      JSON.stringify(Array.isArray(techniques) ? techniques : []),
      generatedPrompt: (result.mainPrompt?.userPrompt ?? result.prompt ?? "").slice(0, 10000),
      systemPrompt:    (result.mainPrompt?.systemPrompt ?? null)?.slice(0, 5000),
      negativePrompt:  (result.mainPrompt?.negativePrompt ?? null)?.slice(0, 2000),
      resultJson:      JSON.stringify(result),
      qualityScore:    result.qualityScore ?? null,
      qualityLabel:    (QUALITY_MAP[result.qualityLabel] ?? null) as any,
      title:           (title ?? result.title ?? rawIdea?.slice(0, 80) ?? "Prompt").slice(0, 300),
      isSaved:         true,
    },
  });

  await upsertWorkspace(user.id, category, targetModel, techniques);
  return NextResponse.json({ ok: true, projectId: saved.id });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prismadb.promptProject.deleteMany({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sp     = new URL(req.url).searchParams;
  const id     = sp.get("id");
  const action = sp.get("action");
  const body   = await req.json();

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  if (action === "star") {
    await prismadb.promptProject.updateMany({ where: { id, userId: user.id }, data: { isStarred: body.isStarred } });
  } else if (action === "notes") {
    await prismadb.promptProject.updateMany({ where: { id, userId: user.id }, data: { notes: body.notes ?? null } });
  } else if (action === "title") {
    await prismadb.promptProject.updateMany({ where: { id, userId: user.id }, data: { title: body.title?.slice(0, 300) ?? null } });
  } else if (action === "tags") {
    await prismadb.promptProject.updateMany({ where: { id, userId: user.id }, data: { tags: JSON.stringify(body.tags ?? []) } });
  } else if (action === "incrementCopy") {
    await prismadb.promptProject.updateMany({ where: { id, userId: user.id }, data: { useCount: { increment: 1 } } });
    await prismadb.promptWorkspace.updateMany({ where: { userId: user.id }, data: { totalCopied: { increment: 1 } } });
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}

// ─── Workspace upsert ─────────────────────────────────────────────────────────
async function upsertWorkspace(userId: string, category: string, model: string, techniques: string | string[]) {
  const existing = await prismadb.promptWorkspace.findUnique({ where: { userId } });
  const techArr  = Array.isArray(techniques) ? techniques : [];

  if (!existing) {
    await prismadb.promptWorkspace.create({
      data: {
        userId,
        totalGenerated:  1,
        xpPoints:        25,
        streakDays:      1,
        lastActivityDate: new Date(),
        categoriesJson:  JSON.stringify([{ category, count: 1 }]),
        modelsJson:      JSON.stringify([{ model, count: 1 }]),
        techniquesJson:  JSON.stringify(techArr.map(t => ({ technique: t, count: 1 }))),
      },
    });
    return;
  }

  // Update categories
  let categories: { category: string; count: number }[] = [];
  try { categories = JSON.parse(existing.categoriesJson ?? "[]"); } catch {}
  const foundCat = categories.find(c => c.category === category);
  if (foundCat) foundCat.count += 1;
  else categories.push({ category, count: 1 });

  // Update models
  let models: { model: string; count: number }[] = [];
  try { models = JSON.parse(existing.modelsJson ?? "[]"); } catch {}
  const foundModel = models.find(m => m.model === model);
  if (foundModel) foundModel.count += 1;
  else models.push({ model, count: 1 });

  // Update techniques
  let techList: { technique: string; count: number }[] = [];
  try { techList = JSON.parse(existing.techniquesJson ?? "[]"); } catch {}
  for (const t of techArr) {
    const found = techList.find(x => x.technique === t);
    if (found) found.count += 1;
    else techList.push({ technique: t, count: 1 });
  }

  const lastDate  = existing.lastActivityDate ? new Date(existing.lastActivityDate) : null;
  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const lastDay   = lastDate ? new Date(lastDate) : null;
  if (lastDay) lastDay.setHours(0, 0, 0, 0);
  const diffDays  = lastDay ? Math.floor((today.getTime() - lastDay.getTime()) / 86400000) : 999;
  const newStreak = diffDays === 0 ? existing.streakDays : diffDays === 1 ? existing.streakDays + 1 : 1;

  await prismadb.promptWorkspace.update({
    where: { userId },
    data: {
      totalGenerated:  { increment: 1 },
      xpPoints:        { increment: 25 + (newStreak > 1 ? 5 : 0) },
      streakDays:      newStreak,
      lastActivityDate: new Date(),
      categoriesJson:  JSON.stringify(categories),
      modelsJson:      JSON.stringify(models),
      techniquesJson:  JSON.stringify(techList),
    },
  });
}