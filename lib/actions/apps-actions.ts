"use server";

// =============================================================================
// isaacpaha.com — Apps Server Actions
// lib/actions/apps-actions.ts
// =============================================================================

import { revalidatePath } from "next/cache";
import { prismadb }       from "../db";
import { AppStatus }      from "../generated/prisma/client";

// ─── STATS ────────────────────────────────────────────────────────────────────

export async function getAppStats() {
  const [total, byStatus, byCompany, totalUsersAgg, totalViewsAgg, topViewed] =
    await Promise.all([
      prismadb.app.count(),
      prismadb.app.groupBy({ by: ["status"], _count: { _all: true } }),
      prismadb.app.groupBy({ by: ["companyId"], _count: { _all: true } }),
      prismadb.app.aggregate({ _sum: { userCount: true } }),
      prismadb.app.aggregate({ _sum: { viewCount: true } }),
      prismadb.app.findMany({
        orderBy: { viewCount: "desc" },
        take:    5,
        select: {
          id:         true,
          name:       true,
          slug:       true,
          emoji:      true,
          status:     true,
          accentColor:true,
          userCount:  true,
          viewCount:  true,
          company:    { select: { name: true, flag: true } },
        },
      }),
    ]);

  return {
    total,
    live:       byStatus.find((b) => b.status === "LIVE")?._count._all          ?? 0,
    beta:       byStatus.find((b) => b.status === "BETA")?._count._all          ?? 0,
    inDev:      byStatus.find((b) => b.status === "IN_DEVELOPMENT")?._count._all ?? 0,
    comingSoon: byStatus.find((b) => b.status === "COMING_SOON")?._count._all   ?? 0,
    deprecated: byStatus.find((b) => b.status === "DEPRECATED")?._count._all    ?? 0,
    totalUsers: totalUsersAgg._sum.userCount ?? 0,
    totalViews: totalViewsAgg._sum.viewCount ?? 0,
    byStatus:   byStatus.map((b) => ({ status: b.status as AppStatus, count: b._count._all })),
    byCompany:  byCompany.map((b) => ({ companyId: b.companyId, count: b._count._all })),
    topViewed,
  };
}

// ─── LIST (used by admin client) ─────────────────────────────────────────────

export async function getApps({
  page      = 1,
  pageSize  = 20,
  status,
  companyId,
  search,
  isFeatured,
  sortBy    = "createdAt",
  sortOrder = "desc",
}: {
  page?:      number;
  pageSize?:  number;
  status?:    AppStatus | string;
  companyId?: string;
  search?:    string;
  isFeatured?:boolean;
  sortBy?:    "createdAt" | "updatedAt" | "name" | "viewCount" | "userCount" | "launchDate";
  sortOrder?: "asc" | "desc";
} = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    ...(status    && status    !== "ALL" && { status }),
    ...(companyId && companyId !== "ALL" && { companyId }),
    ...(isFeatured !== undefined && { isFeatured }),
    ...(search && {
      OR: [
        { name:        { contains: search } },  // no 'mode' — MariaDB doesn't support insensitive
        { tagline:     { contains: search } },
        { description: { contains: search } },
      ],
    }),
  };

  const [apps, total] = await Promise.all([
    prismadb.app.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: {
        company:    { select: { name: true, flag: true, slug: true } },
        categories: true,
        // ── techItems included so AppCard tech stack renders ──────────────────
        techItems:  { select: { name: true, category: true } },
        changelog:  {
          orderBy: { releasedAt: "desc" },
          take:    1,
          select:  { version: true, releasedAt: true },
        },
        // ── _count included so AppCard screenshot + changelog counts render ───
        _count: {
          select: {
            screenshots: true,
            changelog:   true,
          },
        },
      },
    }),
    prismadb.app.count({ where }),
  ]);

  // Normalise techItems → techStack for the client (client type uses techStack)
  const normalisedApps = apps.map((a) => ({
    ...a,
    techStack: a.techItems ?? [],
    category:  a.primaryCategory ?? "Other",
  }));
  console.log(`Fetched ${apps.length} apps from DB with filters - status: ${status}, companyId: ${companyId}, search: ${search}, isFeatured: ${isFeatured}`);

  return {
    apps:  normalisedApps,
    total,
    pages: Math.ceil(total / pageSize),
  };
}

// ─── SINGLE (full detail) ─────────────────────────────────────────────────────

export async function getAppById(id: string) {
  const app = await prismadb.app.findUnique({
    where:   { id },
    include: {
      company:     true,
      categories:  true,
      screenshots: { orderBy: { order: "asc" } },
      features:    { orderBy: { order: "asc" } },
      metrics:     { orderBy: { order: "asc" } },
      techItems:   true,
      changelog:   { orderBy: { releasedAt: "desc" } },
      integrations:true,
      pricingTiers:true,
      faqs:        { orderBy: { order: "asc" } },
      awards:      true,
      _count: {
        select: {
          screenshots: true,
          changelog:   true,
        },
      },
    },
  });
  if (!app) return null;
  // Normalise for client
  return {
    ...app,
    techStack: app.techItems ?? [],
    category:  app.primaryCategory ?? "Other",
  };
}

export async function getAppBySlug(slug: string) {
  const app = await prismadb.app.findUnique({
    where:   { slug },
    include: {
      company:     true,
      categories:  true,
      screenshots: { orderBy: { order: "asc" } },
      features:    { orderBy: { order: "asc" } },
      metrics:     { orderBy: { order: "asc" } },
      techItems:   true,
      changelog:   { orderBy: { releasedAt: "desc" } },
      integrations:true,
      pricingTiers:true,
      faqs:        { orderBy: { order: "asc" } },
      awards:      true,
      _count: {
        select: {
          screenshots: true,
          changelog:   true,
        },
      },
    },
  });
  if (!app) return null;
  return { ...app, techStack: app.techItems ?? [], category: app.primaryCategory ?? "Other" };
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

export async function createApp(data: {
  name:             string;
  slug:             string;
  tagline:          string;
  description:      string;
  fullDescription?: string | null;
  problemSolved?:   string | null;
  businessModel?:   string | null;
  targetUsers?:     string | null;
  nextMilestone?:   string | null;
  primaryCategory?: string | null;
  keywords?:        string[];
  status:           AppStatus;
  emoji?:           string;
  primaryColor?:    string;
  accentColor?:     string;
  icon?:            string | null;
  coverImage?:      string | null;
  logoImage?:       string | null;
  companyId:        string;
  liveUrl?:         string | null;
  appUrl?:          string | null;
  githubUrl?:       string | null;
  playStoreUrl?:    string | null;
  appStoreUrl?:     string | null;
  launchDate?:      Date | null;
  userCount?:       number;
  isFeatured?:      boolean;
  isNew?:           boolean;
  techStack?:       { name: string; category: string }[];
}) {
  const existing  = await prismadb.app.findUnique({ where: { slug: data.slug } });
  const finalSlug = existing ? `${data.slug}-${Date.now()}` : data.slug;

  const app = await prismadb.app.create({
    data: {
      name:            data.name,
      slug:            finalSlug,
      tagline:         data.tagline,
      description:     data.description,
      fullDescription: data.fullDescription  ?? null,
      problemSolved:   data.problemSolved    ?? null,
      businessModel:   data.businessModel    ?? null,
      targetUsers:     data.targetUsers      ?? null,
      nextMilestone:   data.nextMilestone    ?? null,
      primaryCategory: data.primaryCategory  ?? null,
      keywords:        JSON.stringify(data.keywords ?? []),
      status:          data.status,
      emoji:           data.emoji            ?? "📱",
      primaryColor:    data.primaryColor     ?? "#f59e0b",
      accentColor:     data.accentColor      ?? "#fbbf24",
      icon:            data.icon             ?? null,
      coverImage:      data.coverImage       ?? null,
      logoImage:       data.logoImage        ?? null,
      companyId:       data.companyId,
      liveUrl:         data.liveUrl          ?? null,
      appUrl:          data.appUrl           ?? null,
      githubUrl:       data.githubUrl        ?? null,
      playStoreUrl:    data.playStoreUrl      ?? null,
      appStoreUrl:     data.appStoreUrl       ?? null,
      launchDate:      data.launchDate        ?? null,
      userCount:       data.userCount         ?? 0,
      isFeatured:      data.isFeatured        ?? false,
      isNew:           data.isNew             ?? true,
      isPublished:     true,
      publishedAt:     new Date(),
      // Nested create tech items if provided
      ...(data.techStack?.length && {
        techItems: {
          createMany: {
            data: data.techStack.map((t) => ({ name: t.name, category: t.category })),
          },
        },
      }),
    },
    include: {
      company:   { select: { name: true, flag: true, slug: true } },
      techItems: { select: { name: true, category: true } },
      _count:    { select: { screenshots: true, changelog: true } },
    },
  });

  revalidatePath("/apps");
  revalidatePath("/admin/[userId]/apps", "page");
  return { ...app, techStack: app.techItems ?? [], category: app.primaryCategory ?? "Other" };
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateApp(
  id:   string,
  data: Partial<{
    name:            string;
    slug:            string;
    tagline:         string;
    description:     string;
    fullDescription: string | null;
    problemSolved:   string | null;
    businessModel:   string | null;
    targetUsers:     string | null;
    nextMilestone:   string | null;
    primaryCategory: string | null;
    status:          AppStatus;
    emoji:           string;
    primaryColor:    string;
    accentColor:     string;
    icon:            string | null;
    coverImage:      string | null;
    logoImage:       string | null;
    companyId:       string;
    liveUrl:         string | null;
    appUrl:          string | null;
    githubUrl:       string | null;
    playStoreUrl:    string | null;
    appStoreUrl:     string | null;
    userCount:       number;
    launchDate:      Date | null;
    isFeatured:      boolean;
    isNew:           boolean;
    // tech stack: replace all
    techStack:       { name: string; category: string }[];
  }>
) {
  const { techStack, ...rest } = data;

  // If techStack provided, replace all tech items
  if (techStack !== undefined) {
    await prismadb.appTechItem.deleteMany({ where: { appId: id } });
    if (techStack.length > 0) {
      await prismadb.appTechItem.createMany({
        data: techStack.map((t) => ({ appId: id, name: t.name, category: t.category })),
      });
    }
  }

  const updated = await prismadb.app.update({
    where: { id },
    data:  rest,
    include: {
      company:   { select: { name: true, flag: true, slug: true } },
      techItems: { select: { name: true, category: true } },
      _count:    { select: { screenshots: true, changelog: true } },
    },
  });

  revalidatePath("/apps");
  revalidatePath("/admin/[userId]/apps", "page");
  revalidatePath(`/apps/${updated.slug}`);
  return { ...updated, techStack: updated.techItems ?? [], category: updated.primaryCategory ?? "Other" };
}

// ─── TOGGLE FEATURED ─────────────────────────────────────────────────────────

export async function toggleAppFeatured(id: string) {
  const app = await prismadb.app.findUnique({ where: { id }, select: { isFeatured: true } });
  if (!app) throw new Error("App not found");
  const updated = await prismadb.app.update({
    where: { id },
    data:  { isFeatured: !app.isFeatured },
  });
  revalidatePath("/apps");
  revalidatePath("/admin/[userId]/apps", "page");
  return updated;
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteApp(id: string) {
  await prismadb.app.delete({ where: { id } });
  revalidatePath("/apps");
  revalidatePath("/admin/[userId]/apps", "page");
}

export async function bulkDeleteApps(ids: string[]) {
  await prismadb.app.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/apps");
  revalidatePath("/admin/[userId]/apps", "page");
}

// ─── DUPLICATE ────────────────────────────────────────────────────────────────

export async function duplicateApp(id: string) {
  const src = await prismadb.app.findUnique({
    where:   { id },
    include: { techItems: true },
  });
  if (!src) throw new Error("App not found");

  const copy = await prismadb.app.create({
    data: {
      name:            `${src.name} (Copy)`,
      slug:            `${src.slug}-copy-${Date.now()}`,
      tagline:         src.tagline,
      description:     src.description,
      fullDescription: src.fullDescription,
      problemSolved:   src.problemSolved,
      businessModel:   src.businessModel,
      targetUsers:     src.targetUsers,
      nextMilestone:   src.nextMilestone,
      primaryCategory: src.primaryCategory,
      keywords:        src.keywords,
      status:          "IN_DEVELOPMENT",
      emoji:           src.emoji,
      primaryColor:    src.primaryColor,
      accentColor:     src.accentColor,
      icon:            src.icon,
      companyId:       src.companyId,
      isFeatured:      false,
      isNew:           false,
      isPublished:     false,
    },
    include: {
      company:   { select: { name: true, flag: true, slug: true } },
      techItems: { select: { name: true, category: true } },
      _count:    { select: { screenshots: true, changelog: true } },
    },
  });

  revalidatePath("/admin/[userId]/apps", "page");
  return { ...copy, techStack: copy.techItems ?? [], category: copy.primaryCategory ?? "Other" };
}

// ─── SCREENSHOTS ─────────────────────────────────────────────────────────────

export async function addScreenshot(appId: string, url: string, alt?: string | null, label?: string | null) {
  const count = await prismadb.appScreenshot.count({ where: { appId } });
  return prismadb.appScreenshot.create({
    data: { appId, url, alt: alt ?? null, label: label ?? null, order: count },
  });
}

export async function deleteScreenshot(id: string) {
  await prismadb.appScreenshot.delete({ where: { id } });
}

// ─── CHANGELOG ───────────────────────────────────────────────────────────────

export async function addChangelog(data: {
  appId:       string;
  version:     string;
  title:       string;
  description: string;
  type:        string;
  releasedAt:  Date;
}) {
  return prismadb.appChangelog.create({ data });
}

export async function deleteChangelog(id: string) {
  await prismadb.appChangelog.delete({ where: { id } });
}

// ─── FEATURES ────────────────────────────────────────────────────────────────

export async function addFeature(appId: string, data: { icon?: string; title: string; description: string }) {
  const count = await prismadb.appFeature.count({ where: { appId } });
  return prismadb.appFeature.create({ data: { appId, ...data, order: count } });
}

export async function deleteFeature(id: string) {
  await prismadb.appFeature.delete({ where: { id } });
}

// ─── SLUG HELPER ─────────────────────────────────────────────────────────────

export async function generateAppSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const exists = await prismadb.app.findUnique({ where: { slug: base } });
  return exists ? `${base}-${Date.now()}` : base;
}



// "use server";

// // =============================================================================
// // isaacpaha.com — Apps Server Actions
// // lib/actions/apps.actions.ts
// // =============================================================================

// import { revalidatePath } from "next/cache";
// import { prismadb } from "../db";
// import { AppStatus } from "../generated/prisma/enums";


// // ─── STATS ───────────────────────────────────────────────────────────────────

// export async function getAppStats() {
//   const [total, byStatus, byCompany, totalUsersAgg, totalViewsAgg, topViewed] =
//     await Promise.all([
//       prismadb.app.count(),
//       prismadb.app.groupBy({ by: ["status"],  _count: { _all: true } }),
//       prismadb.app.groupBy({ by: ["company"], _count: { _all: true } }),
//       prismadb.app.aggregate({ _sum: { userCount: true } }),
//       prismadb.app.aggregate({ _sum: { viewCount: true } }),
//       prismadb.app.findMany({
//         orderBy: { viewCount: "desc" },
//         take:    5,
//         select:  { id: true, name: true, slug: true, emoji: true, status: true, company: true, userCount: true, viewCount: true, accentColor: true },
//       }),
//     ]);

//   return {
//     total,
//     live:       byStatus.find((b) => b.status === "LIVE")?.         _count._all ?? 0,
//     beta:       byStatus.find((b) => b.status === "BETA")?.         _count._all ?? 0,
//     inDev:      byStatus.find((b) => b.status === "IN_DEVELOPMENT")?._count._all ?? 0,
//     comingSoon: byStatus.find((b) => b.status === "COMING_SOON")?.  _count._all ?? 0,
//     deprecated: byStatus.find((b) => b.status === "DEPRECATED")?.   _count._all ?? 0,
//     totalUsers: totalUsersAgg._sum.userCount ?? 0,
//     totalViews: totalViewsAgg._sum.viewCount ?? 0,
//     byStatus:   byStatus.map((b) => ({ status: b.status as AppStatus, count: b._count._all })),
//     byCompany:  byCompany.map((b) => ({ company: b.company, count: b._count._all })),
//     topViewed,
//   };
// }

// // ─── LIST ─────────────────────────────────────────────────────────────────────

// export async function getApps({
//   page      = 1,
//   pageSize  = 20,
//   status,
//   company,
//   search,
//   isFeatured,
//   sortBy    = "createdAt",
//   sortOrder = "desc",
// }: {
//   page?:       number;
//   pageSize?:   number;
//   status?:     AppStatus;
//   company?:    string;
//   search?:     string;
//   isFeatured?: boolean;
//   sortBy?:     "createdAt" | "updatedAt" | "name" | "viewCount" | "userCount";
//   sortOrder?:  "asc" | "desc";
// } = {}) {
//   const where = {
//     ...(status     !== undefined && { status }),
//     ...(company    && company    !== "ALL" && { company }),
//     ...(isFeatured !== undefined && { isFeatured }),
//     ...(search && {
//       OR: [
//         { name:        { contains: search } },
//         { tagline:     { contains: search } },
//         { description: { contains: search } },
//         { category:    { contains: search } },
//         { company:     { contains: search } },
//       ],
//     }),
//   };

//   const [apps, total] = await Promise.all([
//     prismadb.app.findMany({
//       where,
//       orderBy: { [sortBy]: sortOrder },
//       skip:    (page - 1) * pageSize,
//       take:    pageSize,
//       include: {
//         _count:    { select: { screenshots: true, changelog: true } },
//         changelog: { orderBy: { releasedAt: "desc" }, take: 1, select: { version: true, releasedAt: true } },
//       },
//     }),
//     prismadb.app.count({ where }),
//   ]);

//   return { apps, total, pages: Math.ceil(total / pageSize) };
// }

// // ─── SINGLE ───────────────────────────────────────────────────────────────────

// export async function getAppById(id: string) {
//   return prismadb.app.findUnique({
//     where:   { id },
//     include: {
//       screenshots: { orderBy: { order: "asc" } },
//       changelog:   { orderBy: { releasedAt: "desc" } },
//     },
//   });
// }

// // ─── CREATE ───────────────────────────────────────────────────────────────────

// export async function createApp(data: {
//   name:             string;
//   slug:             string;
//   tagline:          string;
//   description:      string;
//   fullDescription?: string;
//   problemSolved?:   string;
//   businessModel?:   string;
//   targetUsers?:     string;
//   category:         string;
//   status:           AppStatus;
//   emoji?:           string;
//   coverImage?:      string | null;
//   logoImage?:       string | null;
//   accentColor?:     string;
//   isFeatured?:      boolean;
//   isNew?:           boolean;
//   company:          string;
//   companyFlag?:     string;
//   appUrl?:          string | null;
//   githubUrl?:       string | null;
//   playStoreUrl?:    string | null;
//   appStoreUrl?:     string | null;
//   techStack?:       string[];
//   userCount?:       number;
//   launchDate?:      Date | null;
// }) {
//   const existing  = await prismadb.app.findUnique({ where: { slug: data.slug } });
//   const finalSlug = existing ? `${data.slug}-${Date.now()}` : data.slug;

//   const app = await prismadb.app.create({
//     data: {
//       name:            data.name,
//       slug:            finalSlug,
//       tagline:         data.tagline,
//       description:     data.description,
//       fullDescription: data.fullDescription  ?? null,
//       problemSolved:   data.problemSolved    ?? "",
//       businessModel:   data.businessModel    ?? null,
//       targetUsers:     data.targetUsers      ?? null,
//       category:        data.category,
//       status:          data.status,
//       emoji:           data.emoji            ?? "📱",
//       coverImage:      data.coverImage       ?? null,
//       logoImage:       data.logoImage        ?? null,
//       accentColor:     data.accentColor      ?? "#f59e0b",
//       isFeatured:      data.isFeatured       ?? false,
//       isNew:           data.isNew            ?? true,
//       company:         data.company,
//       companyFlag:     data.companyFlag      ?? "🇬🇧",
//       appUrl:          data.appUrl           ?? null,
//       githubUrl:       data.githubUrl        ?? null,
//       playStoreUrl:    data.playStoreUrl     ?? null,
//       appStoreUrl:     data.appStoreUrl      ?? null,
//       techStack:       JSON.stringify(data.techStack ?? []),
//       userCount:       data.userCount        ?? 0,
//       launchDate:      data.launchDate       ?? null,
//     },
//   });

//   revalidatePath("/admin/[userId]/apps", "page");
//   revalidatePath("/apps", "page");
//   return app;
// }

// // ─── UPDATE ───────────────────────────────────────────────────────────────────

// export async function updateApp(
//   id: string,
//   data: Partial<{
//     name:            string;
//     slug:            string;
//     tagline:         string;
//     description:     string;
//     fullDescription: string | null;
//     problemSolved:   string;
//     businessModel:   string | null;
//     targetUsers:     string | null;
//     category:        string;
//     status:          AppStatus;
//     emoji:           string;
//     coverImage:      string | null;
//     logoImage:       string | null;
//     accentColor:     string;
//     isFeatured:      boolean;
//     isNew:           boolean;
//     company:         string;
//     companyFlag:     string;
//     appUrl:          string | null;
//     githubUrl:       string | null;
//     playStoreUrl:    string | null;
//     appStoreUrl:     string | null;
//     techStack:       string[];
//     userCount:       number;
//     launchDate:      Date | null;
//   }>
// ) {
//   const updated = await prismadb.app.update({
//     where: { id },
//     data:  {
//       name:            data.name,
//       slug:            data.slug,
//       tagline:         data.tagline,
//       description:     data.description,
//       fullDescription: data.fullDescription,
//       problemSolved:   data.problemSolved,
//       businessModel:   data.businessModel,
//       targetUsers:     data.targetUsers,
//       category:        data.category,
//       status:          data.status,
//       emoji:           data.emoji,
//       coverImage:      data.coverImage,
//       logoImage:       data.logoImage,
//       accentColor:     data.accentColor,
//       isFeatured:      data.isFeatured,
//       isNew:           data.isNew,
//       company:         data.company,
//       companyFlag:     data.companyFlag,
//       appUrl:          data.appUrl,
//       githubUrl:       data.githubUrl,
//       playStoreUrl:    data.playStoreUrl,
//       appStoreUrl:     data.appStoreUrl,
//       techStack:       data.techStack !== undefined ? JSON.stringify(data.techStack) : undefined,
//       userCount:       data.userCount,
//       launchDate:      data.launchDate,
//     },
//   });

//   revalidatePath("/admin/[userId]/apps", "page");
//   revalidatePath("/apps", "page");
//   revalidatePath(`/apps/${updated.slug}`, "page");
//   return updated;
// }

// // ─── TOGGLE FEATURED ─────────────────────────────────────────────────────────

// export async function toggleAppFeatured(id: string) {
//   const app = await prismadb.app.findUnique({ where: { id }, select: { isFeatured: true } });
//   if (!app) throw new Error("App not found");
//   if (!app.isFeatured) {
//     await prismadb.app.updateMany({ where: { isFeatured: true }, data: { isFeatured: false } });
//   }
//   const updated = await prismadb.app.update({ where: { id }, data: { isFeatured: !app.isFeatured } });
//   revalidatePath("/admin/[userId]/apps", "page");
//   revalidatePath("/apps", "page");
//   return updated;
// }

// // ─── DELETE ───────────────────────────────────────────────────────────────────

// export async function deleteApp(id: string) {
//   await prismadb.app.delete({ where: { id } });  // cascade: screenshots + changelog
//   revalidatePath("/admin/[userId]/apps", "page");
//   revalidatePath("/apps", "page");
// }

// export async function bulkDeleteApps(ids: string[]) {
//   await prismadb.app.deleteMany({ where: { id: { in: ids } } });
//   revalidatePath("/admin/[userId]/apps", "page");
//   revalidatePath("/apps", "page");
// }

// // ─── DUPLICATE ────────────────────────────────────────────────────────────────

// export async function duplicateApp(id: string) {
//   const src = await prismadb.app.findUnique({ where: { id } });
//   if (!src) throw new Error("Not found");
//   const copy = await prismadb.app.create({
//     data: {
//       name:            `${src.name} (Copy)`,
//       slug:            `${src.slug}-copy-${Date.now()}`,
//       tagline:         src.tagline,
//       description:     src.description,
//       fullDescription: src.fullDescription,
//       problemSolved:   src.problemSolved,
//       businessModel:   src.businessModel,
//       targetUsers:     src.targetUsers,
//       category:        src.category,
//       status:          "IN_DEVELOPMENT",
//       emoji:           src.emoji,
//       accentColor:     src.accentColor,
//       isFeatured:      false,
//       isNew:           false,
//       company:         src.company,
//       companyFlag:     src.companyFlag,
//       techStack:       src.techStack,
//     },
//   });
//   revalidatePath("/admin/[userId]/apps", "page");
//   return copy;
// }

// // ─── SLUG GENERATOR ───────────────────────────────────────────────────────────

// export async function generateAppSlug(name: string): Promise<string> {
//   const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
//   const exists = await prismadb.app.findUnique({ where: { slug: base } });
//   return exists ? `${base}-${Date.now()}` : base;
// }

// // ─── SCREENSHOTS ─────────────────────────────────────────────────────────────

// export async function addScreenshot(appId: string, url: string, alt?: string) {
//   const count = await prismadb.appScreenshot.count({ where: { appId } });
//   const ss = await prismadb.appScreenshot.create({
//     data: { appId, url, alt: alt ?? null, order: count },
//   });
//   revalidatePath("/admin/[userId]/apps", "page");
//   return ss;
// }

// export async function updateScreenshot(id: string, data: { alt?: string; order?: number }) {
//   return prismadb.appScreenshot.update({ where: { id }, data });
// }

// export async function deleteScreenshot(id: string) {
//   await prismadb.appScreenshot.delete({ where: { id } });
//   revalidatePath("/admin/[userId]/apps", "page");
// }

// export async function reorderScreenshots(appId: string, orderedIds: string[]) {
//   await Promise.all(orderedIds.map((id, idx) =>
//     prismadb.appScreenshot.update({ where: { id }, data: { order: idx } })
//   ));
//   revalidatePath("/admin/[userId]/apps", "page");
// }

// // ─── CHANGELOG ───────────────────────────────────────────────────────────────

// export async function addChangelog(data: {
//   appId: string; version: string; title: string;
//   description: string; type: string; releasedAt: Date;
// }) {
//   const entry = await prismadb.appChangelog.create({ data });
//   revalidatePath("/admin/[userId]/apps", "page");
//   return entry;
// }

// export async function updateChangelog(id: string, data: Partial<{
//   version: string; title: string; description: string; type: string; releasedAt: Date;
// }>) {
//   return prismadb.appChangelog.update({ where: { id }, data });
// }

// export async function deleteChangelog(id: string) {
//   await prismadb.appChangelog.delete({ where: { id } });
//   revalidatePath("/admin/[userId]/apps", "page");
// }