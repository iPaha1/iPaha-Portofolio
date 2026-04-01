"use client";

// =============================================================================
// isaacpaha.com — Tools Lab Client
// app/tools/_tools/tools-lab-client.tsx
//
// Now receives DB tools from the server instead of importing hardcoded data.
// Maps DB field names (name, tagLine, icon, usageCount, ratingAvg, accentColor)
// → the shape that FeaturedToolCard, ToolCard, ToolsSidebar, etc. expect.
// =============================================================================

import React, { useState, useMemo } from "react";
import type { ToolCategory, ToolStatus } from "@/lib/generated/prisma/enums";
import { ToolsHero }        from "./tools-hero";
import { FeaturedToolCard } from "./featured-tools-card";
import { ToolsFilterBar }   from "./tools-filter-bar";
import { ToolsGrid }        from "./tools-grid";
import { ToolsSidebar }     from "./tools-side-bar";
import { ToolsSocialProof } from "./tool-social-prof";

// ─── DB shape (what comes from getPublicTools) ────────────────────────────────
 
export type DbTool = {
  id:             string;
  name:           string;
  slug:           string;
  tagLine:        string;
  description:    string;
  features:       unknown;        // Json? → string[] after parsing
  category:       string;
  status:         ToolStatus;
  icon:           string | null;
  accentColor:    string | null;
  tags:           string | null;  // JSON string "["tag1","tag2"]"
  tokenCost:      number | null;
  coverImage:     string | null;
  isFeatured:     boolean;
  isNew:          boolean;
  isPremium:      boolean;
  isInteractive:  boolean;
  isActive:       boolean;
  isPublic:       boolean;
  viewCount:      number;
  usageCount:     number;
  ratingAvg:      number | null;
  ratingCount:    number;
  version:        string | null;
  createdAt:      Date;
  updatedAt:      Date;
  _count:         { usageLogs: number };
};
 
// ─── Normalised shape used by all child components ────────────────────────────
 
export type NormalisedTool = {
  id:          string;
  slug:        string;
  name:        string;
  tagline:     string;
  description: string;
  category:    string;
  status:      ToolStatus;
  icon:        string;
  accentColor: string;
  tags:        string[];
  features:    string[];
  usageCount:  number;
  tokenCost:   number | undefined;
  ratingAvg:   number;
  ratingCount: number;
  isFeatured:  boolean;
  isNew:       boolean;
  isPremium:   boolean;
  buildTime?:  string;
  coverImage?: string;
};
 
// ─── Category display config ──────────────────────────────────────────────────
 
const CATEGORY_CFG: Record<string, { icon: string; color: string; description: string }> = {
  AI:           { icon: "🤖", color: "#f59e0b", description: "AI-powered tools"    },
  CAREER:       { icon: "💼", color: "#ec4899", description: "Job search & career"  },
  FINANCE:      { icon: "💰", color: "#14b8a6", description: "Money & finance"       },
  STARTUP:      { icon: "🚀", color: "#10b981", description: "Business & startups"  },
  EDUCATION:    { icon: "📚", color: "#8b5cf6", description: "Learning & growth"    },
  PRODUCTIVITY: { icon: "⚡", color: "#14b8a6", description: "Work smarter"         },
  WRITING:      { icon: "✍️", color: "#3b82f6", description: "Content & writing"   },
  OTHER:        { icon: "🔧", color: "#6b7280", description: "Other tools"          },
};
 
const DEFAULT_ACCENT: Record<string, string> = {
  AI:           "#f59e0b",
  CAREER:       "#ec4899",
  FINANCE:      "#14b8a6",
  STARTUP:      "#10b981",
  EDUCATION:    "#8b5cf6",
  PRODUCTIVITY: "#14b8a6",
  WRITING:      "#3b82f6",
  OTHER:        "#6b7280",
};
 
// ─── Helpers ──────────────────────────────────────────────────────────────────
 
function parseTags(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}
 
function parseFeatures(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((f): f is string => typeof f === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
 
function normalise(t: DbTool): NormalisedTool {
  return {
    id:          t.id,
    slug:        t.slug,
    name:        t.name,
    tagline:     t.tagLine,
    description: t.description,
    category:    t.category,
    status:      t.status,
    icon:        t.icon          ?? "🔧",
    accentColor: t.accentColor   ?? DEFAULT_ACCENT[t.category] ?? "#f59e0b",
    tags:        parseTags(t.tags),
    features:    parseFeatures(t.features),
    usageCount:  t.usageCount    ?? 0,
    tokenCost:   t.tokenCost     ?? undefined,
    ratingAvg:   t.ratingAvg     ?? 0,
    ratingCount: t.ratingCount   ?? 0,
    isFeatured:  t.isFeatured,
    isNew:       t.isNew,
    isPremium:   t.isPremium,
    coverImage:  t.coverImage    ?? undefined,
  };
}
 
function getCategories(tools: NormalisedTool[]) {
  const cats = Array.from(new Set(tools.map((t) => t.category)));
  return cats.map((name) => ({
    name,
    icon:        CATEGORY_CFG[name]?.icon        ?? "🔧",
    color:       CATEGORY_CFG[name]?.color       ?? "#6b7280",
    description: CATEGORY_CFG[name]?.description ?? "",
  }));
}
 
// ─── Component ────────────────────────────────────────────────────────────────
 
interface Props {
  tools?: DbTool[]; // optional — guard against undefined from server
}
 
export const ToolsLabClient = ({ tools: dbTools = [] }: Props) => {
  // Normalise once — safe even if dbTools is []
  const tools = useMemo(() => (dbTools ?? []).map(normalise), [dbTools]);
 
  const [search,         setSearch]         = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeStatus,   setActiveStatus]   = useState<ToolStatus | "All">("All");
 
  const categories   = useMemo(() => getCategories(tools), [tools]);
  const featuredTool = tools.find((t) => t.isFeatured);
 
  const filtered = useMemo(() => {
    return tools
      .filter((tool) => {
        const q = search.toLowerCase();
        const matchesSearch =
          q.length === 0 ||
          tool.name.toLowerCase().includes(q)        ||
          tool.tagline.toLowerCase().includes(q)     ||
          tool.description.toLowerCase().includes(q) ||
          tool.tags.some((t) => t.toLowerCase().includes(q));
 
        const matchesCategory = activeCategory === "All" || tool.category === activeCategory;
        const matchesStatus   = activeStatus   === "All" || tool.status   === activeStatus;
 
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .filter((tool) => {
        // Hide the featured tool from the main grid when no filters active
        const hasFilters = search.length > 0 || activeCategory !== "All" || activeStatus !== "All";
        return hasFilters || !tool.isFeatured;
      });
  }, [tools, search, activeCategory, activeStatus]);
 
  const hasFilters = search.length > 0 || activeCategory !== "All" || activeStatus !== "All";
 
  return (
    <div className="min-h-screen bg-white text-stone-900" style={{ fontFamily: "Sora, sans-serif" }}>
 
      {/* Hero — computed from live DB tools */}
      <ToolsHero tools={tools} />
 
      {/* Featured tool panel */}
      {!hasFilters && featuredTool && (
        <div className="pt-10">
          <FeaturedToolCard tool={featuredTool} />
        </div>
      )}
 
      {/* Filter bar */}
      <ToolsFilterBar
        search={search}
        onSearch={setSearch}
        activeCategory={activeCategory}
        onCategory={setActiveCategory}
        activeStatus={activeStatus}
        onStatus={setActiveStatus}
        totalResults={filtered.length}
        categories={categories}
      />
 
      {/* Main grid + sidebar */}
      <div id="tools-grid" className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <ToolsGrid tools={filtered} />
          </div>
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-52">
              <ToolsSidebar
                tools={tools}
                categories={categories}
                activeCategory={activeCategory}
                onCategory={setActiveCategory}
              />
            </div>
          </div>
        </div>
      </div>
 
      {/* Social proof */}
      <ToolsSocialProof tools={tools} categories={categories} />
 
    </div>
  );
};
 






// "use client";

// // =============================================================================
// // isaacpaha.com — Tools Lab Client
// // app/tools/_tools/tools-lab-client.tsx
// //
// // Changes from original:
// //   • InteractiveToolsShowcase → ToolsSocialProof (no broken inline widgets)
// //   • Import updated ToolsHero (honest copy, real stats)
// //   • Import updated FeaturedToolCard (no broken try-it)
// // =============================================================================

// import React, { useState, useMemo } from "react";
// import { TOOLS, type ToolCategory, type ToolStatus } from "@/lib/data/tools-data";
// import { ToolsHero }        from "./tools-hero";
// import { FeaturedToolCard } from "./featured-tools-card";
// import { ToolsFilterBar }   from "./tools-filter-bar";
// import { ToolsGrid }        from "./tools-grid";
// import { ToolsSidebar }     from "./tools-side-bar";
// import { ToolsSocialProof } from "./tool-social-prof";


// export const ToolsLabClient = () => {
//   const [search,          setSearch]          = useState("");
//   const [activeCategory,  setActiveCategory]  = useState<ToolCategory | "All">("All");
//   const [activeStatus,    setActiveStatus]    = useState<ToolStatus   | "All">("All");

//   const featuredTool = TOOLS.find(t => t.isFeatured);

//   const filtered = useMemo(() => {
//     return TOOLS.filter(tool => {
//       const matchesSearch =
//         search.length === 0 ||
//         tool.name.toLowerCase().includes(search.toLowerCase()) ||
//         tool.tagline.toLowerCase().includes(search.toLowerCase()) ||
//         tool.description.toLowerCase().includes(search.toLowerCase()) ||
//         tool.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

//       const matchesCategory = activeCategory === "All" || tool.category === activeCategory;
//       const matchesStatus   = activeStatus   === "All" || tool.status   === activeStatus;

//       return matchesSearch && matchesCategory && matchesStatus;
//     }).filter(tool => {
//       const hasFilters = search.length > 0 || activeCategory !== "All" || activeStatus !== "All";
//       return hasFilters || !tool.isFeatured;
//     });
//   }, [search, activeCategory, activeStatus]);

//   const hasFilters = search.length > 0 || activeCategory !== "All" || activeStatus !== "All";

//   return (
//     <div className="min-h-screen bg-white text-stone-900" style={{ fontFamily: "Sora, sans-serif" }}>

//       {/* Hero — honest copy, real stats */}
//       <ToolsHero />

//       {/* Featured tool — no broken try-it widget */}
//       {!hasFilters && featuredTool && (
//         <div className="pt-10">
//           <FeaturedToolCard tool={featuredTool} />
//         </div>
//       )}

//       {/* Filter bar */}
//       <ToolsFilterBar
//         search={search}
//         onSearch={setSearch}
//         activeCategory={activeCategory}
//         onCategory={setActiveCategory}
//         activeStatus={activeStatus}
//         onStatus={setActiveStatus}
//         totalResults={filtered.length}
//       />

//       {/* Main grid + sidebar */}
//       <div id="tools-grid" className="max-w-6xl mx-auto px-4 py-12">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
//           <div className="lg:col-span-2">
//             <ToolsGrid tools={filtered} />
//           </div>
//           <div className="lg:col-span-1">
//             <div className="lg:sticky lg:top-52">
//               <ToolsSidebar
//                 activeCategory={activeCategory}
//                 onCategory={setActiveCategory}
//               />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Social proof, category breakdown, token explainer */}
//       <ToolsSocialProof />

//     </div>
//   );
// };


