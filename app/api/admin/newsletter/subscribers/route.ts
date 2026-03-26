// =============================================================================
// isaacpaha.com — Newsletter Subscribers API
// app/api/admin/newsletter/subscribers/route.ts
// GET  → paginated subscriber list with filters
// POST → add single subscriber
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                       from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import { NewsletterStatus } from "@/lib/generated/prisma/enums";
import { addSubscriber, getSubscribers } from "@/lib/actions/newsletter-actions";


async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN" ? userId : null;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page     = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 50);
  const status   = searchParams.get("status") as NewsletterStatus | null;
  const search   = searchParams.get("search") ?? undefined;
  const sortBy   = (searchParams.get("sortBy") as "subscribedAt" | "email") ?? "subscribedAt";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") ?? "desc";

  const result = await getSubscribers({ page, pageSize, status: status ?? undefined, search, sortBy, sortOrder });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { email, firstName, source } = body;

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const subscriber = await addSubscriber({ email, firstName, source });
  return NextResponse.json(subscriber, { status: 201 });
}