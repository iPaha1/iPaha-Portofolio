// =============================================================================
// isaacpaha.com — Developer Hub: Shared Types & Config
// components/admin/hub/shared/hub-types.ts
// =============================================================================

// ─── Entry Types ──────────────────────────────────────────────────────────────

export type HubType =
  // Phase 1
  | "SNIPPET" | "PROMPT" | "COMMAND" | "ERROR"
  // Phase 2
  | "NOTE" | "API" | "PATTERN" | "TEMPLATE" | "PLAYBOOK" | "RESOURCE";

export type HubLanguage =
  | "PLAINTEXT" | "BASH" | "MARKDOWN"
  | "HTML" | "CSS" | "JAVASCRIPT" | "TYPESCRIPT" | "JSX" | "TSX"
  | "PYTHON" | "RUST" | "GO" | "JAVA" | "CSHARP" | "PHP" | "RUBY"
  | "SQL" | "PRISMA" | "GRAPHQL" | "JSON" | "YAML"
  | "DOCKERFILE" | "ENV" | "TOML" | "REGEX" | "OTHER";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
export type ResourceType = "DOCUMENTATION" | "COURSE" | "ARTICLE" | "VIDEO" | "TOOL" | "BOOK" | "PODCAST" | "OTHER";

// ─── Unified entry model ──────────────────────────────────────────────────────

export type HubEntry = {
  id:            string;
  type:          HubType;

  // Universal
  title:         string;
  description:   string | null;
  content:       string;        // main payload — varies by type
  tags:          string | null; // JSON string[]
  category:      string | null;
  isFavourite:   boolean;
  isPinned:      boolean;
  copyCount:     number;
  viewCount:     number;

  // SNIPPET
  language:      HubLanguage | null;
  framework:     string | null;

  // PROMPT
  aiModel:       string | null;
  exampleOutput: string | null;

  // ERROR
  errorMessage:  string | null;
  solution:      string | null;
  technology:    string | null;

  // NOTE
  references:    string | null; // JSON string[] of URLs/labels
  difficulty:    string | null; // "Beginner" | "Intermediate" | "Advanced"

  // API
  httpMethod:      string | null;
  endpointUrl:     string | null;
  requestExample:  string | null; // JSON/body example
  responseExample: string | null;
  apiHeaders:      string | null; // JSON Record<string, string>
  authType:        string | null; // "Bearer" | "API Key" | "Basic" | "None"

  // PATTERN
  advantages:    string | null; // LongText
  disadvantages: string | null; // LongText
  useCases:      string | null; // LongText
  relatedTech:   string | null; // JSON string[]
  diagramUrl:    string | null;

  // TEMPLATE
  templateType:  string | null; // "README" | "DOCS" | "BUG_REPORT" | "PITCH" | etc.

  // PLAYBOOK
  steps:          string | null; // JSON PlaybookStep[]
  estimatedTime:  string | null; // "~30 min" | "1-2 hours"

  // RESOURCE
  resourceUrl:   string | null;
  resourceType:  string | null;
  rating:        number | null; // 1-5
  author:        string | null;

  createdAt: Date;
  updatedAt: Date;
};

// ─── Playbook step type ───────────────────────────────────────────────────────

export type PlaybookStep = {
  order:       number;
  title:       string;
  description: string;
  command?:    string;
  note?:       string;
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export type HubStats = {
  total:       number;
  // Phase 1
  snippets:    number;
  prompts:     number;
  commands:    number;
  errors:      number;
  // Phase 2
  notes:       number;
  apis:        number;
  patterns:    number;
  templates:   number;
  playbooks:   number;
  resources:   number;
  // Misc
  favourites:  number;
  pinned:      number;
  totalCopies: number;
  mostCopied:  MostCopiedEntry[];
  byCategory:  { category: string; count: number }[];
};

export type MostCopiedEntry = {
  id:        string;
  title:     string;
  type:      HubType;
  copyCount: number;
  category:  string | null;
  language:  HubLanguage | null;
};

// ─── Tab config ───────────────────────────────────────────────────────────────

import {
  Code2, Brain, Terminal, Bug, Search,
  BookOpen, Globe, Layers, FileText, BookMarked, Link2,
} from "lucide-react";

export const TAB_CFG = {
  // Phase 1
  snippets:  { type: "SNIPPET"  as HubType, label: "Snippets",      icon: Code2,     color: "#f59e0b", bg: "#fef3c7", phase: 1 },
  prompts:   { type: "PROMPT"   as HubType, label: "AI Prompts",    icon: Brain,     color: "#8b5cf6", bg: "#ede9fe", phase: 1 },
  commands:  { type: "COMMAND"  as HubType, label: "Commands",      icon: Terminal,  color: "#10b981", bg: "#d1fae5", phase: 1 },
  errors:    { type: "ERROR"    as HubType, label: "Errors",        icon: Bug,       color: "#ef4444", bg: "#fee2e2", phase: 1 },
  // Phase 2
  notes:     { type: "NOTE"     as HubType, label: "Notes",         icon: BookOpen,  color: "#0ea5e9", bg: "#e0f2fe", phase: 2 },
  apis:      { type: "API"      as HubType, label: "API Reference", icon: Globe,     color: "#06b6d4", bg: "#cffafe", phase: 2 },
  patterns:  { type: "PATTERN"  as HubType, label: "Patterns",      icon: Layers,    color: "#6366f1", bg: "#e0e7ff", phase: 2 },
  templates: { type: "TEMPLATE" as HubType, label: "Templates",     icon: FileText,  color: "#f97316", bg: "#ffedd5", phase: 2 },
  playbooks: { type: "PLAYBOOK" as HubType, label: "Playbooks",     icon: BookMarked,color: "#ec4899", bg: "#fce7f3", phase: 2 },
  resources: { type: "RESOURCE" as HubType, label: "Resources",     icon: Link2,     color: "#84cc16", bg: "#f7fee7", phase: 2 },
  // Global
  search:    { type: null,                  label: "Search",         icon: Search,    color: "#3b82f6", bg: "#dbeafe", phase: 0 },
} as const;

export type TabKey = keyof typeof TAB_CFG;

// ─── Language config ──────────────────────────────────────────────────────────

export const LANGUAGES: HubLanguage[] = [
  "TYPESCRIPT", "JAVASCRIPT", "PYTHON", "BASH", "SQL", "PRISMA",
  "TSX", "JSX", "HTML", "CSS", "JSON", "YAML", "GRAPHQL",
  "GO", "RUST", "JAVA", "CSHARP", "PHP", "RUBY",
  "DOCKERFILE", "ENV", "TOML", "REGEX", "MARKDOWN", "PLAINTEXT", "OTHER",
];

export const LANG_LABELS: Record<HubLanguage, string> = {
  TYPESCRIPT: "TypeScript", JAVASCRIPT: "JavaScript", PYTHON: "Python",
  BASH: "Bash/Shell", SQL: "SQL", PRISMA: "Prisma", TSX: "TSX", JSX: "JSX",
  HTML: "HTML", CSS: "CSS", JSON: "JSON", YAML: "YAML", GRAPHQL: "GraphQL",
  GO: "Go", RUST: "Rust", JAVA: "Java", CSHARP: "C#", PHP: "PHP", RUBY: "Ruby",
  DOCKERFILE: "Dockerfile", ENV: ".env", TOML: "TOML", REGEX: "Regex",
  MARKDOWN: "Markdown", PLAINTEXT: "Plain Text", OTHER: "Other",
};

export const LANG_COLOR: Record<string, string> = {
  TYPESCRIPT: "#3b82f6", JAVASCRIPT: "#f59e0b", PYTHON: "#10b981",
  BASH: "#10b981",       SQL: "#8b5cf6",        PRISMA: "#6366f1",
  TSX: "#06b6d4",        JSX: "#f97316",        GO: "#14b8a6",
  RUST: "#f97316",       JAVA: "#ec4899",       GRAPHQL: "#e91e63",
  HTML: "#f97316",       CSS: "#3b82f6",        JSON: "#84cc16",
  YAML: "#84cc16",       TOML: "#f59e0b",       ENV: "#6b7280",
  REGEX: "#ef4444",      MARKDOWN: "#6b7280",   DEFAULT: "#9ca3af",
};

// ─── HTTP Methods ─────────────────────────────────────────────────────────────

export const HTTP_METHOD_COLOR: Record<string, string> = {
  GET: "#10b981", POST: "#f59e0b", PUT: "#3b82f6",
  PATCH: "#8b5cf6", DELETE: "#ef4444", HEAD: "#6b7280", OPTIONS: "#6b7280",
};

// ─── Resource types ───────────────────────────────────────────────────────────

export const RESOURCE_TYPE_CFG: Record<ResourceType, { label: string; emoji: string }> = {
  DOCUMENTATION: { label: "Documentation", emoji: "📖" },
  COURSE:        { label: "Course",         emoji: "🎓" },
  ARTICLE:       { label: "Article",        emoji: "📝" },
  VIDEO:         { label: "Video",          emoji: "🎬" },
  TOOL:          { label: "Tool",           emoji: "🔧" },
  BOOK:          { label: "Book",           emoji: "📚" },
  PODCAST:       { label: "Podcast",        emoji: "🎙️" },
  OTHER:         { label: "Other",          emoji: "🔗" },
};

// ─── Suggested categories per type ───────────────────────────────────────────

export const SUGGESTED_CATEGORIES: Record<HubType, string[]> = {
  SNIPPET:  ["Prisma", "React", "Next.js", "Auth", "API Routes", "Hooks", "Tailwind", "SQL", "TypeScript", "Utilities"],
  PROMPT:   ["Coding", "Debugging", "Architecture", "Writing", "Documentation", "Startup", "Review", "Refactoring"],
  COMMAND:  ["Git", "Docker", "Linux", "Node.js", "Prisma", "npm/yarn", "Database", "Vercel", "SSH", "Process"],
  ERROR:    ["Next.js", "Prisma", "TypeScript", "Node.js", "Build", "Deployment", "Auth", "Database", "CSS", "API"],
  NOTE:     ["System Design", "Architecture", "Performance", "Security", "Database", "Frontend", "Backend", "DevOps", "Career"],
  API:      ["Stripe", "OpenAI", "Anthropic", "Internal", "Auth", "Storage", "Messaging", "Analytics", "Payment"],
  PATTERN:  ["Architecture", "Design Patterns", "Microservices", "Database", "Security", "Frontend", "Backend", "Cloud"],
  TEMPLATE: ["README", "Documentation", "Bug Report", "PR Template", "Architecture", "Startup", "API Docs", "Changelog"],
  PLAYBOOK: ["Deployment", "Setup", "Debugging", "Launch", "Migration", "Security", "Onboarding", "Release"],
  RESOURCE: ["AI", "TypeScript", "React", "System Design", "Career", "Startups", "Security", "Database", "DevOps"],
};

// ─── Utility functions ────────────────────────────────────────────────────────

export function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];

  // 1. Try parsing as JSON first (most Prisma Json fields store actual arrays)
  try {
    const parsed = JSON.parse(raw);
    
    // Handle different successful parse results
    if (Array.isArray(parsed)) {
      // Keep only string values, filter out non-strings
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
    }
    
    // If parsed is a single string (e.g. someone stored "nextjs" instead of ["nextjs"])
    if (typeof parsed === 'string') {
      return parsed.trim() ? [parsed.trim()] : [];
    }
    
    // Otherwise (object, number, etc.) → treat as empty
    return [];
  } catch {
    // Not valid JSON → try treating as comma-separated string (very common fallback)
    return raw
      .split(/[,;]/)                    // split on comma or semicolon
      .map(t => t.trim())
      .filter(t => t.length > 0);       // remove empties
  }
}

export function parseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function fmtDate(d: Date | string): string {
  const date = new Date(d);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1)  return "today";
  if (days === 1) return "yesterday";
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function getTypeCountKey(type: HubType): keyof HubStats {
  const map: Record<HubType, keyof HubStats> = {
    SNIPPET: "snippets", PROMPT: "prompts", COMMAND: "commands", ERROR: "errors",
    NOTE: "notes", API: "apis", PATTERN: "patterns",
    TEMPLATE: "templates", PLAYBOOK: "playbooks", RESOURCE: "resources",
  };
  return map[type];
}

export function typeToTabKey(type: HubType): TabKey {
  const map: Record<HubType, TabKey> = {
    SNIPPET: "snippets", PROMPT: "prompts", COMMAND: "commands", ERROR: "errors",
    NOTE: "notes", API: "apis", PATTERN: "patterns",
    TEMPLATE: "templates", PLAYBOOK: "playbooks", RESOURCE: "resources",
  };
  return map[type];
}