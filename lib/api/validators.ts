// =============================================================================
// lib/api/validators.ts
// Zod schemas for all request bodies and query parameters
// Usage: const result = BookingCreateSchema.safeParse(body)
// =============================================================================

import { z } from "zod";

// -----------------------------------------------------------------------------
// SHARED
// -----------------------------------------------------------------------------

export const PaginationSchema = z.object({
  page:     z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort:     z.string().optional(),           // "createdAt" | "-createdAt"
  search:   z.string().max(200).optional(),
  include:  z.string().optional(),           // Comma-separated: "contact,invoice"
  fields:   z.string().optional(),           // Comma-separated sparse fieldset
});

// Helper: parse include and fields from query params
export function parseListParams(searchParams: URLSearchParams) {
  return PaginationSchema.parse({
    page:     searchParams.get("page"),
    pageSize: searchParams.get("pageSize"),
    sort:     searchParams.get("sort"),
    search:   searchParams.get("search"),
    include:  searchParams.get("include"),
    fields:   searchParams.get("fields"),
  });
}

// Helper: parse sort string into Prisma orderBy
export function parseSortParam(sort?: string): Record<string, "asc" | "desc"> {
  if (!sort) return { createdAt: "desc" };
  const desc = sort.startsWith("-");
  const field = desc ? sort.slice(1) : sort;
  const safeFields = ["createdAt", "updatedAt", "status", "clientEmail", "clientName"];
  if (!safeFields.includes(field)) return { createdAt: "desc" };
  return { [field]: desc ? "desc" : "asc" };
}

// -----------------------------------------------------------------------------
// BOOKINGS
// -----------------------------------------------------------------------------

export const BookingCreateSchema = z.object({
  clientName:      z.string().min(1).max(200),
  clientEmail:     z.string().email(),
  clientPhone:     z.string().max(30).optional(),
  clientCompany:   z.string().max(200).optional(),
  clientMessage:   z.string().max(5000).optional(),
  serviceType:     z.string().max(100).optional(),
  preferredDate:   z.string().datetime({ offset: true }).optional(),
  duration:        z.number().int().min(15).max(480).optional(),
  location:        z.enum(["VIDEO_CALL", "IN_PERSON", "PHONE"]).optional(),
  source:          z.string().max(100).optional(),
  metadata:        z.record(z.string(), z.unknown()).optional(),
});

export const BookingUpdateSchema = z.object({
  status:          z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  confirmedDate:   z.string().datetime({ offset: true }).optional(),
  meetingUrl:      z.string().url().optional(),
  assignedTo:      z.string().optional(),
  internalNotes:   z.string().max(5000).optional(),
  metadata:        z.record(z.string(), z.unknown()).optional(),
}).strict();

export const BookingFilterSchema = PaginationSchema.extend({
  status:  z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  email:   z.string().email().optional(),
  from:    z.string().datetime({ offset: true }).optional(),
  to:      z.string().datetime({ offset: true }).optional(),
});

// -----------------------------------------------------------------------------
// CONTACTS
// -----------------------------------------------------------------------------

export const ContactCreateSchema = z.object({
  firstName:  z.string().min(1).max(100),
  lastName:   z.string().max(100).optional(),
  email:      z.string().email(),
  phone:      z.string().max(30).optional(),
  company:    z.string().max(200).optional(),
  jobTitle:   z.string().max(200).optional(),
  notes:      z.string().max(5000).optional(),
  tags:       z.array(z.string().max(50)).optional(),
  source:     z.string().max(100).optional(),
  metadata:   z.record(z.string(), z.unknown()).optional(),
});

export const ContactUpdateSchema = ContactCreateSchema.partial().strict();

export const ContactFilterSchema = PaginationSchema.extend({
  company:   z.string().optional(),
  tag:       z.string().optional(),
  isActive:  z.coerce.boolean().optional(),
});

// -----------------------------------------------------------------------------
// INVOICES
// -----------------------------------------------------------------------------

const LineItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity:    z.number().positive(),
  unitPrice:   z.number().nonnegative(),
});

export const InvoiceCreateSchema = z.object({
  invoiceNumber: z.string().min(1).max(50),
  clientName:    z.string().min(1).max(200),
  clientEmail:   z.string().email(),
  clientAddress: z.string().max(1000).optional(),
  lineItems:     z.array(LineItemSchema).min(1),
  taxRate:       z.number().min(0).max(100).default(20),
  currency:      z.string().length(3).default("GBP"),
  dueAt:         z.string().datetime({ offset: true }).optional(),
  notes:         z.string().max(2000).optional(),
  metadata:      z.record(z.string(), z.unknown()).optional(),
});

export const InvoiceUpdateSchema = z.object({
  status:     z.enum(["DRAFT","SENT","VIEWED","PAID","OVERDUE","CANCELLED"]).optional(),
  paidAt:     z.string().datetime({ offset: true }).optional(),
  paymentRef: z.string().max(200).optional(),
  notes:      z.string().max(2000).optional(),
}).strict();

// -----------------------------------------------------------------------------
// FORM SUBMISSIONS
// -----------------------------------------------------------------------------

export const FormSubmissionSchema = z.object({
  formId:    z.string().min(1).max(100),
  data:      z.record(z.string(), z.unknown()),
  source:    z.string().max(200).optional(),
});

// -----------------------------------------------------------------------------
// WEBHOOKS
// -----------------------------------------------------------------------------

export const WebhookCreateSchema = z.object({
  url:         z.string().url().startsWith("https://", {
    message: "Webhook URL must use HTTPS",
  }),
  description: z.string().max(500).optional(),
  events:      z.array(z.enum([
    "booking.created", "booking.updated", "booking.cancelled",
    "contact.created", "contact.updated",
    "invoice.created", "invoice.paid", "invoice.overdue",
    "form.submitted",
  ])).min(1),
});

export const WebhookUpdateSchema = z.object({
  url:         z.string().url().startsWith("https://").optional(),
  description: z.string().max(500).optional(),
  events:      z.array(z.string()).optional(),
  isActive:    z.boolean().optional(),
}).strict();

// Type exports for use in handlers
export type BookingCreateInput  = z.infer<typeof BookingCreateSchema>;
export type BookingUpdateInput  = z.infer<typeof BookingUpdateSchema>;
export type ContactCreateInput  = z.infer<typeof ContactCreateSchema>;
export type ContactUpdateInput  = z.infer<typeof ContactUpdateSchema>;
export type InvoiceCreateInput  = z.infer<typeof InvoiceCreateSchema>;
export type FormSubmissionInput = z.infer<typeof FormSubmissionSchema>;
export type WebhookCreateInput  = z.infer<typeof WebhookCreateSchema>;