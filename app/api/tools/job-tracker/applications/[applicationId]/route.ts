// =============================================================================
// app/api/tools/job-tracker/applications/[applicationId]/route.ts
// =============================================================================

import { NextRequest, NextResponse }   from "next/server";
import { auth }                        from "@clerk/nextjs/server";
import { deleteApplication, updateApplication } from "@/lib/tools/actions/job-tracker-actions";


export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {

  const { userId } = await auth();
  const { applicationId } = await params;

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body    = await req.json();
  const updated = await updateApplication(applicationId, body);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ applicationId: string }> }
) {

  const { userId } = await auth();
  const { applicationId } = await params;

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await deleteApplication(applicationId);
  return NextResponse.json({ ok: true });
}