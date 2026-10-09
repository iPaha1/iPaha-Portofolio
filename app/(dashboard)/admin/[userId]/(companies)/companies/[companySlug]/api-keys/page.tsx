// app/(dashboard)/admin/[userId]/(companies)/companies/[companySlug]/page.tsx
// app/admin/[userId]/companies/[companySlug]/api-keys/page.tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCompany, getCompanyApiKeys } from "@/lib/actions/company-actions";
import { ApiKeysClient } from "./_api-keys/api-keys-client";


interface Props {
  params: Promise<{ userId: string; companySlug: string }>;
}

export default async function ApiKeysPage({ params }: Props) {
  const { userId: clerkUserId } = await auth();
  const { userId, companySlug } = await params;

  if (!clerkUserId) redirect("/sign-in");
  
  // Optional: Verify the userId matches or user has admin access
  if (userId !== clerkUserId) {
    // Check if user is admin - you might want to add this check
    redirect("/unauthorized");
  }

  const company = await getCompany(companySlug);
  if (!company) notFound();

  const apiKeys = await getCompanyApiKeys(company.id);
  
  // Transform API keys to match the expected format for ApiKeysClient
  const formattedApiKeys = apiKeys.map((key) => ({
    id: key.id,
    name: key.name,
    maskedKey: `${key.keyPrefix}...${key.lastFourChars}`,
    scopes: typeof key.scopes === 'string' ? JSON.parse(key.scopes) : key.scopes,
    isActive: key.isActive,
    lastUsedAt: key.lastUsedAt,
    totalRequests: key.totalRequests,
    expiresAt: key.expiresAt,
    revokedAt: key.revokedAt,
  }));

  return (
    <ApiKeysClient
      companyId={company.id}
      companySlug={company.slug}
      initialKeys={formattedApiKeys}
      accent={company.accentColor || "#f59e0b"} // Default amber color if not set
    />
  );
}