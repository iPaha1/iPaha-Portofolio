// lib/services/calendar.ts
import { google } from "googleapis";

interface Booking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string | null;
  clientMessage?: string | null;
  company: {
    displayName?: string | null;
    legalName?: string | null;
  };
}

export async function createCalendarEvent(booking: Booking, date: Date) {
  // Option 1: Google Calendar Integration
  if (process.env.GOOGLE_CALENDAR_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    try {
      const auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });

      const calendar = google.calendar({ version: "v3", auth });

      await calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        requestBody: {
          summary: `Consultation: ${booking.clientName}`,
          description: `
Client: ${booking.clientName}
Email: ${booking.clientEmail}
Phone: ${booking.clientPhone || "Not provided"}
Message: ${booking.clientMessage || "No message"}

Company: ${booking.company.displayName || booking.company.legalName}
Booking ID: ${booking.id}
          `.trim(),
          start: { dateTime: date.toISOString(), timeZone: "Europe/London" },
          end: { dateTime: new Date(date.getTime() + 30 * 60000).toISOString(), timeZone: "Europe/London" },
          attendees: [{ email: booking.clientEmail }],
          conferenceData: {
            createRequest: { requestId: booking.id, conferenceSolutionKey: { type: "hangoutsMeet" } },
          },
        },
        conferenceDataVersion: 1,
      });
    } catch (error) {
      console.error("Failed to create calendar event:", error);
    }
  }

  // Option 2: Just return a meeting link (e.g., Cal.com, Calendly)
  const meetingUrl = process.env.DEFAULT_MEETING_URL || "https://cal.com/ipaha/30min";
  
  return { meetingUrl };
}