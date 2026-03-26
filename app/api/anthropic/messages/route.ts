// =============================================================================
// isaacpaha.com — Anthropic Messages Proxy
// app/api/anthropic/messages/route.ts
// Proxies requests from client-side tool components to Anthropic API.
// Rate limited — only Anthropic API key needed on server.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import Anthropic                     from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { model = "claude-sonnet-4-20250514", max_tokens = 1500, messages, system } = body;

    if (!messages?.length) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model,
      max_tokens,
      messages,
      ...(system ? { system } : {}),
    });

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[anthropic/messages]", err);
    return NextResponse.json({ error: err.message ?? "Anthropic API error" }, { status: 500 });
  }
}