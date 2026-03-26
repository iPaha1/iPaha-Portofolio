// =============================================================================
// isaacpaha.com — Developer Hub Admin Page (Server Component)
// app/admin/[userId]/hub/page.tsx
// =============================================================================

import type { Metadata }  from "next";
import { getHubStats, getHubEntries } from "@/lib/actions/hub-actions";
import type { HubEntryType } from "@/lib/generated/prisma/enums";
import { HubAdminClient } from "./_hub/hub-client";
import { HubEntry, TabKey } from "./_shared/hub-types";

export const metadata: Metadata = {
  title: "Developer Hub | Admin",
  robots: { index: false, follow: false },
};

interface Props {
  params:       Promise<{ userId: string }>;
  searchParams: Promise<{
    tab?:      string;   // snippets | prompts | commands | errors | search
    page?:     string;
    search?:   string;
    category?: string;
    lang?:     string;
    fav?:      string;
    sort?:     string;
  }>;
}

export default async function HubAdminPage({ params, searchParams }: Props) {

    const { userId } = await params;
    const { tab, page, search, category, lang, fav, sort } = await searchParams;

//   const tab      = (tab ?? "snippets") as HubEntryType | "search";
//   const page     = Number(page ?? 1);

  const typeMap: Record<string, HubEntryType> = {
    snippets:  "SNIPPET",
    prompts:   "PROMPT",
    commands:  "COMMAND",
    errors:    "ERROR",
    notes:     "NOTE",
    apis:      "API",
    patterns:  "PATTERN",
    templates: "TEMPLATE",
    playbooks: "PLAYBOOK",
    resources: "RESOURCE",
  };
  // Phase 3 tabs don't map to entry types — they are feature panels
  const phase3Tabs = ["ai", "analytics", "import", "tags"];
  const isPhase3Tab = phase3Tabs.includes(tab as string);
  const entryType   = isPhase3Tab ? undefined : (typeMap[tab as string] as HubEntryType | undefined);

  const pageNumber = Number(page ?? 1);

  const allowedSortBy = ["title", "copyCount", "viewCount", "createdAt", "updatedAt"] as const;
  type SortByType = typeof allowedSortBy[number];

  const sortByValue = (sort?.split("_")[0] ?? "createdAt") as string;
  const sortBy: SortByType = allowedSortBy.includes(sortByValue as SortByType)
    ? (sortByValue as SortByType)
    : "createdAt";

  const sortOrderValue = (sort?.split("_")[1] as string) ?? "desc";
  const sortOrder: "asc" | "desc" | undefined =
    sortOrderValue === "asc" || sortOrderValue === "desc" ? sortOrderValue : "desc";

  const [stats, entriesData] = await Promise.all([
    getHubStats(),
    getHubEntries({
      type:     entryType,
      page: pageNumber,
      pageSize: 30,
      search:   search,
      category: category,
      sortBy:   sortBy,
      sortOrder: sortOrder,
    }),
  ]);

  return (
    <HubAdminClient
      userId={userId}
      stats={stats}
      initialEntries={isPhase3Tab ? [] : (entriesData.entries as HubEntry[])}
      entryTotal={isPhase3Tab ? 0 : entriesData.total}
      entryPages={isPhase3Tab ? 1 : entriesData.pages}
      initialTab={tab as TabKey}
      initialSearch={search ?? ""}
      initialCategory={category ?? ""}
      currentPage={pageNumber}
    />
  );
}