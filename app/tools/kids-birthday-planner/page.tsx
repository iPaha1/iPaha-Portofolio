// =============================================================================
// isaacpaha.com — AI Kids Birthday Planner — Main Server Page
// app/tools/kids-birthday-planner/page.tsx
// Route: /tools/kids-birthday-planner
// =============================================================================

import type { Metadata }        from "next";
import { currentUser }          from "@clerk/nextjs/server";
import { BirthdayPlannerPage } from "./_birthday-planner/birthday-planner-page";


export const metadata: Metadata = {
  title:       "AI Kids Birthday Planner — Perfect Party in Minutes",
  description:
    "Plan your child's perfect birthday party in minutes. AI generates a complete party plan — schedule, activities, food, music, party bags, and budget. Then share a smart invite link that evolves into a live RSVP tracker and check-in system on party day.",
  openGraph: {
    title:       "AI Kids Birthday Planner | Isaac Paha Tools",
    description: "Plan your child's perfect birthday party in minutes. Smart invites, live RSVPs, activity timers, and party day check-in — all from one link.",
    url:         "https://isaacpaha.com/tools/kids-birthday-planner",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/kids-birthday-planner.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "AI Kids Birthday Planner | Free Tool",
    description: "Plan a perfect kids party in minutes — AI plan + smart invite links that become a live check-in system on party day.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/kids-birthday-planner" },
  keywords: [
    "kids birthday party planner", "birthday party ideas", "birthday party planning app",
    "RSVP party invite link", "birthday party checklist", "kids party activities",
    "party budget planner", "birthday party AI", "free party planner",
    "kids party food ideas", "party day check-in", "birthday party organiser UK",
    "children's party planner", "party invite generator", "birthday party themes",
  ],
};

export default async function KidsBirthdayPlannerPage() {
  const clerkUser = await currentUser().catch(() => null);
  return <BirthdayPlannerPage isSignedIn={!!clerkUser} />;
}