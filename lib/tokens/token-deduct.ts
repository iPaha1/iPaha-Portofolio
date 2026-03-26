// =============================================================================
// isaacpaha.com — Token Deduct Utility
// lib/token-deduct.ts
//
// Call AFTER a successful AI generation to deduct tokens from the user's wallet
// and record the transaction.
//
// Usage:
//   import { deductTokens } from "@/lib/token-deduct";
//
//   // Inside your route, after the AI call succeeds:
//   await deductTokens(dbUserId, 200, "chemistry-engine/explain", {
//     level: "gcse", mode: "full"
//   });
//
// Safe to fire-and-forget (it won't throw to the caller):
//   deductTokens(...).catch(console.error);
// =============================================================================

import { prismadb } from "../db";



export interface DeductResult {
  ok:          boolean;
  newBalance?: number;
  error?:      string;
}

/**
 * Atomically deduct `amount` tokens from `dbUserId`'s wallet.
 * Records a SPEND transaction.
 * Returns { ok: true, newBalance } on success; { ok: false, error } on failure.
 */
export async function deductTokens(
  dbUserId: string,
  amount:   number,
  toolSlug: string,
  meta?:    Record<string, unknown>,
): Promise<DeductResult> {
  if (!dbUserId || amount <= 0) return { ok: true }; // No-op for free/public tools

  try {
    const result = await prismadb.$transaction(async (tx) => {
      // Lock the wallet row and verify funds are still available
      const wallet = await tx.tokenWallet.findUnique({
        where:  { userId: dbUserId },
        select: { id: true, balance: true },
      });

      if (!wallet) throw new Error("wallet_not_found");
      if (wallet.balance < amount) throw new Error("insufficient_tokens");

      const updated = await tx.tokenWallet.update({
        where: { userId: dbUserId },
        data:  { balance: { decrement: amount } },
      });

      await tx.tokenTransaction.create({
        data: {
          id:          wallet.id,
          userId:      dbUserId,
          amount:      -amount,
          type:        "SPEND",
          description: `Tool: ${toolSlug}`,
          metadata:    meta ? JSON.stringify(meta) : null,
        },
      });

      return updated.balance;
    });

    return { ok: true, newBalance: result };
  } catch (err: any) {
    console.error("[deductTokens]", err);
    return { ok: false, error: err.message ?? "deduction_failed" };
  }
}

/**
 * Convenience wrapper: deducts tokens AND returns the new balance.
 * Throws if the wallet is short (use tokenGate first to prevent this).
 */
export async function deductOrThrow(
  dbUserId: string,
  amount:   number,
  toolSlug: string,
  meta?:    Record<string, unknown>,
): Promise<number> {
  const res = await deductTokens(dbUserId, amount, toolSlug, meta);
  if (!res.ok) throw new Error(res.error ?? "deduction_failed");
  return res.newBalance!;
}