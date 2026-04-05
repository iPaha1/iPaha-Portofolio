// =============================================================================
// isaacpaha.com — Apps Admin API Route
// app/api/admin/apps/route.ts   (or wherever your API lives)
//
// GET    /api/admin/apps?page=1&pageSize=20&status=LIVE&company=...&search=...
// GET    /api/admin/apps?id=xxx          → single full app
// POST   /api/admin/apps                → create
// PATCH  /api/admin/apps?id=xxx         → update | _action: toggleFeatured | duplicate
// DELETE /api/admin/apps?id=xxx         → delete single
// DELETE /api/admin/apps  { ids: [] }   → bulk delete
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import {
  getApps, getAppById,
  createApp, updateApp,
  toggleAppFeatured, duplicateApp,
  deleteApp, bulkDeleteApps,
  addScreenshot, deleteScreenshot,
  addChangelog, deleteChangelog,
} from "@/lib/actions/apps-actions";
import { AppStatus } from "@/lib/generated/prisma/client";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const id = sp.get("id");

  // Single app fetch
  if (id) {
    const app = await getAppById(id);
    if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(app);
  }

  // List
  const result = await getApps({
    page:      Number(sp.get("page")     ?? 1),
    pageSize:  Number(sp.get("pageSize") ?? 20),
    status:    (sp.get("status")  as AppStatus) || undefined,
    companyId: sp.get("company")  || undefined,
    search:    sp.get("search")   || undefined,
    sortBy:    (sp.get("sortBy")  as any) ?? "createdAt",
    sortOrder: (sp.get("sortOrder") as "asc" | "desc") ?? "desc",
  });
  console.log("GET /api/admin/apps - fetched apps with filters:", {
    status: sp.get("status"),
    companyId: sp.get("company"),
    search: sp.get("search"),
    page: sp.get("page"),
    pageSize: sp.get("pageSize"),
    sortBy: sp.get("sortBy"),
    sortOrder: sp.get("sortOrder"),
  });
  


  return NextResponse.json(result);
}

// ─── POST — create ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body.name?.trim() || !body.tagline?.trim() || !body.companyId) {
    return NextResponse.json({ error: "name, tagline, and companyId are required" }, { status: 400 });
  }

  const slugBase = body.slug?.trim() || body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

  const app = await createApp({
    name:            body.name.trim(),
    slug:            slugBase,
    tagline:         body.tagline.trim(),
    description:     body.description?.trim()      ?? "",
    fullDescription: body.fullDescription?.trim()  ?? null,
    problemSolved:   body.problemSolved?.trim()    ?? null,
    businessModel:   body.businessModel?.trim()    ?? null,
    targetUsers:     body.targetUsers?.trim()      ?? null,
    nextMilestone:   body.nextMilestone?.trim()    ?? null,
    primaryCategory: body.category                 ?? null,
    status:          body.status                   ?? "IN_DEVELOPMENT",
    emoji:           body.emoji                    ?? "📱",
    primaryColor:    body.primaryColor             ?? "#f59e0b",
    accentColor:     body.accentColor              ?? "#fbbf24",
    icon:            body.icon                     ?? null,
    coverImage:      body.coverImage               ?? null,
    logoImage:       body.logoImage                ?? null,
    companyId:       body.companyId,
    liveUrl:         body.appUrl                   ?? null,
    appUrl:          body.appUrl                   ?? null,
    githubUrl:       body.githubUrl                ?? null,
    playStoreUrl:    body.playStoreUrl              ?? null,
    appStoreUrl:     body.appStoreUrl               ?? null,
    launchDate:      body.launchDate ? new Date(body.launchDate) : null,
    userCount:       Number(body.userCount ?? 0),
    isFeatured:      body.isFeatured               ?? false,
    isNew:           body.isNew                    ?? true,
    techStack:       body.techStack                ?? [],
  });

  return NextResponse.json({ ok: true, app }, { status: 201 });
}

// ─── PATCH — update / action ──────────────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp  = new URL(req.url).searchParams;
  const id  = sp.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json();

  // ── Special actions ────────────────────────────────────────────────────────
  if (body._action === "toggleFeatured") {
    return NextResponse.json(await toggleAppFeatured(id));
  }
  if (body._action === "duplicate") {
    return NextResponse.json(await duplicateApp(id));
  }
  if (body._action === "addScreenshot") {
    const ss = await addScreenshot(id, body.url, body.alt ?? null, body.label ?? null);
    return NextResponse.json(ss);
  }
  if (body._action === "deleteScreenshot") {
    await deleteScreenshot(body.screenshotId);
    return NextResponse.json({ ok: true });
  }
  if (body._action === "addChangelog") {
    const entry = await addChangelog({
      appId:       id,
      version:     body.version,
      title:       body.title,
      description: body.description ?? "",
      type:        body.type        ?? "feature",
      releasedAt:  body.releasedAt ? new Date(body.releasedAt) : new Date(),
    });
    return NextResponse.json(entry);
  }
  if (body._action === "deleteChangelog") {
    await deleteChangelog(body.changelogId);
    return NextResponse.json({ ok: true });
  }

  // ── Regular update ─────────────────────────────────────────────────────────
  const { _action, ...updateData } = body;

  const updated = await updateApp(id, {
    ...updateData,
    // Map category → primaryCategory (client sends 'category')
    primaryCategory: updateData.category ?? updateData.primaryCategory,
    launchDate:      updateData.launchDate ? new Date(updateData.launchDate) : null,
    userCount:       updateData.userCount !== undefined ? Number(updateData.userCount) : undefined,
    techStack:       updateData.techStack,
  });

  return NextResponse.json(updated);
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp  = new URL(req.url).searchParams;
  const id  = sp.get("id");

  // Bulk delete
  if (!id) {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids[] required" }, { status: 400 });
    }
    await bulkDeleteApps(ids);
    return NextResponse.json({ ok: true, deleted: ids.length });
  }

  await deleteApp(id);
  return NextResponse.json({ ok: true });
}




// // =============================================================================
// // isaacpaha.com — Apps List API
// // app/api/admin/apps/route.ts
// // GET    → paginated list with filters
// // POST   → create app
// // DELETE → bulk delete { ids[] }
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import { auth }                      from "@clerk/nextjs/server";
// import { prismadb } from "@/lib/db";
// import {
//   getApps, createApp, bulkDeleteApps, generateAppSlug,
// } from "@/lib/actions/apps-actions";
// import { AppStatus } from "@/lib/generated/prisma/enums";


// async function requireAdmin(): Promise<boolean> {
//   const { userId } = await auth();
//   if (!userId) return false;
//   const user = await prismadb.user.findUnique({
//     where: { clerkId: userId }, select: { role: true },
//   });
//   return user?.role === "ADMIN";
// }

// export async function GET(req: NextRequest) {
//   if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const sp = new URL(req.url).searchParams;
//   const result = await getApps({
//     page:      Number(sp.get("page")     ?? 1),
//     pageSize:  Number(sp.get("pageSize") ?? 20),
//     status:    (sp.get("status")  as AppStatus) || undefined,
//     company:   sp.get("company")  || undefined,
//     search:    sp.get("search")   || undefined,
//     sortBy:    (["createdAt", "updatedAt", "name", "userCount", "viewCount"].includes(sp.get("sortBy") ?? "")
//                 ? sp.get("sortBy")
//                 : "createdAt") as
//                 | "createdAt"
//                 | "updatedAt"
//                 | "name"
//                 | "userCount"
//                 | "viewCount"
//                 | undefined,
//     sortOrder: (["asc", "desc"].includes(sp.get("sortOrder") ?? "")
//                 ? sp.get("sortOrder")
//                 : "desc") as "asc" | "desc" | undefined,
//   });
//   return NextResponse.json(result);
// }

// export async function POST(req: NextRequest) {
//   if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//   const body = await req.json();
//   if (!body.name?.trim() || !body.tagline?.trim() || !body.company?.trim()) {
//     return NextResponse.json({ error: "Name, tagline and company are required" }, { status: 400 });
//   }

//   const slug = body.slug?.trim() || await generateAppSlug(body.name);
//   const app = await createApp({
//     name:            body.name.trim(),
//     slug,
//     tagline:         body.tagline.trim(),
//     description:     body.description?.trim()     ?? "",
//     fullDescription: body.fullDescription?.trim() ?? null,
//     problemSolved:   body.problemSolved?.trim()   ?? "",
//     businessModel:   body.businessModel?.trim()   ?? null,
//     targetUsers:     body.targetUsers?.trim()     ?? null,
//     category:        body.category                ?? "Other",
//     status:          body.status                  ?? "IN_DEVELOPMENT",
//     emoji:           body.emoji                   ?? "📱",
//     coverImage:      body.coverImage              ?? null,
//     logoImage:       body.logoImage               ?? null,
//     accentColor:     body.accentColor             ?? "#f59e0b",
//     isFeatured:      body.isFeatured              ?? false,
//     isNew:           body.isNew                   ?? true,
//     company:         body.company,
//     companyFlag:     body.companyFlag             ?? "🇬🇧",
//     appUrl:          body.appUrl                  ?? null,
//     githubUrl:       body.githubUrl               ?? null,
//     playStoreUrl:    body.playStoreUrl            ?? null,
//     appStoreUrl:     body.appStoreUrl             ?? null,
//     techStack:       body.techStack               ?? [],
//     userCount:       body.userCount               ?? 0,
//     launchDate:      body.launchDate ? new Date(body.launchDate) : null,
//   });
//   return NextResponse.json({ ok: true, app }, { status: 201 });
// }

// export async function DELETE(req: NextRequest) {
//   if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   const { ids } = await req.json();
//   if (!Array.isArray(ids) || ids.length === 0) {
//     return NextResponse.json({ error: "ids[] required" }, { status: 400 });
//   }
//   await bulkDeleteApps(ids);
//   return NextResponse.json({ ok: true, deleted: ids.length });
// }