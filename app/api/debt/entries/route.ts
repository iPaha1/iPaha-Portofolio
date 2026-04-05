// app/api/debt/entries/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prismadb }                  from "@/lib/db";
import { requireDebtAccess }         from "@/lib/debt/auth";

// GET — fetch all debt entries
export async function GET() {
  const { email, error } = await requireDebtAccess();
  if (error) return error;

  const entries = await prismadb.debtEntry.findMany({
    orderBy:  { dateOfTransfer: "desc" },
    include:  { repayments: true },
  });

  return NextResponse.json({ ok: true, entries });
}

// POST — create a new debt entry
export async function POST(req: NextRequest) {
  const { email, error } = await requireDebtAccess();
  if (error) return error;

  const body = await req.json();
  const {
    amountGBP,
    amountVND,
    exchangeRateAtTransfer,
    dateOfTransfer,
    description,
    evidenceUrl,
    evidencePublicId,
  } = body;

  if (!amountGBP || !amountVND || !exchangeRateAtTransfer || !dateOfTransfer) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const entry = await prismadb.debtEntry.create({
    data: {
      createdByEmail:         email!,
      amountGBP:              Number(amountGBP),
      amountVND:              Number(amountVND),
      exchangeRateAtTransfer: Number(exchangeRateAtTransfer),
      dateOfTransfer:         new Date(dateOfTransfer),
      description:            description ?? null,
      evidenceUrl:            evidenceUrl ?? null,
      evidencePublicId:       evidencePublicId ?? null,
    },
  });

  return NextResponse.json({ ok: true, entry }, { status: 201 });
}