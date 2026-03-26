"use server";

// =============================================================================
// isaacpaha.com — Contact Server Actions
// lib/actions/contact.actions.ts
// =============================================================================

import { revalidatePath } from "next/cache";
import { prismadb } from "../db";

// ─── STATS ───────────────────────────────────────────────────────────────────

export async function getContactStats() {
  const [total, unread, unreplied, last7d, last30d, byType] = await Promise.all([
    prismadb.contactSubmission.count(),
    prismadb.contactSubmission.count({ where: { isRead: false } }),
    prismadb.contactSubmission.count({ where: { isReplied: false } }),
    prismadb.contactSubmission.count({
      where: { createdAt: { gte: new Date(Date.now() - 7  * 24 * 60 * 60 * 1000) } },
    }),
    prismadb.contactSubmission.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    prismadb.contactSubmission.groupBy({
      by:      ["type"],
      _count:  { _all: true },
      orderBy: { _count: { type: "desc" } },
    }),
  ]);

  return {
    total,
    unread,
    unreplied,
    last7d,
    last30d,
    byType: byType.map((b) => ({ type: b.type, count: b._count._all })),
  };
}

// ─── LIST ─────────────────────────────────────────────────────────────────────

export async function getSubmissions({
  page      = 1,
  pageSize  = 30,
  type,
  isRead,
  isReplied,
  search,
  sortBy    = "createdAt",
  sortOrder = "desc",
}: {
  page?:      number;
  pageSize?:  number;
  type?:      string;
  isRead?:    boolean;
  isReplied?: boolean;
  search?:    string;
  sortBy?:    "createdAt" | "name" | "type";
  sortOrder?: "asc" | "desc";
} = {}) {
  const where = {
    ...(type      !== undefined && { type }),
    ...(isRead    !== undefined && { isRead }),
    ...(isReplied !== undefined && { isReplied }),
    ...(search && {
      OR: [
        { name:    { contains: search } },
        { email:   { contains: search } },
        { message: { contains: search } },
        { company: { contains: search } },
        { subject: { contains: search } },
      ],
    }),
  };

  const [submissions, total] = await Promise.all([
    prismadb.contactSubmission.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
    }),
    prismadb.contactSubmission.count({ where }),
  ]);

  return { submissions, total, pages: Math.ceil(total / pageSize) };
}

// ─── SINGLE ───────────────────────────────────────────────────────────────────

export async function getSubmissionById(id: string) {
  return prismadb.contactSubmission.findUnique({ where: { id } });
}

// ─── MARK READ / UNREAD ───────────────────────────────────────────────────────

export async function markAsRead(id: string) {
  const updated = await prismadb.contactSubmission.update({
    where: { id },
    data:  { isRead: true },
  });
  revalidatePath("/admin/[userId]/contacts", "page");
  return updated;
}

export async function markAllRead() {
  await prismadb.contactSubmission.updateMany({
    where: { isRead: false },
    data:  { isRead: true },
  });
  revalidatePath("/admin/[userId]/contacts", "page");
}

// ─── MARK REPLIED / UNREPLIED ─────────────────────────────────────────────────

export async function markAsReplied(id: string) {
  const updated = await prismadb.contactSubmission.update({
    where: { id },
    data:  { isReplied: true, isRead: true, repliedAt: new Date() },
  });
  revalidatePath("/admin/[userId]/contacts", "page");
  return updated;
}

export async function markAsUnreplied(id: string) {
  const updated = await prismadb.contactSubmission.update({
    where: { id },
    data:  { isReplied: false, repliedAt: null },
  });
  revalidatePath("/admin/[userId]/contacts", "page");
  return updated;
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteSubmission(id: string) {
  await prismadb.contactSubmission.delete({ where: { id } });
  revalidatePath("/admin/[userId]/contacts", "page");
}

export async function bulkDelete(ids: string[]) {
  await prismadb.contactSubmission.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/admin/[userId]/contacts", "page");
}

// ─── VOLUME CHART ─────────────────────────────────────────────────────────────

export async function getSubmissionVolume(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows  = await prismadb.contactSubmission.findMany({
    where:   { createdAt: { gte: since } },
    select:  { createdAt: true, type: true },
    orderBy: { createdAt: "asc" },
  });

  const map: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    map[d.toISOString().slice(0, 10)] = 0;
  }
  for (const r of rows) {
    const key = r.createdAt.toISOString().slice(0, 10);
    if (key in map) map[key]++;
  }

  return Object.entries(map).map(([date, count]) => ({ date, count }));
}

// ─── AVG REPLY TIME ───────────────────────────────────────────────────────────

export async function getAvgReplyTime() {
  const replied = await prismadb.contactSubmission.findMany({
    where:   { isReplied: true, repliedAt: { not: null } },
    select:  { createdAt: true, repliedAt: true },
    take:    50,
    orderBy: { repliedAt: "desc" },
  });

  if (replied.length === 0) return null;

  const avgMs = replied.reduce((sum, r) =>
    sum + (r.repliedAt!.getTime() - r.createdAt.getTime()), 0
  ) / replied.length;

  const hours = Math.round(avgMs / (1000 * 60 * 60));
  return hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`;
}