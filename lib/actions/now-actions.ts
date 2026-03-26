"use server";

// =============================================================================
// isaacpaha.com — Now Page Server Actions
// lib/actions/now.actions.ts
// Covers: NowPage, TimelineEvent, KnowledgeItem, AskIsaacQuestion
// =============================================================================

import { prismadb }       from "@/lib/db";
import { revalidatePath } from "next/cache";
import type {
  TimelineType, KnowledgeType,
} from "@/lib/generated/prisma/enums";

// ─────────────────────────────────────────────────────────────────────────────
// NOW PAGE (monthly entries)
// ─────────────────────────────────────────────────────────────────────────────

export async function getNowStats() {
  const [totalEntries, published, totalTimeline, totalKnowledge, totalQuestions] =
    await Promise.all([
      prismadb.nowPage.count(),
      prismadb.nowPage.count({ where: { isPublished: true } }),
      prismadb.timelineEvent.count(),
      prismadb.knowledgeItem.count(),
      prismadb.askIsaacQuestion.count(),
    ]);
  return { totalEntries, published, drafts: totalEntries - published, totalTimeline, totalKnowledge, totalQuestions };
}

export async function getNowEntries() {
  return prismadb.nowPage.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });
}

export async function getNowEntry(id: string) {
  return prismadb.nowPage.findUnique({ where: { id } });
}

export async function getNowEntryByMonthYear(month: number, year: number) {
  return prismadb.nowPage.findUnique({ where: { month_year: { month, year } } });
}

export async function createNowEntry(data: {
  month:       number;
  year:        number;
  title:       string;
  content:     string;
  isPublished?: boolean;
}) {
  const entry = await prismadb.nowPage.create({
    data: {
      month:       data.month,
      year:        data.year,
      title:       data.title,
      content:     data.content,
      isPublished: data.isPublished ?? false,
      publishedAt: data.isPublished ? new Date() : null,
    },
  });
  revalidatePath("/admin/[userId]/now", "page");
  revalidatePath("/now", "page");
  return entry;
}

export async function updateNowEntry(
  id: string,
  data: Partial<{ title: string; content: string; isPublished: boolean; month: number; year: number }>
) {
  let publishedAt: Date | null | undefined;
  if (data.isPublished === true) {
    const existing = await prismadb.nowPage.findUnique({ where: { id }, select: { publishedAt: true } });
    if (!existing?.publishedAt) publishedAt = new Date();
  } else if (data.isPublished === false) {
    publishedAt = null;
  }

  const updated = await prismadb.nowPage.update({
    where: { id },
    data: { ...data, publishedAt },
  });
  revalidatePath("/admin/[userId]/now", "page");
  revalidatePath("/now", "page");
  return updated;
}

export async function deleteNowEntry(id: string) {
  await prismadb.nowPage.delete({ where: { id } });
  revalidatePath("/admin/[userId]/now", "page");
  revalidatePath("/now", "page");
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE EVENTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getTimelineEvents() {
  return prismadb.timelineEvent.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }, { sortOrder: "asc" }],
  });
}

export async function createTimelineEvent(data: {
  year:         number;
  month?:       number;
  title:        string;
  description:  string;
  type:         TimelineType;
  icon?:        string;
  imageUrl?:    string;
  link?:        string;
  isHighlight?: boolean;
  sortOrder?:   number;
}) {
  const event = await prismadb.timelineEvent.create({
    data: {
      year:        data.year,
      month:       data.month ?? null,
      title:       data.title,
      description: data.description,
      type:        data.type,
      icon:        data.icon        ?? null,
      imageUrl:    data.imageUrl    ?? null,
      link:        data.link        ?? null,
      isHighlight: data.isHighlight ?? false,
      sortOrder:   data.sortOrder   ?? 0,
    },
  });
  revalidatePath("/admin/[userId]/now", "page");
  return event;
}

export async function updateTimelineEvent(id: string, data: Partial<{
  year: number; month: number | null; title: string; description: string;
  type: TimelineType; icon: string; imageUrl: string; link: string;
  isHighlight: boolean; sortOrder: number;
}>) {
  const updated = await prismadb.timelineEvent.update({ where: { id }, data });
  revalidatePath("/admin/[userId]/now", "page");
  return updated;
}

export async function deleteTimelineEvent(id: string) {
  await prismadb.timelineEvent.delete({ where: { id } });
  revalidatePath("/admin/[userId]/now", "page");
}

// ─────────────────────────────────────────────────────────────────────────────
// KNOWLEDGE ITEMS
// ─────────────────────────────────────────────────────────────────────────────

export async function getKnowledgeItems({
  type, search, isRecommended,
}: { type?: KnowledgeType; search?: string; isRecommended?: boolean } = {}) {
  return prismadb.knowledgeItem.findMany({
    where: {
      ...(type          && { type }),
      ...(isRecommended !== undefined && { isRecommended }),
      ...(search && {
        OR: [
          { title:       { contains: search } },
          { author:      { contains: search } },
          { description: { contains: search } },
        ],
      }),
    },
    orderBy: [{ isFeatured: "desc" }, { finishedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function createKnowledgeItem(data: {
  title:          string;
  author?:        string;
  type:           KnowledgeType;
  url?:           string;
  imageUrl?:      string;
  description?:   string;
  notes?:         string;
  rating?:        number;
  isRecommended?: boolean;
  isFeatured?:    boolean;
  finishedAt?:    Date;
  startedAt?:     Date;
  tags?:          string[];
}) {
  const item = await prismadb.knowledgeItem.create({
    data: {
      title:         data.title,
      author:        data.author        ?? null,
      type:          data.type,
      url:           data.url           ?? null,
      imageUrl:      data.imageUrl      ?? null,
      description:   data.description  ?? null,
      notes:         data.notes         ?? null,
      rating:        data.rating        ?? null,
      isRecommended: data.isRecommended ?? false,
      isFeatured:    data.isFeatured    ?? false,
      finishedAt:    data.finishedAt    ?? null,
      startedAt:     data.startedAt     ?? null,
      tags:          data.tags?.length  ? JSON.stringify(data.tags) : null,
    },
  });
  revalidatePath("/admin/[userId]/now", "page");
  return item;
}

export async function updateKnowledgeItem(id: string, data: Partial<{
  title: string; author: string; type: KnowledgeType; url: string;
  imageUrl: string; description: string; notes: string;
  rating: number | null; isRecommended: boolean; isFeatured: boolean;
  finishedAt: Date | null; startedAt: Date | null; tags: string[];
}>) {
  const updated = await prismadb.knowledgeItem.update({
    where: { id },
    data: {
      ...data,
      tags: data.tags !== undefined ? JSON.stringify(data.tags) : undefined,
    },
  });
  revalidatePath("/admin/[userId]/now", "page");
  return updated;
}

export async function deleteKnowledgeItem(id: string) {
  await prismadb.knowledgeItem.delete({ where: { id } });
  revalidatePath("/admin/[userId]/now", "page");
}

// ─────────────────────────────────────────────────────────────────────────────
// ASK ISAAC QUESTIONS (read-only from Now admin — managed via separate page)
// ─────────────────────────────────────────────────────────────────────────────

export async function getRecentQuestions(limit = 10) {
  return prismadb.askIsaacQuestion.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true, askerName: true, question: true, status: true,
      isPublic: true, createdAt: true,
    },
  });
}