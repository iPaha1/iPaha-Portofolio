// lib/debt/calculations.ts
// Core exchange-rate-aware calculation logic.

import { Decimal } from "@prisma/client/runtime/client";



export interface DebtSummary {
  totalBorrowedGBP:    number;
  totalBorrowedVND:    number;
  totalRepaidGBP:      number;
  totalRepaidVND:      number;   // VND equivalent at repayment rates
  outstandingGBP:      number;
  outstandingVND:      number;   // remaining in original VND terms
  vndProtectionStatus: "protected" | "at-risk" | "neutral";
}

/**
 * Determines if a repayment amount satisfies the VND protection agreement.
 *
 * Agreement: Fokanta must never receive less VND purchasing power than he gave.
 *   - If rate fell  → £ repaid × new rate < original VND → rate risk, but
 *     Isaac still pays the full GBP amount so Fokanta is protected in GBP terms.
 *   - We flag "at-risk" when the VND equivalent of outstanding GBP < original VND.
 *   - We flag "protected" when VND equivalent >= original VND.
 */
export function checkVndProtection(params: {
  originalGBP:           number;
  originalVND:           number;
  rateAtTransfer:        number;  // VND per £1 when borrowed
  currentRate:           number;  // VND per £1 today
}): {
  status:                "protected" | "at-risk";
  originalVND:           number;
  currentEquivalentVND:  number;
  difference:            number;
  explanation:           string;
} {
  const { originalGBP, originalVND, rateAtTransfer, currentRate } = params;
  const currentEquivalentVND = originalGBP * currentRate;
  const difference           = currentEquivalentVND - originalVND;
  const status               = currentEquivalentVND >= originalVND ? "protected" : "at-risk";

  const explanation =
    status === "protected"
      ? `At the current rate (₫${currentRate.toLocaleString()}/£), £${originalGBP.toLocaleString()} = ₫${Math.round(currentEquivalentVND).toLocaleString()} — more than the original ₫${Math.round(originalVND).toLocaleString()}. Fokanta receives more in VND terms.`
      : `At the current rate (₫${currentRate.toLocaleString()}/£), £${originalGBP.toLocaleString()} = ₫${Math.round(currentEquivalentVND).toLocaleString()} — less than the original ₫${Math.round(originalVND).toLocaleString()}. However, per agreement Isaac still pays the full £${originalGBP.toLocaleString()} in GBP.`;

  return { status, originalVND, currentEquivalentVND, difference, explanation };
}

export function toNumber(d: Decimal | number | null | undefined): number {
  if (d == null) return 0;
  return typeof d === "number" ? d : Number(d.toString());
}