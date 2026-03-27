// =============================================================================
// isaacpaha.com — Token Gate Utility
// lib/token-gate.ts
//
// Drop-in server-side check for any tool API route.
// Usage:
//   import { tokenGate } from "@/lib/token-gate";
//
//   export async function POST(req: NextRequest) {
//     const gate = await tokenGate(req, 200); // 200 = token cost
//     if (!gate.ok) return gate.response;     // returns 402 JSON the client reads
//     // ...your existing logic
//   }
//
// The 402 response payload:
//   { error: "insufficient_tokens", required: number, balance: number,
//     userId: string, toolName?: string }
// =============================================================================

import { auth }        from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "../db";

export type GateResult =
  | {
      ok:       true,
      userId:   string,         // Clerk user ID (for downstream use)
      dbUserId: string,         // DB row ID
      balance:  number,
    }
  | {
      ok:       false,
      response: NextResponse,   // Ready-made 401 or 402 response to return immediately
    };

export interface TokenGateOptions {
  /** Human-readable tool name included in the 402 response */
  toolName?:   string;
  /** If true, a missing / unauthenticated user returns 401, not 402 */
  requireAuth?: boolean;
}

/**
 * Check the current Clerk user has at least `requiredTokens` in their wallet.
 * Returns { ok: true, userId, dbUserId, balance } on success,
 * or { ok: false, response } with a ready-made NextResponse on failure.
 */
export async function tokenGate(
  _req:           NextRequest,
  requiredTokens: number,
  options:        TokenGateOptions = {},
): Promise<GateResult> {
  const { toolName, requireAuth = true } = options;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const { userId: clerkId } = await auth();
  console.log(`[tokenGate] Auth check — Clerk user ID: ${clerkId}`);

  if (!clerkId) {
    if (requireAuth) {
      return {
        ok:       false,
        response: NextResponse.json(
          { error: "unauthenticated", message: "Sign in to use this tool." },
          { status: 401 },
        ),
      };
    }
    // Non-auth tools: pass through (e.g. free/public tools)
    return { ok: true, userId: "", dbUserId: "", balance: Infinity } as GateResult;
  }

  // ── Resolve DB user ───────────────────────────────────────────────────────
  let dbUser = await prismadb.user.findUnique({
    where:  { clerkId },
    select: { id: true },
  });
  console.log(`[tokenGate] Authenticated user ${clerkId} — DB lookup result:`, dbUser);

  if (!dbUser) {
    // Lazy-create in case syncUser hasn't run yet
    dbUser = await prismadb.user.create({
      data:   { clerkId, email: "", displayName: "" },
      select: { id: true },
    });
    console.log(`[tokenGate] No DB user for Clerk ID ${clerkId} — created new DB user with ID ${dbUser.id}`);
  }

  // ── Wallet ────────────────────────────────────────────────────────────────
  let wallet = await prismadb.tokenWallet.findUnique({
    where:  { userId: dbUser.id },
    select: { balance: true },
  });
  console.log(`[tokenGate] User ${dbUser.id} — Wallet lookup result:`, wallet);

  if (!wallet) {
    // Bootstrap wallet with 100 welcome tokens
    wallet = await prismadb.tokenWallet.create({
      data:   { userId: dbUser.id, balance: 100 },
      select: { balance: true },
    });
  }

  const balance = wallet.balance;
  console.log(`[tokenGate] User ${dbUser.id} — Wallet balance: ${balance} tokens, Required: ${requiredTokens} tokens`);

  // ── Insufficient tokens ───────────────────────────────────────────────────
  if (balance < requiredTokens) {
    return {
      ok:       false,
      response: NextResponse.json(
        {
          error:    "insufficient_tokens",
          required: requiredTokens,
          balance,
          userId:   clerkId,
          dbUserId: dbUser.id,
          toolName: toolName ?? null,
        },
        { status: 402 },
      ),
    };
  }

  console.log(`[tokenGate] User ${dbUser.id} — Token gate passed — proceeding`);

  return {
    ok:       true,
    userId:   clerkId,
    dbUserId: dbUser.id,
    balance,
  } as GateResult;
}