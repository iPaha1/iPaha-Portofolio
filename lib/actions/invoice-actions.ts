// lib/actions/invoice-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prismadb } from "../db";
import { revalidatePath } from "next/cache";
import { sendInvoiceEmail as sendEmail } from "@/lib/services/email";

// Helper: ensure caller is an admin
async function requireAdmin() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorised");

  const user = await prismadb.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });
  if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
    throw new Error("Unauthorised");
  }
  return user;
}

interface GetInvoicesParams {
  status?: string;
  page?: number;
  pageSize?: number;
  search?: string;
}

export async function getInvoices(companyId: string, params: GetInvoicesParams = {}) {
  await requireAdmin();
  
  const { status, page = 1, pageSize = 20, search } = params;
  const skip = (page - 1) * pageSize;

  const where: any = { companyId };
  
  if (status && status !== "ALL") {
    where.status = status;
  }
  
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { clientName: { contains: search, mode: "insensitive" } },
      { clientEmail: { contains: search, mode: "insensitive" } },
      { clientCompany: { contains: search, mode: "insensitive" } },
    ];
  }

  const [invoices, total] = await Promise.all([
    prismadb.invoice.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prismadb.invoice.count({ where }),
  ]);

  // Parse lineItems from JSON string to array
  const parsedInvoices = invoices.map(invoice => ({
    ...invoice,
    lineItems: typeof invoice.lineItems === 'string' ? JSON.parse(invoice.lineItems) : invoice.lineItems,
    subtotal: Number(invoice.subtotal),
    taxRate: Number(invoice.taxRate),
    taxAmount: Number(invoice.taxAmount),
    total: Number(invoice.total),
  }));

  return {
    invoices: parsedInvoices,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getInvoiceStatusCounts(companyId: string) {
  await requireAdmin();
  
  const counts = await prismadb.invoice.groupBy({
    by: ["status"],
    where: { companyId },
    _count: { status: true },
  });

  const result: Record<string, number> = {};
  counts.forEach((count) => {
    result[count.status] = count._count.status;
  });
  
  return result;
}

export async function getInvoiceById(invoiceId: string) {
  await requireAdmin();
  
  const invoice = await prismadb.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      company: {
        select: { id: true, slug: true, displayName: true, accentColor: true },
      },
    },
  });
  
  if (invoice) {
    return {
      ...invoice,
      lineItems: typeof invoice.lineItems === 'string' ? JSON.parse(invoice.lineItems) : invoice.lineItems,
      subtotal: Number(invoice.subtotal),
      taxRate: Number(invoice.taxRate),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
    };
  }
  
  return invoice;
}

export async function createInvoice(data: {
  companyId: string;
  companySlug: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string;
  currency?: string;
}) {
  await requireAdmin();

  // Check if invoice number is unique
  const existing = await prismadb.invoice.findFirst({
    where: { companyId: data.companyId, invoiceNumber: data.invoiceNumber },
  });
  if (existing) {
    throw new Error("Invoice number already exists for this company");
  }

  const invoice = await prismadb.invoice.create({
    data: {
      companyId: data.companyId,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientCompany: data.clientCompany || null, // Use null if not provided
      invoiceNumber: data.invoiceNumber,
      issuedAt: data.issueDate, // Note: field is issuedAt, not issueDate
      dueAt: data.dueDate,      // Note: field is dueAt, not dueDate
      lineItems: JSON.stringify(data.lineItems),
      subtotal: data.subtotal,
      taxRate: data.taxRate,
      taxAmount: data.taxAmount,
      total: data.total,
      notes: data.notes,
      currency: data.currency || "GBP",
      status: "DRAFT",
    },
  });

  revalidatePath(`/admin/${data.companySlug}/invoices`);
  return invoice;
}

export async function sendInvoiceEmail(invoiceId: string, companySlug: string) {
  await requireAdmin();

  const invoice = await prismadb.invoice.findUnique({
    where: { id: invoiceId },
    include: { company: true },
  });

  if (!invoice) throw new Error("Invoice not found");

  // Parse lineItems if needed
  const lineItems = typeof invoice.lineItems === 'string' ? JSON.parse(invoice.lineItems) : invoice.lineItems;

  await sendEmail({
    to: invoice.clientEmail,
    subject: `Invoice ${invoice.invoiceNumber} from ${invoice.company.displayName || invoice.company.legalName}`,
    html: generateInvoiceEmailHTML({ ...invoice, lineItems }),
  });

  // Update status to SENT
  await prismadb.invoice.update({
    where: { id: invoiceId },
    data: { 
      status: "SENT",
      updatedAt: new Date(),
    },
  });

  revalidatePath(`/admin/${companySlug}/invoices`);
  return { success: true };
}

export async function resendInvoiceEmail(invoiceId: string, companySlug: string) {
  await requireAdmin();
  return sendInvoiceEmail(invoiceId, companySlug);
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: "DRAFT" | "SENT" | "VIEWED" | "PAID" | "OVERDUE" | "CANCELLED",
  companySlug: string
) {
  await requireAdmin();

  const updateData: any = { status };
  if (status === "PAID") {
    updateData.paidAt = new Date();
  }

  const invoice = await prismadb.invoice.update({
    where: { id: invoiceId },
    data: updateData,
  });

  revalidatePath(`/admin/${companySlug}/invoices`);
  return invoice;
}

export async function markAsPaid(invoiceId: string, companySlug: string) {
  await requireAdmin();

  const invoice = await prismadb.invoice.update({
    where: { id: invoiceId },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
    include: { company: true },
  });

  // Send payment confirmation email
  const { sendPaymentConfirmation } = await import("@/lib/services/email");
  await sendPaymentConfirmation({
    ...invoice,
    lineItems: typeof invoice.lineItems === 'string' ? JSON.parse(invoice.lineItems) : invoice.lineItems,
  });

  revalidatePath(`/admin/${companySlug}/invoices`);
  return invoice;
}

function generateInvoiceEmailHTML(invoice: any): string {
  const lineItems = invoice.lineItems || [];
  const currency = invoice.currency || "GBP";
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
        .invoice-details { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .invoice-table th, .invoice-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .invoice-table th { background: #f9fafb; font-weight: 600; }
        .totals { text-align: right; margin-top: 20px; }
        .totals div { margin: 5px 0; }
        .grand-total { font-size: 18px; font-weight: bold; color: #f59e0b; }
        .button { display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Invoice ${invoice.invoiceNumber}</h1>
        </div>
        <div class="content">
          <p>Dear ${invoice.clientName},</p>
          <p>Please find your invoice attached below. Payment is due by ${new Date(invoice.dueAt).toLocaleDateString('en-GB')}.</p>
          
          <div class="invoice-details">
            <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Issue Date:</strong> ${new Date(invoice.issuedAt).toLocaleDateString('en-GB')}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueAt).toLocaleDateString('en-GB')}</p>
            ${invoice.clientCompany ? `<p><strong>Company:</strong> ${invoice.clientCompany}</p>` : ''}
          </div>

          <table class="invoice-table">
            <thead>
              <tr><th>Description</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>
            </thead>
            <tbody>
              ${lineItems.map((item: any) => `
                <tr>
                  <td>${item.description}</td>
                  <td>${item.quantity}</td>
                  <td>${new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(item.unitPrice)}</td>
                  <td>${new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(item.quantity * item.unitPrice)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals">
            <div>Subtotal: ${new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(Number(invoice.subtotal))}</div>
            <div>Tax (${invoice.taxRate}%): ${new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(Number(invoice.taxAmount))}</div>
            <div class="grand-total">Total Due: ${new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(Number(invoice.total))}</div>
          </div>

          ${invoice.notes ? `<div style="margin: 20px 0; padding: 15px; background: #fef3c7; border-radius: 8px;"><strong>Notes:</strong><br/>${invoice.notes}</div>` : ''}

          <div style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.id}" class="button">View Online</a>
          </div>

          <div class="footer">
            <p>Thank you for your business!</p>
            <p>${invoice.company.displayName || invoice.company.legalName}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}




// // lib/actions/invoice-actions.ts
// "use server";

// import { auth } from "@clerk/nextjs/server";
// import { prismadb } from "../db";
// import { revalidatePath } from "next/cache";
// import { sendInvoiceEmail as sendEmail } from "@/lib/services/email";

// // Helper: ensure caller is an admin
// async function requireAdmin() {
//   const { userId } = await auth();
//   if (!userId) throw new Error("Unauthorised");

//   const user = await prismadb.user.findUnique({
//     where: { clerkId: userId },
//     select: { role: true },
//   });
//   if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
//     throw new Error("Unauthorised");
//   }
//   return user;
// }

// interface GetInvoicesParams {
//   status?: string;
//   page?: number;
//   pageSize?: number;
//   search?: string;
// }

// export async function getInvoices(companyId: string, params: GetInvoicesParams = {}) {
//   await requireAdmin();
  
//   const { status, page = 1, pageSize = 20, search } = params;
//   const skip = (page - 1) * pageSize;

//   // Build where clause
//   const where: any = { companyId };
  
//   if (status && status !== "ALL") {
//     where.status = status;
//   }
  
//   if (search) {
//     where.OR = [
//       { invoiceNumber: { contains: search, mode: "insensitive" } },
//       { clientName: { contains: search, mode: "insensitive" } },
//       { clientEmail: { contains: search, mode: "insensitive" } },
//     ];
//   }

//   const [invoices, total] = await Promise.all([
//     prismadb.invoice.findMany({
//       where,
//       skip,
//       take: pageSize,
//       orderBy: { createdAt: "desc" },
//     }),
//     prismadb.invoice.count({ where }),
//   ]);

//   return {
//     invoices,
//     total,
//     page,
//     pageSize,
//     totalPages: Math.ceil(total / pageSize),
//   };
// }

// export async function getInvoiceStatusCounts(companyId: string) {
//   await requireAdmin();
  
//   const counts = await prismadb.invoice.groupBy({
//     by: ["status"],
//     where: { companyId },
//     _count: { status: true },
//   });

//   const result: Record<string, number> = {};
//   counts.forEach((count) => {
//     result[count.status] = count._count.status;
//   });
  
//   return result;
// }

// export async function getInvoiceById(invoiceId: string) {
//   await requireAdmin();
  
//   return prismadb.invoice.findUnique({
//     where: { id: invoiceId },
//     include: {
//       company: {
//         select: { id: true, slug: true, displayName: true, accentColor: true },
//       },
//     },
//   });
// }

// export async function createInvoice(data: {
//   companyId: string;
//   companySlug: string;
//   clientName: string;
//   clientEmail: string;
//   clientCompany?: string;
//   invoiceNumber: string;
//   issueDate: Date;
//   dueDate: Date;
//   lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;
//   subtotal: number;
//   taxRate: number;
//   taxAmount: number;
//   total: number;
//   notes?: string;
//   currency?: string;
// }) {
//   await requireAdmin();

//   // Check if invoice number is unique
//   const existing = await prismadb.invoice.findFirst({
//     where: { companyId: data.companyId, invoiceNumber: data.invoiceNumber },
//   });
//   if (existing) {
//     throw new Error("Invoice number already exists for this company");
//   }

//   const invoice = await prismadb.invoice.create({
//     data: {
//       companyId: data.companyId,
//       clientName: data.clientName,
//       clientEmail: data.clientEmail,
//       clientCompany: data.clientCompany,
//       invoiceNumber: data.invoiceNumber,
//       issueDate: data.issueDate,
//       dueDate: data.dueDate,
//       lineItems: JSON.stringify(data.lineItems),
//       subtotal: data.subtotal,
//       taxRate: data.taxRate,
//       taxAmount: data.taxAmount,
//       total: data.total,
//       notes: data.notes,
//       currency: data.currency || "GBP",
//       status: "DRAFT",
//     },
//   });

//   revalidatePath(`/admin/${data.companySlug}/invoices`);
//   return invoice;
// }

// export async function sendInvoiceEmail(invoiceId: string, companySlug: string) {
//   await requireAdmin();

//   const invoice = await prismadb.invoice.findUnique({
//     where: { id: invoiceId },
//     include: { company: true },
//   });

//   if (!invoice) throw new Error("Invoice not found");

//   await sendEmail({
//     to: invoice.clientEmail,
//     subject: `Invoice ${invoice.invoiceNumber} from ${invoice.company.displayName || invoice.company.legalName}`,
//     html: generateInvoiceEmailHTML(invoice),
//   });

//   // Update last sent timestamp
//   await prismadb.invoice.update({
//     where: { id: invoiceId },
//     data: { 
//       status: "SENT",
//       updatedAt: new Date(),
//     },
//   });

//   revalidatePath(`/admin/${companySlug}/invoices`);
//   return { success: true };
// }

// export async function resendInvoiceEmail(invoiceId: string, companySlug: string) {
//   await requireAdmin();
//   return sendInvoiceEmail(invoiceId, companySlug);
// }

// export async function updateInvoiceStatus(
//   invoiceId: string,
//   status: "DRAFT" | "SENT" | "VIEWED" | "PAID" | "OVERDUE" | "CANCELLED",
//   companySlug: string
// ) {
//   await requireAdmin();

//   const updateData: any = { status };
//   if (status === "PAID") {
//     updateData.paidAt = new Date();
//   }

//   const invoice = await prismadb.invoice.update({
//     where: { id: invoiceId },
//     data: updateData,
//   });

//   revalidatePath(`/admin/${companySlug}/invoices`);
//   return invoice;
// }

// export async function markAsPaid(invoiceId: string, companySlug: string) {
//   await requireAdmin();

//   const invoice = await prismadb.invoice.update({
//     where: { id: invoiceId },
//     data: {
//       status: "PAID",
//       paidAt: new Date(),
//     },
//   });

//   // Send payment confirmation email
//   const { sendPaymentConfirmation } = await import("@/lib/services/email");
//   await sendPaymentConfirmation(invoice);

//   revalidatePath(`/admin/${companySlug}/invoices`);
//   return invoice;
// }

// function generateInvoiceEmailHTML(invoice: any): string {
//   const lineItems = JSON.parse(invoice.lineItems);
//   const currency = invoice.currency || "GBP";
  
//   return `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="utf-8">
//       <style>
//         body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; }
//         .container { max-width: 600px; margin: 0 auto; padding: 20px; }
//         .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
//         .header h1 { color: white; margin: 0; font-size: 24px; }
//         .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
//         .invoice-details { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
//         .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
//         .invoice-table th, .invoice-table td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
//         .invoice-table th { background: #f9fafb; font-weight: 600; }
//         .totals { text-align: right; margin-top: 20px; }
//         .totals div { margin: 5px 0; }
//         .grand-total { font-size: 18px; font-weight: bold; color: #f59e0b; }
//         .button { display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
//         .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <div class="header">
//           <h1>Invoice ${invoice.invoiceNumber}</h1>
//         </div>
//         <div class="content">
//           <p>Dear ${invoice.clientName},</p>
//           <p>Please find your invoice attached below. Payment is due by ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}.</p>
          
//           <div class="invoice-details">
//             <p><strong>Invoice Number:</strong> ${invoice.invoiceNumber}</p>
//             <p><strong>Issue Date:</strong> ${new Date(invoice.issueDate).toLocaleDateString('en-GB')}</p>
//             <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-GB')}</p>
//           </div>

//           <table class="invoice-table">
//             <thead>
//               <tr><th>Description</th><th>Quantity</th><th>Unit Price</th><th>Total</th></tr>
//             </thead>
//             <tbody>
//               ${lineItems.map((item: any) => `
//                 <tr>
//                   <td>${item.description}</td>
//                   <td>${item.quantity}</td>
//                   <td>${new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(item.unitPrice)}</td>
//                   <td>${new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(item.quantity * item.unitPrice)}</td>
//                 </tr>
//               `).join('')}
//             </tbody>
//           </table>

//           <div class="totals">
//             <div>Subtotal: ${new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(invoice.subtotal)}</div>
//             <div>Tax (${invoice.taxRate}%): ${new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(invoice.taxAmount)}</div>
//             <div class="grand-total">Total Due: ${new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(invoice.total)}</div>
//           </div>

//           ${invoice.notes ? `<div style="margin: 20px 0; padding: 15px; background: #fef3c7; border-radius: 8px;"><strong>Notes:</strong><br/>${invoice.notes}</div>` : ''}

//           <div style="text-align: center;">
//             <a href="${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.id}" class="button">View Online</a>
//           </div>

//           <div class="footer">
//             <p>Thank you for your business!</p>
//             <p>${invoice.company.displayName || invoice.company.legalName}</p>
//           </div>
//         </div>
//       </div>
//     </body>
//     </html>
//   `;
// }

// /