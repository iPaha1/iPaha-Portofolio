// =============================================================================
// isaacpaha.com — Admin Now Page (Server Component)
// app/admin/[userId]/now/page.tsx
// =============================================================================

import type { Metadata }  from "next";
import {
  getNowStats, getNowEntries,
  getTimelineEvents, getKnowledgeItems,
  getRecentQuestions,
} from "@/lib/actions/now-actions";
import { NowAdminClient } from "./_now/now-client";

export const metadata: Metadata = {
  title: "Now Page | Admin",
  robots: { index: false, follow: false },
};

interface Props {
  params:       Promise<{ userId: string }>;
  searchParams: Promise<{ tab?: string; edit?: string }>;
}

export default async function NowAdminPage({ params, searchParams }: Props) {

    const { userId } = await params;
    const { tab, edit } = await searchParams;

  const [stats, entries, timeline, knowledge, recentQuestions] = await Promise.all([
    getNowStats(),
    getNowEntries(),
    getTimelineEvents(),
    getKnowledgeItems(),
    getRecentQuestions(8),
  ]);   

  return (
    <NowAdminClient
      userId={userId}
      stats={stats}
      initialEntries={entries as any}
      initialTimeline={timeline as any}
      initialKnowledge={knowledge as any}
      recentQuestions={recentQuestions as any}
      initialTab={(tab as any) ?? "now"}
      initialEditId={edit}
    />
  );
}