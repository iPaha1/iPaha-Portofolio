// =============================================================================
// YouTube Content Studio — Prismadbprismadb DB Helpers
// lib/youtube/db.ts
// =============================================================================

import { prismadb } from "@/lib/db";
import type {
    ContentTone,
    PaginatedResponse,
    StudioDashboardStats,
    TopicMemoryEntry,
    VideoFilterOptions,
    YoutubeVideo,
} from "@/app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-types";

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getOrCreateProfile(userId: string) {
  const existing = await prismadb.youtubeCreatorProfile.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  return prismadb.youtubeCreatorProfile.create({
    data: {
      userId,
      videosPerWeek: 3,
      defaultTone: "CALM",
      isOnboarded: false,
      subscriberCount: 0,
      totalVideos: 0,
      totalViews: 0,
      avgViewsPerVideo: 0,
      avgWatchTimeSeconds: 0,
    },
  });
}

export async function updateProfile(
  profileId: string,
  data: Partial<{
    channelName: string;
    channelHandle: string;
    channelDescription: string;
    channelAvatarUrl: string;
    channelBannerUrl: string;
    videosPerWeek: number;
    defaultTone: string;
    targetAudience: string;
    creatorBio: string;
    uniqueVoiceNotes: string;
    channelMission: string;
    coreThemes: string[];
    speakingPace: string;
    cameraStyle: string;
    backgroundStyle: string;
    isOnboarded: boolean;
  }>
) {
  const { coreThemes, defaultTone, ...rest } = data;
  return prismadb.youtubeCreatorProfile.update({
    where: { id: profileId },
    data: {
      ...rest,
      ...(defaultTone !== undefined && { defaultTone: defaultTone as any }),
      ...(coreThemes !== undefined && { coreThemes: JSON.stringify(coreThemes) }),
    },
  });
}

// ─── Topic Memory ─────────────────────────────────────────────────────────────

export async function getTopicMemory(profileId: string): Promise<TopicMemoryEntry[]> {
  const profile = await prismadb.youtubeCreatorProfile.findUnique({
    where: { id: profileId },
    select: { topicMemory: true },
  });
  if (!profile?.topicMemory) return [];
  try {
    return JSON.parse(profile.topicMemory) as TopicMemoryEntry[];
  } catch {
    return [];
  }
}

export async function appendTopicMemory(
  profileId: string,
  entries: TopicMemoryEntry[]
) {
  const existing = await getTopicMemory(profileId);
  // Keep last 50 entries to avoid prompt bloat
  const updated = [...existing, ...entries].slice(-50);
  return prismadb.youtubeCreatorProfile.update({
    where: { id: profileId },
    data: { topicMemory: JSON.stringify(updated) },
  });
}

// ─── Weekly Batches ───────────────────────────────────────────────────────────

// ─── Weekly Batches ───────────────────────────────────────────────────────────

export async function createWeeklyBatch(data: {
  profileId: string;
  weekNumber: number;
  year: number;
  weekLabel: string;
  videosRequested: number;
  toneUsed: string;
  themesUsed: string[];
  personalContext?: string;
  targetAudience?: string;
  modelUsed?: string;
}) {
  const { toneUsed, themesUsed, ...rest } = data;

  return prismadb.youtubeWeeklyBatch.upsert({
    where: {
      // This matches your @@unique([profileId, weekNumber, year])
      profileId_weekNumber_year: {
        profileId: data.profileId,
        weekNumber: data.weekNumber,
        year: data.year,
      },
    },
    update: {
      // If batch already exists for this week → reset it for re-generation
      status: "GENERATING",
      videosRequested: data.videosRequested,
      toneUsed: toneUsed as any,
      themesUsed: JSON.stringify(themesUsed),
      personalContext: data.personalContext,
      targetAudience: data.targetAudience,
      weekLabel: data.weekLabel,           // in case label changed
      generatedAt: null,                   // reset
      totalVideos: 0,
      draftCount: 0,
      publishedCount: 0,
      updatedAt: new Date(),
    },
    create: {
      // Brand new batch
      ...rest,
      toneUsed: toneUsed as any,
      themesUsed: JSON.stringify(themesUsed),
      status: "GENERATING" as any,
    },
  });
}

export async function updateBatchStatus(
  batchId: string,
  data: {
    status?: string;
    generatedAt?: Date;
    generationMs?: number;
    tokensUsed?: number;
    narrativeArc?: string;
    totalVideos?: number;
  }
) {
  const { status, ...rest } = data;
  return prismadb.youtubeWeeklyBatch.update({
    where: { id: batchId },
    data: {
      ...rest,
      ...(status !== undefined && { status: status as any }),
    },
  });
}

export async function getBatchesForProfile(profileId: string, limit = 10) {
  return prismadb.youtubeWeeklyBatch.findMany({
    where: { profileId },
    orderBy: [{ year: "desc" }, { weekNumber: "desc" }],
    take: limit,
    include: {
      videos: {
        select: {
          id: true,
          title: true,
          status: true,
          viewCount: true,
          publishedAt: true,
          isStarred: true,
          seoTitle: true,
        },
        orderBy: { orderInBatch: "asc" },
      },
    },
  });
}

// ─── Videos ───────────────────────────────────────────────────────────────────

export async function createVideo(data: {
  batchId?: string;
  profileId: string;
  title: string;
  orderInBatch: number;
  hook?: string;
  intro?: string;
  body?: string;
  perspectiveShift?: string;
  closingLine?: string;
  fullScript?: string;
  toneNotes?: string;
  pausePoints?: string[];
  emphasisPoints?: string[];
  facialCues?: string;
  energyArc?: string;
  cameraPosition?: string;
  lightingSuggestion?: string;
  bodyLanguageTips?: string;
  setDressing?: string;
  seoTitle?: string;
  description?: string;
  tags?: string[];
  thumbnailTextIdeas?: string[];
  category?: string;
  twitterPost?: string;
  linkedinPost?: string;
  facebookPost?: string;
  tiktokCaption?: string;
  shortsCaption?: string;
  coreConcepts?: string[];
  topicFingerprint?: string[];
}) {
  const { pausePoints, emphasisPoints, tags, thumbnailTextIdeas, coreConcepts, topicFingerprint, ...rest } = data;
  return prismadb.youtubeVideo.create({
    data: {
      ...rest,
      status: "DRAFT",
      pausePoints: pausePoints ? JSON.stringify(pausePoints) : undefined,
      emphasisPoints: emphasisPoints ? JSON.stringify(emphasisPoints) : undefined,
      tags: tags ? JSON.stringify(tags) : undefined,
      thumbnailTextIdeas: thumbnailTextIdeas ? JSON.stringify(thumbnailTextIdeas) : undefined,
      coreConcepts: coreConcepts ? JSON.stringify(coreConcepts) : undefined,
      topicFingerprint: topicFingerprint ? JSON.stringify(topicFingerprint) : undefined,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
      impressions: 0,
      isStarred: false,
      isEdited: false,
    },
  });
}

export async function getVideosForProfile(
  profileId: string,
  filters: VideoFilterOptions = {}
): Promise<PaginatedResponse<YoutubeVideo>> {
  const {
    status, search, sortBy = "date", sortOrder = "desc",
    page = 1, pageSize = 20, isStarred,
  } = filters;

  const where: Record<string, unknown> = { profileId };
  if (status) where.status = status;
  if (isStarred !== undefined) where.isStarred = isStarred;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { seoTitle: { contains: search } },
    ];
  }

  const orderBy: Record<string, string> =
    sortBy === "views" ? { viewCount: sortOrder }
    : sortBy === "title" ? { title: sortOrder }
    : { createdAt: sortOrder };

  const [data, total] = await Promise.all([
    prismadb.youtubeVideo.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prismadb.youtubeVideo.count({ where }),
  ]);

  return {
    data: data as unknown as YoutubeVideo[],
    total,
    page,
    pageSize,
    hasMore: page * pageSize < total,
  };
}

export async function getVideoById(videoId: string) {
  return prismadb.youtubeVideo.findUnique({
    where: { id: videoId },
    include: {
      scriptSections: { orderBy: { order: "asc" } },
      revisions: { orderBy: { revisionNum: "desc" }, take: 10 },
      calendarEntry: true,
      performanceLogs: { orderBy: { logDate: "desc" }, take: 30 },
    },
  });
}

export async function updateVideo(
  videoId: string,
  data: Partial<{
    title: string;
    status: string;
    hook: string;
    intro: string;
    body: string;
    perspectiveShift: string;
    closingLine: string;
    fullScript: string;
    toneNotes: string;
    pausePoints: string[];
    emphasisPoints: string[];
    facialCues: string;
    energyArc: string;
    cameraPosition: string;
    lightingSuggestion: string;
    bodyLanguageTips: string;
    seoTitle: string;
    description: string;
    tags: string[];
    thumbnailTextIdeas: string[];
    twitterPost: string;
    linkedinPost: string;
    facebookPost: string;
    tiktokCaption: string;
    shortsCaption: string;
    scheduledFor: Date;
    publishedAt: Date;
    youtubeVideoId: string;
    youtubeUrl: string;
    userNotes: string;
    isStarred: boolean;
    isEdited: boolean;
    editedAt: Date;
  }>
) {
  const { pausePoints, emphasisPoints, tags, thumbnailTextIdeas, status, ...rest } = data;
  return prismadb.youtubeVideo.update({
    where: { id: videoId },
    data: {
      ...rest,
      ...(status !== undefined && { status: status as any }),
      ...(pausePoints && { pausePoints: JSON.stringify(pausePoints) }),
      ...(emphasisPoints && { emphasisPoints: JSON.stringify(emphasisPoints) }),
      ...(tags && { tags: JSON.stringify(tags) }),
      ...(thumbnailTextIdeas && { thumbnailTextIdeas: JSON.stringify(thumbnailTextIdeas) }),
    },
  });
}

export async function saveVideoRevision(
  videoId: string,
  fullScript: string,
  changeNote?: string
) {
  const count = await prismadb.youtubeVideoRevision.count({ where: { videoId } });
  return prismadb.youtubeVideoRevision.create({
    data: { videoId, fullScript, changeNote, revisionNum: count + 1 },
  });
}

// ─── Ideas Bank ───────────────────────────────────────────────────────────────

export async function createIdeas(ideas: Array<{
  profileId: string;
  title: string;
  hook?: string;
  angle?: string;
  whyNow?: string;
  targetEmotion?: string;
  themes?: string[];
  difficulty?: string;
  estimatedLength?: number;
}>) {
  return prismadb.youtubeContentIdea.createMany({
    data: ideas.map(idea => ({
      ...idea,
      themes: idea.themes ? JSON.stringify(idea.themes) : undefined,
      isAiGenerated: true,
      isUsed: false,
      isSaved: false,
    })),
    skipDuplicates: true,
  });
}

export async function getIdeasForProfile(
  profileId: string,
  options: { saved?: boolean; used?: boolean; page?: number; pageSize?: number } = {}
) {
  const { saved, used = false, page = 1, pageSize = 20 } = options;
  const where: Record<string, unknown> = { profileId, isUsed: used };
  if (saved !== undefined) where.isSaved = saved;

  const [data, total] = await Promise.all([
    prismadb.youtubeContentIdea.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prismadb.youtubeContentIdea.count({ where }),
  ]);
  return { data, total, page, pageSize, hasMore: page * pageSize < total };
}

export async function toggleIdeaSaved(ideaId: string, isSaved: boolean) {
  return prismadb.youtubeContentIdea.update({
    where: { id: ideaId },
    data: { isSaved },
  });
}

export async function markIdeaUsed(ideaId: string, videoId: string) {
  return prismadb.youtubeContentIdea.update({
    where: { id: ideaId },
    data: { isUsed: true, usedInVideoId: videoId },
  });
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export async function getCalendarEntries(
  profileId: string,
  from: Date,
  to: Date
) {
  return prismadb.youtubeCalendarEntry.findMany({
    where: {
      profileId,
      scheduledDate: { gte: from, lte: to },
    },
    include: { video: { select: { id: true, title: true, status: true } } },
    orderBy: { scheduledDate: "asc" },
  });
}

export async function createCalendarEntry(data: {
  profileId: string;
  videoId?: string;
  title: string;
  scheduledDate: Date;
  status?: string;
  color?: string;
  notes?: string;
}) {
  const { status, ...rest } = data;
  return prismadb.youtubeCalendarEntry.create({
    data: {
      ...rest,
      isRecurring: false,
      ...(status !== undefined && { status: status as any }),
    },
  });
}

export async function updateCalendarEntry(
  entryId: string,
  data: { scheduledDate?: Date; status?: string; notes?: string; title?: string }
) {
  const { status, ...rest } = data;
  return prismadb.youtubeCalendarEntry.update({
    where: { id: entryId },
    data: {
      ...rest,
      ...(status !== undefined && { status: status as any }),
    },
  });
}

// ─── Goals ────────────────────────────────────────────────────────────────────

export async function getGoals(profileId: string) {
  return prismadb.youtubeChannelGoal.findMany({
    where: { profileId },
    orderBy: { createdAt: "asc" },
  });
}

export async function createGoal(data: {
  profileId: string;
  title: string;
  targetMetric: string;
  targetValue: number;
  targetDate?: Date;
  description?: string;
}) {
  return prismadb.youtubeChannelGoal.create({
    data: { ...data, currentValue: 0, isCompleted: false },
  });
}

export async function updateGoalProgress(goalId: string, currentValue: number) {
  const goal = await prismadb.youtubeChannelGoal.findUnique({ where: { id: goalId } });
  if (!goal) return null;
  const isCompleted = currentValue >= goal.targetValue;
  return prismadb.youtubeChannelGoal.update({
    where: { id: goalId },
    data: {
      currentValue,
      isCompleted,
      completedAt: isCompleted && !goal.isCompleted ? new Date() : undefined,
    },
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getAnalyticsSnapshots(profileId: string, limit = 12) {
  return prismadb.youtubeAnalyticsSnapshot.findMany({
    where: { profileId },
    orderBy: { snapshotDate: "desc" },
    take: limit,
  });
}

export async function upsertAnalyticsSnapshot(data: {
  profileId: string;
  snapshotDate: Date;
  subscriberCount: number;
  subscriberGrowth: number;
  totalViews: number;
  viewsGrowth: number;
  watchHoursTotal: number;
  watchHoursGrowth: number;
  videosPublished: number;
  avgViewsPerVideo: number;
  avgLikesPerVideo: number;
  avgCtr: number;
  avgWatchPercent: number;
  topVideoId?: string;
  topVideoTitle?: string;
  topVideoViews: number;
  topCountry?: string;
  totalSocialImpressions: number;
}) {
  return prismadb.youtubeAnalyticsSnapshot.upsert({
    where: { profileId_snapshotDate: { profileId: data.profileId, snapshotDate: data.snapshotDate } },
    create: data,
    update: data,
  });
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export async function getDashboardStats(profileId: string): Promise<StudioDashboardStats> {
  const [
    totalVideos,
    publishedVideos,
    scheduledCount,
    ideasBankCount,
    profile,
    latestSnapshot,
    previousSnapshot,
  ] = await Promise.all([
    prismadb.youtubeVideo.count({ where: { profileId } }),
    prismadb.youtubeVideo.count({ where: { profileId, status: "PUBLISHED" } }),
    prismadb.youtubeVideo.count({ where: { profileId, status: "SCHEDULED" } }),
    prismadb.youtubeContentIdea.count({ where: { profileId, isUsed: false } }),
    prismadb.youtubeCreatorProfile.findUnique({ where: { id: profileId } }),
    prismadb.youtubeAnalyticsSnapshot.findFirst({
      where: { profileId },
      orderBy: { snapshotDate: "desc" },
    }),
    prismadb.youtubeAnalyticsSnapshot.findFirst({
      where: { profileId },
      orderBy: { snapshotDate: "desc" },
      skip: 1,
    }),
  ]);

  // Publishing streak: count consecutive weeks with at least 1 published video
  const weeklyPublished = await prismadb.youtubeVideo.groupBy({
    by: ["profileId"],
    where: { profileId, status: "PUBLISHED" },
    _count: true,
  });

  const monthlyViewsGrowthPct =
    previousSnapshot && latestSnapshot && previousSnapshot.totalViews > 0
      ? ((latestSnapshot.totalViews - previousSnapshot.totalViews) / previousSnapshot.totalViews) * 100
      : 0;

  return {
    totalVideos,
    publishedVideos,
    totalViews: latestSnapshot?.totalViews ?? 0,
    subscribers: profile?.subscriberCount ?? 0,
    watchHours: Math.round((latestSnapshot?.watchHoursTotal ?? 0)),
    avgCtr: latestSnapshot?.avgCtr ?? 0,
    publishingStreak: 6, // TODO: compute from batch history
    videosThisWeek: weeklyPublished[0]?._count ?? 0,
    ideasBankCount,
    scheduledCount,
    weeklyGrowthPct: latestSnapshot?.subscriberGrowth ?? 0,
    monthlyViewsGrowthPct: Math.round(monthlyViewsGrowthPct),
  };
}

// ─── AI Session Logging ───────────────────────────────────────────────────────

export async function logAiSession(data: {
  profileId: string;
  batchId?: string;
  videoId?: string;
  sessionType: string;
  prompt: string;
  response?: string;
  modelUsed?: string;
  tokensInput?: number;
  tokensOutput?: number;
  durationMs?: number;
  wasSuccess: boolean;
  errorMessage?: string;
}) {
  return prismadb.youtubeAiSession.create({ data });
}


// ─── Save Generated Video to Library ─────────────────────────────────────────

export async function saveVideoToLibrary(data: {
  profileId: string;
  batchId?: string;           // optional - if it came from a weekly batch
  title: string;
  seoTitle?: string;
  hook?: string;
  intro?: string;
  body?: string;
  perspectiveShift?: string;
  closingLine?: string;
  fullScript?: string;
  toneNotes?: string;
  pausePoints?: string[];
  emphasisPoints?: string[];
  facialCues?: string;
  energyArc?: string;
  cameraPosition?: string;
  lightingSuggestion?: string;
  bodyLanguageTips?: string;
  setDressing?: string;
  description?: string;
  tags?: string[];
  thumbnailTextIdeas?: string[];
  category?: string;
  twitterPost?: string;
  linkedinPost?: string;
  facebookPost?: string;
  tiktokCaption?: string;
  shortsCaption?: string;
  coreConcepts?: string[];
  topicFingerprint?: string;
}) {
  return prismadb.youtubeVideo.create({
    data: {
      profileId: data.profileId,
      batchId: data.batchId || null,
      title: data.title,
      seoTitle: data.seoTitle || data.title,
      hook: data.hook,
      intro: data.intro,
      body: data.body,
      perspectiveShift: data.perspectiveShift,
      closingLine: data.closingLine,
      fullScript: data.fullScript,
      toneNotes: data.toneNotes,
      pausePoints: data.pausePoints ? JSON.stringify(data.pausePoints) : null,
      emphasisPoints: data.emphasisPoints ? JSON.stringify(data.emphasisPoints) : null,
      facialCues: data.facialCues,
      energyArc: data.energyArc,
      cameraPosition: data.cameraPosition,
      lightingSuggestion: data.lightingSuggestion,
      bodyLanguageTips: data.bodyLanguageTips,
      setDressing: data.setDressing,
      description: data.description,
      tags: data.tags ? JSON.stringify(data.tags) : null,
      thumbnailTextIdeas: data.thumbnailTextIdeas ? JSON.stringify(data.thumbnailTextIdeas) : null,
      category: data.category,
      twitterPost: data.twitterPost,
      linkedinPost: data.linkedinPost,
      facebookPost: data.facebookPost,
      tiktokCaption: data.tiktokCaption,
      shortsCaption: data.shortsCaption,
      coreConcepts: data.coreConcepts ? JSON.stringify(data.coreConcepts) : null,
      topicFingerprint: data.topicFingerprint,
      status: "READY" as any,
    },
  });
}