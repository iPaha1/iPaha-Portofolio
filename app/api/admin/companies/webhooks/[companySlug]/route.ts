// app/api/v1/companies/[companySlug]/webhooks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createWebhookEndpoint } from "@/lib/actions/webhook-actions";
import { prismadb } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ companySlug: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { companySlug } = await params;
    
    // Get the company
    const company = await prismadb.company.findUnique({
      where: { slug: companySlug },
      select: { id: true },
    });
    
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    
    const body = await req.json();
    const { url, description, events } = body;
    
    if (!url || !events || events.length === 0) {
      return NextResponse.json(
        { error: "URL and events are required" },
        { status: 400 }
      );
    }
    
    const endpoint = await createWebhookEndpoint({
      companyId: company.id,
      companySlug,
      url,
      description,
      events,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        id: endpoint.id,
        url: endpoint.url,
        description: endpoint.description,
        events: JSON.parse(endpoint.events),
        signingSecret: endpoint.signingSecret,
      },
    });
  } catch (error) {
    console.error("Failed to create webhook endpoint:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create webhook endpoint" },
      { status: 500 }
    );
  }
}