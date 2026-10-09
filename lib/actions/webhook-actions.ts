// lib/actions/webhook-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prismadb } from "../db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

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

// Generate a signing secret for webhook endpoints
function generateSigningSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function getWebhookEndpoints(companyId: string) {
  await requireAdmin();
  
  const endpoints = await prismadb.webhookEndpoint.findMany({
    where: { companyId },
    include: {
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 5, // Only get the 5 most recent deliveries
      },
      _count: {
        select: { deliveries: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  
  return endpoints;
}

export async function createWebhookEndpoint(data: {
  companyId: string;
  companySlug: string;
  url: string;
  description?: string;
  events: string[];
}) {
  await requireAdmin();
  
  // Validate URL is HTTPS in production
  if (process.env.NODE_ENV === "production" && !data.url.startsWith("https://")) {
    throw new Error("Webhook URLs must use HTTPS in production");
  }
  
  const signingSecret = generateSigningSecret();
  
  const endpoint = await prismadb.webhookEndpoint.create({
    data: {
      companyId: data.companyId,
      url: data.url,
      description: data.description,
      events: JSON.stringify(data.events),
      signingSecret,
      isActive: true,
      totalDeliveries: 0,
      totalFailures: 0,
    },
  });
  
  revalidatePath(`/admin/${data.companySlug}/webhooks`);
  
  return {
    ...endpoint,
    signingSecret, // Return the raw secret for the client to display once
  };
}

export async function updateWebhookEndpoint(
  endpointId: string,
  companySlug: string,
  data: {
    url?: string;
    description?: string;
    events?: string[];
    isActive?: boolean;
  }
) {
  await requireAdmin();
  
  const updateData: any = {};
  if (data.url !== undefined) updateData.url = data.url;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.events !== undefined) updateData.events = JSON.stringify(data.events);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  
  const endpoint = await prismadb.webhookEndpoint.update({
    where: { id: endpointId },
    data: updateData,
  });
  
  revalidatePath(`/admin/webhooks/${companySlug}`);
  return endpoint;
}

export async function deleteWebhookEndpoint(endpointId: string, companySlug: string) {
  await requireAdmin();
  
  // First delete all deliveries (cascade might handle this, but explicit is safer)
  await prismadb.webhookDelivery.deleteMany({
    where: { endpointId },
  });
  
  await prismadb.webhookEndpoint.delete({
    where: { id: endpointId },
  });
  
  revalidatePath(`/admin/${companySlug}/webhooks`);
}

export async function rotateWebhookSecret(endpointId: string, companySlug: string) {
  await requireAdmin();
  
  const newSecret = generateSigningSecret();
  
  const endpoint = await prismadb.webhookEndpoint.update({
    where: { id: endpointId },
    data: { signingSecret: newSecret },
  });
  
  revalidatePath(`/admin/${companySlug}/webhooks`);
  
  return {
    ...endpoint,
    signingSecret: newSecret,
  };
}

export async function redeliverWebhook(deliveryId: string, companySlug: string) {
  await requireAdmin();
  
  // Get the delivery and its endpoint
  const delivery = await prismadb.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: {
      endpoint: true,
    },
  });
  
  if (!delivery) {
    throw new Error("Delivery not found");
  }
  
  // Here you would trigger a new delivery
  // This would typically call your webhook delivery service
  // For now, we'll just mark that it was requested
  
  revalidatePath(`/admin/${companySlug}/webhooks`);
  
  return { success: true };
}