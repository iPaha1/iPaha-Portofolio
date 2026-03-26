"use server";

// =============================================================================
// isaacpaha.com — Job Application Tracker Server Actions
// lib/actions/job-tracker.actions.ts
// =============================================================================

import { prismadb }       from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth }           from "@clerk/nextjs/server";
import { WorkMode, WorkType } from "@/lib/generated/prisma/enums";

// ─── Types ────────────────────────────────────────────────────────────────────

type ApplicationStatus =
  | "WISHLIST" | "APPLIED" | "PHONE_SCREEN" | "INTERVIEW"
  | "ASSESSMENT" | "FINAL_ROUND" | "OFFER" | "ACCEPTED"
  | "REJECTED" | "WITHDRAWN" | "GHOSTED";

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function getProfileId(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { id: true } });
  if (!user) return null;
  const profile = await prismadb.jobSeekerProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  return profile?.id ?? null;
}

// ─── PROFILE ─────────────────────────────────────────────────────────────────

export async function getOrCreateProfile() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await prismadb.user.findUnique({
    where:  { clerkId: userId },
    select: { id: true, displayName: true, avatarUrl: true, email: true },
  });
  if (!user) return null;

  const existing = await prismadb.jobSeekerProfile.findUnique({
    where:   { userId: user.id },
    include: {
      badges:       true,
      applications: { orderBy: { appliedAt: "desc" }, take: 5 },
      _count:       { select: { applications: true, discussions: true } },
    },
  });
  if (existing) return existing;

  // Create profile on first visit
  const profile = await prismadb.jobSeekerProfile.create({
    data: {
      userId:      user.id,
      displayName: user.displayName ?? "Job Seeker",
      avatarUrl:   user.avatarUrl ?? null,
    },
  });

  // Create ladder entry
  await prismadb.ladderEntry.create({ data: { profileId: profile.id } });

  return profile;
}

export async function updateProfile(data: {
  displayName?:     string;
  headline?:        string;
  bio?:             string;
  location?:        string;
  currentRole?:     string;
  targetRole?:      string;
  targetSectors?:   string[];
  yearsExperience?: number;
  linkedinUrl?:     string;
  githubUrl?:       string;
  portfolioUrl?:    string;
  twitterUrl?:      string;
  isPublicProfile?: boolean;
  showCompanyNames?: boolean;
  showOnLadder?:    boolean;
  ladderDisplayName?: string;
}) {
  const profileId = await getProfileId();
  if (!profileId) throw new Error("Not authenticated");

  const updated = await prismadb.jobSeekerProfile.update({
    where: { id: profileId },
    data: {
      ...data,
      targetSectors: data.targetSectors ? JSON.stringify(data.targetSectors) : undefined,
    },
  });
  revalidatePath("/tools/job-application-tracker");
  return updated;
}

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────

export async function getApplications({
  status,
  sector,
  search,
  sortBy = "appliedAt",
  sortOrder = "desc",
  page = 1,
  pageSize = 20,
}: {
  status?:    ApplicationStatus;
  sector?:    string;
  search?:    string;
  sortBy?:    "appliedAt" | "updatedAt" | "status" | "company" | "jobTitle";
  sortOrder?: "asc" | "desc";
  page?:      number;
  pageSize?:  number;
} = {}) {
  const profileId = await getProfileId();
  if (!profileId) return { applications: [], total: 0, pages: 0 };

  const where = {
    profileId,
    ...(status && { status: status as ApplicationStatus }),
    ...(sector && { sector }),
    ...(search && {
      OR: [
        { jobTitle: { contains: search } },
        { company:  { contains: search } },
        { sector:   { contains: search } },
        { notes:    { contains: search } },
      ],
    }),
  };

  const [applications, total] = await Promise.all([
    prismadb.jobApplication.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
    }),
    prismadb.jobApplication.count({ where }),
  ]);

  return { applications, total, pages: Math.ceil(total / pageSize) };
}

export async function getApplicationStats() {
  const profileId = await getProfileId();
  if (!profileId) return null;

  const apps = await prismadb.jobApplication.findMany({
    where:  { profileId },
    select: { status: true, appliedAt: true, sector: true },
  });

  const byStatus: Record<string, number> = {};
  const bySector: Record<string, number> = {};
  const byMonth:  Record<string, number> = {};

  for (const app of apps) {
    byStatus[app.status]               = (byStatus[app.status] ?? 0) + 1;
    if (app.sector) bySector[app.sector] = (bySector[app.sector] ?? 0) + 1;
    const month = app.appliedAt.toISOString().slice(0, 7);
    byMonth[month] = (byMonth[month] ?? 0) + 1;
  }

  const total      = apps.length;
  const interviews = (byStatus["PHONE_SCREEN"] ?? 0) + (byStatus["INTERVIEW"] ?? 0) + (byStatus["FINAL_ROUND"] ?? 0);
  const offers     = (byStatus["OFFER"] ?? 0) + (byStatus["ACCEPTED"] ?? 0);
  const rejections = byStatus["REJECTED"] ?? 0;

  return {
    total, byStatus, bySector, byMonth,
    interviewRate:  total > 0 ? Math.round((interviews / total) * 100) : 0,
    offerRate:      total > 0 ? Math.round((offers     / total) * 100) : 0,
    rejectionRate:  total > 0 ? Math.round((rejections / total) * 100) : 0,
    topSector:      Object.entries(bySector).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
  };
}

export async function createApplication(data: {
  jobTitle:       string;
  company?:       string;
  hideCompany?:   boolean;
  sector?:        string;
  location?:      string;
  workType?:      string;
  workMode?:      string;
  salaryMin?:     number;
  salaryMax?:     number;
  salaryCurrency?: string;
  jobUrl?:        string;
  status?:        ApplicationStatus;
  appliedAt?:     Date;
  notes?:         string;
  coverLetterUsed?: boolean;
  resumeVersion?: string;
  followUpDate?:  Date;
}) {
  const profileId = await getProfileId();
  if (!profileId) throw new Error("Not authenticated");

  const app = await prismadb.jobApplication.create({
    data: {
      profileId,
      jobTitle:        data.jobTitle,
      company:         data.company         ?? null,
      hideCompany:     data.hideCompany     ?? false,
      sector:          data.sector          ?? null,
      location:        data.location        ?? null,
      workType:        (data.workType as WorkType)   ?? "FULL_TIME",
      workMode:        (data.workMode as WorkMode)   ?? "HYBRID",
      salaryMin:       data.salaryMin       ?? null,
      salaryMax:       data.salaryMax       ?? null,
      salaryCurrency:  data.salaryCurrency  ?? "GBP",
      jobUrl:          data.jobUrl          ?? null,
      status:          (data.status as ApplicationStatus) ?? "APPLIED",
      appliedAt: data.appliedAt 
      ? new Date(data.appliedAt).toISOString()     // safest: normalize to ISO string
      : new Date().toISOString(),                  // fallback to now
      notes:           data.notes           ?? null,
      coverLetterUsed: data.coverLetterUsed ?? false,
      resumeVersion:   data.resumeVersion   ?? null,
      followUpDate:    data.followUpDate
      ? new Date(data.followUpDate).toISOString()   // user-provided date → ISO string
      : new Date().toISOString(),                // default: right now in UTC
      statusHistory:   JSON.stringify([{ status: data.status ?? "APPLIED", date: new Date().toISOString(), note: "Application logged" }]),
    },
  });

  // Update ladder entry + profile stats
  await updateLadderAndProfile(profileId);
  // Check and award badges
  await checkAndAwardBadges(profileId);
  // Update streak
  await updateStreak(profileId);

  revalidatePath("/tools/job-application-tracker");
  return app;
}

export async function updateApplication(id: string, data: {
  jobTitle?:        string;
  company?:         string;
  hideCompany?:     boolean;
  sector?:          string;
  location?:        string;
  workType?:        string;
  workMode?:        string;
  salaryMin?:       number;
  salaryMax?:       number;
  jobUrl?:          string;
  status?:          ApplicationStatus;
  notes?:           string;
  interviewNotes?:  string;
  whatWentWell?:    string;
  whatToImprove?:   string;
  interviewDate?:   Date;
  interviewRound?:  number;
  followUpDate?:    Date;
  followedUp?:      boolean;
  outcome?:         string;
  rejectionReason?: string;
}) {
  const profileId = await getProfileId();
  if (!profileId) throw new Error("Not authenticated");

  // Verify ownership
  const existing = await prismadb.jobApplication.findFirst({ where: { id, profileId }, select: { id: true, status: true, statusHistory: true } });
  if (!existing) throw new Error("Application not found");

  // If status changed, append to history
  let statusHistory = existing.statusHistory;
  if (data.status && data.status !== existing.status) {
    const history = existing.statusHistory ? JSON.parse(existing.statusHistory) : [];
    history.push({ status: data.status, date: new Date().toISOString(), note: "" });
    statusHistory = JSON.stringify(history);
  }

  const updated = await prismadb.jobApplication.update({
    where: { id },
    data: {
      ...data,
      workType: data.workType as WorkType,
      workMode: data.workMode as WorkMode,
      status:   data.status   as ApplicationStatus,
      statusHistory,
      statusUpdatedAt: data.status ? new Date() : undefined,
    },
  });

  await updateLadderAndProfile(profileId);
  await checkAndAwardBadges(profileId);

  // If accepted — mark employed
  if (data.status === "ACCEPTED") {
    await prismadb.jobSeekerProfile.update({
      where: { id: profileId },
      data:  { isEmployed: true, employedAt: new Date(), employedRole: data.jobTitle },
    });
  }

  revalidatePath("/tools/job-application-tracker");
  return updated;
}

export async function deleteApplication(id: string) {
  const profileId = await getProfileId();
  if (!profileId) throw new Error("Not authenticated");
  await prismadb.jobApplication.deleteMany({ where: { id, profileId } });
  await updateLadderAndProfile(profileId);
  revalidatePath("/tools/job-application-tracker");
}

// ─── LADDER ───────────────────────────────────────────────────────────────────

export async function getLadder({
  page = 1, pageSize = 20, sector,
}: { page?: number; pageSize?: number; sector?: string } = {}) {
  const [entries, total] = await Promise.all([
    prismadb.ladderEntry.findMany({
      where:   { profile: { isEmployed: false, showOnLadder: true } },
      orderBy: { totalApplications: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: {
        profile: {
          select: {
            displayName: true, ladderDisplayName: true, avatarUrl: true,
            headline: true, location: true, isPublicProfile: true,
            targetRole: true, xpPoints: true, level: true, streakDays: true,
            isEmployed: true, showCompanyNames: true,
          },
        },
      },
    }),
    prismadb.ladderEntry.count({ where: { profile: { isEmployed: false, showOnLadder: true } } }),
  ]);

  // Assign ranks
  const ranked = entries.map((e, i) => ({ ...e, rank: (page - 1) * pageSize + i + 1 }));
  return { entries: ranked, total, pages: Math.ceil(total / pageSize) };
}

export async function getMyLadderEntry() {
  const profileId = await getProfileId();
  if (!profileId) return null;
  return prismadb.ladderEntry.findUnique({ where: { profileId } });
}

// ─── LADDER UPDATE (internal) ─────────────────────────────────────────────────

async function updateLadderAndProfile(profileId: string) {
  const apps = await prismadb.jobApplication.findMany({
    where:  { profileId },
    select: { status: true },
  });

  const counts = {
    total:   apps.length,
    active:  apps.filter((a) => !["REJECTED", "WITHDRAWN", "GHOSTED", "ACCEPTED"].includes(a.status)).length,
    interviews: apps.filter((a) => ["PHONE_SCREEN", "INTERVIEW", "ASSESSMENT", "FINAL_ROUND"].includes(a.status)).length,
    offers:  apps.filter((a) => ["OFFER", "ACCEPTED"].includes(a.status)).length,
    rejections: apps.filter((a) => a.status === "REJECTED").length,
  };

  await prismadb.ladderEntry.upsert({
    where:  { profileId },
    create: { profileId, totalApplications: counts.total, activeApplications: counts.active, interviews: counts.interviews, offers: counts.offers, rejections: counts.rejections },
    update: { totalApplications: counts.total, activeApplications: counts.active, interviews: counts.interviews, offers: counts.offers, rejections: counts.rejections, lastApplicationAt: new Date() },
  });

  await prismadb.jobSeekerProfile.update({
    where: { id: profileId },
    data:  { totalApplications: counts.total },
  });
}

// ─── STREAK UPDATE ────────────────────────────────────────────────────────────

async function updateStreak(profileId: string) {
  const profile = await prismadb.jobSeekerProfile.findUnique({ where: { id: profileId }, select: { streakDays: true, lastActivityDate: true } });
  if (!profile) return;

  const today    = new Date(); today.setHours(0, 0, 0, 0);
  const last     = profile.lastActivityDate ? new Date(profile.lastActivityDate) : null;
  if (last) last.setHours(0, 0, 0, 0);

  const diffDays = last ? Math.floor((today.getTime() - last.getTime()) / 86400000) : 999;
  const newStreak = diffDays === 0 ? profile.streakDays : diffDays === 1 ? profile.streakDays + 1 : 1;

  // XP for applying
  const xpGain = 10 + (newStreak > 1 ? 5 : 0); // bonus for streaks

  await prismadb.jobSeekerProfile.update({
    where: { id: profileId },
    data:  { streakDays: newStreak, lastActivityDate: new Date(), xpPoints: { increment: xpGain } },
  });
}

// ─── BADGE AWARDS ─────────────────────────────────────────────────────────────

const BADGE_THRESHOLDS: Record<string, { type: string; check: (stats: any) => boolean }> = {
  FIRST_APPLICATION:    { type: "FIRST_APPLICATION",    check: (s) => s.total >= 1   },
  TEN_APPLICATIONS:     { type: "TEN_APPLICATIONS",     check: (s) => s.total >= 10  },
  FIFTY_APPLICATIONS:   { type: "FIFTY_APPLICATIONS",   check: (s) => s.total >= 50  },
  HUNDRED_APPLICATIONS: { type: "HUNDRED_APPLICATIONS", check: (s) => s.total >= 100 },
  FIRST_INTERVIEW:      { type: "FIRST_INTERVIEW",      check: (s) => s.interviews >= 1 },
  RESILIENCE:           { type: "RESILIENCE",           check: (s) => s.rejections >= 30 },
};

async function checkAndAwardBadges(profileId: string) {
  const [ladder, existing] = await Promise.all([
    prismadb.ladderEntry.findUnique({ where: { profileId } }),
    prismadb.userBadge.findMany({ where: { profileId }, select: { type: true } }),
  ]);
  if (!ladder) return;

  const existingTypes = new Set(existing.map((b) => b.type));
  const stats = {
    total:      ladder.totalApplications,
    interviews: ladder.interviews,
    rejections: ladder.rejections,
  };

  const toAward = Object.values(BADGE_THRESHOLDS)
    .filter((b) => !existingTypes.has(b.type as any) && b.check(stats))
    .map((b) => ({ profileId, type: b.type as any }));

  if (toAward.length) {
    await prismadb.userBadge.createMany({ data: toAward, skipDuplicates: true });
    // Award XP for badges
    await prismadb.jobSeekerProfile.update({
      where: { id: profileId },
      data:  { xpPoints: { increment: toAward.length * 50 } },
    });
  }
}

// ─── DISCUSSIONS ──────────────────────────────────────────────────────────────

export async function getDiscussions({
  category, page = 1, pageSize = 20, sortBy = "createdAt",
}: { category?: string; page?: number; pageSize?: number; sortBy?: "createdAt" | "likeCount" | "replyCount" } = {}) {
  const where = {
    deletedAt: null,
    ...(category && { category: category as any }),
  };
  const [discussions, total] = await Promise.all([
    prismadb.discussion.findMany({
      where,
      orderBy: { [sortBy]: "desc" },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
      include: {
        profile: { select: { displayName: true, avatarUrl: true, isPublicProfile: true } },
        _count:  { select: { replies: true, likes: true } },
      },
    }),
    prismadb.discussion.count({ where }),
  ]);
  return { discussions, total, pages: Math.ceil(total / pageSize) };
}

export async function createDiscussion(data: {
  category:    string;
  title:       string;
  content:     string;
  isAnonymous?: boolean;
}) {
  const profileId = await getProfileId();
  if (!profileId) throw new Error("Not authenticated");
  const disc = await prismadb.discussion.create({
    data: { profileId, category: data.category as any, title: data.title.trim(), content: data.content.trim(), isAnonymous: data.isAnonymous ?? false },
  });
  revalidatePath("/tools/job-application-tracker");
  return disc;
}

export async function createReply(discussionId: string, content: string, isAnonymous = false) {
  const profileId = await getProfileId();
  if (!profileId) throw new Error("Not authenticated");
  const reply = await prismadb.discussionReply.create({
    data: { discussionId, profileId, content: content.trim(), isAnonymous },
  });
  await prismadb.discussion.update({ where: { id: discussionId }, data: { replyCount: { increment: 1 } } });
  // Award XP and potentially badge for helping
  await prismadb.jobSeekerProfile.update({ where: { id: profileId }, data: { xpPoints: { increment: 5 } } });
  revalidatePath("/tools/job-application-tracker");
  return reply;
}

export async function likeDiscussion(discussionId: string) {
  const profileId = await getProfileId();
  if (!profileId) throw new Error("Not authenticated");
  try {
    await prismadb.discussionLike.create({ data: { discussionId, profileId } });
    await prismadb.discussion.update({ where: { id: discussionId }, data: { likeCount: { increment: 1 } } });
  } catch { /* already liked */ }
}

// ─── SHARED PROGRESS ──────────────────────────────────────────────────────────

export async function logShare(platform: string, message: string, stats: object) {
  const profileId = await getProfileId();
  if (!profileId) throw new Error("Not authenticated");
  await prismadb.sharedProgress.create({
    data: { profileId, platform, message, stats: JSON.stringify(stats) },
  });
  await prismadb.jobSeekerProfile.update({ where: { id: profileId }, data: { xpPoints: { increment: 15 } } });
}

// ─── BULK DELETE ──────────────────────────────────────────────────────────────

export async function bulkDeleteApplications(ids: string[]) {
  const profileId = await getProfileId();
  if (!profileId) throw new Error("Not authenticated");
  await prismadb.jobApplication.deleteMany({ where: { id: { in: ids }, profileId } });
  await updateLadderAndProfile(profileId);
  revalidatePath("/tools/job-application-tracker");
}