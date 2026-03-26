// =============================================================================
// isaacpaha.com — Admin Navigation Config
// Single source of truth for all sidebar navigation
// =============================================================================

export interface NavItem {
  id: string;
  label: string;
  href: (userId: string) => string;
  iconName: string;
  badge?: string;
  badgeColor?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        href: (u) => `/admin/${u}/dashboard`,
        iconName: "LayoutDashboard",
      },
      {
        id: "analytics",
        label: "Analytics",
        href: (u) => `/admin/${u}/analytics`,
        iconName: "BarChart3",
      },
    ],
  },
  {
    id: "content",
    label: "Content",
    items: [
      {
        id: "blog",
        label: "Blog",
        href: (u) => `/admin/${u}/blog`,
        iconName: "FileText",
      },
      {
        id: "ideas",
        label: "Ideas Lab",
        href: (u) => `/admin/${u}/ideas`,
        iconName: "Lightbulb",
      },
      {
        id: "tools",
        label: "Tools Lab",
        href: (u) => `/admin/${u}/tools`,
        iconName: "Wrench",
      },
      {
        id: "now",
        label: "Now Page",
        href: (u) => `/admin/${u}/now`,
        iconName: "Clock",
        badge: "Live",
        badgeColor: "#10b981",
      },
      {
        id: "podcast",
        label: "Podcast",
        href: (u) => `/admin/${u}/podcast`,
        iconName: "Mic",
      },
    ],
  },
  {
    id: "products",
    label: "Products",
    items: [
      {
        id: "apps",
        label: "Apps",
        href: (u) => `/admin/${u}/apps`,
        iconName: "AppWindow",
      },
      {
        id: "newsletter",
        label: "Newsletter",
        href: (u) => `/admin/${u}/newsletter`,
        iconName: "Mail",
      },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    items: [
      {
        id: "social",
        label: "Social Media",
        href: (u) => `/admin/${u}/social`,
        iconName: "Share2",
      },
      {
        id: "contacts",
        label: "Contacts",
        href: (u) => `/admin/${u}/contacts`,
        iconName: "Users",
      },
    ],
  },
  // ─── NEW: Developer Hub ────────────────────────────────────────────────────
  // ─── Developer Hub (Phase 1 + Phase 2) ─────────────────────────────────────
  {
    id: "devhub",
    label: "Developer Hub",
    items: [
      {
        id: "hub",
        label: "Hub Overview",
        href: (u) => `/admin/${u}/hub`,
        iconName: "Database",
      },
      // {
      //   id: "hub-search",
      //   label: "Global Search",
      //   href: (u) => `/admin/${u}/hub?tab=search`,
      //   iconName: "SearchCode",
      // },
    ],
  },
  // {
  //   id: "devhub-phase1",
  //   label: "Phase 1 — Code",
  //   items: [
  //     {
  //       id: "hub-snippets",
  //       label: "Code Snippets",
  //       href: (u) => `/admin/${u}/hub?tab=snippets`,
  //       iconName: "Code2",
  //     },
  //     {
  //       id: "hub-prompts",
  //       label: "AI Prompts",
  //       href: (u) => `/admin/${u}/hub?tab=prompts`,
  //       iconName: "Brain",
  //     },
  //     {
  //       id: "hub-commands",
  //       label: "Dev Commands",
  //       href: (u) => `/admin/${u}/hub?tab=commands`,
  //       iconName: "Terminal",
  //     },
  //     {
  //       id: "hub-errors",
  //       label: "Error Solutions",
  //       href: (u) => `/admin/${u}/hub?tab=errors`,
  //       iconName: "Bug",
  //     },
  //   ],
  // },
  // {
  //   id: "devhub-phase2",
  //   label: "Phase 2 — Knowledge",
  //   items: [
  //     {
  //       id: "hub-notes",
  //       label: "Learning Notes",
  //       href: (u) => `/admin/${u}/hub?tab=notes`,
  //       iconName: "BookOpen",
  //     },
  //     {
  //       id: "hub-apis",
  //       label: "API Reference",
  //       href: (u) => `/admin/${u}/hub?tab=apis`,
  //       iconName: "Globe",
  //     },
  //     {
  //       id: "hub-patterns",
  //       label: "Arch Patterns",
  //       href: (u) => `/admin/${u}/hub?tab=patterns`,
  //       iconName: "Layers",
  //     },
  //     {
  //       id: "hub-templates",
  //       label: "Templates",
  //       href: (u) => `/admin/${u}/hub?tab=templates`,
  //       iconName: "FileText",
  //     },
  //     {
  //       id: "hub-playbooks",
  //       label: "Playbooks",
  //       href: (u) => `/admin/${u}/hub?tab=playbooks`,
  //       iconName: "BookMarked",
  //     },
  //     {
  //       id: "hub-resources",
  //       label: "Resources",
  //       href: (u) => `/admin/${u}/hub?tab=resources`,
  //       iconName: "Link2",
  //     },
  //   ],
  // },
  // {
  //   id: "devhub-phase3",
  //   label: "Phase 3 — AI Layer",
  //   items: [
  //     {
  //       id: "hub-ai",
  //       label: "AI Assistant",
  //       href: (u) => `/admin/${u}/hub?tab=ai`,
  //       iconName: "Bot",
  //       badge: "New",
  //       badgeColor: "#8b5cf6",
  //     },
  //     {
  //       id: "hub-analytics",
  //       label: "Analytics",
  //       href: (u) => `/admin/${u}/hub?tab=analytics`,
  //       iconName: "BarChart2",
  //     },
  //     {
  //       id: "hub-import",
  //       label: "Import / Export",
  //       href: (u) => `/admin/${u}/hub?tab=import`,
  //       iconName: "ArrowLeftRight",
  //     },
  //     {
  //       id: "hub-tags",
  //       label: "Tag Manager",
  //       href: (u) => `/admin/${u}/hub?tab=tags`,
  //       iconName: "Tags",
  //     },
  //   ],
  // },
  // ──────────────────────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: "system",
    label: "System",
    items: [
      {
        id: "media",
        label: "Media Library",
        href: (u) => `/admin/${u}/media`,
        iconName: "Image",
      },
      {
        id: "settings",
        label: "Settings",
        href: (u) => `/admin/${u}/settings`,
        iconName: "Settings",
      },
    ],
  },
];

// Quick actions shown on dashboard and command palette
export const QUICK_ACTIONS = [
  {
    id: "new-post",
    label: "New Blog Post",
    description: "Write and publish a new article",
    iconName: "FilePlus",
    href: (u: string) => `/admin/${u}/blog/new`,
    color: "#f59e0b",
    shortcut: "N B",
  },
  {
    id: "new-idea",
    label: "New Idea",
    description: "Add to the Ideas Lab",
    iconName: "Lightbulb",
    href: (u: string) => `/admin/${u}/ideas/new`,
    color: "#8b5cf6",
    shortcut: "N I",
  },
  {
    id: "new-app",
    label: "New App",
    description: "Register a new product",
    iconName: "AppWindow",
    href: (u: string) => `/admin/${u}/apps/new`,
    color: "#10b981",
    shortcut: "N A",
  },
  {
    id: "post-social",
    label: "Post to Social",
    description: "Compose a social media post",
    iconName: "Share2",
    href: (u: string) => `/admin/${u}/social/compose`,
    color: "#3b82f6",
    shortcut: "N S",
  },
  {
    id: "new-tool",
    label: "New Tool",
    description: "Add a tool to Tools Lab",
    iconName: "Wrench",
    href: (u: string) => `/admin/${u}/tools/new`,
    color: "#f97316",
    shortcut: "N T",
  },
  {
    id: "upload-media",
    label: "Upload Media",
    description: "Add files to media library",
    iconName: "Upload",
    href: (u: string) => `/admin/${u}/media`,
    color: "#ec4899",
    shortcut: "N M",
  },
];