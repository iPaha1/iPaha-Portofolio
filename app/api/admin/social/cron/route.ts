import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { prismadb }                  from "@/lib/db";
import {
  getSocialCronSettings, saveSocialCronSettings,
  getSocialCronHistory, saveSocialCronHistory,
  getConnections, createSocialPost, gatherContextForAI,
} from "@/lib/actions/social-actions";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

const ISAAC_KNOWLEDGE_BASE = `Isaac Paha — founder of iPaha Ltd (UK), iPahaStores Ltd (UK), Okpah Ltd (Ghana).
Products: oKadwuma jobs platform (8,500+ users), okDdwa e-commerce (₵280k GMV/mo), okSika fintech (3,400 beta users),
okSumame delivery (building), Paralel Me AI assistant (1,200 beta users), iPahaStore marketplace (340+ vendors, £180k GMV/mo).

Expert in: African tech ecosystem, mobile money leapfrogging, fintech for the underbanked, last-mile logistics,
solo founding, AI productivity, UK-Ghana dual business context, Open University education.

Strong opinions: Africa will produce the next great tech companies within 15 years. Trust, not payments,
is the core problem in African e-commerce. Most AI productivity tools optimise the wrong variable.
Building for emerging markets requires rethinking assumptions from first principles.`;

async function generateSocialPost(platform: string, context: string, topic: string): Promise<string> {
  const PLATFORM_RULES: Record<string, { charLimit: number; style: string }> = {
    TWITTER:  { charLimit: 280,  style: "Punchy, direct, opinionated. One strong idea. Hook first." },
    LINKEDIN: { charLimit: 1500, style: "Professional but personal. Story → insight → takeaway." },
    FACEBOOK: { charLimit: 1000, style: "Conversational, warm. Personal anecdotes work well." },
    INSTAGRAM: { charLimit: 800, style: "Visual hook. Story format. Hashtags at bottom." },
    THREADS:  { charLimit: 500,  style: "Casual opinions and short takes." },
  };

  const rules = PLATFORM_RULES[platform] ?? PLATFORM_RULES.TWITTER;
  const prompt = `You are writing a social media post for Isaac Paha's ${platform} account.

${ISAAC_KNOWLEDGE_BASE}

${context}

Write ONE post about: ${topic}

Platform rules: ${rules.style} Max ${rules.charLimit} chars.

Write in Isaac's voice — direct, specific, grounded in real experience. No generic startup-speak.
Return ONLY the post text.`;

  const message = await anthropic.messages.create({
    model:      "claude-sonnet-4-20250514",
    max_tokens: 600,
    messages:   [{ role: "user", content: prompt }],
  });
  return message.content[0].type === "text" ? message.content[0].text.trim() : "";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [settings, history] = await Promise.all([getSocialCronSettings(), getSocialCronHistory()]);
  return NextResponse.json({ settings, history });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, settings: newSettings } = await req.json();

  if (action === "configure" && newSettings) {
    await saveSocialCronSettings(newSettings);
    return NextResponse.json({ ok: true, settings: newSettings });
  }

  if (action === "run") {
    const [settings, history, connections] = await Promise.all([
      getSocialCronSettings(), getSocialCronHistory(), getConnections(),
    ]);

    const activePlatforms = ((settings as any)?.platforms ?? ["TWITTER", "LINKEDIN"])
      .filter((p: string) => connections.some((c: any) => c.platform === p && c.isActive));

    if (!activePlatforms.length) {
      return NextResponse.json({ error: "No active connected platforms configured for cron" }, { status: 400 });
    }

    const topics: string[] = (settings as any)?.topics ?? ["Building in Africa", "AI for founders", "Solo founding insights"];
    const topic = topics[history.length % topics.length] ?? topics[0];

    const runId     = `run_${Date.now()}`;
    const startedAt = new Date().toISOString();
    const created:  any[] = [];

    try {
      const context = await gatherContextForAI();

      for (const platform of activePlatforms) {
        const connection = connections.find((c: any) => c.platform === platform && c.isActive);
        if (!connection) continue;

        const content = await generateSocialPost(platform, context, topic);
        const post    = await createSocialPost({
          connectionId: connection.id,
          platform,
          content,
          status: (settings as any)?.autoPublish ? "published" : "draft",
        });
        created.push({ platform, postId: post.id, preview: content.slice(0, 80) });
      }

      const newHistory = [{
        id: runId, startedAt, completedAt: new Date().toISOString(),
        topic, platforms: activePlatforms, status: "success", created,
      }, ...(history as any[])];
      await saveSocialCronHistory(newHistory);
      await saveSocialCronSettings({ ...(settings as object), lastRun: new Date().toISOString() });

      return NextResponse.json({ ok: true, topic, created, runId });
    } catch (err: any) {
      const newHistory = [{
        id: runId, startedAt, completedAt: new Date().toISOString(),
        topic, platforms: activePlatforms, status: "error", error: err.message,
      }, ...(history as any[])];
      await saveSocialCronHistory(newHistory);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}