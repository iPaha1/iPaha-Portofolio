"use server";

// =============================================================================
// isaacpaha.com — Social Media Server Actions
// lib/actions/social.actions.ts
// Covers: SocialConnection, SocialPost, SocialSettings, SocialTokens, Cron
// =============================================================================

import { prismadb }       from "@/lib/db";
import { revalidatePath } from "next/cache";

// ─── Types ────────────────────────────────────────────────────────────────────

// type SocialPlatform = "TWITTER" | "LINKEDIN" | "FACEBOOK" | "INSTAGRAM" | "THREADS" | "TIKTOK" | "YOUTUBE";
export type PostStatus     = "draft" | "scheduled" | "published" | "failed";

// ─── STATS ───────────────────────────────────────────────────────────────────

export async function getSocialStats() {
  const [
    connections, totalPosts, published, drafts, scheduled, failed,
    totalLikes, totalShares, totalImpressions, recentPosts,
  ] = await Promise.all([
    prismadb.socialConnection.findMany({
      select: { id: true, platform: true, handle: true, isActive: true, followerCount: true, lastPostedAt: true },
    }),
    prismadb.socialPost.count(),
    prismadb.socialPost.count({ where: { status: "published" } }),
    prismadb.socialPost.count({ where: { status: "draft"     } }),
    prismadb.socialPost.count({ where: { status: "scheduled" } }),
    prismadb.socialPost.count({ where: { status: "failed"    } }),
    prismadb.socialPost.aggregate({ _sum: { likes: true   } }),
    prismadb.socialPost.aggregate({ _sum: { shares: true  } }),
    prismadb.socialPost.aggregate({ _sum: { impressions: true } }),
    prismadb.socialPost.findMany({
      orderBy: { createdAt: "desc" },
      take:    10,
      select: {
        id: true, platform: true, content: true, status: true,
        likes: true, shares: true, impressions: true,
        publishedAt: true, scheduledFor: true, createdAt: true,
      },
    }),
  ]);

  return {
    connections,
    connectedCount: connections.filter((c) => c.isActive).length,
    totalPosts, published, drafts, scheduled, failed,
    totalLikes:       totalLikes._sum.likes       ?? 0,
    totalShares:      totalShares._sum.shares     ?? 0,
    totalImpressions: totalImpressions._sum.impressions ?? 0,
    recentPosts,
  };
}

// ─── CONNECTIONS ──────────────────────────────────────────────────────────────

export async function getConnections() {
  return prismadb.socialConnection.findMany({
    orderBy: { connectedAt: "asc" },
    include: { _count: { select: { posts: true } } },
  });
}

export async function getConnection(platform: string) {
  return prismadb.socialConnection.findFirst({ where: { platform: platform as any } });
}

export async function upsertConnection(data: {
  platform:     string;
  handle?:      string;
  accessToken:  string;
  refreshToken?: string;
  tokenExpiry?:  Date;
  profileUrl?:   string;
  followerCount?: number;
}) {
  const conn = await prismadb.socialConnection.upsert({
    where:  { platform: data.platform as any },
    create: {
      platform:     data.platform as any,
      handle:       data.handle       ?? null,
      accessToken:  data.accessToken,
      refreshToken: data.refreshToken ?? null,
      tokenExpiry:  data.tokenExpiry  ?? null,
      profileUrl:   data.profileUrl   ?? null,
      followerCount: data.followerCount ?? null,
      isActive:     true,
    },
    update: {
      handle:       data.handle       ?? undefined,
      accessToken:  data.accessToken,
      refreshToken: data.refreshToken ?? undefined,
      tokenExpiry:  data.tokenExpiry  ?? undefined,
      profileUrl:   data.profileUrl   ?? undefined,
      followerCount: data.followerCount ?? undefined,
      isActive:     true,
      updatedAt:    new Date(),
    },
  });
  revalidatePath("/admin/[userId]/social", "page");
  return conn;
}

export async function disconnectPlatform(platform: string) {
  await prismadb.socialConnection.updateMany({
    where: { platform: platform as any },
    data:  { isActive: false, accessToken: "", refreshToken: null },
  });
  revalidatePath("/admin/[userId]/social", "page");
}

export async function updateConnectionStats(platform: string, followerCount: number) {
  await prismadb.socialConnection.updateMany({
    where: { platform: platform as any },
    data:  { followerCount, updatedAt: new Date() },
  });
}

// ─── POSTS ────────────────────────────────────────────────────────────────────

export async function getSocialPosts({
  page     = 1,
  pageSize = 20,
  platform,
  status,
  search,
}: {
  page?:     number;
  pageSize?: number;
  platform?: string;
  status?:   PostStatus;
  search?:   string;
} = {}) {
  const where = {
    ...(platform && { platform: platform as any }),
    ...(status   && { status }),
    ...(search   && { content: { contains: search } }),
  };
  const [posts, total] = await Promise.all([
    prismadb.socialPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: { connection: { select: { handle: true, profileUrl: true } } },
    }),
    prismadb.socialPost.count({ where }),
  ]);
  return { posts, total, pages: Math.ceil(total / pageSize) };
}

export async function getSocialPostById(id: string) {
  return prismadb.socialPost.findUnique({
    where:   { id },
    include: { connection: true },
  });
}

export async function createSocialPost(data: {
  connectionId:  string;
  platform:      string;
  content:       string;
  mediaUrls?:    string[];
  blogPostId?:   string;
  scheduledFor?: Date;
  status?:       PostStatus;
}) {
  const post = await prismadb.socialPost.create({
    data: {
      connectionId:  data.connectionId,
      platform:      data.platform as any,
      content:       data.content,
      mediaUrls:     data.mediaUrls?.length ? JSON.stringify(data.mediaUrls) : null,
      blogPostId:    data.blogPostId  ?? null,
      scheduledFor:  data.scheduledFor ?? null,
      status:        data.status ?? "draft",
    },
  });
  console.log("Created Post:", post)
  revalidatePath("/admin/[userId]/social", "page");
  return post;
}

export async function updateSocialPost(id: string, data: {
  content?:     string;
  mediaUrls?:   string[];
  scheduledFor?: Date | null;
  status?:      PostStatus;
  platformPostId?: string;
  likes?:       number;
  shares?:      number;
  comments?:    number;
  impressions?: number;
}) {
  const updated = await prismadb.socialPost.update({
    where: { id },
    data:  {
      ...data,
      mediaUrls:   data.mediaUrls !== undefined ? JSON.stringify(data.mediaUrls) : undefined,
      publishedAt: data.status === "published" ? new Date() : undefined,
    },
  });
  revalidatePath("/admin/[userId]/social", "page");
  return updated;
}

export async function deleteSocialPost(id: string) {
  await prismadb.socialPost.delete({ where: { id } });
  revalidatePath("/admin/[userId]/social", "page");
}

export async function bulkDeleteSocialPosts(ids: string[]) {
  await prismadb.socialPost.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/admin/[userId]/social", "page");
}

export async function duplicateSocialPost(id: string) {
  const src = await prismadb.socialPost.findUnique({ where: { id } });
  if (!src) throw new Error("Post not found");
  const copy = await prismadb.socialPost.create({
    data: {
      connectionId: src.connectionId,
      platform:     src.platform,
      content:      src.content,
      mediaUrls:    src.mediaUrls,
      status:       "draft",
    },
  });
  revalidatePath("/admin/[userId]/social", "page");
  return copy;
}

// ─── SOCIAL SETTINGS ─────────────────────────────────────────────────────────

export async function getSocialSettings() {
  const setting = await prismadb.siteSetting.findUnique({ where: { key: "social_settings" } });
  if (!setting) return {
    autoPostTwitter:   false,
    autoPostFacebook:  false,
    autoPostInstagram: false,
    autoPostLinkedin:  false,
    autoPostThreads:   false,
    twitterTemplate:   "",
    facebookTemplate:  "",
    instagramTemplate: "",
    linkedinTemplate:  "",
    threadsTemplate:   "",
  };
  try { return JSON.parse(setting.value); } catch { return {}; }
}

export async function saveSocialSettings(settings: object) {
  await prismadb.siteSetting.upsert({
    where:  { key: "social_settings" },
    create: { key: "social_settings", value: JSON.stringify(settings) },
    update: { value: JSON.stringify(settings) },
  });
  revalidatePath("/admin/[userId]/social", "page");
}

// ─── SOCIAL CRON ─────────────────────────────────────────────────────────────

export async function getSocialCronSettings() {
  const s = await prismadb.siteSetting.findUnique({ where: { key: "social_cron_settings" } });
  if (!s) return {
    enabled:     false,
    intervalHours: 24,
    platforms:   ["TWITTER", "LINKEDIN"],
    autoPublish: false,
    topics:      ["AI", "Africa", "Building in Public", "Startups"],
    lastRun:     null,
  };
  try { return JSON.parse(s.value); } catch { return null; }
}

export async function saveSocialCronSettings(settings: object) {
  await prismadb.siteSetting.upsert({
    where:  { key: "social_cron_settings" },
    create: { key: "social_cron_settings", value: JSON.stringify(settings) },
    update: { value: JSON.stringify(settings) },
  });
}

export async function getSocialCronHistory() {
  const s = await prismadb.siteSetting.findUnique({ where: { key: "social_cron_history" } });
  if (!s) return [];
  try { return JSON.parse(s.value); } catch { return []; }
}

export async function saveSocialCronHistory(history: any[]) {
  await prismadb.siteSetting.upsert({
    where:  { key: "social_cron_history" },
    create: { key: "social_cron_history", value: JSON.stringify(history.slice(0, 50)) },
    update: { value: JSON.stringify(history.slice(0, 50)) },
  });
}

// ─── CONTEXT GATHERING (for AI) ───────────────────────────────────────────────

export async function gatherContextForAI(): Promise<string> {
  const [nowEntries, knowledgeItems, recentPosts, recentSocial] = await Promise.all([
    prismadb.nowPage.findMany({
      where: { isPublished: true },
      orderBy: [{ year: "desc" }, { month: "desc" }],
      take: 1,
      select: { title: true, content: true },
    }),
    prismadb.knowledgeItem.findMany({
      where: { isRecommended: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { title: true, author: true, type: true, notes: true },
    }),
    prismadb.blogPost.findMany({
      where: { status: "PUBLISHED", deletedAt: null },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: { title: true, excerpt: true, tags: true },
    }),
    prismadb.socialPost.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      take: 5,
      select: { platform: true, content: true, likes: true, impressions: true },
    }),
  ]);

  const sections: string[] = [];

  if (nowEntries[0]) {
    sections.push(`## What Isaac is doing right now\n${nowEntries[0].title}\n${nowEntries[0].content.slice(0, 500)}…`);
  }
  if (knowledgeItems.length) {
    sections.push(`## Recently reading / learning\n${knowledgeItems.map((k) => `- ${k.title} by ${k.author ?? "Unknown"}`).join("\n")}`);
  }
  if (recentPosts.length) {
    sections.push(`## Recent blog topics\n${recentPosts.map((p) => `- ${p.title}: ${p.excerpt?.slice(0, 80) ?? ""}`).join("\n")}`);
  }
  if (recentSocial.length) {
    const topPost = recentSocial.sort((a, b) => (b.impressions ?? 0) - (a.impressions ?? 0))[0];
    sections.push(`## Top recent social post (${topPost.impressions?.toLocaleString()} impressions)\n"${topPost.content.slice(0, 150)}"`);
  }

  return sections.join("\n\n");
}