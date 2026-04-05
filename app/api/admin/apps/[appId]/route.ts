// =============================================================================
// isaacpaha.com — Single App API
// app/api/admin/apps/[appId]/route.ts
// GET    → full app with screenshots + changelog
// PATCH  → update fields | _action: toggleFeatured | duplicate
// DELETE → delete single (cascade)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";


async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  
  const user = await prismadb.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;

  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const app = await prismadb.app.findUnique({
    where: { id: appId, deletedAt: null },
    include: {
      company: true,
      categories: true,
      screenshots: {
        orderBy: { order: "asc" },
      },
      features: {
        orderBy: { order: "asc" },
      },
      metrics: {
        orderBy: { order: "asc" },
      },
      techItems: true,
      changelog: {
        orderBy: { releasedAt: "desc" },
      },
      integrations: true,
      pricingTiers: {
        orderBy: { price: "asc" },
      },
      faqs: {
        orderBy: { order: "asc" },
      },
      awards: true,
      updates: {
        orderBy: { publishedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Transform to match AppFull type
  const transformedApp = {
    ...app,
    category: app.primaryCategory || "Other",
    techStack: JSON.parse(app.keywords as string || "[]"),
    screenshots: app.screenshots,
    changelog: app.changelog,
    features: app.features,
    metrics: app.metrics,
    techItems: app.techItems,
    integrations: app.integrations,
    pricingTiers: app.pricingTiers,
    faqs: app.faqs,
    awards: app.awards,
    updates: app.updates,
  };

  return NextResponse.json(transformedApp);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;

  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  try {
    // Handle special actions
    if (body._action === "toggleFeatured") {
      const app = await prismadb.app.findUnique({
        where: { id: appId },
        select: { isFeatured: true }
      });
      
      if (!app) {
        return NextResponse.json({ error: "App not found" }, { status: 404 });
      }

      // If setting as featured, unfeature all others
      if (!app.isFeatured) {
        await prismadb.app.updateMany({
          where: { isFeatured: true },
          data: { isFeatured: false },
        });
      }

      const updated = await prismadb.app.update({
        where: { id: appId },
        data: { isFeatured: !app.isFeatured },
      });
      
      return NextResponse.json(updated);
    }

    if (body._action === "duplicate") {
      const src = await prismadb.app.findUnique({
        where: { id: appId },
        include: {
          categories: true,
          features: true,
          metrics: true,
          techItems: true,
        },
      });
      
      if (!src) {
        return NextResponse.json({ error: "App not found" }, { status: 404 });
      }

      const copy = await prismadb.app.create({
        data: {
          name: `${src.name} (Copy)`,
          slug: `${src.slug}-copy-${Date.now()}`,
          tagline: src.tagline,
          description: src.description,
          fullDescription: src.fullDescription,
          problemSolved: src.problemSolved,
          businessModel: src.businessModel,
          targetUsers: src.targetUsers,
          nextMilestone: src.nextMilestone,
          primaryCategory: src.primaryCategory,
          keywords: src.keywords,
          status: "IN_DEVELOPMENT",
          emoji: src.emoji,
          primaryColor: src.primaryColor,
          accentColor: src.accentColor,
          icon: src.icon,
          companyId: src.companyId,
          isFeatured: false,
          isPublished: false,
        },
      });
      
      return NextResponse.json(copy);
    }

    // Screenshot actions
    if (body._action === "addScreenshot") {
      const count = await prismadb.appScreenshot.count({
        where: { appId },
      });
      
      const screenshot = await prismadb.appScreenshot.create({
        data: {
          appId,
          url: body.url,
          alt: body.alt || null,
          order: count,
        },
      });
      
      return NextResponse.json(screenshot, { status: 201 });
    }

    if (body._action === "deleteScreenshot") {
      await prismadb.appScreenshot.delete({
        where: { id: body.screenshotId },
      });
      
      return NextResponse.json({ ok: true });
    }

    // Changelog actions
    if (body._action === "addChangelog") {
      const entry = await prismadb.appChangelog.create({
        data: {
          appId,
          version: body.version,
          title: body.title,
          description: body.description || "",
          type: body.type || "feature",
          releasedAt: new Date(body.releasedAt),
        },
      });
      
      return NextResponse.json(entry, { status: 201 });
    }

    if (body._action === "deleteChangelog") {
      await prismadb.appChangelog.delete({
        where: { id: body.changelogId },
      });
      
      return NextResponse.json({ ok: true });
    }

    // Regular app update
    const updateData: any = { ...body };
    
    // Handle tech stack (keywords)
    if (body.techStack !== undefined) {
      updateData.keywords = JSON.stringify(body.techStack);
      delete updateData.techStack;
    }
    
    // Handle launch date
    if (body.launchDate !== undefined) {
      updateData.launchDate = body.launchDate ? new Date(body.launchDate) : null;
    }
    
    // Handle category mapping
    if (body.category !== undefined) {
      updateData.primaryCategory = body.category;
      delete updateData.category;
    }
    
    // Remove fields that shouldn't be updated directly
    delete updateData._action;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.company;
    delete updateData.screenshots;
    delete updateData.changelog;
    delete updateData.features;
    delete updateData.metrics;
    delete updateData.techItems;
    
    const updated = await prismadb.app.update({
      where: { id: appId },
      data: updateData,
      include: {
        company: true,
        screenshots: true,
        changelog: true,
      },
    });
    
    // Transform response
    const transformed = {
      ...updated,
      category: updated.primaryCategory,
      techStack: JSON.parse(updated.keywords as string || "[]"),
    };
    
    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Failed to update app:", error);
    return NextResponse.json(
      { error: "Failed to update app" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const { appId } = await params;

  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Soft delete - just set deletedAt
    await prismadb.app.update({
      where: { id: appId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete app:", error);
    return NextResponse.json(
      { error: "Failed to delete app" },
      { status: 500 }
    );
  }
}






// // =============================================================================
// // isaacpaha.com — Single App API
// // app/api/admin/apps/[appId]/route.ts
// // GET    → full app with screenshots + changelog
// // PATCH  → update fields | _action: toggleFeatured | duplicate
// // DELETE → delete single (cascade)
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import { auth }                      from "@clerk/nextjs/server";
// import { prismadb } from "@/lib/db";
// import {
//   getAppById, updateApp, deleteApp,
//   toggleAppFeatured, duplicateApp,
//   addScreenshot, updateScreenshot, deleteScreenshot, reorderScreenshots,
//   addChangelog, updateChangelog, deleteChangelog,
// } from "@/lib/actions/apps-actions";


// async function requireAdmin(): Promise<boolean> {
//   const { userId } = await auth();
//   if (!userId) return false;
//   const user = await prismadb.user.findUnique({
//     where: { clerkId: userId }, select: { role: true },
//   });
//   return user?.role === "ADMIN";
// }

// export async function GET(
//   _req: NextRequest,
//   { params }: { params: Promise<{ appId: string }> }
// ) {
//     const { appId } = await params;

//   if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   const app = await getAppById(appId);
//   if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
//   return NextResponse.json(app);
// }

// export async function PATCH(
//   req: NextRequest,
//   { params }: { params: Promise<{ appId: string }> }
// ) {

//     const { appId } = await params;

//   if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   const body = await req.json();

//   // Special actions
//   if (body._action === "toggleFeatured") return NextResponse.json(await toggleAppFeatured(appId));
//   if (body._action === "duplicate")      return NextResponse.json(await duplicateApp(appId));

//   // Screenshot actions
//   if (body._action === "addScreenshot") {
//     const ss = await addScreenshot(appId, body.url, body.alt);
//     return NextResponse.json(ss, { status: 201 });
//   }
//   if (body._action === "updateScreenshot") {
//     const ss = await updateScreenshot(body.screenshotId, { alt: body.alt, order: body.order });
//     return NextResponse.json(ss);
//   }
//   if (body._action === "deleteScreenshot") {
//     await deleteScreenshot(body.screenshotId);
//     return NextResponse.json({ ok: true });
//   }
//   if (body._action === "reorderScreenshots") {
//     await reorderScreenshots(appId, body.orderedIds);
//     return NextResponse.json({ ok: true });
//   }

//   // Changelog actions
//   if (body._action === "addChangelog") {
//     const entry = await addChangelog({
//       appId: appId, version: body.version, title: body.title,
//       description: body.description, type: body.type,
//       releasedAt: new Date(body.releasedAt),
//     });
//     return NextResponse.json(entry, { status: 201 });
//   }
//   if (body._action === "updateChangelog") {
//     const entry = await updateChangelog(body.changelogId, {
//       version: body.version, title: body.title, description: body.description,
//       type: body.type, releasedAt: body.releasedAt ? new Date(body.releasedAt) : undefined,
//     });
//     return NextResponse.json(entry);
//   }
//   if (body._action === "deleteChangelog") {
//     await deleteChangelog(body.changelogId);
//     return NextResponse.json({ ok: true });
//   }

//   // Default: update app fields
//   const updated = await updateApp(appId, {
//     ...body,
//     techStack:  body.techStack  !== undefined ? body.techStack : undefined,
//     launchDate: body.launchDate !== undefined
//       ? (body.launchDate ? new Date(body.launchDate) : null)
//       : undefined,
//   });
//   return NextResponse.json(updated);
// }

// export async function DELETE(
//   _req: NextRequest,
//   { params }: { params: Promise<{ appId: string }> }
// ) {

//     const { appId } = await params;

//   if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   await deleteApp(appId);
//   return NextResponse.json({ ok: true });
// }