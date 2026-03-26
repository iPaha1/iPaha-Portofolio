"use server";

// =============================================================================
// isaacpaha.com — Tools Lab Server Actions
// lib/actions/tools.actions.ts
// =============================================================================

import { revalidatePath } from "next/cache";
import { prismadb } from "../db";
import { ToolCategory, ToolStatus } from "../generated/prisma/enums";


// ─── STATS ───────────────────────────────────────────────────────────────────

export async function getToolStats() {
  const [
    total, live, beta, comingSoon, featured, interactive, premium,
    totalViewsAgg, totalUsesAgg, topUsed,
    byStatus, byCategory,
  ] = await Promise.all([
    prismadb.tool.count(),
    prismadb.tool.count({ where: { status: "LIVE" } }),
    prismadb.tool.count({ where: { status: "BETA" } }),
    prismadb.tool.count({ where: { status: "COMING_SOON" } }),
    prismadb.tool.count({ where: { isFeatured: true } }),
    prismadb.tool.count({ where: { isInteractive: true } }),
    prismadb.tool.count({ where: { isPremium: true } }),
    prismadb.tool.aggregate({ _sum: { viewCount: true } }),
    prismadb.tool.aggregate({ _sum: { usageCount: true } }),
    prismadb.tool.findMany({
      orderBy: { usageCount: "desc" },
      take:    5,
      select:  { id: true, name: true, slug: true, usageCount: true, viewCount: true, category: true, status: true, icon: true },
    }),
    prismadb.tool.groupBy({ by: ["status"],   _count: { _all: true } }),
    prismadb.tool.groupBy({ by: ["category"], _count: { _all: true } }),
  ]);

  // Recent usage (last 30d)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentUsageCount = await prismadb.toolUsageLog.count({
    where: { createdAt: { gte: thirtyDaysAgo } },
  });

  return {
    total, live, beta, comingSoon, featured, interactive, premium,
    totalViews:   totalViewsAgg._sum.viewCount ?? 0,
    totalUses:    totalUsesAgg._sum.usageCount   ?? 0,
    recentUsageCount,
    byStatus:     byStatus.map((b) => ({ status: b.status as ToolStatus, count: b._count._all })),
    byCategory:   byCategory.map((b) => ({ category: b.category as string, count: b._count._all })),
    topUsed,
  };
}

// ─── LIST ─────────────────────────────────────────────────────────────────────

export async function getTools({
  page      = 1,
  pageSize  = 20,
  category,
  status,
  search,
  isFeatured,
  isInteractive,
  isPremium,
  sortBy    = "createdAt",
  sortOrder = "desc",
}: {
  page?:          number;
  pageSize?:      number;
  category?:      string;
  status?:        ToolStatus;
  search?:        string;
  isFeatured?:    boolean;
  isInteractive?: boolean;
  isPremium?:     boolean;
  sortBy?:        "createdAt" | "updatedAt" | "title" | "viewCount" | "usageCount" | "rating";
  sortOrder?:     "asc" | "desc";
} = {}) {
  const where = {
    ...(category      !== undefined && { category: category as ToolCategory }),
    ...(status        !== undefined && { status }),
    ...(isFeatured    !== undefined && { isFeatured }),
    ...(isInteractive !== undefined && { isInteractive }),
    ...(isPremium     !== undefined && { isPremium }),
    ...(search && {
      OR: [
        { title:       { contains: search } },
        { tagline:     { contains: search } },
        { description: { contains: search } },
        { tags:        { contains: search } },
      ],
    }),
  };

  const [tools, total] = await Promise.all([
    prismadb.tool.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      select: {
        id: true, name: true, slug: true, tagLine: true,
        category: true, status: true, icon: true,
        tags: true, coverImage: true,
        isFeatured: true, isPremium: true, isInteractive: true,
        // componentKey: true,
        viewCount: true, usageCount: true, ratingAvg: true, ratingCount: true,
        createdAt: true, updatedAt: true,
        _count: { select: { usageLogs: true } },
      },
    }),
    prismadb.tool.count({ where }),
  ]);

  return { tools, total, pages: Math.ceil(total / pageSize) };
}

// ─── SINGLE ───────────────────────────────────────────────────────────────────

export async function getToolById(id: string) {
  return prismadb.tool.findUnique({
    where: { id },
    include: {
      _count: { select: { usageLogs: true } },
    },
  });
}

export async function getToolBySlug(slug: string) {
  return prismadb.tool.findUnique({
    where: { slug },
    include: { _count: { select: { usageLogs: true } } },
  });
}

// ─── USAGE LOG ────────────────────────────────────────────────────────────────

export async function getToolUsageHistory(toolId: string, days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const logs  = await prismadb.toolUsageLog.findMany({
    where:   { toolId, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take:    200,
    select:  { id: true, createdAt: true, userId: true, ipAddress: true },
  });
  return logs;
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createTool(data: {
  title:          string;
  slug:           string;
  tagLine:        string;
  description:    string;
  category:       string;
  status:         ToolStatus;
  emoji?:         string;
  tags?:          string[];
  coverImage?:    string;
  isFeatured?:    boolean;
  isPremium?:     boolean;
  isInteractive?: boolean;
  componentKey?:  string;
}) {
  const existing  = await prismadb.tool.findUnique({ where: { slug: data.slug } });
  const finalSlug = existing ? `${data.slug}-${Date.now()}` : data.slug;

  const tool = await prismadb.tool.create({
    data: {
      name:         data.title,
      slug:          finalSlug,
      tagLine:       data.tagLine,
      description:   data.description,
      category:      data.category as ToolCategory,
      status:        data.status,
      icon:         data.emoji        ?? "🔧",
      tags:          data.tags?.length ? JSON.stringify(data.tags) : "[]",
      coverImage:    data.coverImage   ?? null,
      isFeatured:    data.isFeatured   ?? false,
      isPremium:     data.isPremium    ?? false,
      isInteractive: data.isInteractive ?? false,
    //   componentKey:  data.componentKey  ?? null,
    },
  });

  revalidatePath("/admin/[userId]/tools", "page");
  revalidatePath("/tools", "page");
  return tool;
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateTool(
  id: string,
  data: Partial<{
    title:         string;
    slug:          string;
    tagline:       string;
    description:   string;
    category:      string;
    status:        ToolStatus;
    emoji:         string;
    tags:          string[];
    coverImage:    string | null;
    isFeatured:    boolean;
    isPremium:     boolean;
    isInteractive: boolean;
    componentKey:  string | null;
  }>
) {
  const updated = await prismadb.tool.update({
    where: { id },
    data: {
      ...data,
      category: data.category !== undefined ? data.category as ToolCategory : undefined,
      tags: data.tags !== undefined ? JSON.stringify(data.tags) : undefined,
    },
  });

  revalidatePath("/admin/[userId]/tools", "page");
  revalidatePath("/tools", "page");
  revalidatePath(`/tools/${updated.slug}`, "page");
  return updated;
}

// ─── TOGGLE FEATURED ─────────────────────────────────────────────────────────

export async function toggleToolFeatured(id: string) {
  const tool = await prismadb.tool.findUnique({ where: { id }, select: { isFeatured: true } });
  if (!tool) throw new Error("Not found");
  const updated = await prismadb.tool.update({
    where: { id },
    data:  { isFeatured: !tool.isFeatured },
  });
  revalidatePath("/admin/[userId]/tools", "page");
  revalidatePath("/tools", "page");
  return updated;
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteTool(id: string) {
  await prismadb.tool.delete({ where: { id } });
  revalidatePath("/admin/[userId]/tools", "page");
  revalidatePath("/tools", "page");
}

export async function bulkDeleteTools(ids: string[]) {
  await prismadb.tool.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/admin/[userId]/tools", "page");
  revalidatePath("/tools", "page");
}

// ─── DUPLICATE ────────────────────────────────────────────────────────────────

export async function duplicateTool(id: string) {
  const src = await prismadb.tool.findUnique({ where: { id } });
  if (!src) throw new Error("Not found");
  const copy = await prismadb.tool.create({
    data: {
      name:         `${src.name} (Copy)`,
      slug:          `${src.slug}-copy-${Date.now()}`,
      tagLine:       src.tagLine,
      description:   src.description,
      category:      src.category,
      status:        "COMING_SOON",
      icon:         src.icon,
      tags:          src.tags,
      coverImage:    src.coverImage,
      isFeatured:    false,
      isPremium:     src.isPremium,
      isInteractive: src.isInteractive,
    //   componentKey:  src.componentKey,
    },
  });
  revalidatePath("/admin/[userId]/tools", "page");
  return copy;
}

// ─── SLUG HELPER ─────────────────────────────────────────────────────────────

export async function generateUniqueToolSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const existing = await prismadb.tool.findUnique({ where: { slug: base } });
  return existing ? `${base}-${Date.now()}` : base;
}