// app/api/admin/hub/export/route.ts — GET ?format=json|csv&types=SNIPPET,PROMPT
import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import { HubEntryType } from "@/lib/generated/prisma/enums";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

const CSV_FIELDS = ["id","type","title","description","content","category","tags","language","framework",
  "technology","aiModel","httpMethod","endpointUrl","resourceUrl","resourceType","rating","author",
  "copyCount","viewCount","isFavourite","isPinned","createdAt","updatedAt"];

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp     = new URL(req.url).searchParams;
  const format = (sp.get("format") ?? "json") as "json"|"csv";
  const types  = sp.get("types")?.split(",").filter(Boolean);
  // Import your HubEntryType enum from Prisma client
  const entries = await prismadb.hubEntry.findMany({
    where: types?.length ? { type: { in: types as HubEntryType[] } } : undefined,
    orderBy: { createdAt: "asc" },
  });
  if (format === "json") {
    return new NextResponse(JSON.stringify(entries, null, 2), {
      headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="hub-export.json"` },
    });
  }
  type HubEntry = {
    [key: string]: string | number | boolean | null | undefined | Date;
  };

  const csv = [CSV_FIELDS.join(","), ...entries.map((e: HubEntry) =>
    CSV_FIELDS.map((f) => {
      const v = e[f]; if (v === null || v === undefined) return "";
      const s = String(v).replace(/"/g,'""');
      return s.includes(",") || s.includes("\n") || s.includes('"') ? `"${s}"` : s;
    }).join(",")
  )].join("\n");
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="hub-export.csv"` },
  });
}