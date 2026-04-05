// =============================================================================
// isaacpaha.com — Admin Apps Page (Server Component)
// app/admin/[userId]/apps/page.tsx
// =============================================================================

import type { Metadata }         from "next";
import { getApps, getAppStats }  from "@/lib/actions/apps-actions";
import { AppsAdminClient }       from "./_apps/apps-client";
import { AppStatus }             from "@/lib/generated/prisma/client";

export const metadata: Metadata = {
  title:  "Apps | Admin",
  robots: { index: false, follow: false },
};

interface Props {
  params:       Promise<{ userId: string }>;
  searchParams: Promise<{
    tab?:     string;
    page?:    string;
    search?:  string;
    status?:  string;
    company?: string;
    sort?:    string;
    edit?:    string;
  }>;
}

const VALID_TABS = ["apps", "editor", "stats"] as const;

export default async function AppsAdminPage({ params, searchParams }: Props) {
  const { userId }                                = await params;
  const { tab, page, search, status, company, sort, edit } = await searchParams;

  const pageNumber = Number(page ?? 1);
  const initialTab = VALID_TABS.includes(tab as (typeof VALID_TABS)[number])
    ? (tab as (typeof VALID_TABS)[number])
    : "apps";

  const rawSortBy   = sort?.split("_")[0] ?? "createdAt";
  const sortOrder   = (sort?.split("_")[1] as "asc" | "desc") ?? "desc";

  const [rawStats, appsData] = await Promise.all([
    getAppStats(),
    getApps({
      page:      pageNumber,
      pageSize:  20,
      status:    (status && status !== "ALL") ? (status as AppStatus) : undefined,
      companyId: (company && company !== "ALL") ? company : undefined,
      search:    search || undefined,
      sortBy:    (["createdAt", "updatedAt", "name", "viewCount", "userCount", "launchDate"].includes(rawSortBy)
                   ? rawSortBy
                   : "createdAt") as any,
      sortOrder,
    }),
  ]);
  console.log("Raw stats from DB:", rawStats);
  console.log("Apps data from DB:", appsData);

  // rawStats already has the right shape — pass it straight through
  // (no byStatus → bystatus typo from the original)
  const stats = rawStats;
  console.log("App stats:", stats);
  console.log(`==============[AppsAdminPage] Fetched stats and ${appsData.apps.length} apps from the database================`);

  return (
    <AppsAdminClient
      userId={userId}
      stats={stats}
      initialApps={appsData.apps as any}
      appTotal={appsData.total}
      appPages={appsData.pages}
      initialTab={initialTab}
      initialSearch={search ?? ""}
      initialStatus={status ?? "ALL"}
      initialCompany={company ?? "ALL"}
      initialEditId={edit}
      currentPage={pageNumber}
    />
  );
}



// // =============================================================================
// // isaacpaha.com — Admin Apps Page (Server Component)
// // app/admin/[userId]/apps/page.tsx
// // =============================================================================

// import type { Metadata }  from "next";
// import { getApps, getAppStats } from "@/lib/actions/apps-actions";
// import { AppsAdminClient } from "./_apps/apps-client";



// export const metadata: Metadata = {
//   title: "Apps | Admin",
//   robots: { index: false, follow: false },
// };

// interface Props {
//   params:       Promise<{ userId: string }>;
//   searchParams: Promise<{
//     tab?:     string;
//     page?:    string;
//     search?:  string;
//     status?:  string;
//     company?: string;
//     sort?:    string;
//     edit?:    string;  // app id — open editor directly
//   }>;
// }

// export default async function AppsAdminPage({ params, searchParams }: Props) {

//     const { userId } = await params;
//     const { tab, page, search, status, company, sort, edit } = await searchParams;
//     // Convert page to number or undefined
//   const pageNumber = page ? Number(page) : undefined;
// //   const page = Number(page ?? 1);

//   const [rawStats, appsData] = await Promise.all([
//     getAppStats(),
//     getApps({
//       page: pageNumber,
//       pageSize:  20,
//       status:    status  as any,
//       company:   company,
//       search:    search,
//       sortBy:    (sort?.split("_")[0] as any) ?? "createdAt",
//       sortOrder: (sort?.split("_")[1] as any) ?? "desc",
//     }),
//   ]);

//   // Rename 'byStatus' to 'bystatus' to match Stats type
//   const stats = {
//     ...rawStats,
//     bystatus: rawStats.byStatus,
//     // Optionally remove the original 'byStatus' property if needed:
//     // byStatus: undefined,
//   };

//   return (
//     <AppsAdminClient
//       userId={userId}
//       stats={stats}
//       initialApps={appsData.apps as any}
//       appTotal={appsData.total}
//       appPages={appsData.pages}
//       initialTab={(tab as any) ?? "apps"}
//       initialSearch={search ?? ""}
//       initialStatus={status ?? "ALL"}
//       initialCompany={company ?? "ALL"}
//       initialEditId={edit}
//       currentPage={Number(page ?? 1)}
//     />
//   );
// }