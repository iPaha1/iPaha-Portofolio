// app/api/debt/repayments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prismadb }                  from "@/lib/db";
import { requireDebtAccess }         from "@/lib/debt/auth";

export async function GET() {
  const { error } = await requireDebtAccess();
  if (error) return error;

  const repayments = await prismadb.repaymentEntry.findMany({
    orderBy: { dateOfPayment: "desc" },
    include: { debtEntry: true },
  });

  return NextResponse.json({ ok: true, repayments });
}

export async function POST(req: NextRequest) {
  const { email, error } = await requireDebtAccess();
  if (error) return error;

  const body = await req.json();
  const {
    amountGBP,
    amountVND,
    exchangeRateAtRepayment,
    dateOfPayment,
    description,
    evidenceUrl,
    evidencePublicId,
    debtEntryId,        // optional — null = applies to overall balance
  } = body;

  if (!amountGBP || !amountVND || !exchangeRateAtRepayment || !dateOfPayment) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // If debtEntryId provided, verify it exists and is CONFIRMED
  if (debtEntryId) {
    const linked = await prismadb.debtEntry.findUnique({ where: { id: debtEntryId } });
    if (!linked) {
      return NextResponse.json({ error: "Linked debt entry not found" }, { status: 404 });
    }
    if (linked.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "Can only link repayments to CONFIRMED debt entries" },
        { status: 400 }
      );
    }
  }

  const repayment = await prismadb.repaymentEntry.create({
    data: {
      createdByEmail:           email!,
      amountGBP:                Number(amountGBP),
      amountVND:                Number(amountVND),
      exchangeRateAtRepayment:  Number(exchangeRateAtRepayment),
      dateOfPayment:            new Date(dateOfPayment),
      description:              description ?? null,
      evidenceUrl:              evidenceUrl ?? null,
      evidencePublicId:         evidencePublicId ?? null,
      debtEntryId:              debtEntryId ?? null,
    },
  });

  return NextResponse.json({ ok: true, repayment }, { status: 201 });
}