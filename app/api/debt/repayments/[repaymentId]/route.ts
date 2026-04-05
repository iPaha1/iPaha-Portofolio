// app/api/debt/repayments/[repaymentId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prismadb }                  from "@/lib/db";
import { requireDebtAccess }         from "@/lib/debt/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ repaymentId: string }> }
) {

    const { repaymentId } = await params;

  const { email, error } = await requireDebtAccess();
  if (error) return error;

  const body = await req.json();
  const { action, disputeNote, disputeEvidenceUrl, disputeEvidencePublicId } = body;

  if (!["confirm", "dispute"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const repayment = await prismadb.repaymentEntry.findUnique({ where: { id: repaymentId } });
  if (!repayment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "confirm" && repayment.createdByEmail === email) {
    return NextResponse.json(
      { error: "You cannot confirm your own entry" },
      { status: 403 }
    );
  }

  const updated = await prismadb.repaymentEntry.update({
    where: { id: repaymentId },
    data: {
      status:                  action === "confirm" ? "CONFIRMED" : "DISPUTED",
      confirmedByEmail:        action === "confirm" ? email!      : null,
      confirmedAt:             action === "confirm" ? new Date()  : null,
      disputeNote:             action === "dispute" ? (disputeNote ?? null)             : null,
      disputeEvidenceUrl:      action === "dispute" ? (disputeEvidenceUrl ?? null)      : null,
      disputeEvidencePublicId: action === "dispute" ? (disputeEvidencePublicId ?? null) : null,
    },
  });

  return NextResponse.json({ ok: true, repayment: updated });
}