// lib/actions/company-actions.ts
// Server actions for the admin dashboard company management
// These are called from admin UI components — protected by Clerk auth
// =============================================================================

"use server";

import { auth } from "@clerk/nextjs/server";
import { createApiKey, rotateApiKey, revokeApiKey, listApiKeys } from "@/lib/services/api-keys";
import type { Scope } from "@/lib/api/types";
import { revalidatePath } from "next/cache";
import { prismadb } from "../db";

// Helper: ensure caller is an admin
async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorised");

  // Check your User table for ADMIN/SUPER_ADMIN role
  const user = await prismadb.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    throw new Error("Unauthorised");
  }
  return user;
}

// -----------------------------------------------------------------------------
// COMPANY CRUD
// -----------------------------------------------------------------------------

export async function getCompany(slug: string) {
  await requireAdmin();
  return prismadb.company.findUnique({
    where: { slug },
    include: {
      apiKeys: { select: { id: true, name: true, keyPrefix: true, lastFourChars: true,
                            isActive: true, lastUsedAt: true, totalRequests: true, scopes: true } },
      members: { select: { id: true, userId: true, role: true, isActive: true } },
      _count: { select: { bookings: true, contacts: true, invoices: true } },
    },
  });
}

export async function listCompanies() {
  await requireAdmin();
  return prismadb.company.findMany({
    select: {
      id: true, legalName: true, displayName: true, slug: true,
      logoUrl: true, accentColor: true, isActive: true, planTier: true,
      primaryDomain: true, createdAt: true,
      _count: { select: { bookings: true, contacts: true, apiKeys: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createCompany(input: {
  legalName: string;
  displayName: string;
  slug: string;
  primaryDomain: string;
  allowedDomains?: string[];
  accentColor?: string;
  contactEmail?: string;
  dashboardConfig?: object;
}) {
  await requireAdmin();

  const existing = await prismadb.company.findUnique({ where: { slug: input.slug } });
  if (existing) throw new Error("Slug already in use");

  const company = await prismadb.company.create({
    data: {
      ...input,
      allowedDomains: input.allowedDomains ? JSON.stringify(input.allowedDomains) : undefined,
      dashboardConfig: input.dashboardConfig ? JSON.stringify(input.dashboardConfig) : undefined,
    },
  });

  revalidatePath("/admin");
  return company;
}

// -----------------------------------------------------------------------------
// DASHBOARD CONFIG
// Update the dynamic navigation and module config for a company
// -----------------------------------------------------------------------------

export interface NavItem {
  id: string;
  label: string;
  iconName: string;
  href: string;
  badge?: string;
  badgeColor?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export interface DashboardConfig {
  nav: NavGroup[];
  modules: string[];                          // Enabled module IDs
  settings: Record<string, unknown>;           // Arbitrary per-company settings
}

export async function updateDashboardConfig(
  companyId: string,
  config: DashboardConfig
) {
  await requireAdmin();
  await prismadb.company.update({
    where: { id: companyId },
    data: { dashboardConfig: JSON.stringify(config) },
  });
  revalidatePath("/admin");
}

// Remove the default config exports - these shouldn't be exported from a "use server" file
// Instead, create a separate config file for these constants

// -----------------------------------------------------------------------------
// API KEY MANAGEMENT (called from dashboard)
// -----------------------------------------------------------------------------

export async function createCompanyApiKey(input: {
  companyId: string;
  companySlug: string;
  name: string;
  scopes: Scope[];
  expiresAt?: Date;
  rateLimit?: number;
  allowedIps?: string[];
  allowedDomains?: string[];
}) {
  await requireAdmin();

  const result = await createApiKey(input);

  revalidatePath(`/admin/${input.companySlug}/api-keys`);

  // Return raw key — caller must display immediately and never store
  return result;
}

export async function rotateCompanyApiKey(keyId: string, companySlug: string) {
  await requireAdmin();
  const result = await rotateApiKey(keyId, companySlug);
  revalidatePath(`/admin/${companySlug}/api-keys`);
  return result;
}

export async function revokeCompanyApiKey(keyId: string, companySlug: string, reason?: string) {
  await requireAdmin();
  await revokeApiKey(keyId, reason);
  revalidatePath(`/admin/${companySlug}/api-keys`);
}

export async function getCompanyApiKeys(companyId: string) {
  await requireAdmin();
  return listApiKeys(companyId);
}

// -----------------------------------------------------------------------------
// ANALYTICS (for dashboard overview widgets)
// -----------------------------------------------------------------------------

export async function getCompanyStats(companyId: string, days = 30) {
  await requireAdmin();

  const since = new Date(Date.now() - days * 86400000);

  const [
    totalBookings,
    newBookings,
    pendingBookings,
    totalContacts,
    totalInvoices,
    paidInvoices,
    apiRequests,
    apiErrors,
  ] = await Promise.all([
    prismadb.booking.count({ where: { companyId } }),
    prismadb.booking.count({ where: { companyId, createdAt: { gte: since } } }),
    prismadb.booking.count({ where: { companyId, status: "PENDING" } }),
    prismadb.companyContact.count({ where: { companyId } }),
    prismadb.invoice.count({ where: { companyId } }),
    prismadb.invoice.count({ where: { companyId, status: "PAID" } }),
    prismadb.apiRequestLog.count({ where: { companyId, createdAt: { gte: since } } }),
    prismadb.apiRequestLog.count({
      where: { companyId, createdAt: { gte: since }, statusCode: { gte: 400 } }
    }),
  ]);

  return {
    bookings: { total: totalBookings, new: newBookings, pending: pendingBookings },
    contacts: { total: totalContacts },
    invoices: { total: totalInvoices, paid: paidInvoices },
    api: { requests: apiRequests, errors: apiErrors, errorRate: apiRequests > 0
                  ? Math.round((apiErrors / apiRequests) * 100) : 0 },
  };
}





// // =============================================================================
// // lib/actions/company-actions.ts
// // Server actions for the admin dashboard company management
// // These are called from admin UI components — protected by Clerk auth
// // =============================================================================

// "use server";

// import { auth } from "@clerk/nextjs/server";
// import { createApiKey, rotateApiKey, revokeApiKey, listApiKeys } from "@/lib/services/api-keys";
// import type { Scope } from "@/lib/api/types";
// import { revalidatePath } from "next/cache";
// import { prismadb } from "../db";

// // Helper: ensure caller is an admin
// async function requireAdmin() {
//   const { userId } = await auth();
//   if (!userId) throw new Error("Unauthorised");

//   // Check your User table for ADMIN/SUPER_ADMIN role
//   const user = await prismadb.user.findUnique({
//     where: { clerkId: userId },
//     select: { role: true },
//   });
//   if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
//     throw new Error("Unauthorised");
//   }
//   return user;
// }

// // -----------------------------------------------------------------------------
// // COMPANY CRUD
// // -----------------------------------------------------------------------------

// export async function getCompany(slug: string) {
//   await requireAdmin();
//   return prismadb.company.findUnique({
//     where: { slug },
//     include: {
//       apiKeys:  { select: { id: true, name: true, keyPrefix: true, lastFourChars: true,
//                             isActive: true, lastUsedAt: true, totalRequests: true, scopes: true } },
//       members:  { select: { id: true, userId: true, role: true, isActive: true } },
//       _count:   { select: { bookings: true, contacts: true, invoices: true } },
//     },
//   });
// }

// export async function listCompanies() {
//   await requireAdmin();
//   return prismadb.company.findMany({
//     select: {
//       id: true, legalName: true, displayName: true, slug: true,
//       logoUrl: true, accentColor: true, isActive: true, planTier: true,
//       primaryDomain: true, createdAt: true,
//       _count: { select: { bookings: true, contacts: true, apiKeys: true } },
//     },
//     orderBy: { createdAt: "asc" },
//   });
// }

// export async function createCompany(input: {
//   legalName:     string;
//   displayName:   string;
//   slug:          string;
//   primaryDomain: string;
//   allowedDomains?: string[];
//   accentColor?:  string;
//   contactEmail?: string;
//   dashboardConfig?: object;
// }) {
//   await requireAdmin();

//   const existing = await prismadb.company.findUnique({ where: { slug: input.slug } });
//   if (existing) throw new Error("Slug already in use");

//   const company = await prismadb.company.create({
//     data: {
//       ...input,
//       allowedDomains:  input.allowedDomains ? JSON.stringify(input.allowedDomains) : undefined,
//       dashboardConfig: input.dashboardConfig ? JSON.stringify(input.dashboardConfig) : undefined,
//     },
//   });

//   revalidatePath("/admin");
//   return company;
// }

// // -----------------------------------------------------------------------------
// // DASHBOARD CONFIG
// // Update the dynamic navigation and module config for a company
// // -----------------------------------------------------------------------------

// export interface NavItem {
//   id:        string;
//   label:     string;
//   iconName:  string;
//   href:      string;
//   badge?:    string;
//   badgeColor?: string;
// }

// export interface NavGroup {
//   id:    string;
//   label: string;
//   items: NavItem[];
// }

// export interface DashboardConfig {
//   nav:      NavGroup[];
//   modules:  string[];                          // Enabled module IDs
//   settings: Record<string, unknown>;           // Arbitrary per-company settings
// }

// export async function updateDashboardConfig(
//   companyId: string,
//   config: DashboardConfig
// ) {
//   await requireAdmin();
//   await prismadb.company.update({
//     where: { id: companyId },
//     data:  { dashboardConfig: JSON.stringify(config) },
//   });
//   revalidatePath("/admin");
// }

// // Default dashboard config for iPaha Ltd
// export const IPAHA_LTD_DASHBOARD_CONFIG: DashboardConfig = {
//   nav: [
//     {
//       id: "main",
//       label: "Main",
//       items: [
//         { id: "dashboard", label: "Dashboard",  iconName: "LayoutDashboard", href: "/dashboard" },
//         { id: "bookings",  label: "Bookings",   iconName: "Calendar",        href: "/bookings" },
//         { id: "clients",   label: "Clients",    iconName: "Users",           href: "/clients" },
//         { id: "invoices",  label: "Invoices",   iconName: "FileText",        href: "/invoices" },
//         { id: "portal",    label: "Client Portal", iconName: "Globe",        href: "/portal" },
//       ],
//     },
//     {
//       id: "dev",
//       label: "Developer",
//       items: [
//         { id: "api-keys",  label: "API Keys",   iconName: "Key",             href: "/api-keys" },
//         { id: "webhooks",  label: "Webhooks",   iconName: "Webhook",         href: "/webhooks" },
//         { id: "logs",      label: "Logs",       iconName: "Terminal",        href: "/logs" },
//       ],
//     },
//     {
//       id: "config",
//       label: "Settings",
//       items: [
//         { id: "settings",  label: "Settings",   iconName: "Settings",        href: "/settings" },
//       ],
//     },
//   ],
//   modules:  ["bookings", "contacts", "invoices", "client_portal", "api_keys", "webhooks"],
//   settings: { currency: "GBP", timezone: "Europe/London" },
// };

// // Default dashboard config for iPahaStores Ltd
// export const IPAHASTORES_DASHBOARD_CONFIG: DashboardConfig = {
//   nav: [
//     {
//       id: "main",
//       label: "Main",
//       items: [
//         { id: "dashboard",  label: "Dashboard",  iconName: "LayoutDashboard", href: "/dashboard" },
//         { id: "products",   label: "Products",   iconName: "Package",         href: "/products" },
//         { id: "orders",     label: "Orders",     iconName: "ShoppingCart",    href: "/orders" },
//         { id: "inventory",  label: "Inventory",  iconName: "Boxes",           href: "/inventory" },
//         { id: "customers",  label: "Customers",  iconName: "Users",           href: "/customers" },
//         { id: "shipping",   label: "Shipping",   iconName: "Truck",           href: "/shipping" },
//       ],
//     },
//     {
//       id: "dev",
//       label: "Developer",
//       items: [
//         { id: "api-keys",  label: "API Keys",   iconName: "Key",             href: "/api-keys" },
//         { id: "webhooks",  label: "Webhooks",   iconName: "Webhook",         href: "/webhooks" },
//         { id: "logs",      label: "Logs",       iconName: "Terminal",        href: "/logs" },
//       ],
//     },
//   ],
//   modules:  ["products", "orders", "inventory", "customers", "shipping", "api_keys", "webhooks"],
//   settings: { currency: "GBP", timezone: "Europe/London", vatNumber: "" },
// };

// // -----------------------------------------------------------------------------
// // API KEY MANAGEMENT (called from dashboard)
// // -----------------------------------------------------------------------------

// export async function createCompanyApiKey(input: {
//   companyId:       string;
//   companySlug:     string;
//   name:            string;
//   scopes:          Scope[];
//   expiresAt?:      Date;
//   rateLimit?:      number;
//   allowedIps?:     string[];
//   allowedDomains?: string[];
// }) {
//   await requireAdmin();

//   const result = await createApiKey(input);

//   revalidatePath(`/admin/${input.companySlug}/api-keys`);

//   // Return raw key — caller must display immediately and never store
//   return result;
// }

// export async function rotateCompanyApiKey(keyId: string, companySlug: string) {
//   await requireAdmin();
//   const result = await rotateApiKey(keyId, companySlug);
//   revalidatePath(`/admin/${companySlug}/api-keys`);
//   return result;
// }

// export async function revokeCompanyApiKey(keyId: string, companySlug: string, reason?: string) {
//   await requireAdmin();
//   await revokeApiKey(keyId, reason);
//   revalidatePath(`/admin/${companySlug}/api-keys`);
// }

// export async function getCompanyApiKeys(companyId: string) {
//   await requireAdmin();
//   return listApiKeys(companyId);
// }

// // -----------------------------------------------------------------------------
// // ANALYTICS (for dashboard overview widgets)
// // -----------------------------------------------------------------------------

// export async function getCompanyStats(companyId: string, days = 30) {
//   await requireAdmin();

//   const since = new Date(Date.now() - days * 86400000);

//   const [
//     totalBookings,
//     newBookings,
//     pendingBookings,
//     totalContacts,
//     totalInvoices,
//     paidInvoices,
//     apiRequests,
//     apiErrors,
//   ] = await Promise.all([
//     prismadb.booking.count({ where: { companyId } }),
//     prismadb.booking.count({ where: { companyId, createdAt: { gte: since } } }),
//     prismadb.booking.count({ where: { companyId, status: "PENDING" } }),
//     prismadb.companyContact.count({ where: { companyId } }),
//     prismadb.invoice.count({ where: { companyId } }),
//     prismadb.invoice.count({ where: { companyId, status: "PAID" } }),
//     prismadb.apiRequestLog.count({ where: { companyId, createdAt: { gte: since } } }),
//     prismadb.apiRequestLog.count({
//       where: { companyId, createdAt: { gte: since }, statusCode: { gte: 400 } }
//     }),
//   ]);

//   return {
//     bookings:   { total: totalBookings, new: newBookings, pending: pendingBookings },
//     contacts:   { total: totalContacts },
//     invoices:   { total: totalInvoices, paid: paidInvoices },
//     api:        { requests: apiRequests, errors: apiErrors, errorRate: apiRequests > 0
//                   ? Math.round((apiErrors / apiRequests) * 100) : 0 },
//   };
// }