// =============================================================================
// isaacpaha.com — Admin Newsletter Page (Server Component)
// app/admin/[userId]/newsletter/page.tsx
// Fetches real data from DB, passes to client component.
// =============================================================================

import type { Metadata }  from "next";
import {
  getSubscriberStats,
  getSubscribers,
  getEditions,
  getSubscriberSources,
  getSubscriberGrowth,
  getNextIssueNumber,
} from "@/lib/actions/newsletter-actions";
import { NewsletterAdminClient } from "./_newsletter/newsletter-admin-client";


export const metadata: Metadata = {
  title: "Newsletter | Admin",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ tab?: string; page?: string; search?: string; status?: string }>;
}

export default async function NewsletterAdminPage({ params, searchParams }: Props) {
  const { userId } = await params;
  const { tab, page, search, status } = await searchParams;
  // Parallel fetch everything on the server
  const [stats, subscribersData, editionsData, sources, growth, nextIssue] =
    await Promise.all([
      getSubscriberStats(),
      getSubscribers({
        page:      Number(page ?? 1),
        search:    search,
        status:    status as any,
        pageSize:  50,
      }),
      getEditions({ page: 1, pageSize: 20 }),
      getSubscriberSources(),
      getSubscriberGrowth(30),
      getNextIssueNumber(),
    ]);

  return (
    <NewsletterAdminClient
      userId={userId}
      stats={stats}
      initialSubscribers={subscribersData.subscribers.filter(
        (sub) => sub.status !== "PENDING"
      ) as any}
      subscriberTotal={subscribersData.total}
      subscriberPages={subscribersData.pages}
      initialEditions={editionsData.editions}
      editionTotal={editionsData.total}
      sources={sources}
      growth={growth}
      nextIssueNumber={nextIssue}
      activeTab={(tab as unknown as any) ?? "overview"}
    />
  );
}