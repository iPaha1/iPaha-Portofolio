// =============================================================================
// isaacpaha.com — Idea DB Types
// lib/types/idea.ts
// =============================================================================

// Mirror the Prisma enums exactly
export type IdeaCategory =
  | "TECH"
  | "AI"
  | "BUSINESS"
  | "SOCIETY"
  | "AFRICA"
  | "FINTECH"
  | "EDUCATION"
  | "PHILOSOPHY"
  | "OTHER";

export type IdeaStatus =
  | "CONCEPT"
  | "EXPLORING"
  | "DEVELOPING"
  | "SHELVED"
  | "LAUNCHED";

// Shape returned by Prisma selects
export interface DBIdea {
  id:           string;
  slug:         string;
  title:        string;
  summary:      string;
  coverImage:   string | null;
  category:     IdeaCategory;
  status:       IdeaStatus;
  tags:         string | null; // JSON string[] in DB
  isPublished:  boolean;
  publishedAt:  string | Date | null;
  isFeatured:   boolean;
  viewCount:    number;
  likeCount:    number;
  commentCount: number;
}

export interface DBIdeaFull extends DBIdea {
  content:         string;
  metaTitle:       string | null;
  metaDescription: string | null;
  createdAt:       string | Date;
  updatedAt:       string | Date;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export function parseIdeaTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

// Category display config (icon + colour) — no DB table, just UI mapping
export const IDEA_CATEGORY_CONFIG: Record<
  IdeaCategory,
  { label: string; icon: string; color: string }
> = {
  TECH:        { label: "Tech",        icon: "💻", color: "#14b8a6" },
  AI:          { label: "AI",          icon: "🤖", color: "#8b5cf6" },
  BUSINESS:    { label: "Business",    icon: "🚀", color: "#10b981" },
  SOCIETY:     { label: "Society",     icon: "🌍", color: "#3b82f6" },
  AFRICA:      { label: "Africa",      icon: "🌅", color: "#f97316" },
  FINTECH:     { label: "Fintech",     icon: "💳", color: "#06b6d4" },
  EDUCATION:   { label: "Education",   icon: "📚", color: "#8b5cf6" },
  PHILOSOPHY:  { label: "Philosophy",  icon: "🔭", color: "#a78bfa" },
  OTHER:       { label: "Other",       icon: "💡", color: "#f59e0b" },
};

// All categories as an array for filter pills / sidebar
export const IDEA_CATEGORIES = (
  Object.entries(IDEA_CATEGORY_CONFIG) as [IdeaCategory, typeof IDEA_CATEGORY_CONFIG[IdeaCategory]][]
).map(([key, val]) => ({ key, ...val }));

// Status display config
export const IDEA_STATUS_CONFIG: Record<
  IdeaStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  CONCEPT:    { label: "Concept",    color: "text-sky-400",    bg: "bg-sky-500/10",    border: "border-sky-500/20",    dot: "bg-sky-400"    },
  EXPLORING:  { label: "Exploring",  color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20",  dot: "bg-amber-400"  },
  DEVELOPING: { label: "Developing", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", dot: "bg-violet-400" },
  SHELVED:    { label: "Shelved",    color: "text-white/30",   bg: "bg-white/5",       border: "border-white/10",      dot: "bg-white/30"   },
  LAUNCHED:   { label: "Launched",   color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20",dot: "bg-emerald-400"},
};