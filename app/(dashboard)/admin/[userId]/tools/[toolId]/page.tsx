// =============================================================================
// isaacpaha.com — Individual Tool Admin Dashboard (Server Component)
// app/admin/[userId]/tools/[toolId]/page.tsx
//
// This page is the per-tool management hub. Each tool type will eventually
// have its own custom dashboard (analytics, usage logs, config, AI model
// settings, rate limits, etc.). For now, it renders a structured placeholder
// with all the tool's current data and a roadmap of planned sections.
// =============================================================================

import { getToolById, getToolUsageHistory } from "@/lib/actions/tools-actions";
import type { Metadata }         from "next";
import { notFound }              from "next/navigation";
import { ToolDashboardClient } from "../_tools/tool-dashboard-client";


interface Props {
  params: Promise<{ userId: string; toolId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {

    const { userId, toolId } = await params;

  const tool = await getToolById(toolId);
  return {
    title: tool ? `${tool.name} Dashboard | Admin` : "Tool Dashboard | Admin",
    robots: { index: false, follow: false },
  };
}

export default async function ToolDashboardPage({ params }: Props) {

    const { userId, toolId } = await params;

  const tool = await getToolById(toolId);
  if (!tool) notFound();

  const usageLogs = await getToolUsageHistory(toolId, 30);

  return (
    <ToolDashboardClient
      userId={userId}
      tool={tool as any}
      usageLogs={usageLogs as any}
    />
  );
}