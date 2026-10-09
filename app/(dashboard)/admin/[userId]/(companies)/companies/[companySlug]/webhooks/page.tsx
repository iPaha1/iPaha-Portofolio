// app/admin/[userId]/companies/[companySlug]/webhooks/page.tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCompany } from "@/lib/actions/company-actions";
import { getWebhookEndpoints } from "@/lib/actions/webhook-actions";
import { WebhooksClient } from "./_webhooks/webhooks-client";



interface Props {
  params: Promise<{ userId: string; companySlug: string }>;
}

export default async function WebhooksPage({ params }: Props) {
  const { userId: clerkUserId } = await auth();
  const { userId, companySlug } = await params;

  if (!clerkUserId) redirect("/sign-in");
  
  // Optional: Verify the userId matches or user has admin access
  if (userId !== clerkUserId) {
    redirect("/unauthorized");
  }

  const company = await getCompany(companySlug);
  if (!company) notFound();

  // Fetch webhook endpoints with recent deliveries
  const endpoints = await getWebhookEndpoints(company.id);

  // Format endpoints for the client component
  const formattedEndpoints = endpoints.map((endpoint) => ({
    id: endpoint.id,
    url: endpoint.url,
    description: endpoint.description,
    events: typeof endpoint.events === 'string' 
      ? JSON.parse(endpoint.events) 
      : endpoint.events,
    isActive: endpoint.isActive,
    totalDeliveries: endpoint.totalDeliveries,
    totalFailures: endpoint.totalFailures,
    lastDeliveryAt: endpoint.lastDeliveryAt,
    signingSecret: endpoint.signingSecret,
    deliveries: endpoint.deliveries.map((delivery: any) => ({
      id: delivery.id,
      status: delivery.status,
      responseStatus: delivery.responseStatus,
      createdAt: delivery.createdAt,
      attemptCount: delivery.attemptCount,
    })),
    _count: {
      deliveries: endpoint._count?.deliveries || 0,
    },
  }));

  return (
    <WebhooksClient
      company={{
        id: company.id,
        slug: company.slug,
        displayName: company.displayName || company.legalName || "",
        accentColor: company.accentColor || "#f59e0b",
      }}
      endpoints={formattedEndpoints}
      userId={userId}
    />
  );
}