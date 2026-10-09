// lib/actions/booking-actions.ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { prismadb } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { BookingLocation, BookingStatus } from "@/lib/generated/prisma/enums";
import { sendBookingEmail } from "@/lib/services/email";
import { createCalendarEvent } from "../services/calendar";

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

// Update booking status with email notifications
export async function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  options?: {
    confirmedDate?: Date;
    meetingUrl?: string;
    internalNotes?: string;
    sendEmail?: boolean;
  }
) {
  await requireAdmin();

  const booking = await prismadb.booking.findUnique({
    where: { id: bookingId },
    include: { company: true },
  });

  if (!booking) throw new Error("Booking not found");

  const updateData: any = { status };
  if (options?.confirmedDate) updateData.confirmedDate = options.confirmedDate;
  if (options?.meetingUrl) updateData.meetingUrl = options.meetingUrl;
  if (options?.internalNotes) updateData.internalNotes = options.internalNotes;

  const updated = await prismadb.booking.update({
    where: { id: bookingId },
    data: updateData,
    include: { company: true },
  });

  // Send email notification if requested
  if (options?.sendEmail !== false) {
    await sendBookingEmail(updated, status, options);
  }

  // Create calendar event for confirmed bookings
  if (status === "CONFIRMED" && options?.confirmedDate) {
    await createCalendarEvent(updated, options.confirmedDate);
  }

  revalidatePath(`/admin/${booking.company.slug}/bookings`);
  return updated;
}

// Add internal note to booking
export async function addBookingNote(bookingId: string, note: string) {
  await requireAdmin();

  const booking = await prismadb.booking.findUnique({
    where: { id: bookingId },
    select: { internalNotes: true, company: { select: { slug: true } } },
  });

  if (!booking) throw new Error("Booking not found");

  const currentNotes = booking.internalNotes || "";
  const timestamp = new Date().toISOString();
  const updatedNote = `${currentNotes}\n\n[${timestamp}] ${note}`;

  const updated = await prismadb.booking.update({
    where: { id: bookingId },
    data: { internalNotes: updatedNote },
  });

  revalidatePath(`/admin/${booking.company.slug}/bookings`);
  return updated;
}

// Send follow-up email to client
export async function sendFollowUpEmail(
  bookingId: string,
  subject: string,
  message: string
) {
  await requireAdmin();

  const booking = await prismadb.booking.findUnique({
    where: { id: bookingId },
    include: { company: true },
  });

  if (!booking) throw new Error("Booking not found");

  // Import email service dynamically to avoid circular deps
  const { sendCustomEmail } = await import("@/lib/services/email");
  await sendCustomEmail({
    to: booking.clientEmail,
    subject,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px;">
        <h2>${subject}</h2>
        <p>Dear ${booking.clientName},</p>
        <div style="margin: 20px 0;">${message.replace(/\n/g, "<br/>")}</div>
        <hr style="margin: 30px 0;" />
        <p style="color: #666; font-size: 12px;">
          Best regards,<br/>
          ${booking.company.displayName || booking.company.legalName} Team
        </p>
      </div>
    `,
  });
  console.log("Sent follow-up email to:", booking.clientEmail); // Debug log to check email sending

  // Add to internal notes
  await addBookingNote(bookingId, `Email sent: "${subject}"`);

  return { success: true };
}

// Get booking with full details
export async function getBooking(bookingId: string) {
  await requireAdmin();
  return prismadb.booking.findUnique({
    where: { id: bookingId },
    include: {
      company: {
        select: { id: true, slug: true, displayName: true, accentColor: true },
      },
    },
  });
}

// Get upcoming bookings
export async function getUpcomingBookings(companyId: string, days = 7) {
  await requireAdmin();

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  return prismadb.booking.findMany({
    where: {
      companyId,
      status: { in: ["CONFIRMED", "PENDING"] },
      confirmedDate: { gte: startDate, lte: endDate },
    },
    orderBy: { confirmedDate: "asc" },
  });
}

// Add this to your existing booking-actions.ts file

export async function createManualBooking(data: {
  companyId: string;
  companySlug: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCompany?: string;
  clientMessage?: string;
  serviceType?: string;
  location?: BookingLocation;
  preferredDate?: Date | null;
  source?: string;
  status?: string;
  sendEmail?: boolean;
}) {
  await requireAdmin();

  const booking = await prismadb.booking.create({
    data: {
      companyId: data.companyId,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      clientCompany: data.clientCompany,
      clientMessage: data.clientMessage,
      serviceType: data.serviceType || "consultation",
      location: data.location || "VIDEO_CALL",
      preferredDate: data.preferredDate,
      status: (data.status as any) || "PENDING",
      source: data.source || "manual",
      metadata: JSON.stringify({
        createdBy: "admin",
        createdAt: new Date().toISOString(),
        source: data.source || "manual",
      }),
    },
    include: { company: true },
  });

  // Send email notification if requested
  if (data.sendEmail !== false) {
    const { sendBookingEmail } = await import("@/lib/services/email");
    await sendBookingEmail(booking, "PENDING");
  }

  revalidatePath(`/admin/${data.companySlug}/bookings`);
  return booking;
}