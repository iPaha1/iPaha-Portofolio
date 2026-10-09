// app/admin/[userId]/companies/[companySlug]/settings/page.tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCompany } from "@/lib/actions/company-actions";
import { SettingsClient } from "./_settings/settings-client";


interface Props {
  params: Promise<{ userId: string; companySlug: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { userId: clerkUserId } = await auth();
  const { userId, companySlug } = await params;

  if (!clerkUserId) redirect("/sign-in");
  
  // Optional: Verify the userId matches or user has admin access
  if (userId !== clerkUserId) {
    redirect("/unauthorized");
  }

  const company = await getCompany(companySlug);
  if (!company) notFound();

  // Format company data for the client component
  const formattedCompany = {
    id: company.id,
    slug: company.slug,
    legalName: company.legalName || "",
    displayName: company.displayName || "",
    primaryDomain: company.primaryDomain || null,
    contactEmail: company.contactEmail || null,
    accentColor: company.accentColor || "#f59e0b",
    planTier: company.planTier || "FREE",
    isActive: company.isActive,
    allowedDomains: company.allowedDomains || null,
    registrationNo: company.registrationNo || null,
    city: company.city || null,
    postcode: company.postcode || null,
    country: company.country || "GB",
  };

  return (
    <SettingsClient
      company={formattedCompany}
      userId={userId}
    />
  );
}