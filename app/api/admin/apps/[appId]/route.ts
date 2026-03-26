// =============================================================================
// isaacpaha.com — Single App API
// app/api/admin/apps/[appId]/route.ts
// GET    → full app with screenshots + changelog
// PATCH  → update fields | _action: toggleFeatured | duplicate
// DELETE → delete single (cascade)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import {
  getAppById, updateApp, deleteApp,
  toggleAppFeatured, duplicateApp,
  addScreenshot, updateScreenshot, deleteScreenshot, reorderScreenshots,
  addChangelog, updateChangelog, deleteChangelog,
} from "@/lib/actions/apps-actions";


async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({
    where: { clerkId: userId }, select: { role: true },
  });
  return user?.role === "ADMIN";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
    const { appId } = await params;

  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const app = await getAppById(appId);
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(app);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {

    const { appId } = await params;

  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  // Special actions
  if (body._action === "toggleFeatured") return NextResponse.json(await toggleAppFeatured(appId));
  if (body._action === "duplicate")      return NextResponse.json(await duplicateApp(appId));

  // Screenshot actions
  if (body._action === "addScreenshot") {
    const ss = await addScreenshot(appId, body.url, body.alt);
    return NextResponse.json(ss, { status: 201 });
  }
  if (body._action === "updateScreenshot") {
    const ss = await updateScreenshot(body.screenshotId, { alt: body.alt, order: body.order });
    return NextResponse.json(ss);
  }
  if (body._action === "deleteScreenshot") {
    await deleteScreenshot(body.screenshotId);
    return NextResponse.json({ ok: true });
  }
  if (body._action === "reorderScreenshots") {
    await reorderScreenshots(appId, body.orderedIds);
    return NextResponse.json({ ok: true });
  }

  // Changelog actions
  if (body._action === "addChangelog") {
    const entry = await addChangelog({
      appId: appId, version: body.version, title: body.title,
      description: body.description, type: body.type,
      releasedAt: new Date(body.releasedAt),
    });
    return NextResponse.json(entry, { status: 201 });
  }
  if (body._action === "updateChangelog") {
    const entry = await updateChangelog(body.changelogId, {
      version: body.version, title: body.title, description: body.description,
      type: body.type, releasedAt: body.releasedAt ? new Date(body.releasedAt) : undefined,
    });
    return NextResponse.json(entry);
  }
  if (body._action === "deleteChangelog") {
    await deleteChangelog(body.changelogId);
    return NextResponse.json({ ok: true });
  }

  // Default: update app fields
  const updated = await updateApp(appId, {
    ...body,
    techStack:  body.techStack  !== undefined ? body.techStack : undefined,
    launchDate: body.launchDate !== undefined
      ? (body.launchDate ? new Date(body.launchDate) : null)
      : undefined,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {

    const { appId } = await params;

  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteApp(appId);
  return NextResponse.json({ ok: true });
}