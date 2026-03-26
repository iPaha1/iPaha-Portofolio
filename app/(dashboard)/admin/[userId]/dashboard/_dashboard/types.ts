// =============================================================================
// isaacpaha.com — Admin Dashboard Types
// Shared TypeScript interfaces for the entire admin system
// =============================================================================

// ─── Navigation ───────────────────────────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string; // lucide icon name
  badge?: number | string;
  badgeVariant?: "count" | "status" | "new";
  children?: NavItem[];
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface StatCard {
  id: string;
  label: string;
  value: string | number;
  delta?: number;        // % change vs previous period
  deltaLabel?: string;   // e.g. "vs last 30 days"
  icon: string;
  color: string;
  href?: string;
}

export interface ContentHealth {
  section: string;
  icon: string;
  published: number;
  draft: number;
  total: number;
  color: string;
  href: string;
}

export interface ActivityItem {
  id: string;
  type: "comment" | "like" | "subscriber" | "view" | "contact" | "social" | "publish";
  title: string;
  description: string;
  time: string;
  meta?: string;
  avatar?: string;
  color: string;
}

export interface TopContent {
  id: string;
  title: string;
  type: "post" | "idea" | "tool" | "app";
  views: number;
  likes: number;
  comments: number;
  href: string;
  publishedAt: string;
  delta?: number;
}

export interface SocialPlatformStatus {
  id: string;
  name: string;
  icon: string;
  color: string;
  connected: boolean;
  lastPost?: string;
  followers?: number;
  handle?: string;
}

export interface UpcomingItem {
  id: string;
  type: "post" | "podcast" | "newsletter" | "social";
  title: string;
  scheduledFor: string;
  status: "scheduled" | "draft" | "ready";
  platform?: string;
}

export interface SystemStatus {
  id: string;
  label: string;
  status: "ok" | "warning" | "error" | "unknown";
  detail?: string;
}

// ─── Blog ─────────────────────────────────────────────────────────────────────

export type PostStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "ARCHIVED";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string; // Tiptap JSON string
  status: PostStatus;
  category: string;
  tags: string[];
  coverImage?: string;
  readingTime: number;
  views: number;
  likes: number;
  comments: number;
  publishedAt?: string;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Quick actions ────────────────────────────────────────────────────────────

export interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  shortcut?: string;
}