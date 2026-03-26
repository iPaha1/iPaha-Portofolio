// =============================================================================
// isaacpaha.com — Apps List API
// app/api/admin/apps/route.ts
// GET    → paginated list with filters
// POST   → create app
// DELETE → bulk delete { ids[] }
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import {
  getApps, createApp, bulkDeleteApps, generateAppSlug,
} from "@/lib/actions/apps-actions";
import { AppStatus } from "@/lib/generated/prisma/enums";


async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const result = await getApps({
    page:      Number(sp.get("page")     ?? 1),
    pageSize:  Number(sp.get("pageSize") ?? 20),
    status:    (sp.get("status")  as AppStatus) || undefined,
    company:   sp.get("company")  || undefined,
    search:    sp.get("search")   || undefined,
    sortBy:    (["createdAt", "updatedAt", "name", "userCount", "viewCount"].includes(sp.get("sortBy") ?? "")
                ? sp.get("sortBy")
                : "createdAt") as
                | "createdAt"
                | "updatedAt"
                | "name"
                | "userCount"
                | "viewCount"
                | undefined,
    sortOrder: (["asc", "desc"].includes(sp.get("sortOrder") ?? "")
                ? sp.get("sortOrder")
                : "desc") as "asc" | "desc" | undefined,
  });
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name?.trim() || !body.tagline?.trim() || !body.company?.trim()) {
    return NextResponse.json({ error: "Name, tagline and company are required" }, { status: 400 });
  }

  const slug = body.slug?.trim() || await generateAppSlug(body.name);
  const app = await createApp({
    name:            body.name.trim(),
    slug,
    tagline:         body.tagline.trim(),
    description:     body.description?.trim()     ?? "",
    fullDescription: body.fullDescription?.trim() ?? null,
    problemSolved:   body.problemSolved?.trim()   ?? "",
    businessModel:   body.businessModel?.trim()   ?? null,
    targetUsers:     body.targetUsers?.trim()     ?? null,
    category:        body.category                ?? "Other",
    status:          body.status                  ?? "IN_DEVELOPMENT",
    emoji:           body.emoji                   ?? "📱",
    coverImage:      body.coverImage              ?? null,
    logoImage:       body.logoImage               ?? null,
    accentColor:     body.accentColor             ?? "#f59e0b",
    isFeatured:      body.isFeatured              ?? false,
    isNew:           body.isNew                   ?? true,
    company:         body.company,
    companyFlag:     body.companyFlag             ?? "🇬🇧",
    appUrl:          body.appUrl                  ?? null,
    githubUrl:       body.githubUrl               ?? null,
    playStoreUrl:    body.playStoreUrl            ?? null,
    appStoreUrl:     body.appStoreUrl             ?? null,
    techStack:       body.techStack               ?? [],
    userCount:       body.userCount               ?? 0,
    launchDate:      body.launchDate ? new Date(body.launchDate) : null,
  });
  return NextResponse.json({ ok: true, app }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids[] required" }, { status: 400 });
  }
  await bulkDeleteApps(ids);
  return NextResponse.json({ ok: true, deleted: ids.length });
}