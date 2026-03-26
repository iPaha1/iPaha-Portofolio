// =============================================================================
// isaacpaha.com — Admin Blog Page (Server Component)
// app/admin/[userId]/blog/page.tsx
// =============================================================================

import type { Metadata }     from "next";
import { BlogAdminClient } from "./_blog/blog-client";
import {
  getBlogStats, getBlogPosts, getCategories, getSeries,
} from "@/lib/actions/blog-actions";

export const metadata: Metadata = {
  title: "Blog | Admin",
  robots: { index: false, follow: false },
};

interface Props {
  params:       Promise<{ userId: string }>;
  searchParams: Promise<{
    tab?:    string;
    page?:   string;
    search?: string;
    status?: string;
    sort?:   string;
    edit?:   string;
  }>;
}

export default async function BlogAdminPage({ params, searchParams }: Props) {

    const { userId } = await params;
    const { tab, page, search, status, sort, edit } = await searchParams;

  const pageNumber = Number(page ?? 1);

  const [statsData, postsData, categories, series] = await Promise.all([
    getBlogStats(),
    getBlogPosts({
      page: pageNumber,
      pageSize:  20,
      status:    status as any,
      search:    search,
      sortBy:    (sort?.split("_")[0] as any) ?? "updatedAt",
      sortOrder: (sort?.split("_")[1] as any) ?? "desc",
    }),
    getCategories(),
    getSeries(),
  ]);
 return (
    <BlogAdminClient
      userId={userId}
      stats={statsData as any}
      initialPosts={postsData.posts as any}
      postTotal={postsData.total}
      postPages={postsData.pages}
      categories={categories as any}
      series={series as any}
      initialTab={(tab as any) ?? "posts"}
      initialEditId={edit}
      currentPage={pageNumber}
    />
  );
}