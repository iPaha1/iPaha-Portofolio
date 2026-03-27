"use client";

// =============================================================================
// isaacpaha.com — Tools Lab Client
// app/tools/_tools/tools-lab-client.tsx
//
// Changes from original:
//   • InteractiveToolsShowcase → ToolsSocialProof (no broken inline widgets)
//   • Import updated ToolsHero (honest copy, real stats)
//   • Import updated FeaturedToolCard (no broken try-it)
// =============================================================================

import React, { useState, useMemo } from "react";
import { TOOLS, type ToolCategory, type ToolStatus } from "@/lib/data/tools-data";
import { ToolsHero }        from "./tools-hero";
import { FeaturedToolCard } from "./featured-tools-card";
import { ToolsFilterBar }   from "./tools-filter-bar";
import { ToolsGrid }        from "./tools-grid";
import { ToolsSidebar }     from "./tools-side-bar";
import { ToolsSocialProof } from "./tool-social-prof";


export const ToolsLabClient = () => {
  const [search,          setSearch]          = useState("");
  const [activeCategory,  setActiveCategory]  = useState<ToolCategory | "All">("All");
  const [activeStatus,    setActiveStatus]    = useState<ToolStatus   | "All">("All");

  const featuredTool = TOOLS.find(t => t.isFeatured);

  const filtered = useMemo(() => {
    return TOOLS.filter(tool => {
      const matchesSearch =
        search.length === 0 ||
        tool.name.toLowerCase().includes(search.toLowerCase()) ||
        tool.tagline.toLowerCase().includes(search.toLowerCase()) ||
        tool.description.toLowerCase().includes(search.toLowerCase()) ||
        tool.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory = activeCategory === "All" || tool.category === activeCategory;
      const matchesStatus   = activeStatus   === "All" || tool.status   === activeStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    }).filter(tool => {
      const hasFilters = search.length > 0 || activeCategory !== "All" || activeStatus !== "All";
      return hasFilters || !tool.isFeatured;
    });
  }, [search, activeCategory, activeStatus]);

  const hasFilters = search.length > 0 || activeCategory !== "All" || activeStatus !== "All";

  return (
    <div className="min-h-screen bg-white text-stone-900" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* Hero — honest copy, real stats */}
      <ToolsHero />

      {/* Featured tool — no broken try-it widget */}
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
                activeCategory={activeCategory}
                onCategory={setActiveCategory}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Social proof, category breakdown, token explainer */}
      <ToolsSocialProof />

    </div>
  );
};




// "use client";

// import React, { useState, useMemo } from "react";
// import { TOOLS, type ToolCategory, type ToolStatus } from "@/lib/data/tools-data"; // We need to get all thesse data from our database instead of the hard-coded ones here
// import { ToolsHero } from "./tools-hero";
// import { FeaturedToolCard } from "./featured-tools-card";
// import { ToolsFilterBar } from "./tools-filter-bar";
// import { ToolsGrid } from "./tools-grid";
// import { ToolsSidebar } from "./tools-side-bar";
// import { InteractiveToolsShowcase } from "./interactive-tools-showcase";

// export const ToolsLabClient = () => {
//   const [search, setSearch] = useState("");
//   const [activeCategory, setActiveCategory] = useState<ToolCategory | "All">("All");
//   const [activeStatus, setActiveStatus] = useState<ToolStatus | "All">("All");

//   const featuredTool = TOOLS.find((t) => t.isFeatured)!;

//   const filtered = useMemo(() => {
//     return TOOLS.filter((tool) => {
//       const matchesSearch =
//         search.length === 0 ||
//         tool.name.toLowerCase().includes(search.toLowerCase()) ||
//         tool.tagline.toLowerCase().includes(search.toLowerCase()) ||
//         tool.description.toLowerCase().includes(search.toLowerCase()) ||
//         tool.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

//       const matchesCategory =
//         activeCategory === "All" || tool.category === activeCategory;

//       const matchesStatus =
//         activeStatus === "All" || tool.status === activeStatus;

//       return matchesSearch && matchesCategory && matchesStatus;
//     }).filter((tool) => {
//       const hasFilters =
//         search.length > 0 || activeCategory !== "All" || activeStatus !== "All";
//       return hasFilters || !tool.isFeatured;
//     });
//   }, [search, activeCategory, activeStatus]);

//   const hasFilters =
//     search.length > 0 || activeCategory !== "All" || activeStatus !== "All";

//   return (
//     <div className="min-h-screen bg-white text-gray-900">
//       {/* Hero */}
//       <ToolsHero />

//       {/* Featured tool (only when not filtering) */}
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

//       {/* Main content: grid + sidebar */}
//       <div className="max-w-6xl mx-auto px-4 py-12">
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

//       {/* Interactive tools showcase — the crown jewel */}
//       <InteractiveToolsShowcase />
//     </div>
//   );
// };