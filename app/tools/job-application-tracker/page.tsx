// app/tools/application-tracker/page.tsx// =============================================================================
// isaacpaha.com — Job Application Tracker — Dedicated Tool Page
// app/tools/job-application-tracker/page.tsx
//
// This page lives at /tools/job-application-tracker — a static, dedicated
// route rather than the generic [slug] pattern.
//
// Why a dedicated route?
//   - Richer, tool-specific metadata
//   - Co-located components in _components/ (no monolithic tool-detail-client)
//   - Can be a full server component with DB prefetch
//   - Scales cleanly as more tools get dedicated pages
// =============================================================================

import type { Metadata }   from "next";
import { currentUser }     from "@clerk/nextjs/server";
import { prismadb }        from "@/lib/db";
import { InitialProfile, JobTrackerPage } from "./_application-tracker/job-tracker-page";

export const dynamic = 'force-dynamic';

// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Job Application Tracker — Free Tool for Serious Job Seekers",
  description:
    "Track every job application, monitor your interview rate, log reflections after interviews, and see where you rank on the global application ladder. Free, no-fluff job search management.",
  openGraph: {
    title:       "Job Application Tracker | Isaac Paha Tools",
    description: "Never lose track of where you've applied again. Track status, log reflections, join the ladder.",
    url:         "https://isaacpaha.com/tools/job-application-tracker",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/job-tracker.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Job Application Tracker | Free Tool",
    description: "Track applications, monitor interview rates, and stay motivated on your job search.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/job-application-tracker" },
  keywords: [
    "job application tracker", "job search management", "interview tracker",
    "job application spreadsheet", "job hunting tool", "career tool",
    "application status tracker", "job search organiser",
  ],
};

// ─── Server component — prefetch user's profile + recent applications ─────────
// type JobSeekerProfileData = {
//   id: string;
//   displayName: string | null;
//   avatarUrl: string | null;
//   headline: string | null;
//   xpPoints: number;
//   level: number;
//   streakDays: number;
//   totalApplications: number;
//   isEmployed: boolean;
//   showOnLadder: boolean;
//   showCompanyNames: boolean;
//   badges: Array<{ type: string; awardedAt: Date }>;
//   ladderEntry: { totalApplications: number; interviews: number; offers: number; rank: number } | null;
//   _count: { applications: number; discussions: number };
// } | null;

export default async function JobApplicationTrackerPage() {
  const clerkUser = await currentUser();

  let profileData: InitialProfile | null = null;

  if (clerkUser) {
    const user = await prismadb.user.findUnique({
      where:  { clerkId: clerkUser.id },
      select: { id: true },
    });
    if (user) {
      const rawProfile = await prismadb.jobSeekerProfile.findUnique({
        where:   { userId: user.id },
        include: {
          badges:      { select: { type: true, awardedAt: true } },
          ladderEntry: { select: { totalApplications: true, interviews: true, offers: true, rank: true } },
          _count:      { select: { applications: true, discussions: true } },
        },
      });
      
      if (rawProfile) {
        profileData = {
          ...rawProfile,
          applicationCount: rawProfile._count.applications,
          badges: rawProfile.badges.map(badge => ({
            type: badge.type,
            awardedAt: badge.awardedAt.toISOString(),
          })),
        };
      }
    }
  }
  // console.log("User:", clerkUser)
  console.log("ProfileData:", profileData)

  return (
     <JobTrackerPage
      initialProfile={profileData}
    />
    // <JobTrackerPage
    //   initialProfile={profileData ? {
    //     id:               profileData.id,
    //     displayName:      profileData.displayName,
    //     avatarUrl:        profileData.avatarUrl,
    //     headline:         profileData.headline,
    //     xpPoints:         profileData.xpPoints,
    //     level:            profileData.level,
    //     streakDays:       profileData.streakDays,
    //     totalApplications: profileData.totalApplications,
    //     isEmployed:       profileData.isEmployed,
    //     showOnLadder:     profileData.showOnLadder,
    //     showCompanyNames: profileData.showCompanyNames,
    //     badges:           profileData.badges,
    //     ladderEntry:      profileData.ladderEntry,
    //     applicationCount: profileData._count.applications, // Add application count to the initial profile data
    //   } : null}
    // />
  );
}