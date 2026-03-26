// =============================================================================
// isaacpaha.com — AI Kids Birthday Planner — Smart Guest Invite Page
// app/tools/kids-birthday-planner/invite/[token]/page.tsx
//
// AUTHENTICATED — guests must sign in to RSVP.
// This gives us:
//   • Unique identity per guest (Clerk ID)
//   • Persistent state across refreshes
//   • Secure: each guest only sees their own data
//   • Future: photo sharing, notifications, premium features
//
// Server-side:
//   1. Look up party by inviteToken — notFound() if invalid
//   2. Check Clerk auth — if not signed in, show sign-in prompt
//   3. Look up existing RSVP for this Clerk user on this party
//   4. Pass { party, existingGuest } to client — client renders the right stage
//
// Smart link stages (same URL, driven by party.status + existingGuest.status):
//   INVITED (no RSVP yet)  → Beautiful invitation + sign-in gate
//   ACCEPTED               → Guest dashboard (who's coming, song requests, countdown)
//   DECLINED               → "Thanks for letting us know" + option to change mind
//   DAY_OF (party day)     → Check-in page with "I'm Here!" button
//   COMPLETED              → Party's over — thank you page
// =============================================================================

import type { Metadata }   from "next";
import { notFound }        from "next/navigation";
import { currentUser }     from "@clerk/nextjs/server";
import { prismadb }        from "@/lib/db";
import { GuestInvitePage } from "../../_birthday-planner/birthday-guest-invite-page";


interface Props {
  params: Promise<{ token: string }>;
}

// ─── Dynamic OG metadata ──────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;

  const party = await prismadb.party
    .findUnique({
      where:  { inviteToken: token },
      select: { childName: true, childAge: true, theme: true, customTheme: true, partyDate: true, city: true, country: true },
    })
    .catch(() => null);

  if (!party) return { title: "Birthday Party Invite 🎂" };

  const themeName = party.customTheme || party.theme;
  const dateStr   = new Date(party.partyDate).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });
  const location = party.city || party.country || "somewhere special";

  return {
    title:       `🎂 You're invited to ${party.childName}'s ${themeName} Party!`,
    description: `${party.childName} is turning ${party.childAge}! Join us on ${dateStr} in ${location}. RSVP now.`,
    openGraph: {
      title:       `🎂 ${party.childName}'s Birthday Party — You're Invited!`,
      description: `Turning ${party.childAge}! ${themeName} theme · ${dateStr} · ${location}. Tap to RSVP.`,
      url:         `https://isaacpaha.com/tools/kids-birthday-planner/invite/${token}`,
      type:        "website",
      images: [{
        url: "https://isaacpaha.com/og/birthday-invite.png",
        width: 1200, height: 630,
        alt:  `${party.childName}'s Birthday Party Invite`,
      }],
    },
    twitter: {
      card:    "summary_large_image",
      title:   `🎉 ${party.childName}'s Birthday — You're Invited!`,
      description: `Turning ${party.childAge}! Tap to RSVP.`,
      creator: "@iPaha3",
    },
    robots: { index: false, follow: false },
  };
}

// ─── Strip sensitive data from party for client ───────────────────────────────

function toPublicParty(party: any) {
  return {
    id:              party.id,
    childName:       party.childName,
    childAge:        party.childAge,
    partyDate:       party.partyDate instanceof Date ? party.partyDate.toISOString() : party.partyDate,
    partyEndTime:    party.partyEndTime
                       ? (party.partyEndTime instanceof Date ? party.partyEndTime.toISOString() : party.partyEndTime)
                       : null,
    locationName:    party.locationName    ?? null,
    locationAddress: party.locationAddress ?? null,
    city:            party.city            ?? null,
    country:         party.country,
    theme:           party.theme,
    customTheme:     party.customTheme     ?? null,
    indoor:          party.indoor,
    status:          party.status,
    inviteToken:     party.inviteToken,
    inviteMessage:   party.inviteMessage   ?? null,
    // planJson, userId, budgetAmount, restrictions intentionally EXCLUDED
  };
}

function toPublicGuest(guest: any) {
  if (!guest) return null;
  return {
    id:               guest.id,
    childName:        guest.childName,
    parentName:       guest.parentName    ?? null,
    allergies:        guest.allergies     ?? null,
    rsvpNote:         guest.rsvpNote      ?? null,
    status:           guest.status,
    rsvpAt:           guest.rsvpAt ? (guest.rsvpAt instanceof Date ? guest.rsvpAt.toISOString() : guest.rsvpAt) : null,
    checkedInAt:      guest.checkedInAt ? (guest.checkedInAt instanceof Date ? guest.checkedInAt.toISOString() : guest.checkedInAt) : null,
    photoConsent:     guest.photoConsent,
    photoShareConsent:guest.photoShareConsent,
    digitalTag:       guest.digitalTag    ?? null,
  };
}

// ─── Server component ─────────────────────────────────────────────────────────

export default async function GuestInviteServerPage({ params }: Props) {
  const { token } = await params;

  // 1. Look up party
  const party = await prismadb.party.findUnique({ where: { inviteToken: token } }).catch(() => null);
  if (!party) notFound();

  const publicParty = toPublicParty(party);

  // 2. Check if user is signed in
  const clerkUser = await currentUser().catch(() => null);

  // 3. If signed in, look up their existing RSVP for this party
  let existingGuest = null;
  if (clerkUser) {
    const row = await prismadb.guest
      .findFirst({ where: { partyId: party.id, guestClerkId: clerkUser.id } })
      .catch(() => null);
    existingGuest = toPublicGuest(row);
  }

  return (
    <GuestInvitePage
      token={token}
      party={publicParty}
      isSignedIn={!!clerkUser}
      clerkUserId={clerkUser?.id ?? null}
      existingGuest={existingGuest}
    />
  );
}