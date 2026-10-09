// =============================================================================
// app/admin/[userId]/companies/[companySlug]/bookings/page.tsx
// Route: /admin/{userId}/companies/{companySlug}/bookings
// =============================================================================

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCompany } from "@/lib/actions/company-actions";
import { prismadb } from "@/lib/db";
import { BookingsClient } from "./_bookings/bookings-client";
import { BookingStatus } from "@/lib/generated/prisma/enums";
import { Prisma } from "@/lib/generated/prisma/client";


interface Props {
  params: Promise<{ userId: string; companySlug: string }>;
  searchParams: Promise<{ status?: string; page?: string; search?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { companySlug } = await params;
  return { title: `Bookings — ${companySlug} | Admin`, robots: { index: false, follow: false } };
}

export default async function BookingsPage({ params, searchParams }: Props) {
  const { userId: clerkUserId } = await auth();
  const { userId, companySlug } = await params;
  const { status, page: pageStr, search } = await searchParams;

  if (!clerkUserId) redirect("/sign-in");

  const company = await getCompany(companySlug);
  // console.log("Company:", company); // Debug log to check company data
  if (!company) notFound();

  const page     = Math.max(1, parseInt(pageStr ?? "1", 10));
  const pageSize = 20;
  const skip     = (page - 1) * pageSize;

  const normalizedStatus: BookingStatus | undefined =
    status && status !== "ALL" && (Object.values(BookingStatus) as string[]).includes(status)
      ? (status as BookingStatus)
      : undefined;

  const where: Prisma.BookingWhereInput = {
    companyId: company.id,
    ...(normalizedStatus ? { status: normalizedStatus } : {}),
    ...(search ? {
      OR: [
        { clientName:    { contains: search } },
        { clientEmail:   { contains: search } },
        { clientCompany: { contains: search } },
      ],
    } : {}),
  };

  const [bookings, total] = await Promise.all([
    prismadb.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prismadb.booking.count({ where }),

  ]);
  // console.log("Bookings:", bookings); // Debug log to check bookings data

  const statusCounts = await prismadb.booking.groupBy({
    by: ["status"],
    where: { companyId: company.id },
    _count: { status: true },
  });

  return (
    <BookingsClient
      company={{ id: company.id, slug: company.slug, displayName: company.displayName ?? "", accentColor: company.accentColor ?? "#f59e0b" }}
      bookings={bookings}
      total={total}
      page={page}
      pageSize={pageSize}
      userId={userId}
      statusCounts={statusCounts.reduce((acc, s) => ({ ...acc, [s.status]: s._count.status }), {} as Record<string, number>)}
      initialStatus={normalizedStatus ?? "ALL"}
      initialSearch={search ?? ""}
    />
  );
}
