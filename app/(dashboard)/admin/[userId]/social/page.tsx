// =============================================================================
// isaacpaha.com — Admin Social Media Page (Server Component)
// app/admin/[userId]/social/page.tsx
// =============================================================================

import type { Metadata }       from "next";
import { getSocialStats, getSocialPosts, PostStatus } from "@/lib/actions/social-actions";
import { SocialAdminClient } from "./_social/social-client";
// import { PostStatus } from "@/lib/data/blog-data";


export const metadata: Metadata = {
  title: "Social Media | Admin",
  robots: { index: false, follow: false },
};

interface Props {
  params:       Promise<{ userId: string }>;
  searchParams: Promise<{
    tab?:      string;
    page?:     string;
    platform?: string;
    status?:   string;
  }>;
}

export default async function SocialAdminPage({ params, searchParams }: Props) {
  const { userId } = await params;
  const { tab, page, platform, status } = await searchParams;
  const pageNumber = Number(page ?? 1);

  const [statsData, postsData] = await Promise.all([
    getSocialStats(),
    getSocialPosts({
      page: pageNumber,
      pageSize: 20,
      platform: platform,
      status:   status as PostStatus,
    }),
  ]);

  return (
    <SocialAdminClient
      userId={userId}
      stats={statsData as any}
      initialPosts={postsData.posts as any}
      postTotal={postsData.total}
      postPages={postsData.pages}
      initialTab={(tab as any) ?? "feed"}
      currentPage={pageNumber}
    />
  );
}