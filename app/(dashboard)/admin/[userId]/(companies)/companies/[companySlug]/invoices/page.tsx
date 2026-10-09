// app/admin/[userId]/companies/[companySlug]/invoices/page.tsx
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getCompany } from "@/lib/actions/company-actions";
import { getInvoices, getInvoiceStatusCounts } from "@/lib/actions/invoice-actions";
import { InvoicesClient } from "./_invoices/invoices-client";


interface Props {
  params: Promise<{ userId: string; companySlug: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}

type LineItem = Record<string, unknown>;

function parseLineItems(value: unknown): LineItem[] {
  if (Array.isArray(value)) return value as LineItem[];
  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as LineItem[]) : [];
  } catch {
    return [];
  }
}

export default async function InvoicesPage({ params, searchParams }: Props) {
  const { userId: clerkUserId } = await auth();
  const { userId, companySlug } = await params;
  const { status, page: pageParam } = await searchParams;

  if (!clerkUserId) redirect("/sign-in");
  
  // Optional: Verify the userId matches or user has admin access
  if (userId !== clerkUserId) {
    redirect("/unauthorized");
  }

  const company = await getCompany(companySlug);
  if (!company) notFound();

  // Parse pagination params
  const page = Math.max(1, parseInt(pageParam || "1"));
  const pageSize = 20;
  const activeStatus = status || "ALL";

  // Fetch invoices and status counts
  const [invoicesResult, statusCounts] = await Promise.all([
    getInvoices(company.id, {
      status: activeStatus === "ALL" ? undefined : activeStatus,
      page,
      pageSize,
    }),
    getInvoiceStatusCounts(company.id),
  ]);

  // Format invoices for the client component
  const formattedInvoices = invoicesResult.invoices.map((invoice) => ({
    ...invoice,
    subtotal: Number(invoice.subtotal),
    taxRate: Number(invoice.taxRate),
    taxAmount: Number(invoice.taxAmount),
    total: Number(invoice.total),
    lineItems: parseLineItems(invoice.lineItems),
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt,
    paidAt: invoice.paidAt,
    createdAt: invoice.createdAt,
  }));

  return (
    <InvoicesClient
      company={{
        id: company.id,
        slug: company.slug,
        displayName: company.displayName || company.legalName || "",
        accentColor: company.accentColor || "#f59e0b",
      }}
      invoices={formattedInvoices as any} // Cast to any to bypass lineItems type issues
      total={invoicesResult.total}
      page={page}
      pageSize={pageSize}
      userId={userId}
      statusCounts={statusCounts}
      initialStatus={activeStatus}
    />
  );
}