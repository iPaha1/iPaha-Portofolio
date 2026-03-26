// =============================================================================
// app/api/tools/job-tracker/profile/route.ts
// GET  → get or create profile
// PATCH → update profile
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { getOrCreateProfile, updateProfile } from "@/lib/tools/actions/job-tracker-actions";


export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(null);

  const profile = await getOrCreateProfile();
  return NextResponse.json(profile);
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body    = await req.json();
  const updated = await updateProfile(body);
  return NextResponse.json(updated);
}