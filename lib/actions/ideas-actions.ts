"use server";

// =============================================================================
// isaacpaha.com — Ideas Lab Server Actions
// lib/actions/ideas.actions.ts
// =============================================================================

import { revalidatePath } from "next/cache";
import { prismadb } from "../db";
import { IdeaCategory, IdeaStatus } from "../generated/prisma/enums";


// ─── STATS ───────────────────────────────────────────────────────────────────

export async function getIdeaStats() {
  const [
    total, published, featured,
    byStatus, byCategory, totalViewsAgg, totalLikesAgg, topViewed,
  ] = await Promise.all([
    prismadb.idea.count(),
    prismadb.idea.count({ where: { isPublished: true } }),
    prismadb.idea.count({ where: { isFeatured:  true } }),
    prismadb.idea.groupBy({ by: ["status"],   _count: { _all: true } }),
    prismadb.idea.groupBy({ by: ["category"], _count: { _all: true } }),
    prismadb.idea.aggregate({ _sum: { viewCount: true } }),
    prismadb.idea.aggregate({ _sum: { likeCount: true } }),
    prismadb.idea.findMany({
      where:   { isPublished: true },
      orderBy: { viewCount: "desc" },
      take:    5,
      select:  { id: true, title: true, slug: true, viewCount: true, likeCount: true, category: true, status: true },
    }),
  ]);

  return {
    total,
    published,
    drafts:     total - published,
    featured,
    totalViews: totalViewsAgg._sum.viewCount ?? 0,
    totalLikes: totalLikesAgg._sum.likeCount ?? 0,
    byStatus:   byStatus.map((b) => ({ status: b.status as IdeaStatus, count: b._count._all })),
    byCategory: byCategory.map((b) => ({ category: b.category as IdeaCategory, count: b._count._all })),
    topViewed,
  };
}

// ─── LIST ─────────────────────────────────────────────────────────────────────

export async function getIdeas({
  page      = 1,
  pageSize  = 20,
  category,
  status,
  search,
  isPublished,
  isFeatured,
  sortBy    = "createdAt",
  sortOrder = "desc",
}: {
  page?:        number;
  pageSize?:    number;
  category?:    IdeaCategory;
  status?:      IdeaStatus;
  search?:      string;
  isPublished?: boolean;
  isFeatured?:  boolean;
  sortBy?:      "createdAt" | "updatedAt" | "title" | "viewCount" | "likeCount";
  sortOrder?:   "asc" | "desc";
} = {}) {
  const where = {
    ...(category    !== undefined && { category }),
    ...(status      !== undefined && { status }),
    ...(isPublished !== undefined && { isPublished }),
    ...(isFeatured  !== undefined && { isFeatured }),
    ...(search && {
      OR: [
        { title:   { contains: search } },
        { summary: { contains: search } },
        { tags:    { contains: search } },
      ],
    }),
  };

  const [ideas, total] = await Promise.all([
    prismadb.idea.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      select:  {
        id: true, title: true, slug: true, summary: true,
        category: true, status: true, tags: true,
        isPublished: true, isFeatured: true,
        viewCount: true, likeCount: true, commentCount: true,
        coverImage: true,
        createdAt: true, updatedAt: true, publishedAt: true,
      },
    }),
    prismadb.idea.count({ where }),
  ]);

  return { ideas, total, pages: Math.ceil(total / pageSize) };
}

// ─── SINGLE ───────────────────────────────────────────────────────────────────

export async function getIdeaById(id: string) {
  return prismadb.idea.findUnique({ where: { id } });
}

export async function getIdeaBySlug(slug: string) {
  return prismadb.idea.findUnique({ where: { slug } });
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createIdea(data: {
  title:            string;
  slug:             string;
  summary:          string;
  content:          string;
  category:         IdeaCategory;
  status:           IdeaStatus;
  tags?:            string[];
  coverImage?:      string;
  isPublished?:     boolean;
  isFeatured?:      boolean;
  metaTitle?:       string;
  metaDescription?: string;
}) {
  const existing  = await prismadb.idea.findUnique({ where: { slug: data.slug } });
  const finalSlug = existing ? `${data.slug}-${Date.now()}` : data.slug;

  const idea = await prismadb.idea.create({
    data: {
      title:           data.title,
      slug:            finalSlug,
      summary:         data.summary,
      content:         data.content,
      category:        data.category,
      status:          data.status,
      tags:            data.tags?.length ? JSON.stringify(data.tags) : null,
      coverImage:      data.coverImage      ?? null,
      isPublished:     data.isPublished     ?? false,
      isFeatured:      data.isFeatured      ?? false,
      publishedAt:     data.isPublished     ? new Date() : null,
      metaTitle:       data.metaTitle       ?? null,
      metaDescription: data.metaDescription ?? null,
    },
  });

  revalidatePath("/admin/[userId]/ideas", "page");
  revalidatePath("/ideas", "page");
  return idea;
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateIdea(
  id: string,
  data: Partial<{
    title:           string;
    slug:            string;
    summary:         string;
    content:         string;
    category:        IdeaCategory;
    status:          IdeaStatus;
    tags:            string[];
    coverImage:      string | null;
    isPublished:     boolean;
    isFeatured:      boolean;
    metaTitle:       string;
    metaDescription: string;
  }>
) {
  let publishedAt: Date | undefined | null;
  if (data.isPublished === true) {
    const existing = await prismadb.idea.findUnique({ where: { id }, select: { publishedAt: true } });
    if (!existing?.publishedAt) publishedAt = new Date();
  } else if (data.isPublished === false) {
    publishedAt = null;
  }

  const updated = await prismadb.idea.update({
    where: { id },
    data: {
      title:           data.title,
      slug:            data.slug,
      summary:         data.summary,
      content:         data.content,
      category:        data.category,
      status:          data.status,
      tags:            data.tags !== undefined ? JSON.stringify(data.tags) : undefined,
      coverImage:      data.coverImage,
      isPublished:     data.isPublished,
      isFeatured:      data.isFeatured,
      publishedAt:     publishedAt,
      metaTitle:       data.metaTitle,
      metaDescription: data.metaDescription,
    },
  });

  revalidatePath("/admin/[userId]/ideas", "page");
  revalidatePath("/ideas", "page");
  revalidatePath(`/ideas/${updated.slug}`, "page");
  return updated;
}

// ─── TOGGLE PUBLISH / FEATURED ────────────────────────────────────────────────

export async function togglePublish(id: string) {
  const idea = await prismadb.idea.findUnique({ where: { id }, select: { isPublished: true, publishedAt: true } });
  if (!idea) throw new Error("Not found");
  const updated = await prismadb.idea.update({
    where: { id },
    data:  {
      isPublished: !idea.isPublished,
      publishedAt: !idea.isPublished && !idea.publishedAt ? new Date() : undefined,
    },
  });
  revalidatePath("/admin/[userId]/ideas", "page");
  revalidatePath("/ideas", "page");
  return updated;
}

export async function toggleFeatured(id: string) {
  const idea = await prismadb.idea.findUnique({ where: { id }, select: { isFeatured: true } });
  if (!idea) throw new Error("Not found");
  if (!idea.isFeatured) {
    // Unfeature any existing featured idea first
    await prismadb.idea.updateMany({ where: { isFeatured: true }, data: { isFeatured: false } });
  }
  const updated = await prismadb.idea.update({
    where: { id },
    data:  { isFeatured: !idea.isFeatured },
  });
  revalidatePath("/admin/[userId]/ideas", "page");
  revalidatePath("/ideas", "page");
  return updated;
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteIdea(id: string) {
  await prismadb.idea.delete({ where: { id } });
  revalidatePath("/admin/[userId]/ideas", "page");
  revalidatePath("/ideas", "page");
}

export async function bulkDeleteIdeas(ids: string[]) {
  await prismadb.idea.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/admin/[userId]/ideas", "page");
  revalidatePath("/ideas", "page");
}

// ─── DUPLICATE ────────────────────────────────────────────────────────────────

export async function duplicateIdea(id: string) {
  const src = await prismadb.idea.findUnique({ where: { id } });
  if (!src) throw new Error("Not found");
  const newSlug = `${src.slug}-copy-${Date.now()}`;
  const copy = await prismadb.idea.create({
    data: {
      title:           `${src.title} (Copy)`,
      slug:            newSlug,
      summary:         src.summary,
      content:         src.content,
      category:        src.category,
      status:          "CONCEPT",
      tags:            src.tags,
      coverImage:      src.coverImage,
      isPublished:     false,
      isFeatured:      false,
      metaTitle:       src.metaTitle,
      metaDescription: src.metaDescription,
    },
  });
  revalidatePath("/admin/[userId]/ideas", "page");
  return copy;
}

// ─── SLUG GENERATOR ───────────────────────────────────────────────────────────

export async function generateUniqueSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const existing = await prismadb.idea.findUnique({ where: { slug: base } });
  return existing ? `${base}-${Date.now()}` : base;
}