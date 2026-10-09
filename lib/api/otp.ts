// apps/api/lib/otp.ts
import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function generateOtpCode(): string {
  // 6-digit numeric, unbiased (not naive modulo of Math.random)
  const n = randomBytes(4).readUInt32BE(0) % 1_000_000;
  return n.toString().padStart(6, "0");
}

export const hashOtpCode = (code: string) =>
  createHash("sha256").update(code).digest("hex");

export const generateSessionToken = () =>
  randomBytes(32).toString("base64url");

export const hashSessionToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export function safeCompareHash(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}