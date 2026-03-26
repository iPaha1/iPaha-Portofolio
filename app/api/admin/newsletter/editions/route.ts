// =============================================================================
// isaacpaha.com — Newsletter Editions API
// app/api/admin/newsletter/editions/route.ts
// GET  → list editions (paginated)
// POST → create new edition
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { createEdition, getEditions } from "@/lib/actions/newsletter-actions";
import { prismadb } from "@/lib/db";


async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page     = Number(searchParams.get("page") ?? 1);
  const pageSize = Number(searchParams.get("pageSize") ?? 20);

  const result = await getEditions({ page, pageSize });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, slug, preview, content, contentHtml } = body;

  if (!title || !slug || !preview || !content) {
    return NextResponse.json(
      { error: "title, slug, preview, content are required" },
      { status: 400 }
    );
  }

  const edition = await createEdition({ title, slug, preview, content, contentHtml });
  return NextResponse.json(edition, { status: 201 });
}