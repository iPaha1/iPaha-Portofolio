// app/api/debt/summary/route.ts

import { NextResponse }      from "next/server";
import { prismadb }          from "@/lib/db";
import { requireDebtAccess } from "@/lib/debt/auth";
import { toNumber }          from "@/lib/debt/calculations";

export async function GET() {
  const { error } = await requireDebtAccess();
  if (error) return error;

  const [entries, repayments] = await Promise.all([
    prismadb.debtEntry.findMany(),
    prismadb.repaymentEntry.findMany(),
  ]);

  const confirmedEntries    = entries.filter((e) => e.status === "CONFIRMED");
  const confirmedRepayments = repayments.filter((r) => r.status === "CONFIRMED");

  const totalBorrowedGBP = confirmedEntries.reduce(
    (sum, e) => sum + toNumber(e.amountGBP), 0
  );
  const totalBorrowedVND = confirmedEntries.reduce(
    (sum, e) => sum + toNumber(e.amountVND), 0
  );
  const totalRepaidGBP = confirmedRepayments.reduce(
    (sum, r) => sum + toNumber(r.amountGBP), 0
  );
  // VND equivalent of repayments at their respective repayment-time rates
  const totalRepaidVND = confirmedRepayments.reduce(
    (sum, r) => sum + toNumber(r.amountGBP) * toNumber(r.exchangeRateAtRepayment), 0
  );

  const outstandingGBP = totalBorrowedGBP - totalRepaidGBP;
  // Remaining in original VND terms (what Fokanta is still owed in his currency)
  const outstandingVND = totalBorrowedVND - totalRepaidVND;

  const pendingEntries    = entries.filter((e) => e.status === "PENDING").length;
  const pendingRepayments = repayments.filter((r) => r.status === "PENDING").length;
  const disputedCount     = [...entries, ...repayments].filter(
    (x) => x.status === "DISPUTED"
  ).length;

  return NextResponse.json({
    ok: true,
    summary: {
      totalBorrowedGBP,
      totalBorrowedVND,
      totalRepaidGBP,
      totalRepaidVND,
      outstandingGBP,
      outstandingVND,
      pendingCount: pendingEntries + pendingRepayments,
      disputedCount,
    },
  });
}