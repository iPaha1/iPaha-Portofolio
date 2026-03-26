"use server";

// =============================================================================
// isaacpaha.com — Newsletter Server Actions
// lib/actions/newsletter.actions.ts
// All database operations for the newsletter admin.
// =============================================================================

import { revalidatePath } from "next/cache";
import { prismadb } from "../db";
import { NewsletterStatus } from "../generated/prisma/enums";

// ─── SUBSCRIBER ACTIONS ───────────────────────────────────────────────────────

export async function getSubscriberStats() {
  const [total, active, unsubscribed, bounced, last30d, last7d] =
    await Promise.all([
      prismadb.newsletterSubscriber.count(),
      prismadb.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
      prismadb.newsletterSubscriber.count({ where: { status: "UNSUBSCRIBED" } }),
      prismadb.newsletterSubscriber.count({ where: { status: "BOUNCED" } }),
      prismadb.newsletterSubscriber.count({
        where: {
          subscribedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prismadb.newsletterSubscriber.count({
        where: {
          subscribedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

  return { total, active, unsubscribed, bounced, last30d, last7d };
}

export async function getSubscribers({
  page = 1,
  pageSize = 50,
  status,
  search,
  sortBy = "subscribedAt",
  sortOrder = "desc",
}: {
  page?: number;
  pageSize?: number;
  status?: NewsletterStatus;
  search?: string;
  sortBy?: "subscribedAt" | "email" | "firstName";
  sortOrder?: "asc" | "desc";
}) {
  const where = {
    ...(status && { status }),
    ...(search && {
      OR: [
        { email:     { contains: search } },
        { firstName: { contains: search } },
      ],
    }),
  };

  const [subscribers, total] = await Promise.all([
    prismadb.newsletterSubscriber.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: {
        user: {
          select: { displayName: true, avatarUrl: true, role: true },
        },
      },
    }),
    prismadb.newsletterSubscriber.count({ where }),
  ]);

  return { subscribers, total, pages: Math.ceil(total / pageSize) };
}

export async function updateSubscriberStatus(
  id: string,
  status: NewsletterStatus
) {
  const updated = await prismadb.newsletterSubscriber.update({
    where: { id },
    data:  {
      status,
      ...(status === "UNSUBSCRIBED" && { unsubscribedAt: new Date() }),
    },
  });
  revalidatePath("/admin/[userId]/newsletter", "page");
  return updated;
}

export async function deleteSubscriber(id: string) {
  await prismadb.newsletterSubscriber.delete({ where: { id } });
  revalidatePath("/admin/[userId]/newsletter", "page");
}

export async function addSubscriber(data: {
  email: string;
  firstName?: string;
  source?: string;
}) {
  const existing = await prismadb.newsletterSubscriber.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    // Re-activate if previously unsubscribed
    if (existing.status !== "ACTIVE") {
      return prismadb.newsletterSubscriber.update({
        where: { id: existing.id },
        data:  { status: "ACTIVE", unsubscribedAt: null },
      });
    }
    return existing;
  }

  const subscriber = await prismadb.newsletterSubscriber.create({
    data: {
      email:      data.email,
      firstName:  data.firstName ?? null,
      source:     data.source ?? "admin",
      status:     "ACTIVE",
    },
  });
  revalidatePath("/admin/[userId]/newsletter", "page");
  return subscriber;
}

export async function importSubscribers(
  rows: { email: string; firstName?: string }[]
) {
  let imported = 0;
  let skipped  = 0;

  for (const row of rows) {
    if (!row.email || !row.email.includes("@")) { skipped++; continue; }
    try {
      await prismadb.newsletterSubscriber.upsert({
        where:  { email: row.email.toLowerCase().trim() },
        create: {
          email:     row.email.toLowerCase().trim(),
          firstName: row.firstName ?? null,
          source:    "import",
          status:    "ACTIVE",
        },
        update: {
          firstName: row.firstName ?? undefined,
        },
      });
      imported++;
    } catch {
      skipped++;
    }
  }

  revalidatePath("/admin/[userId]/newsletter", "page");
  return { imported, skipped };
}

// Source breakdown for analytics
export async function getSubscriberSources() {
  const sources = await prismadb.newsletterSubscriber.groupBy({
    by:      ["source"],
    _count:  { _all: true },
    where:   { status: "ACTIVE" },
    orderBy: { _count: { source: "desc" } },
  });

  return sources.map((s) => ({
    source: s.source ?? "unknown",
    count:  s._count._all,
  }));
}

// Growth data: new subscribers per day for last N days
export async function getSubscriberGrowth(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows  = await prismadb.newsletterSubscriber.findMany({
    where:   { subscribedAt: { gte: since } },
    select:  { subscribedAt: true },
    orderBy: { subscribedAt: "asc" },
  });

  // Bucket by date string
  const map: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000);
    map[d.toISOString().slice(0, 10)] = 0;
  }
  for (const r of rows) {
    const key = r.subscribedAt.toISOString().slice(0, 10);
    if (key in map) map[key]++;
  }

  return Object.entries(map).map(([date, count]) => ({ date, count }));
}

// ─── EDITION ACTIONS ──────────────────────────────────────────────────────────

export async function getEditions({
  page = 1,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  const [editions, total] = await Promise.all([
    prismadb.newsletterEdition.findMany({
      orderBy: { issueNumber: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
    }),
    prismadb.newsletterEdition.count(),
  ]);

  return { editions, total, pages: Math.ceil(total / pageSize) };
}

export async function getEditionById(id: string) {
  return prismadb.newsletterEdition.findUnique({ where: { id } });
}

export async function createEdition(data: {
  title:       string;
  slug:        string;
  preview:     string;
  content:     string;
  contentHtml?: string;
}) {
  // Auto-increment issue number
  const latest = await prismadb.newsletterEdition.findFirst({
    orderBy: { issueNumber: "desc" },
    select:  { issueNumber: true },
  });
  const issueNumber = (latest?.issueNumber ?? 0) + 1;

  const edition = await prismadb.newsletterEdition.create({
    data: { ...data, issueNumber },
  });
  revalidatePath("/admin/[userId]/newsletter", "page");
  return edition;
}

export async function updateEdition(
  id: string,
  data: Partial<{
    title:       string;
    slug:        string;
    preview:     string;
    content:     string;
    contentHtml: string;
  }>
) {
  const edition = await prismadb.newsletterEdition.update({
    where: { id },
    data,
  });
  revalidatePath("/admin/[userId]/newsletter", "page");
  return edition;
}

export async function deleteEdition(id: string) {
  await prismadb.newsletterEdition.delete({ where: { id } });
  revalidatePath("/admin/[userId]/newsletter", "page");
}

export async function markEditionSent(id: string, recipientCount: number) {
  return prismadb.newsletterEdition.update({
    where: { id },
    data:  { sentAt: new Date(), recipientCount },
  });
}

// Next issue number preview (for "New Edition" form)
export async function getNextIssueNumber() {
  const latest = await prismadb.newsletterEdition.findFirst({
    orderBy: { issueNumber: "desc" },
    select:  { issueNumber: true },
  });
  return (latest?.issueNumber ?? 0) + 1;
}