// =============================================================================
// isaacpaha.com — Single Tool API
// app/api/admin/tools/[toolId]/route.ts
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import { prismadb }                  from "@/lib/db";
import {
  getToolById, updateTool, deleteTool,
  toggleToolFeatured, duplicateTool,
} from "@/lib/actions/tools-actions";

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
  { params }: { params: Promise<{ toolId: string }> }
) {
  const { toolId } = await params;
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tool = await getToolById(toolId);
  if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(tool);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const { toolId } = await params;
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body._action === "toggleFeatured") return NextResponse.json(await toggleToolFeatured(toolId));
  if (body._action === "duplicate")      return NextResponse.json(await duplicateTool(toolId));

  // Strip _action key before passing to updateTool
  const { _action, ...updateData } = body;
  const updated = await updateTool(toolId, updateData);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  const { toolId } = await params;
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await deleteTool(toolId);
  return NextResponse.json({ ok: true });
}





// // =============================================================================
// // isaacpaha.com — Single Tool API
// // app/api/admin/tools/[toolId]/route.ts
// // GET    → fetch full tool
// // PATCH  → update fields  |  _action: toggleFeatured | duplicate
// // DELETE → delete single
// // =============================================================================

// import { NextRequest, NextResponse } from "next/server";
// import { auth }                      from "@clerk/nextjs/server";
// import { prismadb } from "@/lib/db";
// import {
//   getToolById, updateTool, deleteTool,
//   toggleToolFeatured, duplicateTool,
// } from"@/lib/actions/tools-actions";



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
//   { params }: { params: Promise<{ toolId: string }> }
// ) {

//     const { toolId } = await params;

//   if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   const tool = await getToolById(toolId);
//   if (!tool) return NextResponse.json({ error: "Not found" }, { status: 404 });
//   return NextResponse.json(tool);
// }

// export async function PATCH(
//   req: NextRequest,
//   { params }: { params: Promise<{ toolId: string }> }
// ) {

//     const { toolId } = await params;

//   if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   const body = await req.json();

//   if (body._action === "toggleFeatured") return NextResponse.json(await toggleToolFeatured(toolId));
//   if (body._action === "duplicate")      return NextResponse.json(await duplicateTool(toolId));

//   const updated = await updateTool(toolId, body);
//   return NextResponse.json(updated);
// }

// export async function DELETE(
//   _req: NextRequest,
//   { params }: { params: Promise<{ toolId: string }> }
// ) {

//     const { toolId } = await params;

//   if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   await deleteTool(toolId);
//   return NextResponse.json({ ok: true });
// }