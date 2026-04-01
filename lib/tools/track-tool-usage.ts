// =============================================================================
// isaacpaha.com — Track Tool Usage
// lib/tools/track-tool-usage.ts
//
// Call this from any tool API route after a successful AI generation.
// Increments usageCount on the Tool and creates a ToolUsageLog entry.
//
// Usage:
//   import { trackToolUsage, getIpFromRequest } from "@/lib/tools/track-tool-usage";
//
//   await trackToolUsage({
//     toolId:       "cmnfbkt7...",   // required — DB tool id
//     toolName:     "CV Analyser",   // required — for analytics without joins
//     userId:       user?.id,        // optional — null for anonymous
//     ipAddress:    getIpFromRequest(req),
//     processingMs: Date.now() - start,
//     tokenCost:    500,             // tokens deducted this run
//     wasSuccess:   true,
//   });
// =============================================================================

import { prismadb } from "@/lib/db";

interface TrackUsageInput {
  toolId:        string;
  toolName:      string;           // stored on the log for analytics without joins
  userId?:       string | null;
  ipAddress?:    string | null;
  inputData?:    string | null;    // optional summarised input — no PII
  processingMs?: number | null;    // how long the AI call took
  tokenCost?:    number | null;    // tokens deducted this run
  wasSuccess?:   boolean;
  errorMsg?:     string | null;
  country?:      string | null;
}

export async function trackToolUsage({
  toolId,
  toolName,
  userId       = null,
  ipAddress    = null,
  inputData    = null,
  processingMs = null,
  tokenCost    = null,
  wasSuccess   = true,
  errorMsg     = null,
  country      = null,
}: TrackUsageInput): Promise<void> {
  try {
    await Promise.all([
      // 1. Increment the tool's usageCount
      prismadb.tool.update({
        where: { id: toolId },
        data:  { usageCount: { increment: 1 } },
      }),

      // 2. Create the usage log entry
      prismadb.toolUsageLog.create({
        data: {
          toolId,
          toolName,
          userId:       userId       ?? undefined,
          ipAddress:    ipAddress    ?? undefined,
          inputData:    inputData    ?? undefined,
          processingMs: processingMs ?? undefined,
          tokenCost:    tokenCost    ?? undefined,
          wasSuccess,
          errorMsg:     errorMsg     ?? undefined,
          country:      country      ?? undefined,
        },
      }),
    ]);
  } catch (err) {
    // Non-critical — log but don't throw. The tool response already sent.
    console.error("[track-tool-usage] Failed:", err);
  }
}

// ─── Helper: extract client IP from Next.js App Router request ────────────────
// req.ip is not available in App Router — use headers instead.

export function getIpFromRequest(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip")                              ??
    null
  );
}