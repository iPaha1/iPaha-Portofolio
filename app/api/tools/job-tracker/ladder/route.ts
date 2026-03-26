// =============================================================================
// app/api/tools/job-tracker/ladder/route.ts
// GET ?mine=true → my ladder entry
// GET            → public ladder (paginated)
// =============================================================================

import { getLadder, getMyLadderEntry } from "@/lib/tools/actions/job-tracker-actions";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;

  if (sp.get("mine") === "true") {
    const entry = await getMyLadderEntry();
    return NextResponse.json(entry);
  }

  const result = await getLadder({
    page:     Number(sp.get("page")     ?? 1),
    pageSize: Number(sp.get("pageSize") ?? 25),
  });

  return NextResponse.json(result);
}