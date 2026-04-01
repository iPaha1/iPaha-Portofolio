// =============================================================================
// isaacpaha.com — Admin Tools Page (Server Component)
// app/admin/[userId]/tools/page.tsx
// =============================================================================

import type { Metadata }        from "next";
import { getToolStats, getTools } from "@/lib/actions/tools-actions";
import { ToolCategory, ToolStatus } from "@/lib/generated/prisma/enums";
import { ToolsAdminClient } from "./_tools/tools-client";

export const metadata: Metadata = {
  title:  "Tools Lab | Admin",
  robots: { index: false, follow: false },
};

interface Props {
  params:       Promise<{ userId: string }>;
  searchParams: Promise<{
    tab?:      string;
    page?:     string;
    search?:   string;
    category?: string;
    status?:   string;
    sort?:     string;
    edit?:     string;
  }>;
}

const VALID_SORT_BY = ["viewCount", "usageCount", "createdAt", "updatedAt", "title", "rating"] as const;
const VALID_TABS    = ["tools", "editor", "analytics"] as const;

export default async function ToolsAdminPage({ params, searchParams }: Props) {
  const { userId }                              = await params;
  const { tab, page, search, category, status, sort, edit } = await searchParams;

  const pageNumber  = Number(page ?? 1);
  const initialTab  = VALID_TABS.includes(tab as (typeof VALID_TABS)[number])
    ? (tab as (typeof VALID_TABS)[number])
    : "tools";

  const rawSortBy  = sort?.split("_")[0] ?? "createdAt";
  const sortBy     = VALID_SORT_BY.includes(rawSortBy as (typeof VALID_SORT_BY)[number])
    ? (rawSortBy as (typeof VALID_SORT_BY)[number])
    : "createdAt";
  const sortOrder  = (sort?.split("_")[1] as "asc" | "desc") ?? "desc";

  const [rawStats, toolsData] = await Promise.all([
    getToolStats(),
    getTools({
      page:      pageNumber,
      pageSize:  20,
      category:  category as ToolCategory,
      status:    status   as ToolStatus,
      search,
      sortBy,
      sortOrder,
    }),
  ]);

  // Map DB field names → client Stats shape
  const { recentUsageCount, topUsed, ...restStats } = rawStats;

  const stats = {
    ...restStats,
    recentUseCount: recentUsageCount,
    topUsed: (topUsed ?? []).map((t) => ({
      id:          t.id,
      name:        t.name,
      slug:        t.slug,
      usageCount:  t.usageCount,
      viewCount:   t.viewCount,
      category:    String(t.category),
      icon:        t.icon ?? null,
      accentColor: t.accentColor ?? null,
      status:      t.status as ToolStatus,
    })),
  };

  return (
    <ToolsAdminClient
      userId={userId}
      stats={stats}
      initialTools={toolsData.tools as never}
      toolTotal={toolsData.total}
      toolPages={toolsData.pages}
      initialTab={initialTab}
      initialSearch={search ?? ""}
      initialCategory={category ?? "ALL"}
      initialStatus={status   ?? "ALL"}
      initialEditId={edit}
      currentPage={pageNumber}
    />
  );
}




// // =============================================================================
// // isaacpaha.com — Admin Tools Page (Server Component)
// // app/admin/[userId]/tools/page.tsx
// // =============================================================================

// import { getToolStats, getTools } from "@/lib/actions/tools-actions";
// import type { Metadata }    from "next";
// import { ToolsAdminClient } from "./_tools/tools-client";
// import { ToolCategory, ToolStatus } from "@/lib/generated/prisma/enums";
// import { Tool } from "@/lib/generated/prisma/client";


// export const metadata: Metadata = {
//   title: "Tools Lab | Admin",
//   robots: { index: false, follow: false },
// };

// interface Props {
//   params:       Promise<{ userId: string }>;
//   searchParams: Promise<{
//     tab?:      string;
//     page?:     string;
//     search?:   string;
//     category?: string;
//     status?:   string;
//     sort?:     string;
//     edit?:     string;
//   }>;
// }

// export default async function ToolsAdminPage({ params, searchParams }: Props) {

//     const { userId } = await params;
//     const { tab, page, search, category, status, sort, edit } = await searchParams;
//     const pageNumber = page ? Number(page) : undefined;
//     const validTabs = ["tools", "editor", "analytics"] as const;
//     const initialTab = validTabs.includes(tab as any) ? (tab as typeof validTabs[number]) : "tools";
// //   const page = Number(searchParams.page ?? 1);

//   const [rawStats, toolsData] = await Promise.all([
//     getToolStats(),
//     getTools({
//       page: pageNumber,
//       pageSize:  20,
//       category:  category as ToolCategory,
//       status:    status   as ToolStatus,
//       search:    search,
//       sortBy:    (["viewCount", "usageCount", "createdAt", "updatedAt", "title", "rating"].includes(sort?.split("_")[0] ?? "")
//                   ? (sort?.split("_")[0] as "viewCount" | "usageCount" | "createdAt" | "updatedAt" | "title" | "rating")
//                   : "createdAt"),
//       sortOrder: (sort?.split("_")[1] as "asc" | "desc" ?? "desc"),
//     }),
//   ]);

//   // Map recentUsageCount to recentUseCount to match Stats type
//   const { recentUsageCount, topUsed, ...restStats } = rawStats;
//   const stats = { 
//     ...restStats, 
//     recentUseCount: recentUsageCount,
//     topUsed: (topUsed ?? []).map((tool) => ({
//       id: tool.id,
//       title: tool.name, // rename 'name' to 'title'
//       slug: tool.slug,
//       useCount: tool.usageCount, // rename 'usageCount' to 'useCount'
//       viewCount: tool.viewCount,
//       category: typeof tool.category === "string"
//         ? tool.category
//         : (tool.category !== undefined && tool.category !== null
//             ? String(tool.category)
//             : ""),
//       emoji: tool.icon ?? "", // map 'icon' to 'emoji', fallback to empty string
//       status: tool.status,
//     })),
//   };

//   return (
//     <ToolsAdminClient
//       userId={userId}
//       stats={stats}
//       initialTools={toolsData.tools as any}
//       toolTotal={toolsData.total}
//       toolPages={toolsData.pages}
//       initialTab={initialTab}
//       initialSearch={search ?? ""}
//       initialCategory={category ?? "ALL"}
//       initialStatus={status ?? "ALL"}
//       initialEditId={edit}
//       currentPage={Number(page ?? 1)}
//     />
//   );
// }