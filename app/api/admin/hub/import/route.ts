// app/api/admin/hub/import/route.ts — POST { entries[] }
import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { entries } = await req.json();
  if (!Array.isArray(entries) || entries.length === 0) return NextResponse.json({ error: "entries[] required" }, { status: 400 });
  let created = 0; const errors: string[] = [];
  for (const e of entries) {
    try {
      await prismadb.hubEntry.create({ data: {
        type: e.type, title: String(e.title ?? "").trim(), content: String(e.content ?? "").trim(),
        description: e.description || null, tags: e.tags ? (Array.isArray(e.tags) ? JSON.stringify(e.tags) : e.tags) : null,
        category: e.category || null, isFavourite: Boolean(e.isFavourite), isPinned: false,
        language: e.language || null, framework: e.framework || null, aiModel: e.aiModel || null,
        exampleOutput: e.exampleOutput || null, errorMessage: e.errorMessage || null,
        solution: e.solution || null, technology: e.technology || null,
        references: e.references || null, difficulty: e.difficulty || null,
        httpMethod: e.httpMethod || null, endpointUrl: e.endpointUrl || null,
        requestExample: e.requestExample || null, responseExample: e.responseExample || null,
        apiHeaders: e.apiHeaders || null, authType: e.authType || null,
        advantages: e.advantages || null, disadvantages: e.disadvantages || null,
        useCases: e.useCases || null, relatedTech: e.relatedTech || null, diagramUrl: e.diagramUrl || null,
        templateType: e.templateType || null, steps: e.steps || null, estimatedTime: e.estimatedTime || null,
        resourceUrl: e.resourceUrl || null, resourceType: e.resourceType || null,
        rating: e.rating ? Number(e.rating) : null, author: e.author || null,
      }});
      created++;
    } catch (err: unknown) { errors.push(`"${e.title}": ${(err as Error).message}`); }
  }
  return NextResponse.json({ ok: true, created, errors: errors.slice(0, 5) });
}