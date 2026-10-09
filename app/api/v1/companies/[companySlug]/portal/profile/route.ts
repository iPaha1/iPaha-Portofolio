// app/api/v1/companies/[companySlug]/portal/profile/route.ts
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/middleware/authenticate";
import { errors, apiSuccess } from "@/lib/api/response";
import { prismadb } from "@/lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.PORTAL_JWT_SECRET || "your-secret-key";

export const GET = withAuth(
  async (req, ctx, routeParams) => {
    try {
      // Extract client ID from the API key's scope or from a custom header
      // For portal endpoints, we need to verify the client token
      const authHeader = req.headers.get("authorization");
      const token = authHeader?.replace("Bearer ", "");
      
      if (!token) {
        return errors.invalidKey(ctx.requestId);
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      const client = await prismadb.companyContact.findFirst({
        where: {
          id: decoded.clientId,
          companyId: ctx.companyId,
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          company: true,
          phone: true,
          createdAt: true,
        },
      });

      if (!client) {
        return errors.notFound(ctx.requestId, "Client not found");
      }

      // Get project stats
      const invoices = await prismadb.invoice.findMany({
        where: {
          clientEmail: client.email,
          companyId: ctx.companyId,
        },
        select: {
          status: true,
          total: true,
        },
      });

      const paidTotal = invoices
        .filter(i => i.status === "PAID")
        .reduce((sum, i) => sum + Number(i.total), 0);
      
      const outstandingTotal = invoices
        .filter(i => i.status === "SENT" || i.status === "OVERDUE")
        .reduce((sum, i) => sum + Number(i.total), 0);

      return apiSuccess({
        id: client.id,
        name: `${client.firstName} ${client.lastName}`.trim(),
        email: client.email,
        businessName: client.company,
        phone: client.phone,
        memberSince: client.createdAt,
        stats: {
          invoicesPaid: invoices.filter(i => i.status === "PAID").length,
          invoicesOutstanding: outstandingTotal,
          totalSpent: paidTotal,
        },
      }, ctx.requestId);
    } catch (error) {
      console.error("Profile error:", error);
      return errors.internal(ctx.requestId);
    }
  },
  { requiredScope: "portal:read" }
);