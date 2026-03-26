// =============================================================================
// isaacpaha.com — Admin Ideas Lab Page (Server Component)
// app/admin/[userId]/ideas/page.tsx
// =============================================================================

import type { Metadata }    from "next";
import { IdeasAdminClient } from "./_ideas/ideas-client";
import { getIdeas, getIdeaStats } from "@/lib/actions/ideas-actions";
import { Idea, IdeaCategory, IdeaStatus } from "@/lib/generated/prisma/client";




export const metadata: Metadata = {
  title: "Ideas Lab | Admin",
  robots: { index: false, follow: false },
};

interface Props {
  params:       Promise<{ userId: string }>;
  searchParams: Promise<{
    tab?:      "ideas" | "editor" | "brainstorm"; // specify valid tab values
    page?:     string;
    search?:   string;
    category?: string;
    status?:   string;
    sort?:     string;
    edit?:     string;   // idea id — open editor directly
  }>;
}

export default async function IdeasAdminPage({ params, searchParams }: Props) {
    const { userId } = await params;
  const { tab, page, search, category, status, sort, edit } = await searchParams;

  // Convert page to number or undefined
  const pageNumber = page ? Number(page) : undefined;

const [stats, ideasData] = await Promise.all([
  getIdeaStats(),
  getIdeas({
    page: pageNumber,
    pageSize:  20,
    category:  category as IdeaCategory,
    status:    status   as IdeaStatus,
    search:    search,
    sortBy:    (
      ["title", "viewCount", "likeCount", "createdAt", "updatedAt"].includes(sort?.split("_")[0] ?? "")
        ? (sort?.split("_")[0] as "title" | "viewCount" | "likeCount" | "createdAt" | "updatedAt")
        : "createdAt"
    ),
    sortOrder: (sort?.split("_")[1] === "asc" ? "asc" : "desc") as "asc" | "desc",
  }),
]);

  return (
    <IdeasAdminClient
      userId={userId}
      stats={stats}
      initialIdeas={ideasData.ideas as Idea[]}
    // initialIdeas={ideasData.ideas as any}
      ideaTotal={ideasData.total}
      ideaPages={ideasData.pages}
      initialTab={tab ?? "ideas"}
      initialSearch={search ?? ""}
      initialCategory={category ?? "ALL"}
      initialStatus={status ?? "ALL"}
      initialEditId={edit}
      currentPage={Number(page ?? 1)}
    />
  );
}