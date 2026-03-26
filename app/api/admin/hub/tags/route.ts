// app/api/admin/hub/tags/route.ts
// GET  → all tags with counts and linked entries
// PATCH { action: rename|delete|merge, ...params }
import { NextRequest, NextResponse } from "next/server";
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
  const entries = await prismadb.hubEntry.findMany({ select: { id: true, title: true, type: true, tags: true } });
  const tagMap: Record<string, { entries: { id: string; title: string; type: string }[]; types: Set<string> }> = {};
  for (const e of entries) {
    if (!e.tags) continue;
    try { (JSON.parse(e.tags) as string[]).forEach((tag) => {
      if (!tagMap[tag]) tagMap[tag] = { entries: [], types: new Set() };
      tagMap[tag].entries.push({ id: e.id, title: e.title, type: e.type });
      tagMap[tag].types.add(e.type);
    }); } catch {}
  }
  const tags = Object.entries(tagMap).map(([tag, data]) => ({ tag, count: data.entries.length, types: [...data.types], entries: data.entries }));
  return NextResponse.json({ tags });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, oldTag, newTag, tag, fromTag, intoTag } = await req.json();

  const applyToAll = async (matchTag: string, transform: (tags: string[]) => string[]) => {
    const entries = await prismadb.hubEntry.findMany({ where: { tags: { contains: matchTag } }, select: { id: true, tags: true } });
    for (const e of entries) {
      if (!e.tags) continue;
      try { await prismadb.hubEntry.update({ where: { id: e.id }, data: { tags: JSON.stringify(transform(JSON.parse(e.tags))) } }); } catch {}
    }
  };

  if (action === "rename") await applyToAll(oldTag, (tags) => tags.map((t) => t === oldTag ? newTag : t));
  else if (action === "delete") await applyToAll(tag, (tags) => tags.filter((t) => t !== tag));
  else if (action === "merge")  await applyToAll(fromTag, (tags) => [...new Set(tags.map((t) => t === fromTag ? intoTag : t))]);
  else return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  return NextResponse.json({ ok: true });
}