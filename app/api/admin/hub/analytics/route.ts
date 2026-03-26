// =============================================================================
// isaacpaha.com — Hub Analytics API
// app/api/admin/hub/analytics/route.ts
// GET → aggregated analytics: top copied/viewed, by type, by category, tags, activity
// =============================================================================

import { NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [topCopied, topViewed, byType, byCategory, allEntries] = await Promise.all([
    prismadb.hubEntry.findMany({ orderBy: { copyCount: "desc" }, take: 10,
      select: { id: true, title: true, type: true, copyCount: true, category: true } }),
    prismadb.hubEntry.findMany({ orderBy: { viewCount: "desc" }, take: 10,
      select: { id: true, title: true, type: true, viewCount: true, category: true } }),
    prismadb.hubEntry.groupBy({ by: ["type"], _count: { _all: true }, _sum: { copyCount: true, viewCount: true } }),
    prismadb.hubEntry.groupBy({ by: ["category"], _count: { _all: true }, _sum: { copyCount: true },
      where: { category: { not: null } } }),
    prismadb.hubEntry.findMany({ select: { id: true, title: true, type: true, createdAt: true, updatedAt: true, tags: true }, orderBy: { updatedAt: "desc" } }),
  ]);

  // Daily copies placeholder (last 30 days)
  const dailyCopies: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    dailyCopies.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }

  // Weekly creation counts (last 12 weeks)
  const weeklyMap: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d  = new Date(Date.now() - i * 7 * 86400000);
    const wk = `W${String(Math.ceil(d.getDate() / 7)).padStart(2,"0")} ${d.toLocaleDateString("en-GB",{month:"short"})}`;
    weeklyMap[wk] = 0;
  }
  allEntries.forEach((e) => {
    const d  = new Date(e.createdAt);
    const wk = `W${String(Math.ceil(d.getDate() / 7)).padStart(2,"0")} ${d.toLocaleDateString("en-GB",{month:"short"})}`;
    if (wk in weeklyMap) weeklyMap[wk]++;
  });

  // Tag cloud
  const tagFreq: Record<string, number> = {};
  allEntries.forEach((e) => {
    if (!e.tags) return;
    try { (JSON.parse(e.tags) as string[]).forEach((t) => { tagFreq[t] = (tagFreq[t] ?? 0) + 1; }); } catch {}
  });
  const tagCloud = Object.entries(tagFreq).sort(([,a],[,b]) => b-a).slice(0,50).map(([tag,count]) => ({ tag, count }));

  const recentActivity = allEntries.slice(0, 15).map((e) => ({
    id: e.id, title: e.title, type: e.type as string, action: "updated",
    at: new Date(e.updatedAt).toLocaleDateString("en-GB",{ day:"numeric", month:"short" }),
  }));

  return NextResponse.json({
    topCopied, topViewed,
    byType:     byType.map((b) => ({ type: b.type, count: b._count._all, copies: b._sum.copyCount ?? 0, views: b._sum.viewCount ?? 0 })),
    byCategory: byCategory.filter((b) => b.category !== null).map((b) => ({ category: b.category!, count: b._count._all, copies: b._sum.copyCount ?? 0 })),
    tagCloud, dailyCopies,
    weeklyCreated: Object.entries(weeklyMap).map(([week,count]) => ({ week, count })),
    recentActivity,
  });
}