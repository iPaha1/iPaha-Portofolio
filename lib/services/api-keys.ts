// =============================================================================
// lib/services/api-keys.ts
// API key lifecycle management
// Called from admin dashboard server actions — never from public API handlers
// =============================================================================

import { createHmac, randomBytes } from "crypto";
import type { Scope } from "@/lib/api/types";
import { prismadb } from "../db";

// -----------------------------------------------------------------------------
// Key format:  ipaha_sk_<40 random chars>
// Prefix part: ipaha_sk  (8 chars, stored in keyPrefix for display)
// Stored:      SHA256 hash of full key (never the raw key)
// Shown once:  Full raw key returned ONLY at creation time
// -----------------------------------------------------------------------------

function generateRawKey(companySlug: string): string {
  // e.g. "ipaha_sk_a1b2c3d4e5f6..."
  const slug    = companySlug.replace(/-/g, "").slice(0, 6);
  const random  = randomBytes(20).toString("hex");  // 40 hex chars
  return `${slug}_sk_${random}`;
}

function hashKey(rawKey: string): string {
  return createHmac("sha256", process.env.API_KEY_HASH_SECRET!)
    .update(rawKey)
    .digest("hex");
}

// -----------------------------------------------------------------------------
// CREATE KEY
// Returns the raw key exactly once — it will never be retrievable again
// -----------------------------------------------------------------------------
interface CreateKeyInput {
  companyId:      string;
  companySlug:    string;
  name:           string;
  scopes:         Scope[];
  expiresAt?:     Date;
  rateLimit?:     number;
  allowedIps?:    string[];
  allowedDomains?: string[];
}

interface CreateKeyResult {
  rawKey:     string;   // SHOW ONCE — store nowhere, display immediately
  keyId:      string;   // DB ID for reference
  keyPrefix:  string;   // First 8 chars — safe to display
}

export async function createApiKey(input: CreateKeyInput): Promise<CreateKeyResult> {
  const rawKey      = generateRawKey(input.companySlug);
  const keyHash     = hashKey(rawKey);
  const keyPrefix   = rawKey.slice(0, rawKey.indexOf("_sk_") + 4);
  const lastFour    = rawKey.slice(-4);

  const key = await prismadb.companyApiKey.create({
    data: {
      companyId:      input.companyId,
      name:           input.name,
      keyPrefix,
      keyHash,
      lastFourChars:  lastFour,
      scopes:         JSON.stringify(input.scopes),
      expiresAt:      input.expiresAt,
      rateLimit:      input.rateLimit,
      allowedIps:     input.allowedIps     ? JSON.stringify(input.allowedIps)     : undefined,
      allowedDomains: input.allowedDomains ? JSON.stringify(input.allowedDomains) : undefined,
    },
    select: { id: true },
  });

  return {
    rawKey,           // Caller must display immediately and never store
    keyId:    key.id,
    keyPrefix,
  };
}

// -----------------------------------------------------------------------------
// ROTATE KEY
// Revokes old key and creates a new one with the same settings
// -----------------------------------------------------------------------------
export async function rotateApiKey(
  keyId: string,
  companySlug: string
): Promise<CreateKeyResult> {
  const existing = await prismadb.companyApiKey.findUnique({
    where: { id: keyId },
    select: {
      companyId:      true,
      name:           true,
      scopes:         true,
      expiresAt:      true,
      rateLimit:      true,
      allowedIps:     true,
      allowedDomains: true,
    },
  });
  if (!existing) throw new Error("Key not found");

  // Revoke old key
  await prismadb.companyApiKey.update({
    where: { id: keyId },
    data:  { revokedAt: new Date(), revokedReason: "Rotated", isActive: false },
  });

  // Create replacement
  return createApiKey({
    companyId:      existing.companyId,
    companySlug,
    name:           `${existing.name} (rotated)`,
    scopes:         JSON.parse(existing.scopes) as Scope[],
    expiresAt:      existing.expiresAt ?? undefined,
    rateLimit:      existing.rateLimit ?? undefined,
    allowedIps:     existing.allowedIps     ? JSON.parse(existing.allowedIps)     : undefined,
    allowedDomains: existing.allowedDomains ? JSON.parse(existing.allowedDomains) : undefined,
  });
}

// -----------------------------------------------------------------------------
// REVOKE KEY
// Hard revocation — key immediately becomes invalid
// -----------------------------------------------------------------------------
export async function revokeApiKey(keyId: string, reason?: string): Promise<void> {
  await prismadb.companyApiKey.update({
    where: { id: keyId },
    data: {
      revokedAt:     new Date(),
      revokedReason: reason ?? "Manually revoked",
      isActive:      false,
    },
  });
}

// -----------------------------------------------------------------------------
// LIST KEYS FOR COMPANY (safe — never returns hash or raw key)
// -----------------------------------------------------------------------------
export async function listApiKeys(companyId: string) {
  return prismadb.companyApiKey.findMany({
    where: { companyId },
    select: {
      id:             true,
      name:           true,
      keyPrefix:      true,
      lastFourChars:  true,
      scopes:         true,
      rateLimit:      true,
      allowedIps:     true,
      allowedDomains: true,
      isActive:       true,
      expiresAt:      true,
      revokedAt:      true,
      lastUsedAt:     true,
      lastUsedIp:     true,
      totalRequests:  true,
      totalErrors:    true,
      createdAt:      true,
      // keyHash intentionally excluded
    },
    orderBy: { createdAt: "desc" },
  });
}