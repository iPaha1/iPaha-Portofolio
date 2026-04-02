"use server";

// =============================================================================
// isaacpaha.com — Blog Server Actions
// lib/actions/blog.actions.ts
// =============================================================================

import { prismadb }       from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { BlogStatus, CommentStatus } from "@/lib/generated/prisma/enums";

// ─── Utilities ────────────────────────────────────────────────────────────────

function calcReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function calcWordCount(content: string): number {
  return content.trim().split(/\s+/).filter(Boolean).length;
}

function generateTableOfContents(content: string): string {
  const headings: { id: string; text: string; level: number }[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const h2 = line.match(/^## (.+)$/);
    const h3 = line.match(/^### (.+)$/);
    if (h2) {
      const text = h2[1];
      const id   = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      headings.push({ id, text, level: 2 });
    } else if (h3) {
      const text = h3[1];
      const id   = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      headings.push({ id, text, level: 3 });
    }
  }
  return JSON.stringify(headings);
}

// ─── STATS ───────────────────────────────────────────────────────────────────

export async function getBlogStats() {
  const [
    total, published, drafts, scheduled, archived,
    featured, totalViewsAgg, totalLikesAgg, totalCommentsAgg,
    aiGenerated, recentPosts, pendingComments,
    byCategory,
  ] = await Promise.all([
    prismadb.blogPost.count({ where: { deletedAt: null } }),
    prismadb.blogPost.count({ where: { status: "PUBLISHED", deletedAt: null } }),
    prismadb.blogPost.count({ where: { status: "DRAFT",     deletedAt: null } }),
    prismadb.blogPost.count({ where: { status: "SCHEDULED", deletedAt: null } }),
    prismadb.blogPost.count({ where: { status: "ARCHIVED",  deletedAt: null } }),
    prismadb.blogPost.count({ where: { isFeatured: true,    deletedAt: null } }),
    prismadb.blogPost.aggregate({ _sum: { viewCount: true  }, where: { deletedAt: null } }),
    prismadb.blogPost.aggregate({ _sum: { likeCount: true  }, where: { deletedAt: null } }),
    prismadb.blogPost.aggregate({ _sum: { commentCount: true }, where: { deletedAt: null } }),
    prismadb.blogPost.count({ where: { authorBio: { contains: "AI_GENERATED" }, status: "DRAFT", deletedAt: null } }),
    prismadb.blogPost.findMany({
      where:   { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take:    5,
      select:  { id: true, title: true, slug: true, status: true, viewCount: true, updatedAt: true, isFeatured: true },
    }),
    prismadb.blogComment.count({ where: { status: "PENDING", deletedAt: null } }),
    prismadb.blogPost.groupBy({
      by: ["categoryId"], _count: { _all: true },
      where: { deletedAt: null },
    }),
  ]);

  return {
    total, published, drafts, scheduled, archived, featured,
    totalViews:    totalViewsAgg._sum.viewCount     ?? 0,
    totalLikes:    totalLikesAgg._sum.likeCount     ?? 0,
    totalComments: totalCommentsAgg._sum.commentCount ?? 0,
    aiGenerated, pendingComments,
    recentPosts,
    byCategory,
  };
}

// ─── LIST POSTS ───────────────────────────────────────────────────────────────

export async function getBlogPosts({
  page       = 1,
  pageSize   = 20,
  status,
  categoryId,
  search,
  isFeatured,
  isToolsShowcase,
  isLatest,
  sortBy     = "updatedAt",
  sortOrder  = "desc",
}: {
  page?:       number;
  pageSize?:   number;
  status?:     BlogStatus;
  categoryId?: string;
  search?:     string;
  isFeatured?: boolean;
  isToolsShowcase?: boolean;
  isLatest?: boolean;
  sortBy?:     "createdAt" | "updatedAt" | "publishedAt" | "title" | "viewCount" | "likeCount" | "trendingScore";
  sortOrder?:  "asc" | "desc";
} = {}) {
  const where = {
    deletedAt: null,
    ...(status     && { status }),
    ...(categoryId && { categoryId }),
    ...(isFeatured !== undefined && { isFeatured }),
    ...(isToolsShowcase !== undefined && { isToolsShowcase }),
    ...(isLatest !== undefined && { isLatest }),
    ...(search && {
      OR: [
        { title:   { contains: search } },
        { excerpt: { contains: search } },
        { tags:    { contains: search } },
      ],
    }),
  };

  const [posts, total] = await Promise.all([
    prismadb.blogPost.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      select: {
        id: true, title: true, slug: true, excerpt: true, status: true,
        coverImage: true, categoryId: true, seriesId: true,
        isFeatured: true, isPinned: true, isPremium: true,
        isIdeasLab: true, isToolsShowcase: true, isLatest: true, isBuildInPublic: true,
        tags: true, publishedAt: true, scheduledAt: true,
        readingTimeMinutes: true, wordCount: true,
        viewCount: true, likeCount: true, commentCount: true,
        trendingScore: true,
        createdAt: true, updatedAt: true,
        category: { select: { name: true, color: true } },
      },
    }),
    prismadb.blogPost.count({ where }),
  ]);

  return { posts, total, pages: Math.ceil(total / pageSize) };
}

// ─── SINGLE POST ──────────────────────────────────────────────────────────────

export async function getBlogPostById(id: string) {
  return prismadb.blogPost.findUnique({
    where: { id },
    include: {
      category: true,
      series:   true,
      _count:   { select: { comments: true, likes: true, bookmarks: true } },
    },
  });
}

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

export async function getCategories() {
  return prismadb.blogCategory.findMany({
    where:   { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { posts: true } } },
  });
}

export async function getSeries() {
  return prismadb.blogSeries.findMany({
    where:   { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { posts: true } } },
  });
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createBlogPost(data: {
  title:            string;
  slug:             string;
  excerpt:          string;
  content:          string;
  status?:          BlogStatus;
  categoryId?:      string;
  seriesId?:        string;
  seriesOrder?:     number;
  coverImage?:      string;
  coverImageAlt?:   string;
  ogImage?:         string;
  metaTitle?:       string;
  metaDescription?: string;
  canonicalUrl?:    string;
  keywords?:        string;
  tags?:            string[];
  isFeatured?:      boolean;
  isPinned?:        boolean;
  isPremium?:       boolean;
  isIdeasLab?:      boolean;
  isToolsShowcase?: boolean;
  isLatest?:        boolean;
  isBuildInPublic?: boolean;
  scheduledAt?:     Date;
  authorId:         string;
  authorName:       string;
  authorImage?:     string;
  authorBio?:       string;
}) {
  const existing  = await prismadb.blogPost.findUnique({ where: { slug: data.slug } });
  const finalSlug = existing ? `${data.slug}-${Date.now()}` : data.slug;
  const toc       = generateTableOfContents(data.content);
  const wc        = calcWordCount(data.content);
  const rt        = calcReadingTime(data.content);

  const post = await prismadb.blogPost.create({
    data: {
      title:            data.title,
      slug:             finalSlug,
      excerpt:          data.excerpt,
      content:          data.content,
      status:           data.status ?? "DRAFT",
      categoryId:       data.categoryId   ?? null,
      seriesId:         data.seriesId     ?? null,
      seriesOrder:      data.seriesOrder  ?? null,
      coverImage:       data.coverImage   ?? null,
      coverImageAlt:    data.coverImageAlt ?? null,
      ogImage:          data.ogImage      ?? null,
      metaTitle:        data.metaTitle    ?? null,
      metaDescription:  data.metaDescription ?? null,
      canonicalUrl:     data.canonicalUrl ?? null,
      keywords:         data.keywords     ?? null,
      tags:             data.tags?.length ? JSON.stringify(data.tags) : null,
      isFeatured:       data.isFeatured   ?? false,
      isPinned:         data.isPinned     ?? false,
      isPremium:        data.isPremium    ?? false,
      isIdeasLab:       data.isIdeasLab   ?? false,
      isToolsShowcase:  data.isToolsShowcase ?? false,
      isLatest:           data.isLatest ?? false,
      isBuildInPublic:  data.isBuildInPublic ?? false,
      scheduledAt:      data.scheduledAt  ?? null,
      publishedAt:      data.status === "PUBLISHED" ? new Date() : null,
      authorId:         data.authorId,
      authorName:       data.authorName,
      authorImage:      data.authorImage  ?? null,
      authorBio:        data.authorBio    ?? null,
      tableOfContents:  toc,
      wordCount:        wc,
      readingTimeMinutes: rt,
    },
  });

  revalidatePath("/admin/[userId]/blog", "page");
  if (post.status === "PUBLISHED") revalidatePath("/blog", "page");
  return post;
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateBlogPost(
  id: string,
  data: Partial<{
    title:            string;
    slug:             string;
    excerpt:          string;
    content:          string;
    status:           BlogStatus;
    categoryId:       string | null;
    seriesId:         string | null;
    seriesOrder:      number | null;
    coverImage:       string | null;
    coverImageAlt:    string | null;
    coverImageCaption: string | null;
    ogImage:          string | null;
    metaTitle:        string | null;
    metaDescription:  string | null;
    canonicalUrl:     string | null;
    keywords:         string | null;
    tags:             string[];
    isFeatured:       boolean;
    isPinned:         boolean;
    isPremium:        boolean;
    isIdeasLab:       boolean;
    isToolsShowcase:  boolean;
    isLatest:           boolean;
    isBuildInPublic:  boolean;
    scheduledAt:      Date | null;
    authorBio:        string | null;
  }>
) {
  const existing = await prismadb.blogPost.findUnique({ where: { id }, select: { publishedAt: true, status: true, content: true, title: true, excerpt: true } });
  if (!existing) throw new Error("Post not found");

  // Save revision before update
  if (data.content !== undefined || data.title !== undefined) {
    await prismadb.blogRevision.create({
      data: {
        postId:  id,
        title:   existing.title,
        content: existing.content,
        revisedBy: "isaac",
      },
    });
  }

  // Recalculate metrics if content changed
//   const content = data.content ?? existing.content;
  const toc = data.content ? generateTableOfContents(data.content) : undefined;
  const wc  = data.content ? calcWordCount(data.content) : undefined;
  const rt  = data.content ? calcReadingTime(data.content) : undefined;

  // Handle publish date
  let publishedAt: Date | null | undefined;
  if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
    publishedAt = new Date();
  } else if (data.status === "DRAFT" || data.status === "ARCHIVED") {
    publishedAt = null;
  }

  const updated = await prismadb.blogPost.update({
    where: { id },
    data: {
      ...data,
      tags:             data.tags !== undefined ? JSON.stringify(data.tags) : undefined,
      tableOfContents:  toc,
      wordCount:        wc,
      readingTimeMinutes: rt,
      publishedAt,
    },
  });

  revalidatePath("/admin/[userId]/blog", "page");
  revalidatePath(`/blog/${updated.slug}`, "page");
  if (updated.status === "PUBLISHED") revalidatePath("/blog", "page");
  return updated;
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function softDeletePost(id: string) {
  await prismadb.blogPost.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/admin/[userId]/blog", "page");
  revalidatePath("/blog", "page");
}

export async function bulkSoftDelete(ids: string[]) {
  await prismadb.blogPost.updateMany({ where: { id: { in: ids } }, data: { deletedAt: new Date() } });
  revalidatePath("/admin/[userId]/blog", "page");
}

export async function restorePost(id: string) {
  await prismadb.blogPost.update({ where: { id }, data: { deletedAt: null } });
  revalidatePath("/admin/[userId]/blog", "page");
}

// ─── PUBLISH ─────────────────────────────────────────────────────────────────

export async function publishPost(id: string) {
  const post = await prismadb.blogPost.update({
    where: { id },
    data:  { status: "PUBLISHED", publishedAt: new Date() },
  });
  revalidatePath("/admin/[userId]/blog", "page");
  revalidatePath("/blog", "page");
  revalidatePath(`/blog/${post.slug}`, "page");
  return post;
}

export async function unpublishPost(id: string) {
  const post = await prismadb.blogPost.update({
    where: { id },
    data:  { status: "DRAFT", publishedAt: null },
  });
  revalidatePath("/admin/[userId]/blog", "page");
  revalidatePath("/blog", "page");
  revalidatePath(`/blog/${post.slug}`, "page");
  return post;
}

// ─── DUPLICATE ────────────────────────────────────────────────────────────────

export async function duplicateBlogPost(id: string) {
  const src = await prismadb.blogPost.findUnique({ where: { id } });
  if (!src) throw new Error("Not found");
  const copy = await prismadb.blogPost.create({
    data: {
      title:   `${src.title} (Copy)`,
      slug:    `${src.slug}-copy-${Date.now()}`,
      excerpt: src.excerpt,
      content: src.content,
      status:  "DRAFT",
      categoryId: src.categoryId,
      tags:    src.tags,
      coverImage: src.coverImage,
      metaTitle:  src.metaTitle,
      metaDescription: src.metaDescription,
      keywords:  src.keywords,
      authorId:  src.authorId,
      authorName: src.authorName,
      authorImage: src.authorImage,
      tableOfContents: src.tableOfContents,
      wordCount: src.wordCount,
      readingTimeMinutes: src.readingTimeMinutes,
    },
  });
  revalidatePath("/admin/[userId]/blog", "page");
  return copy;
}

// ─── REVISIONS ────────────────────────────────────────────────────────────────

export async function getRevisions(postId: string) {
  return prismadb.blogRevision.findMany({
    where:   { postId },
    orderBy: { createdAt: "desc" },
    take:    20,
  });
}

// ─── COMMENTS ─────────────────────────────────────────────────────────────────

export async function getComments({
  status,  postId, page = 1, pageSize = 30,
}: { status?: CommentStatus; postId?: string; page?: number; pageSize?: number } = {}) {
  const where = {
    deletedAt: null,
    ...(status && { status }),
    ...(postId && { postId }),
  };
  const [comments, total] = await Promise.all([
    prismadb.blogComment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: { post: { select: { title: true, slug: true } } },
    }),
    prismadb.blogComment.count({ where }),
  ]);
  return { comments, total, pages: Math.ceil(total / pageSize) };
}

export async function moderateComment(id: string, status: CommentStatus) {
  const updated = await prismadb.blogComment.update({
    where: { id },
    data:  { status, moderatedAt: new Date(), moderatedBy: "isaac" },
  });
  // Sync post comment count
  if (status === "APPROVED" || status === "REJECTED" || status === "SPAM") {
    const count = await prismadb.blogComment.count({ where: { postId: updated.postId, status: "APPROVED", deletedAt: null } });
    await prismadb.blogPost.update({ where: { id: updated.postId }, data: { commentCount: count } });
  }
  revalidatePath("/admin/[userId]/blog", "page");
  return updated;
}

export async function deleteComment(id: string) {
  await prismadb.blogComment.update({ where: { id }, data: { deletedAt: new Date() } });
  revalidatePath("/admin/[userId]/blog", "page");
}

// ─── SEO AUDIT ────────────────────────────────────────────────────────────────

export async function saveSeoAudit(postId: string, score: number, issues: string[], suggestions: string[]) {
  return prismadb.seoAudit.upsert({
    where:  { postId },
    create: { postId, score, issues: JSON.stringify(issues), suggestions: JSON.stringify(suggestions) },
    update: { score, issues: JSON.stringify(issues), suggestions: JSON.stringify(suggestions), lastAuditedAt: new Date() },
  });
}

// ─── SLUG GENERATOR ──────────────────────────────────────────────────────────

export async function generateUniqueBlogSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  const existing = await prismadb.blogPost.findUnique({ where: { slug: base } });
  return existing ? `${base}-${Date.now()}` : base;
}

// ─── CRON LOG ─────────────────────────────────────────────────────────────────

export async function getCronHistory() {
  // We use a JSON in SiteSetting for cron history — lightweight, no extra model
  const setting = await prismadb.siteSetting.findUnique({ where: { key: "blog_cron_history" } });
  if (!setting) return [];
  try { return JSON.parse(setting.value as string); } catch { return []; }
}

export async function saveCronHistory(history: Array<{ timestamp?: string; status?: string; message?: string }>) {
  await prismadb.siteSetting.upsert({
    where:  { key: "blog_cron_history" },
    create: { key: "blog_cron_history", value: JSON.stringify(history.slice(0, 30)) },
    update: { value: JSON.stringify(history.slice(0, 30)) },
  });
}

export async function getCronSettings() {
  const setting = await prismadb.siteSetting.findUnique({ where: { key: "blog_cron_settings" } });
  if (!setting) return {
    enabled: false, intervalDays: 7, lastRun: null,
    categories: ["AI", "Africa", "Technology", "Business"],
    autoPublish: false,
  };
  try { return JSON.parse(setting.value as string); } catch { return null; }
}

export async function saveCronSettings(settings: object) {
  await prismadb.siteSetting.upsert({
    where:  { key: "blog_cron_settings" },
    create: { key: "blog_cron_settings", value: JSON.stringify(settings) },
    update: { value: JSON.stringify(settings) },
  });
}