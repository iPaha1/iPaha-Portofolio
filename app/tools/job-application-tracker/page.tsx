// =============================================================================
// isaacpaha.com — Job Application Tracker — Dedicated Tool Page
// app/tools/job-application-tracker/page.tsx
// =============================================================================

import type { Metadata }  from "next";
import { currentUser }    from "@clerk/nextjs/server";
import { notFound }       from "next/navigation";
import { prismadb }       from "@/lib/db";
import { InitialProfile, JobTrackerPage } from "./_application-tracker/job-tracker-page";
import { getToolBySlug, getPublicTools }  from "@/lib/actions/tools-actions";
import type { NormalisedTool, DbTool }    from "../_tools/tools-lab-client";

export const dynamic = "force-dynamic";

// ─── Normaliser (mirrors tools-lab-client.tsx) ────────────────────────────────

const CATEGORY_ACCENT: Record<string, string> = {
  AI:           "#f59e0b",
  CAREER:       "#ec4899",
  FINANCE:      "#14b8a6",
  STARTUP:      "#10b981",
  EDUCATION:    "#8b5cf6",
  PRODUCTIVITY: "#14b8a6",
  WRITING:      "#3b82f6",
  OTHER:        "#6b7280",
};

function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p.filter((t): t is string => typeof t === "string") : []; }
  catch { return []; }
}

function parseFeatures(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((f): f is string => typeof f === "string");
  if (typeof raw === "string") { try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalise(t: any): NormalisedTool {
  return {
    id:          t.id,
    slug:        t.slug,
    name:        t.name,
    tagline:     t.tagLine,
    description: t.description,
    category:    t.category,
    status:      t.status,
    icon:        t.icon        ?? "🔧",
    accentColor: t.accentColor ?? CATEGORY_ACCENT[t.category] ?? "#f59e0b",
    tags:        parseTags(t.tags),
    features:    parseFeatures(t.features),
    usageCount:  t.usageCount  ?? 0,
    tokenCost:   t.tokenCost   ?? undefined,
    ratingAvg:   t.ratingAvg   ?? 0,
    ratingCount: t.ratingCount ?? 0,
    isFeatured:  t.isFeatured,
    isNew:       t.isNew,
    isPremium:   t.isPremium,
    coverImage:  t.coverImage  ?? undefined,
  };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title:       "Job Application Tracker — Free Tool for Serious Job Seekers",
  description: "Track every job application, monitor your interview rate, log reflections after interviews, and see where you rank on the global application ladder. Free, no-fluff job search management.",
  openGraph: {
    title:       "Job Application Tracker | Isaac Paha Tools",
    description: "Never lose track of where you've applied again. Track status, log reflections, join the ladder.",
    url:         "https://isaacpaha.com/tools/job-application-tracker",
    type:        "website",
  },
  twitter: {
    card:    "summary_large_image",
    title:   "Job Application Tracker | Free Tool",
    creator: "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/job-application-tracker" },
  keywords: [
    "job application tracker", "job search management", "interview tracker",
    "application status tracker", "job search organiser",
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function JobApplicationTrackerPage() {
  const [clerkUser, rawTool, allTools] = await Promise.all([
    currentUser().catch(() => null),
    getToolBySlug("job-application-tracker"),
    getPublicTools(),
  ]);

  if (!rawTool || !rawTool.isActive || !rawTool.isPublic) notFound();

  const tool         = normalise(rawTool);
  const relatedTools = (allTools as DbTool[])
    .filter((t) => t.category === rawTool.category && t.slug !== rawTool.slug && t.status !== "COMING_SOON")
    .slice(0, 3)
    .map(normalise);

  // ── Fetch job seeker profile for signed-in users ───────────────────────────
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
          _count:      { select: { applications: true } },
        },
      });

      if (rawProfile) {
        profileData = {
          ...rawProfile,
          applicationCount: rawProfile._count.applications,
          badges: rawProfile.badges.map((b) => ({
            type:      b.type,
            awardedAt: b.awardedAt.toISOString(),
          })),
        };
      }
    }
  }

  return (
    <JobTrackerPage
      initialProfile={profileData}
      tool={tool}
      relatedTools={relatedTools}
    />
  );
}





// // app/tools/application-tracker/page.tsx// =============================================================================
// // isaacpaha.com — Job Application Tracker — Dedicated Tool Page
// // app/tools/job-application-tracker/page.tsx
// //
// // This page lives at /tools/job-application-tracker — a static, dedicated
// // route rather than the generic [slug] pattern.
// //
// // Why a dedicated route?
// //   - Richer, tool-specific metadata
// //   - Co-located components in _components/ (no monolithic tool-detail-client)
// //   - Can be a full server component with DB prefetch
// //   - Scales cleanly as more tools get dedicated pages
// // =============================================================================

// import type { Metadata }   from "next";
// import { currentUser }     from "@clerk/nextjs/server";
// import { prismadb }        from "@/lib/db";
// import { InitialProfile, JobTrackerPage } from "./_application-tracker/job-tracker-page";

// export const dynamic = 'force-dynamic';

// // ─── SEO Metadata ─────────────────────────────────────────────────────────────

// export const metadata: Metadata = {
//   title: "Job Application Tracker — Free Tool for Serious Job Seekers",
//   description:
//     "Track every job application, monitor your interview rate, log reflections after interviews, and see where you rank on the global application ladder. Free, no-fluff job search management.",
//   openGraph: {
//     title:       "Job Application Tracker | Isaac Paha Tools",
//     description: "Never lose track of where you've applied again. Track status, log reflections, join the ladder.",
//     url:         "https://isaacpaha.com/tools/job-application-tracker",
//     type:        "website",
//     images: [{ url: "https://isaacpaha.com/og/job-tracker.png", width: 1200, height: 630 }],
//   },
//   twitter: {
//     card:        "summary_large_image",
//     title:       "Job Application Tracker | Free Tool",
//     description: "Track applications, monitor interview rates, and stay motivated on your job search.",
//     creator:     "@iPaha3",
//   },
//   alternates: { canonical: "https://isaacpaha.com/tools/job-application-tracker" },
//   keywords: [
//     "job application tracker", "job search management", "interview tracker",
//     "job application spreadsheet", "job hunting tool", "career tool",
//     "application status tracker", "job search organiser",
//   ],
// };


// export default async function JobApplicationTrackerPage() {
//   const clerkUser = await currentUser();

//   let profileData: InitialProfile | null = null;

//   if (clerkUser) {
//     const user = await prismadb.user.findUnique({
//       where:  { clerkId: clerkUser.id },
//       select: { id: true },
//     });
//     if (user) {
//       const rawProfile = await prismadb.jobSeekerProfile.findUnique({
//         where:   { userId: user.id },
//         include: {
//           badges:      { select: { type: true, awardedAt: true } },
//           ladderEntry: { select: { totalApplications: true, interviews: true, offers: true, rank: true } },
//           _count:      { select: { applications: true, discussions: true } },
//         },
//       });
      
//       if (rawProfile) {
//         profileData = {
//           ...rawProfile,
//           applicationCount: rawProfile._count.applications,
//           badges: rawProfile.badges.map(badge => ({
//             type: badge.type,
//             awardedAt: badge.awardedAt.toISOString(),
//           })),
//         };
//       }
//     }
//   }
//   // console.log("User:", clerkUser)
//   console.log("ProfileData:", profileData)

//   return (
//      <JobTrackerPage
//       initialProfile={profileData}
//     />
    
//   );
// }