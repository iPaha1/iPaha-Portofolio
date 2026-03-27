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

import { prismadb } from "@/lib/db";
 
export interface DeductResult {
  ok:          boolean;
  newBalance?: number;
  error?:      string;
}
 
/**
 * Atomically deduct `amount` tokens from `dbUserId`'s wallet.
 * Records a SPEND transaction.
 */
export async function deductTokens(
  dbUserId: string,
  amount:   number,
  toolSlug: string,
  meta?:    Record<string, unknown>,
): Promise<DeductResult> {
  if (!dbUserId || amount <= 0) {
    console.log(`[deductTokens] Skipping — dbUserId: "${dbUserId}", amount: ${amount}`);
    return { ok: true };
  }
 
  console.log(
    `[deductTokens] Attempting to deduct ${amount} tokens from user ${dbUserId} for tool ${toolSlug}` +
    (meta ? ` with meta: ${JSON.stringify(meta)}` : ""),
  );
 
  try {
    const newBalance = await prismadb.$transaction(async (tx) => {
      // 1. Lock wallet row and verify balance
      const wallet = await tx.tokenWallet.findUnique({
        where:  { userId: dbUserId },
        select: { id: true, balance: true },
      });
 
      if (!wallet)            throw new Error("wallet_not_found");
      if (wallet.balance < amount) throw new Error("insufficient_tokens");
 
      // 2. Decrement balance (also increment totalSpent if your schema has it)
      const updated = await tx.tokenWallet.update({
        where: { userId: dbUserId },
        data:  {
          balance:    { decrement: amount },
          totalSpent: { increment: amount },
        },
      });
 
      // 3. Create transaction record — let Prisma generate the @id @default(cuid())
      //    Connect to wallet via the relation (no walletId scalar field on the model)
      await tx.tokenTransaction.create({
        data: {
          // ✅ No `id` field — Prisma generates a new cuid() automatically
          userId:      dbUserId,
          amount:      -amount,           // negative = spend
          type:        "SPEND",
          description: `Tool: ${toolSlug}`,
          metadata:    meta ? JSON.stringify(meta) : null,
          // ✅ Connect via relation array (matches schema: tokenWallet TokenWallet[])
          tokenWallet: {
            connect: { id: wallet.id },
          },
        },
      });
 
      return updated.balance;
    });
 
    console.log(
      `[deductTokens] Deducted ${amount} tokens from user ${dbUserId} — new balance: ${newBalance}`,
    );
    return { ok: true, newBalance };
  } catch (err: any) {
    console.error(`[deductTokens] Error`, err);
    return { ok: false, error: err.message ?? "deduction_failed" };
  }
}
 
/**
 * Throws on failure. Use when you need the new balance inline.
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
 