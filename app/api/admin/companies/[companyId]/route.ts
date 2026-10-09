// app/api/admin/companies/[companyId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prismadb.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!user || !["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { companyId } = await params;
    const body = await req.json();
    
    const {
      displayName,
      contactEmail,
      primaryDomain,
      allowedDomains,
      accentColor,
    } = body;

    // Prepare update data
    const updateData: any = {};
    
    if (displayName !== undefined) updateData.displayName = displayName;
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
    if (primaryDomain !== undefined) updateData.primaryDomain = primaryDomain;
    if (allowedDomains !== undefined) {
      updateData.allowedDomains = JSON.stringify(allowedDomains);
    }
    if (accentColor !== undefined) updateData.accentColor = accentColor;

    const updatedCompany = await prismadb.company.update({
      where: { id: companyId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      company: updatedCompany,
    });
  } catch (error) {
    console.error("Failed to update company:", error);
    return NextResponse.json(
      { error: "Failed to update company settings" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companyId } = await params;
    
    const company = await prismadb.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            apiKeys: true,
            bookings: true,
            invoices: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({ company });
  } catch (error) {
    console.error("Failed to fetch company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}