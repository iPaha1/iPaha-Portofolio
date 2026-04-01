"use client";

// =============================================================================
// isaacpaha.com — Blog Filter Bar
// app/blog/_blog/blog-filter-bar.tsx
// =============================================================================

import React from "react";
import { Search, X, SlidersHorizontal, TrendingUp, Clock, Eye } from "lucide-react";
import type { DBCategory } from "@/lib/types/blog";
import { cn } from "@/lib/utils";

export type SortOption = "latest" | "popular" | "trending";

interface BlogFilterBarProps {
  search:         string;
  onSearch:       (v: string) => void;
  activeCategory: string;
  onCategory:     (c: string) => void;
  sort:           SortOption;
  onSort:         (s: SortOption) => void;
  totalResults:   number;
  categories:     DBCategory[];
}

const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ElementType }[] = [
  { value: "latest",   label: "Latest",   icon: Clock     },
  { value: "popular",  label: "Most read", icon: Eye       },
  { value: "trending", label: "Trending", icon: TrendingUp },
];

export const BlogFilterBar = ({
  search,
  onSearch,
  activeCategory,
  onCategory,
  sort,
  onSort,
  totalResults,
  categories,
}: BlogFilterBarProps) => {
  const hasFilters = activeCategory !== "All" || search.length > 0;

  return (
    <div className="sticky top-16 z-30 bg-[#fafaf8]/95 backdrop-blur-md border-b border-gray-200 py-3">
      <div className="max-w-7xl mx-auto px-4 space-y-3">
        {/* Row 1: search + sort + count */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search essays..."
              className="w-full bg-white border border-gray-200 rounded-xs pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-all duration-200 shadow-sm"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xs p-1 shadow-sm">
            {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => onSort(value)}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xs transition-all duration-200",
                  sort === value
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              <span className="text-gray-700 font-bold">{totalResults}</span>{" "}
              {totalResults === 1 ? "essay" : "essays"}
            </span>
          </div>

          {hasFilters && (
            <button
              onClick={() => { onSearch(""); onCategory("All"); }}
              className="flex items-center gap-1.5 text-xs text-amber-600 border border-amber-200 bg-amber-50 px-3 py-2 rounded-xs hover:bg-amber-100 transition-all"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>

        {/* Row 2: category pills — from DB */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
          <button
            onClick={() => onCategory("All")}
            className={cn(
              "shrink-0 text-xs font-semibold px-4 py-2 rounded-xs border transition-all duration-200",
              activeCategory === "All"
                ? "bg-gray-900 border-gray-900 text-white"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategory(cat.name)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xs border transition-all duration-200",
                activeCategory === cat.name
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800"
              )}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};






// "use client";

// import React from "react";
// import { Search, X, SlidersHorizontal, TrendingUp, Clock } from "lucide-react";
// import { BLOG_CATEGORIES, type BlogCategory } from "@/lib/data/blog-data";
// import { cn } from "@/lib/utils";

// export type SortOption = "latest" | "popular" | "trending";

// interface BlogFilterBarProps {
//   search: string;
//   onSearch: (v: string) => void;
//   activeCategory: BlogCategory | "All";
//   onCategory: (c: BlogCategory | "All") => void;
//   sort: SortOption;
//   onSort: (s: SortOption) => void;
//   totalResults: number;
// }

// const SORT_OPTIONS: { value: SortOption; label: string; icon: React.ElementType }[] = [
//   { value: "latest", label: "Latest", icon: Clock },
//   { value: "popular", label: "Most read", icon: Eye_ },
//   { value: "trending", label: "Trending", icon: TrendingUp },
// ];

// // Simple inline Eye component to avoid import issues
// function Eye_({ className }: { className?: string }) {
//   return (
//     <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//       <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
//       <circle cx="12" cy="12" r="3" />
//     </svg>
//   );
// }

// export const BlogFilterBar = ({
//   search,
//   onSearch,
//   activeCategory,
//   onCategory,
//   sort,
//   onSort,
//   totalResults,
// }: BlogFilterBarProps) => {
//   const hasFilters = activeCategory !== "All" || search.length > 0;

//   return (
//     <div className="sticky top-16 z-30 bg-[#fafaf8]/95 backdrop-blur-md border-b border-gray-200 py-3">
//       <div className="max-w-7xl mx-auto px-4 space-y-3">
//         {/* Row 1: search + sort + count */}
//         <div className="flex items-center gap-3 flex-wrap">
//           <div className="relative flex-1 min-w-[200px] max-w-sm">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
//             <input
//               type="text"
//               value={search}
//               onChange={(e) => onSearch(e.target.value)}
//               placeholder="Search essays..."
//               className="w-full bg-white border border-gray-200 rounded-xs pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-all duration-200 shadow-sm"
//             />
//           </div>

//           {/* Sort */}
//           <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xs p-1 shadow-sm">
//             {SORT_OPTIONS.map(({ value, label, icon: Icon }) => (
//               <button
//                 key={value}
//                 onClick={() => onSort(value)}
//                 className={cn(
//                   "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xs transition-all duration-200",
//                   sort === value
//                     ? "bg-gray-900 text-white"
//                     : "text-gray-500 hover:text-gray-800"
//                 )}
//               >
//                 <Icon className="w-3 h-3" />
//                 {label}
//               </button>
//             ))}
//           </div>

//           <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-auto">
//             <SlidersHorizontal className="w-3.5 h-3.5" />
//             <span>
//               <span className="text-gray-700 font-bold">{totalResults}</span>{" "}
//               {totalResults === 1 ? "essay" : "essays"}
//             </span>
//           </div>

//           {hasFilters && (
//             <button
//               onClick={() => { onSearch(""); onCategory("All"); }}
//               className="flex items-center gap-1.5 text-xs text-amber-600 border border-amber-200 bg-amber-50 px-3 py-2 rounded-xs hover:bg-amber-100 transition-all"
//             >
//               <X className="w-3 h-3" />
//               Clear
//             </button>
//           )}
//         </div>

//         {/* Row 2: category pills */}
//         <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
//           <button
//             onClick={() => onCategory("All")}
//             className={cn(
//               "shrink-0 text-xs font-semibold px-4 py-2 rounded-xs border transition-all duration-200",
//               activeCategory === "All"
//                 ? "bg-gray-900 border-gray-900 text-white"
//                 : "bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800"
//             )}
//           >
//             All
//           </button>
//           {BLOG_CATEGORIES.map((cat) => (
//             <button
//               key={cat.name}
//               onClick={() => onCategory(cat.name)}
//               className={cn(
//                 "shrink-0 flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xs border transition-all duration-200",
//                 activeCategory === cat.name
//                   ? "bg-amber-500 border-amber-500 text-white"
//                   : "bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800"
//               )}
//             >
//               {cat.icon} {cat.name}
//             </button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };