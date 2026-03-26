// =============================================================================
// isaacpaha.com — Hub AI Assistant API
// app/api/admin/hub/assistant/route.ts
// POST { message, conversationId?, history? }
// Searches KB for relevant entries, builds context, calls Claude, saves conversation
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import Anthropic                     from "@anthropic-ai/sdk";
import { prismadb }                  from "@/lib/db";

// ─── Anthropic client ─────────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ─── Auth guard ───────────────────────────────────────────────────────────────

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM = `You are an AI assistant for Isaac Paha's personal Developer Knowledge Hub.

Your job is to answer technical questions by searching through Isaac's stored knowledge:
code snippets, AI prompts, terminal commands, error solutions, learning notes,
API references, architecture patterns, templates, playbooks, and saved resources.

Rules:
- Base your answers primarily on the KNOWLEDGE BASE ENTRIES provided in the user message.
- When you find relevant entries, mention them by name so Isaac knows where they came from.
- If no relevant entries are found, say so and suggest what Isaac could add to his KB.
- Be concise and practical. Format code with triple backticks and the language name.
- Do not invent information that is not in the provided entries.`;

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message, conversationId, history = [] } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const q = message.trim();

  // ── 1. Search KB ────────────────────────────────────────────────────────────
  const found = await prismadb.hubEntry.findMany({
    where: {
      OR: [
        { title:       { contains: q } },
        { description: { contains: q } },
        { content:     { contains: q } },
        { tags:        { contains: q } },
        { category:    { contains: q } },
        { solution:    { contains: q } },
        { endpointUrl: { contains: q } },
        { author:      { contains: q } },
        { technology:  { contains: q } },
        { framework:   { contains: q } },
      ],
    },
    take:    8,
    orderBy: { copyCount: "desc" },
    select:  {
      id: true, title: true, type: true,
      content: true, description: true, solution: true,
      category: true, language: true, technology: true,
    },
  });

  // ── 2. Build context block ──────────────────────────────────────────────────
  const contextBlock = found.length > 0
    ? "\n\nKNOWLEDGE BASE ENTRIES (use these to answer):\n\n" +
      found.map((e) => {
        const body = [e.description, e.content, e.solution]
          .filter(Boolean)
          .join("\n\n")
          .slice(0, 600);
        const meta = [e.category, e.language, e.technology].filter(Boolean).join(" · ");
        return `[${e.type}: "${e.title}"]${meta ? ` (${meta})` : ""}\n${body}`;
      }).join("\n\n---\n\n")
    : "\n\nNo directly matching entries found. Answer from general knowledge if possible, and suggest what Isaac could add to his KB.";

  // ── 3. Build messages ───────────────────────────────────────────────────────
  type HistoryMsg = { role: "user" | "assistant"; content: string };

  const messages: Anthropic.MessageParam[] = [
    ...history.slice(-6).map((m: HistoryMsg) => ({
      role:    m.role,
      content: m.content,
    })),
    {
      role:    "user",
      content: `${q}${contextBlock}`,
    },
  ];

  // ── 4. Call Claude ──────────────────────────────────────────────────────────
  let answer = "I couldn't generate a response right now. Please try again.";

  try {
    const response = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      system:     SYSTEM,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (textBlock && textBlock.type === "text") {
      answer = textBlock.text;
    }
    } catch (err: unknown) {
    console.error(
      "[hub/assistant] Claude error:",
      (typeof err === "object" && err !== null && "status" in err) ? (err as { status?: number }).status : undefined,
      (err instanceof Error ? err.message : String(err))
    );

    const status = typeof err === "object" && err !== null && "status" in err ? (err as { status?: number }).status : undefined;
    if (status === 401) {
      return NextResponse.json(
        { error: "Anthropic API key is missing or invalid. Set ANTHROPIC_API_KEY in your .env file." },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "AI generation failed. Please try again." },
      { status: 500 }
    );
  }

  // ── 5. Persist conversation ─────────────────────────────────────────────────
  const sources   = found.map((e) => ({ id: e.id, title: e.title, type: e.type }));
  const userMsg   = { id: crypto.randomUUID(), role: "user",      content: q,     timestamp: new Date().toISOString() };
  const assistMsg = { id: crypto.randomUUID(), role: "assistant", content: answer, sources, timestamp: new Date().toISOString() };

  let convId = conversationId;

  try {
    if (convId) {
      const conv = await prismadb.hubConversation.findUnique({ where: { id: convId } });
      if (conv) {
        const existing = JSON.parse(conv.messages || "[]");
        await prismadb.hubConversation.update({
          where: { id: convId },
          data:  { messages: JSON.stringify([...existing, userMsg, assistMsg]) },
        });
      }
    } else {
      const title = q.length > 60 ? q.slice(0, 60) + "…" : q;
      const conv  = await prismadb.hubConversation.create({
        data: {
          title,
          messages: JSON.stringify([userMsg, assistMsg]),
          context:  JSON.stringify(found.map((e) => e.id)),
        },
      });
      convId = conv.id;
    }
  } catch (dbErr: unknown) {
    // DB failure should not block the response
    if (dbErr && typeof dbErr === "object" && "message" in dbErr) {
      console.error("[hub/assistant] DB save error:", (dbErr as { message?: string }).message ?? dbErr);
    } else {
      console.error("[hub/assistant] DB save error:", dbErr);
    }
  }

  return NextResponse.json({
    answer,
    sources,
    conversationId: convId,
    title:          q.slice(0, 60),
  });
}