// =============================================================================
// app/admin/[userId]/companies/[companySlug]/page.tsx
// Dynamic company admin dashboard — renders based on DB config
// Route: /admin/{userId}/companies/{companySlug}
// =============================================================================

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCompany, getCompanyStats, type DashboardConfig } from "@/lib/actions/company-actions";
import { CompanyDashboardClient } from "../_companies/company-dashboard-client";


interface Props {
  params: Promise<{ userId: string; companySlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { companySlug } = await params;
  return {
    title:  `${companySlug} Dashboard | Admin`,
    robots: { index: false, follow: false },
  };
}

export default async function CompanyDashboardPage({ params }: Props) {
  const { userId: clerkUserId } = await auth();
  const { userId, companySlug } = await params;

  if (!clerkUserId) redirect("/sign-in");

  const company = await getCompany(companySlug);
  if (!company) notFound();

  const stats  = await getCompanyStats(company.id);

  // Parse dashboard config — fall back to sensible defaults if not set
  let dashboardConfig: DashboardConfig = {
    nav: [],
    modules: [],
    settings: {},
  };
  if (company.dashboardConfig) {
    try {
      dashboardConfig = JSON.parse(company.dashboardConfig) as DashboardConfig;
    } catch (error) {
      console.error("Failed to parse dashboardConfig:", error);
    }
  }

  // Parse API keys (safe shape — no hashes)
  const apiKeys = company.apiKeys.map((k) => ({
    ...k,
    scopes: typeof k.scopes === 'string' ? JSON.parse(k.scopes) as string[] : k.scopes,
    maskedKey: `${k.keyPrefix}...${k.lastFourChars}`,
  }));

  return (
    <CompanyDashboardClient
      company={{
        id:           company.id,
        displayName:  company.displayName ?? "",
        legalName:    company.legalName ?? "",
        slug:         company.slug,
        logoUrl:      company.logoUrl,
        accentColor:  company.accentColor ?? "",
        primaryDomain: company.primaryDomain,
        isActive:     company.isActive,
        planTier:     company.planTier,
      }}
      stats={stats}
      apiKeys={apiKeys}
      dashboardConfig={dashboardConfig}
      userId={userId}
    />
  );
}