// =============================================================================
// isaacpaha.com — Admin Contacts Page (Server Component)
// app/admin/[userId]/contacts/page.tsx
// =============================================================================

import {
  getContactStats,
  getSubmissions,
  getSubmissionVolume,
  getAvgReplyTime,
} from  "@/lib/actions/contacts-actions";
import type { Metadata }        from "next";
import { ContactsAdminClient } from "./_contact/contacts-admin-client";




export const metadata: Metadata = {
  title: "Contacts | Admin",
  robots: { index: false, follow: false },
};

interface Props {
  params:       Promise<{ userId: string }>;
  searchParams: Promise<{ tab?: string; page?: string; search?: string; type?: string; filter?: string }>;
}

export default async function ContactsAdminPage({ params, searchParams }: Props) {

  const { userId } = await params;
  const { tab, page, search, type, filter } = await searchParams;
  const pageNumber   = Number(page ?? 1);
  // const filter = filter;

  // Derive isRead / isReplied from filter param
  const isRead    = filter === "unread"    ? false : undefined;
  const isReplied = filter === "unreplied" ? false : undefined;

  const [stats, submissionsData, volume, avgReplyTime] = await Promise.all([
    getContactStats(),
    getSubmissions({
      page: pageNumber,
      // page: page ? Number(page) : undefined,
      pageSize:  30,
      type:      type,
      search:    search,
      isRead,
      isReplied,
    }),
    getSubmissionVolume(30),
    getAvgReplyTime(),
  ]);

  return (
    <ContactsAdminClient
      userId={userId}
      stats={stats}
      initialSubmissions={submissionsData.submissions}
      submissionTotal={submissionsData.total}
      submissionPages={submissionsData.pages}
      volume={volume}
      avgReplyTime={avgReplyTime}
      activeTab={(tab as any) ?? "inbox"}
    />
  );
}