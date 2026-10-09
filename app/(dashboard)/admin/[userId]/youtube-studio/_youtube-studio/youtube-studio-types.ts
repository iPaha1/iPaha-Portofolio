// =============================================================================
// YouTube Content Studio — Shared TypeScript Types
// =============================================================================

// ─── Enums ────────────────────────────────────────────────────────────────────

export type VideoStatus =
  | "DRAFT" | "GENERATING" | "READY" | "FILMING"
  | "EDITING" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

export type ContentTone =
  | "calm" | "reflective" | "direct" | "energetic"
  | "storytelling" | "philosophical" | "motivational" | "conversational";

export type YtWeekStatus =
  | "GENERATING" | "READY" | "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";

export type ThemeCategory =
  | "Life Understanding" | "Self-Belief" | "Confidence" | "Values"
  | "Mindset" | "Relationships" | "Career" | "Money" | "Purpose" | "Custom";

export type ScriptSection =
  | "HOOK" | "INTRO" | "BODY" | "PERSPECTIVE_SHIFT" | "CLOSING";

// ─── Creator Profile ──────────────────────────────────────────────────────────

export interface YoutubeCreatorProfile {
  id: string;
  userId: string;
  channelName?: string;
  channelHandle?: string;
  channelDescription?: string;
  channelAvatarUrl?: string;
  channelBannerUrl?: string;
  channelId?: string;
  subscriberCount: number;
  totalVideos: number;
  totalViews: number;
  videosPerWeek: number;
  defaultTone: ContentTone;
  targetAudience?: string;
  creatorBio?: string;
  uniqueVoiceNotes?: string;
  channelMission?: string;
  coreThemes?: string[];
  speakingPace?: string;
  cameraStyle?: string;
  backgroundStyle?: string;
  topicMemory?: TopicMemoryEntry[];
  avgViewsPerVideo: number;
  avgWatchTimeSeconds: number;
  topPerformingNiche?: string;
  isOnboarded: boolean;
  onboardedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TopicMemoryEntry {
  id: string;
  title: string;
  coreConcepts: string[];
  weekNumber: number;
  year: number;
  createdAt: string;
}

// ─── Weekly Batch ─────────────────────────────────────────────────────────────

export interface YoutubeWeeklyBatch {
  id: string;
  profileId: string;
  weekNumber: number;
  year: number;
  weekLabel?: string;
  status: YtWeekStatus;
  videosRequested: number;
  toneUsed: ContentTone;
  themesUsed?: string[];
  personalContext?: string;
  targetAudience?: string;
  generatedAt?: string;
  generationMs?: number;
  tokensUsed?: number;
  modelUsed?: string;
  narrativeArc?: string;
  totalVideos: number;
  publishedCount: number;
  draftCount: number;
  createdAt: string;
  updatedAt: string;
  videos?: YoutubeVideo[];
}

// ─── Video ────────────────────────────────────────────────────────────────────

export interface YoutubeVideo {
  id: string;
  batchId?: string;
  profileId: string;
  title: string;
  status: VideoStatus;
  orderInBatch: number;
  // Script
  hook?: string;
  intro?: string;
  body?: string;
  perspectiveShift?: string;
  closingLine?: string;
  fullScript?: string;
  // Delivery
  toneNotes?: string;
  pausePoints?: string[];
  emphasisPoints?: string[];
  facialCues?: string;
  energyArc?: string;
  // Filming
  cameraPosition?: string;
  lightingSuggestion?: string;
  bodyLanguageTips?: string;
  setDressing?: string;
  // Upload package
  seoTitle?: string;
  description?: string;
  tags?: string[];
  thumbnailTextIdeas?: string[];
  category?: string;
  targetAudience?: string;
  youtubeMetadata?: YoutubeVideoMetadata;
  // Social posts
  twitterPost?: string;
  linkedinPost?: string;
  facebookPost?: string;
  tiktokCaption?: string;
  shortsCaption?: string;
  // Anti-repetition
  topicFingerprint?: string[];
  coreConcepts?: string[];
  // Scheduling
  scheduledFor?: string;
  publishedAt?: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
  // Performance
  viewCount: number;
  likeCount: number;
  commentCount: number;
  avgWatchPercent?: number;
  impressions: number;
  ctr?: number;
  // User
  userNotes?: string;
  isStarred: boolean;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  scriptSections?: YoutubeScriptSection[];
  revisions?: YoutubeVideoRevision[];
  calendarEntry?: YoutubeCalendarEntry;
}

export interface YoutubeVideoMetadata {
  playlist?: string;
  language?: string;
  madeForKids?: boolean;
  ageRestriction?: boolean;
  defaultLanguage?: string;
  embeddable?: boolean;
  publicStatsViewable?: boolean;
}

// ─── Script Section ───────────────────────────────────────────────────────────

export interface YoutubeScriptSection {
  id: string;
  videoId: string;
  section: ScriptSection;
  content: string;
  order: number;
  wordCount: number;
  estimatedSeconds: number;
  isApproved: boolean;
  userEdited: boolean;
  aiVersion?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Revision ─────────────────────────────────────────────────────────────────

export interface YoutubeVideoRevision {
  id: string;
  videoId: string;
  revisionNum: number;
  changeNote?: string;
  fullScript: string;
  metadata?: string;
  createdAt: string;
}

// ─── Content Idea ─────────────────────────────────────────────────────────────

export interface YoutubeContentIdea {
  id: string;
  profileId: string;
  title: string;
  hook?: string;
  angle?: string;
  whyNow?: string;
  targetEmotion?: string;
  themes?: string[];
  difficulty?: "easy" | "medium" | "deep";
  estimatedLength?: number;
  isAiGenerated: boolean;
  isUsed: boolean;
  usedInVideoId?: string;
  isSaved: boolean;
  userNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Channel Goal ─────────────────────────────────────────────────────────────

export interface YoutubeChannelGoal {
  id: string;
  profileId: string;
  title: string;
  description?: string;
  targetMetric: "subscribers" | "views" | "videos" | "watchHours";
  targetValue: number;
  currentValue: number;
  targetDate?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface YoutubeAnalyticsSnapshot {
  id: string;
  profileId: string;
  snapshotDate: string;
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
  avgViewerAge?: string;
  genderSplit?: Record<string, number>;
  totalSocialImpressions: number;
  createdAt: string;
}

export interface YoutubePerformanceLog {
  id: string;
  videoId: string;
  logDate: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
  ctr?: number;
  avgWatchPercent?: number;
  watchSeconds: number;
  newSubscribers: number;
  createdAt: string;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export interface YoutubeCalendarEntry {
  id: string;
  profileId: string;
  videoId?: string;
  title: string;
  scheduledDate: string;
  status: VideoStatus;
  color?: string;
  notes?: string;
  isRecurring: boolean;
  recurringDays?: number[];
  createdAt: string;
  updatedAt: string;
  video?: YoutubeVideo;
}

// ─── AI Generation ────────────────────────────────────────────────────────────

export interface GenerateWeeklyRequest {
  userId: string;
  videosPerWeek: number;
  tone: ContentTone;
  themes: string[];
  personalContext?: string;
  targetAudience?: string;
  weekNumber?: number;
  year?: number;
}

export interface GenerateIdeasRequest {
  userId: string;
  count?: number;
  themes?: string[];
  tone?: ContentTone;
  targetAudience?: string;
  avoidTopics?: string[];
}

export interface RegenerateScriptSectionRequest {
  videoId: string;
  section: ScriptSection;
  instruction?: string;
}

export interface GeneratedVideoPackage {
  title: string;
  seoTitle: string;
  hook: string;
  intro: string;
  body: string;
  perspectiveShift: string;
  closingLine: string;
  deliveryNotes: string;
  pausePoints: string[];
  emphasisPoints: string[];
  facialCues: string;
  energyArc: string;
  cameraPosition: string;
  lightingSuggestion: string;
  bodyLanguageTips: string;
  setDressing: string;
  description: string;
  tags: string[];
  thumbnailIdeas: string[];
  category: string;
  twitterPost: string;
  linkedinPost: string;
  facebookPost: string;
  tiktokCaption: string;
  shortsCaption: string;
  coreConcepts: string[];
  topicFingerprint: string[];
}

// ─── API Response Wrappers ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface StudioDashboardStats {
  totalVideos: number;
  publishedVideos: number;
  totalViews: number;
  subscribers: number;
  watchHours: number;
  avgCtr: number;
  publishingStreak: number;
  videosThisWeek: number;
  ideasBankCount: number;
  scheduledCount: number;
  weeklyGrowthPct: number;
  monthlyViewsGrowthPct: number;
}

// ─── Filter / Sort ────────────────────────────────────────────────────────────

export interface VideoFilterOptions {
  status?: VideoStatus;
  search?: string;
  sortBy?: "date" | "views" | "score" | "title";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  weekNumber?: number;
  year?: number;
  isStarred?: boolean;
}




