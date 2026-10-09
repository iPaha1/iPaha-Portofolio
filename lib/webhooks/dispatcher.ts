// =============================================================================
// lib/webhooks/dispatcher.ts
// Asynchronous webhook delivery system
//
// Flow:
//   1. Event occurs (booking created, invoice paid, etc.)
//   2. dispatchWebhookEvent() stores the event and queues deliveries
//   3. deliverWebhook() POSTs to each registered endpoint
//   4. On failure, scheduleRetry() re-queues with exponential backoff
//   5. After MAX_ATTEMPTS, marks delivery as ABANDONED
//
// In production: replace setTimeout with a proper queue (BullMQ, Inngest, etc.)
// =============================================================================

import { createHmac } from "crypto";
import type { WebhookPayload } from "@/lib/api/types";
import { prismadb } from "../db";

const MAX_ATTEMPTS = 5;

// Exponential backoff delays (seconds): 30s, 5m, 30m, 2h, 8h
const BACKOFF_DELAYS = [30, 300, 1800, 7200, 28800];

// -----------------------------------------------------------------------------
// Entry point — call this from route handlers after data mutations
// -----------------------------------------------------------------------------
interface DispatchOptions {
  companyId:   string;
  companySlug: string;
  eventType:   string;         // "booking.created"
  entityType:  string;         // "booking"
  entityId:    string;
  data:        unknown;        // The resource that changed
}

export async function dispatchWebhookEvent(opts: DispatchOptions): Promise<void> {
  const { companyId, companySlug, eventType, entityType, entityId, data } = opts;

  // Find active endpoints subscribed to this event type
  const endpoints = await prismadb.webhookEndpoint.findMany({
    where: {
      companyId,
      isActive: true,
    },
  });

  // Filter to endpoints that subscribe to this event
  const matching = endpoints.filter((ep) => {
    const events: string[] = JSON.parse(ep.events);
    return events.includes(eventType);
  });

  if (matching.length === 0) return;

  // Build payload
  const payload: WebhookPayload = {
    id:          `whe_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    eventType,
    companyId,
    companySlug,
    timestamp:   new Date().toISOString(),
    data,
  };

  // Store event
  const event = await prismadb.webhookEvent.create({
    data: {
      companyId,
      eventType,
      entityType,
      entityId,
      payload: JSON.stringify(payload),
    },
  });

  // Create a delivery record for each matching endpoint and attempt delivery
  for (const endpoint of matching) {
    const delivery = await prismadb.webhookDelivery.create({
      data: {
        eventId:    event.id,
        endpointId: endpoint.id,
        status:     "PENDING",
      },
    });

    // Attempt delivery immediately (in production, push to queue instead)
    setImmediate(() => {
      attemptDelivery(delivery.id, endpoint.url, endpoint.signingSecret, payload);
    });
  }
}

// -----------------------------------------------------------------------------
// Attempt a single delivery
// -----------------------------------------------------------------------------
async function attemptDelivery(
  deliveryId: string,
  url:        string,
  secret:     string,
  payload:    WebhookPayload
): Promise<void> {
  const payloadString = JSON.stringify(payload);
  const signature     = signPayload(payloadString, secret);
  const timestamp     = Math.floor(Date.now() / 1000).toString();

  let responseStatus: number | undefined;
  let responseBody:   string | undefined;
  let errorMessage:   string | undefined;

  try {
    const res = await fetch(url, {
      method:  "POST",
      headers: {
        "Content-Type":          "application/json",
        "X-Webhook-Signature":   signature,
        "X-Webhook-Timestamp":   timestamp,
        // Include both header formats for compatibility
        "X-Isaac-Signature-256": `sha256=${signature}`,
        "User-Agent":            "isaacpaha-webhooks/1.0",
      },
      body: payloadString,
      signal: AbortSignal.timeout(10_000),  // 10 second timeout
    });

    responseStatus = res.status;
    responseBody   = await res.text().catch(() => "");

    const success = res.status >= 200 && res.status < 300;

    await prismadb.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status:         success ? "DELIVERED" : "FAILED",
        attemptCount:   { increment: 1 },
        responseStatus,
        responseBody:   responseBody?.slice(0, 2000),
        deliveredAt:    success ? new Date() : undefined,
        nextRetryAt:    success ? undefined : null,
      },
    });

    if (success) {
      // Update endpoint stats
      await prismadb.webhookEndpoint.update({
        where: { id: (await prismadb.webhookDelivery.findUnique({
          where: { id: deliveryId }, select: { endpointId: true }
        }))!.endpointId },
        data: {
          totalDeliveries: { increment: 1 },
          lastDeliveryAt:  new Date(),
        },
      });
    } else {
      await scheduleRetry(deliveryId, secret, payload, url);
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : "Network error";
    await prismadb.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status:       "FAILED",
        attemptCount: { increment: 1 },
        errorMessage,
      },
    });
    await scheduleRetry(deliveryId, secret, payload, url);
  }
}

// -----------------------------------------------------------------------------
// Schedule retry with exponential backoff
// -----------------------------------------------------------------------------
async function scheduleRetry(
  deliveryId: string,
  secret:     string,
  payload:    WebhookPayload,
  url:        string
): Promise<void> {
  const delivery = await prismadb.webhookDelivery.findUnique({
    where: { id: deliveryId },
    select: { attemptCount: true },
  });
  if (!delivery) return;

  const attempt = delivery.attemptCount;

  if (attempt >= MAX_ATTEMPTS) {
    // Give up
    await prismadb.webhookDelivery.update({
      where: { id: deliveryId },
      data:  { status: "ABANDONED", nextRetryAt: null },
    });

    // Update endpoint failure stats
    const ep = await prismadb.webhookDelivery.findUnique({
      where: { id: deliveryId }, select: { endpointId: true }
    });
    if (ep) {
      await prismadb.webhookEndpoint.update({
        where: { id: ep.endpointId },
        data: {
          totalFailures: { increment: 1 },
          lastFailureAt: new Date(),
        },
      });
    }
    return;
  }

  const delaySecs = BACKOFF_DELAYS[attempt] ?? 28800;
  const nextRetryAt = new Date(Date.now() + delaySecs * 1000);

  await prismadb.webhookDelivery.update({
    where: { id: deliveryId },
    data:  { status: "RETRYING", nextRetryAt },
  });

  // In production: push to a queue with delay instead of setTimeout
  // Here: use setTimeout for simplicity (not suitable for large scale)
  setTimeout(() => {
    attemptDelivery(deliveryId, url, secret, payload);
  }, delaySecs * 1000);
}

// -----------------------------------------------------------------------------
// HMAC-SHA256 signature
// The receiving client verifies:
//   const expected = createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
//   if (expected === req.headers['x-webhook-signature']) { /* valid */ }
// -----------------------------------------------------------------------------
function signPayload(payloadString: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(payloadString)
    .digest("hex");
}

// -----------------------------------------------------------------------------
// Export a verification helper that client websites can copy-paste
// -----------------------------------------------------------------------------
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Timing-safe comparison
  if (expected.length !== signature.length) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return require("crypto").timingSafeEqual(a, b);
}