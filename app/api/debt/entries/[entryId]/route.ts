// app/api/debt/entries/[entryId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prismadb }                  from "@/lib/db";
import { requireDebtAccess }         from "@/lib/debt/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ entryId: string }> }
) {

    const { entryId } = await params;
    
  const { email, error } = await requireDebtAccess();
  if (error) return error;

  const body = await req.json();
  const { action, disputeNote, disputeEvidenceUrl, disputeEvidencePublicId } = body;

  if (!["confirm", "dispute"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const entry = await prismadb.debtEntry.findUnique({ where: { id: entryId } });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Can't confirm your own entry
  if (action === "confirm" && entry.createdByEmail === email) {
    return NextResponse.json(
      { error: "You cannot confirm your own entry" },
      { status: 403 }
    );
  }

  const updated = await prismadb.debtEntry.update({
    where: { id: entryId },
    data: {
      status:                 action === "confirm" ? "CONFIRMED" : "DISPUTED",
      confirmedByEmail:       action === "confirm" ? email!      : null,
      confirmedAt:            action === "confirm" ? new Date()  : null,
      disputeNote:            action === "dispute" ? (disputeNote ?? null)            : null,
      disputeEvidenceUrl:     action === "dispute" ? (disputeEvidenceUrl ?? null)     : null,
      disputeEvidencePublicId:action === "dispute" ? (disputeEvidencePublicId ?? null): null,
    },
  });

  return NextResponse.json({ ok: true, entry: updated });
}