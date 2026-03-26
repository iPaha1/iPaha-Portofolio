"use server";

// =============================================================================
// isaacpaha.com — Developer Hub Server Actions (Phase 2)
// lib/actions/hub.actions.ts
// =============================================================================

import { prismadb } from "../db";
import { revalidatePath } from "next/cache";
import type { HubEntryType, HubLanguage } from "../generated/prisma/enums";

// ─── CREATE DATA TYPE ─────────────────────────────────────────────────────────

export type HubEntryCreateData = {
  type:          HubEntryType;
  title:         string;
  description?:  string | null;
  content:       string;
  tags?:         string[];
  category?:     string | null;
  isFavourite?:  boolean;
  isPinned?:     boolean;
  // SNIPPET
  language?:     HubLanguage | null;
  framework?:    string | null;
  // PROMPT
  aiModel?:      string | null;
  exampleOutput?: string | null;
  // ERROR
  errorMessage?: string | null;
  solution?:     string | null;
  technology?:   string | null;
  // NOTE
  references?:   string | null;   // JSON string[]
  difficulty?:   string | null;
  // API
  httpMethod?:      string | null;
  endpointUrl?:     string | null;
  requestExample?:  string | null;
  responseExample?: string | null;
  apiHeaders?:      string | null; // JSON Record<string,string>
  authType?:        string | null;
  // PATTERN
  advantages?:    string | null;
  disadvantages?: string | null;
  useCases?:      string | null;
  relatedTech?:   string | null;  // JSON string[]
  diagramUrl?:    string | null;
  // TEMPLATE
  templateType?:  string | null;
  // PLAYBOOK
  steps?:          string | null; // JSON PlaybookStep[]
  estimatedTime?:  string | null;
  // RESOURCE
  resourceUrl?:   string | null;
  resourceType?:  string | null;
  rating?:        number | null;
  author?:        string | null;
};

export type HubEntryUpdateData = Partial<Omit<HubEntryCreateData, "type">>;

// ─── STATS ───────────────────────────────────────────────────────────────────

export async function getHubStats() {
  const [
    total, snippets, prompts, commands, errors,
    notes, apis, patterns, templates, playbooks, resources,
    favourites, pinned,
    mostCopied, byCategory,
  ] = await Promise.all([
    prismadb.hubEntry.count(),
    prismadb.hubEntry.count({ where: { type: "SNIPPET"  } }),
    prismadb.hubEntry.count({ where: { type: "PROMPT"   } }),
    prismadb.hubEntry.count({ where: { type: "COMMAND"  } }),
    prismadb.hubEntry.count({ where: { type: "ERROR"    } }),
    prismadb.hubEntry.count({ where: { type: "NOTE"     } }),
    prismadb.hubEntry.count({ where: { type: "API"      } }),
    prismadb.hubEntry.count({ where: { type: "PATTERN"  } }),
    prismadb.hubEntry.count({ where: { type: "TEMPLATE" } }),
    prismadb.hubEntry.count({ where: { type: "PLAYBOOK" } }),
    prismadb.hubEntry.count({ where: { type: "RESOURCE" } }),
    prismadb.hubEntry.count({ where: { isFavourite: true } }),
    prismadb.hubEntry.count({ where: { isPinned:    true } }),
    prismadb.hubEntry.findMany({
      orderBy: { copyCount: "desc" },
      take:    5,
      select:  { id: true, title: true, type: true, copyCount: true, category: true, language: true },
    }),
    prismadb.hubEntry.groupBy({
      by:      ["category"],
      _count:  { _all: true },
      orderBy: { _count: { category: "desc" } },
    }),
  ]);

  const totalCopiesAgg = await prismadb.hubEntry.aggregate({ _sum: { copyCount: true } });

  return {
    total, snippets, prompts, commands, errors,
    notes, apis, patterns, templates, playbooks, resources,
    favourites, pinned,
    totalCopies: totalCopiesAgg._sum.copyCount ?? 0,
    mostCopied,
    byCategory: byCategory
      .filter((b) => b.category !== null)
      .map((b) => ({ category: b.category as string, count: b._count._all })),
  };
}

// ─── LIST ─────────────────────────────────────────────────────────────────────

export async function getHubEntries({
  type,
  page      = 1,
  pageSize  = 30,
  search,
  category,
  language,
  isFavourite,
  isPinned,
  sortBy    = "createdAt",
  sortOrder = "desc",
}: {
  type?:        HubEntryType;
  page?:        number;
  pageSize?:    number;
  search?:      string;
  category?:    string;
  language?:    HubLanguage;
  isFavourite?: boolean;
  isPinned?:    boolean;
  sortBy?:      "createdAt" | "updatedAt" | "title" | "copyCount" | "viewCount";
  sortOrder?:   "asc" | "desc";
} = {}) {
  const where = {
    ...(type        !== undefined && { type }),
    ...(category                  && { category }),
    ...(language    !== undefined && { language }),
    ...(isFavourite !== undefined && { isFavourite }),
    ...(isPinned    !== undefined && { isPinned }),
    ...(search && {
      OR: [
        { title:           { contains: search } },
        { description:     { contains: search } },
        { content:         { contains: search } },
        { tags:            { contains: search } },
        { category:        { contains: search } },
        // Phase 1 specific
        { errorMessage:    { contains: search } },
        { solution:        { contains: search } },
        // Phase 2 specific
        { endpointUrl:     { contains: search } },
        { technology:      { contains: search } },
        { advantages:      { contains: search } },
        { useCases:        { contains: search } },
        { resourceUrl:     { contains: search } },
        { author:          { contains: search } },
      ],
    }),
  };

  const [entries, total] = await Promise.all([
    prismadb.hubEntry.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, { [sortBy]: sortOrder }],
      skip:    (page - 1) * pageSize,
      take:    pageSize,
    }),
    prismadb.hubEntry.count({ where }),
  ]);

  return { entries, total, pages: Math.ceil(total / pageSize) };
}

// ─── GLOBAL SEARCH ────────────────────────────────────────────────────────────

export async function globalHubSearch(query: string, limit = 6) {
  if (!query.trim()) {
    return {
      snippets: [], prompts: [], commands: [], errors: [],
      notes: [], apis: [], patterns: [], templates: [], playbooks: [], resources: [],
    };
  }

  const q = query.trim();
  const baseWhere = {
    OR: [
      { title:       { contains: q } },
      { description: { contains: q } },
      { content:     { contains: q } },
      { tags:        { contains: q } },
      { category:    { contains: q } },
    ],
  };

  const selectBase = { id: true, title: true, category: true, copyCount: true };

  const [snippets, prompts, commands, errors, notes, apis, patterns, templates, playbooks, resources] =
    await Promise.all([
      prismadb.hubEntry.findMany({ where: { ...baseWhere, type: "SNIPPET"  }, take: limit,
        select: { ...selectBase, language: true } }),
      prismadb.hubEntry.findMany({ where: { ...baseWhere, type: "PROMPT"   }, take: limit,
        select: { ...selectBase, aiModel: true } }),
      prismadb.hubEntry.findMany({ where: { ...baseWhere, type: "COMMAND"  }, take: limit,
        select: { ...selectBase } }),
      prismadb.hubEntry.findMany({ where: {
        OR: [
          ...baseWhere.OR,
          { errorMessage: { contains: q } },
          { solution:     { contains: q } },
          { technology:   { contains: q } },
        ], type: "ERROR",
      }, take: limit, select: { ...selectBase, technology: true } }),
      prismadb.hubEntry.findMany({ where: { ...baseWhere, type: "NOTE"     }, take: limit,
        select: { ...selectBase, difficulty: true } }),
      prismadb.hubEntry.findMany({ where: {
        OR: [
          ...baseWhere.OR,
          { endpointUrl: { contains: q } },
          { authType:    { contains: q } },
        ], type: "API",
      }, take: limit, select: { ...selectBase, httpMethod: true, endpointUrl: true } }),
      prismadb.hubEntry.findMany({ where: { ...baseWhere, type: "PATTERN"  }, take: limit,
        select: { ...selectBase } }),
      prismadb.hubEntry.findMany({ where: { ...baseWhere, type: "TEMPLATE" }, take: limit,
        select: { ...selectBase, templateType: true } }),
      prismadb.hubEntry.findMany({ where: { ...baseWhere, type: "PLAYBOOK" }, take: limit,
        select: { ...selectBase, estimatedTime: true } }),
      prismadb.hubEntry.findMany({ where: {
        OR: [
          ...baseWhere.OR,
          { resourceUrl: { contains: q } },
          { author:      { contains: q } },
        ], type: "RESOURCE",
      }, take: limit, select: { ...selectBase, resourceType: true, rating: true, author: true } }),
    ]);

  return { snippets, prompts, commands, errors, notes, apis, patterns, templates, playbooks, resources };
}

// ─── SINGLE ───────────────────────────────────────────────────────────────────

export async function getHubEntryById(id: string) {
  return prismadb.hubEntry.findUnique({ where: { id } });
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createHubEntry(data: HubEntryCreateData) {
  const entry = await prismadb.hubEntry.create({
    data: {
      type:            data.type,
      title:           data.title.trim(),
      description:     data.description?.trim() || null,
      content:         data.content.trim(),
      tags:            data.tags?.length ? JSON.stringify(data.tags) : null,
      category:        data.category?.trim()        || null,
      isFavourite:     data.isFavourite             ?? false,
      isPinned:        data.isPinned                ?? false,
      // SNIPPET
      language:        data.language                ?? null,
      framework:       data.framework?.trim()       || null,
      // PROMPT
      aiModel:         data.aiModel?.trim()         || null,
      exampleOutput:   data.exampleOutput?.trim()   || null,
      // ERROR
      errorMessage:    data.errorMessage?.trim()    || null,
      solution:        data.solution?.trim()        || null,
      technology:      data.technology?.trim()      || null,
      // NOTE
      references:      data.references              || null,
      difficulty:      data.difficulty?.trim()      || null,
      // API
      httpMethod:      data.httpMethod?.trim()      || null,
      endpointUrl:     data.endpointUrl?.trim()     || null,
      requestExample:  data.requestExample?.trim()  || null,
      responseExample: data.responseExample?.trim() || null,
      apiHeaders:      data.apiHeaders              || null,
      authType:        data.authType?.trim()        || null,
      // PATTERN
      advantages:      data.advantages?.trim()      || null,
      disadvantages:   data.disadvantages?.trim()   || null,
      useCases:        data.useCases?.trim()        || null,
      relatedTech:     data.relatedTech             || null,
      diagramUrl:      data.diagramUrl?.trim()      || null,
      // TEMPLATE
      templateType:    data.templateType?.trim()    || null,
      // PLAYBOOK
      steps:           data.steps                   || null,
      estimatedTime:   data.estimatedTime?.trim()   || null,
      // RESOURCE
      resourceUrl:     data.resourceUrl?.trim()     || null,
      resourceType:    data.resourceType?.trim()    || null,
      rating:          data.rating                  ?? null,
      author:          data.author?.trim()          || null,
    },
  });
  revalidatePath("/admin/[userId]/hub", "page");
  return entry;
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateHubEntry(id: string, data: HubEntryUpdateData) {
  const updated = await prismadb.hubEntry.update({
    where: { id },
    data: {
      title:           data.title?.trim(),
      description:     data.description?.trim()    || null,
      content:         data.content?.trim(),
      tags:            data.tags !== undefined ? (data.tags?.length ? JSON.stringify(data.tags) : null) : undefined,
      category:        data.category?.trim()        || null,
      isFavourite:     data.isFavourite,
      isPinned:        data.isPinned,
      language:        data.language               ?? null,
      framework:       data.framework?.trim()      || null,
      aiModel:         data.aiModel?.trim()        || null,
      exampleOutput:   data.exampleOutput?.trim()  || null,
      errorMessage:    data.errorMessage?.trim()   || null,
      solution:        data.solution?.trim()       || null,
      technology:      data.technology?.trim()     || null,
      references:      data.references             ?? null,
      difficulty:      data.difficulty?.trim()     || null,
      httpMethod:      data.httpMethod?.trim()     || null,
      endpointUrl:     data.endpointUrl?.trim()    || null,
      requestExample:  data.requestExample?.trim() || null,
      responseExample: data.responseExample?.trim()|| null,
      apiHeaders:      data.apiHeaders             ?? null,
      authType:        data.authType?.trim()       || null,
      advantages:      data.advantages?.trim()     || null,
      disadvantages:   data.disadvantages?.trim()  || null,
      useCases:        data.useCases?.trim()       || null,
      relatedTech:     data.relatedTech            ?? null,
      diagramUrl:      data.diagramUrl?.trim()     || null,
      templateType:    data.templateType?.trim()   || null,
      steps:           data.steps                  ?? null,
      estimatedTime:   data.estimatedTime?.trim()  || null,
      resourceUrl:     data.resourceUrl?.trim()    || null,
      resourceType:    data.resourceType?.trim()   || null,
      rating:          data.rating                 ?? null,
      author:          data.author?.trim()         || null,
    },
  });
  revalidatePath("/admin/[userId]/hub", "page");
  return updated;
}

// ─── TOGGLES ─────────────────────────────────────────────────────────────────

export async function toggleFavourite(id: string) {
  const entry = await prismadb.hubEntry.findUnique({ where: { id }, select: { isFavourite: true } });
  if (!entry) throw new Error("Not found");
  const updated = await prismadb.hubEntry.update({
    where: { id }, data: { isFavourite: !entry.isFavourite },
  });
  revalidatePath("/admin/[userId]/hub", "page");
  return updated;
}

export async function togglePin(id: string) {
  const entry = await prismadb.hubEntry.findUnique({ where: { id }, select: { isPinned: true } });
  if (!entry) throw new Error("Not found");
  const updated = await prismadb.hubEntry.update({
    where: { id }, data: { isPinned: !entry.isPinned },
  });
  revalidatePath("/admin/[userId]/hub", "page");
  return updated;
}

// ─── INCREMENT COPY COUNT ─────────────────────────────────────────────────────

export async function incrementCopyCount(id: string) {
  await prismadb.hubEntry.update({
    where: { id }, data: { copyCount: { increment: 1 } },
  }).catch(() => {});
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteHubEntry(id: string) {
  await prismadb.hubEntry.delete({ where: { id } });
  revalidatePath("/admin/[userId]/hub", "page");
}

export async function bulkDeleteHubEntries(ids: string[]) {
  await prismadb.hubEntry.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/admin/[userId]/hub", "page");
}

// ─── DUPLICATE ────────────────────────────────────────────────────────────────

export async function duplicateHubEntry(id: string) {
  const src = await prismadb.hubEntry.findUnique({ where: { id } });
  if (!src) throw new Error("Not found");
  const copy = await prismadb.hubEntry.create({
    data: {
      ...src,
      id:          undefined as string | undefined,
      title:       `${src.title} (Copy)`,
      isFavourite: false,
      isPinned:    false,
      copyCount:   0,
      viewCount:   0,
      createdAt:   undefined as string | undefined,
      updatedAt:   undefined as string | undefined,
    },
  });
  revalidatePath("/admin/[userId]/hub", "page");
  return copy;
}

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

export async function getHubCategories(type?: HubEntryType) {
  const groups = await prismadb.hubEntry.groupBy({
    by:    ["category"],
    where: { ...(type && { type }), category: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { category: "desc" } },
  });
  return groups
    .filter((g) => g.category !== null)
    .map((g) => ({ category: g.category as string, count: g._count._all }));
}