// =============================================================================
// isaacpaha.com — Job Tracker: Applications API
// app/api/tools/job-tracker/applications/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import {
  getApplications, getApplicationStats, createApplication,
  bulkDeleteApplications,
} from  "@/lib/tools/actions/job-tracker-actions";


export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to track applications" }, { status: 401 });

  const sp = new URL(req.url).searchParams;

  if (sp.get("stats") === "true") {
    const stats = await getApplicationStats();
    return NextResponse.json(stats);
  }

  const result = await getApplications({
    status:    (sp.get("status")    as any) || undefined,
    sector:    sp.get("sector")             || undefined,
    search:    sp.get("search")             || undefined,
    sortBy:    (sp.get("sortBy")    as any) || "appliedAt",
    sortOrder: (sp.get("sortOrder") as any) || "desc",
    page:      Number(sp.get("page")        || 1),
    pageSize:  Number(sp.get("pageSize")    || 50),
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to save applications" }, { status: 401 });

  const body = await req.json();
  if (!body.jobTitle?.trim()) {
    return NextResponse.json({ error: "Job title is required" }, { status: 400 });
  }

  const app = await createApplication(body);
  return NextResponse.json({ ok: true, application: app }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ids } = await req.json();
  if (!Array.isArray(ids) || !ids.length) {
    return NextResponse.json({ error: "ids[] required" }, { status: 400 });
  }

  await bulkDeleteApplications(ids);
  return NextResponse.json({ ok: true });
}