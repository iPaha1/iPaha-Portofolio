// =============================================================================
// isaacpaha.com — Blog Types (DB-derived)
// lib/types/blog.ts
//
// These types match exactly what the API routes return.
// Components import from here instead of @/lib/data/blog-data.
// =============================================================================

export interface DBCategory {
  id:          string;
  name:        string;
  slug:        string;
  icon:        string | null;
  color:       string | null;
  description: string | null;
  _count?:     { posts: number };
}

export interface DBPost {
  id:                 string;
  slug:               string;
  title:              string;
  excerpt:            string;
  coverColor:         string | null;
  coverEmoji:         string | null;
  coverImage:         string | null;
  coverImageAlt:      string | null;
  tags:               string | null; // JSON string[] in DB
  publishedAt:        string | Date | null;
  readingTimeMinutes: number;
  viewCount:          number;
  likeCount:          number;
  commentCount:       number;
  isFeatured:         boolean;
  isEditorPick:       boolean;
  seriesPart:         string | null;
  series:             { title: string } | null;
  category:           { name: string; color: string | null; icon: string | null } | null;
}

export interface DBPostFull extends DBPost {
  content:         string;
  ogImage:         string | null;
  metaTitle:       string | null;
  metaDescription: string | null;
  canonicalUrl:    string | null;
  keywords:        string | null;
  updatedAt:       string | Date;
  wordCount:       number;
  bookmarkCount:   number;
  shareCount:      number;
  isPremium:       boolean;
  authorName:      string;
  authorImage:     string | null;
  authorBio:       string | null;
  tableOfContents: string | null;
  reactionCounts:  Record<string, number>;
  category: {
    id:   string;
    name: string;
    color: string | null;
    icon: string | null;
    slug: string;
  } | null;
  series: { id: string; title: string; slug: string } | null;
}

export interface DBComment {
  id:         string;
  authorName: string;
  authorUrl:  string | null;
  avatarUrl:  string | null;
  content:    string;
  likeCount:  number;
  createdAt:  string | Date;
  isEdited:   boolean;
  replies:    Omit<DBComment, "replies">[];
}

// Helpers
export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

export function formatPostDate(d: string | Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function formatPostDateLong(d: string | Date | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// Map DB ReactionType enum to display emoji + label
export const REACTION_MAP: Record<string, { emoji: string; label: string }> = {
  FIRE:  { emoji: "🔥", label: "Fire"             },
  BULB:  { emoji: "💡", label: "Insightful"       },
  THINK: { emoji: "🤔", label: "Thought-provoking" },
  CLAP:  { emoji: "👏", label: "Applause"         },
  LOVE:  { emoji: "❤️", label: "Love"             },
};

export const REACTION_TYPES = Object.keys(REACTION_MAP) as (keyof typeof REACTION_MAP)[];