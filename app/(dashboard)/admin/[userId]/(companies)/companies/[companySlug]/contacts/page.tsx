// =============================================================================
// app/admin/[userId]/companies/[companySlug]/contacts/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCompany } from "@/lib/actions/company-actions";
import { prismadb } from "@/lib/db";
import { ContactsClient } from "./_contacts/contacts-client";


interface Props {
  params: Promise<{ userId: string; companySlug: string }>;
  searchParams: Promise<{ page?: string; search?: string; tag?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { companySlug } = await params;
  return { title: `Contacts — ${companySlug} | Admin`, robots: { index: false, follow: false } };
}

export default async function ContactsPage({ params, searchParams }: Props) {
  const { userId: clerkUserId } = await auth();
  const { userId, companySlug } = await params;
  const { page: pageStr, search, tag } = await searchParams;

  if (!clerkUserId) redirect("/sign-in");
  const company = await getCompany(companySlug);
  if (!company) notFound();

  const page     = Math.max(1, parseInt(pageStr ?? "1", 10));
  const pageSize = 25;
  const skip     = (page - 1) * pageSize;

  const where = {
    companyId: company.id,
    ...(search ? {
      OR: [
        { firstName:  { contains: search } },
        { lastName:   { contains: search } },
        { email:      { contains: search } },
        { company:    { contains: search } },
      ],
    } : {}),
    ...(tag ? { tags: { contains: tag } } : {}),
  };

  const [contacts, total] = await Promise.all([
    prismadb.companyContact.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prismadb.companyContact.count({ where }),
  ]);

  return (
    <ContactsClient
      company={{ id: company.id, slug: company.slug, displayName: company.displayName ?? "", accentColor: company.accentColor ?? "#f59e0b" }}
      contacts={contacts.map((c) => ({ ...c, tags: c.tags ? JSON.parse(c.tags) as string[] : [] }))}
      total={total}
      page={page}
      pageSize={pageSize}
      userId={userId}
      initialSearch={search ?? ""}
    />
  );
}
