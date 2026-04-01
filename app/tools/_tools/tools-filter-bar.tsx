"use client";

import React from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import type { ToolStatus } from "@/lib/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface Category {
  name:  string;
  icon:  string;
  color: string;
}

interface ToolsFilterBarProps {
  search:          string;
  onSearch:        (v: string) => void;
  activeCategory:  string;
  onCategory:      (c: string) => void;
  activeStatus:    ToolStatus | "All";
  onStatus:        (s: ToolStatus | "All") => void;
  totalResults:    number;
  categories?:     Category[]; // optional — defaults to []
}

const STATUS_OPTIONS: (ToolStatus | "All")[] = ["All", "LIVE", "BETA", "COMING_SOON"];
const STATUS_LABELS: Record<string, string>  = {
  All:         "All",
  LIVE:        "Live",
  BETA:        "Beta",
  COMING_SOON: "Coming Soon",
};

export const ToolsFilterBar = ({
  search,
  onSearch,
  activeCategory,
  onCategory,
  activeStatus,
  onStatus,
  totalResults,
  categories = [], // default to empty array — never undefined
}: ToolsFilterBarProps) => {
  const hasFilters = activeCategory !== "All" || activeStatus !== "All" || search.length > 0;

  return (
    <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm py-4">
      <div className="max-w-6xl mx-auto px-4 space-y-3">

        {/* Top row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search tools..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xs pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              <span className="text-gray-700 font-semibold">{totalResults}</span>{" "}
              tool{totalResults !== 1 ? "s" : ""}
            </span>
          </div>

          {hasFilters && (
            <button
              onClick={() => { onSearch(""); onCategory("All"); onStatus("All"); }}
              className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 border border-amber-200 hover:border-amber-300 bg-amber-50 px-3 py-2 rounded-xs transition-all"
            >
              <X className="w-3 h-3" />Clear
            </button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => onCategory("All")}
            className={cn(
              "shrink-0 text-xs font-semibold px-4 py-2 rounded-xs border transition-all",
              activeCategory === "All"
                ? "bg-gray-900 border-gray-900 text-white"
                : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800"
            )}
          >
            All Tools
          </button>

          {categories.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onCategory(cat.name)}
              className={cn(
                "shrink-0 flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xs border transition-all",
                activeCategory === cat.name
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800"
              )}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 shrink-0">Status:</span>
          <div className="flex items-center gap-1.5">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onStatus(s)}
                className={cn(
                  "shrink-0 text-xs px-3 py-1.5 rounded-xs border transition-all",
                  activeStatus === s
                    ? "bg-gray-900 border-gray-900 text-white font-semibold"
                    : "bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-700"
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};






// "use client";

// import React from "react";
// import { Search, X, SlidersHorizontal } from "lucide-react";
// import { TOOL_CATEGORIES, type ToolCategory, type ToolStatus } from "@/lib/data/tools-data";
// import { cn } from "@/lib/utils";

// interface ToolsFilterBarProps {
//   search: string;
//   onSearch: (v: string) => void;
//   activeCategory: ToolCategory | "All";
//   onCategory: (c: ToolCategory | "All") => void;
//   activeStatus: ToolStatus | "All";
//   onStatus: (s: ToolStatus | "All") => void;
//   totalResults: number;
// }

// const STATUS_OPTIONS: (ToolStatus | "All")[] = ["All", "LIVE", "BETA", "COMING_SOON"];
// const STATUS_LABELS: Record<string, string> = {
//   All: "All",
//   LIVE: "Live",
//   BETA: "Beta",
//   COMING_SOON: "Coming Soon",
// };

// export const ToolsFilterBar = ({
//   search,
//   onSearch,
//   activeCategory,
//   onCategory,
//   activeStatus,
//   onStatus,
//   totalResults,
// }: ToolsFilterBarProps) => {
//   const hasFilters =
//     activeCategory !== "All" || activeStatus !== "All" || search.length > 0;

//   return (
//     <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm py-4">
//       <div className="max-w-6xl mx-auto px-4 space-y-3">
//         {/* Top row */}
//         <div className="flex items-center gap-3">
//           <div className="relative flex-1 max-w-sm">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
//             <input
//               type="text"
//               value={search}
//               onChange={(e) => onSearch(e.target.value)}
//               placeholder="Search tools..."
//               className="w-full bg-gray-50 border border-gray-200 rounded-xs pl-9 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-all duration-200"
//             />
//           </div>

//           <div className="flex items-center gap-1.5 text-xs text-gray-400">
//             <SlidersHorizontal className="w-3.5 h-3.5" />
//             <span>
//               <span className="text-gray-700 font-semibold">{totalResults}</span>{" "}
//               tool{totalResults !== 1 ? "s" : ""}
//             </span>
//           </div>

//           {hasFilters && (
//             <button
//               onClick={() => {
//                 onSearch("");
//                 onCategory("All");
//                 onStatus("All");
//               }}
//               className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 border border-amber-200 hover:border-amber-300 bg-amber-50 px-3 py-2 rounded-xs transition-all duration-200"
//             >
//               <X className="w-3 h-3" />
//               Clear
//             </button>
//           )}
//         </div>

//         {/* Category pills */}
//         <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
//           <button
//             onClick={() => onCategory("All")}
//             className={cn(
//               "shrink-0 text-xs font-semibold px-4 py-2 rounded-xs border transition-all duration-200",
//               activeCategory === "All"
//                 ? "bg-gray-900 border-gray-900 text-white"
//                 : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800"
//             )}
//           >
//             All Tools
//           </button>
//           {TOOL_CATEGORIES.map((cat) => (
//             <button
//               key={cat.name}
//               onClick={() => onCategory(cat.name)}
//               className={cn(
//                 "shrink-0 flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xs border transition-all duration-200",
//                 activeCategory === cat.name
//                   ? "bg-amber-500 border-amber-500 text-white"
//                   : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800"
//               )}
//             >
//               <span>{cat.icon}</span>
//               {cat.name}
//             </button>
//           ))}
//         </div>

//         {/* Status filter */}
//         <div className="flex items-center gap-2">
//           <span className="text-xs text-gray-400 shrink-0">Status:</span>
//           <div className="flex items-center gap-1.5">
//             {STATUS_OPTIONS.map((s) => (
//               <button
//                 key={s}
//                 onClick={() => onStatus(s)}
//                 className={cn(
//                   "shrink-0 text-xs px-3 py-1.5 rounded-xs border transition-all duration-200",
//                   activeStatus === s
//                     ? "bg-gray-900 border-gray-900 text-white font-semibold"
//                     : "bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-700"
//                 )}
//               >
//                 {STATUS_LABELS[s]}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };