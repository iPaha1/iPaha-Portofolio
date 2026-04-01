"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users, Zap, Lock } from "lucide-react";
import { StarRating } from "./star-rating";
import { staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import type { NormalisedTool } from "./tools-lab-client";

// ─── Status config (inlined — no longer imported from tools-data.ts) ──────────

const STATUS_CONFIG = {
  LIVE: {
    label:  "Live",
    color:  "text-green-600",
    bg:     "bg-green-50",
    border: "border-green-200",
    dot:    "bg-green-400",
  },
  BETA: {
    label:  "Beta",
    color:  "text-amber-600",
    bg:     "bg-amber-50",
    border: "border-amber-200",
    dot:    "bg-amber-400 animate-pulse",
  },
  COMING_SOON: {
    label:  "Coming Soon",
    color:  "text-gray-400",
    bg:     "bg-gray-50",
    border: "border-gray-200",
    dot:    "bg-gray-300",
  },
} as const;

// ─── Category display config (derived from DB category string) ────────────────

const CATEGORY_CFG: Record<string, { icon: string; color: string }> = {
  AI:           { icon: "🤖", color: "#f59e0b" },
  CAREER:       { icon: "💼", color: "#ec4899" },
  FINANCE:      { icon: "💰", color: "#14b8a6" },
  STARTUP:      { icon: "🚀", color: "#10b981" },
  EDUCATION:    { icon: "📚", color: "#8b5cf6" },
  PRODUCTIVITY: { icon: "⚡", color: "#14b8a6" },
  WRITING:      { icon: "✍️", color: "#3b82f6" },
  OTHER:        { icon: "🔧", color: "#6b7280" },
};

// ─── Component ────────────────────────────────────────────────────────────────

export const ToolCard = ({ tool }: { tool: NormalisedTool }) => {
  const status     = STATUS_CONFIG[tool.status];
  const catCfg     = CATEGORY_CFG[tool.category] ?? { icon: "🔧", color: "#6b7280" };
  const isDisabled = tool.status === "COMING_SOON";

  const CardContent = (
    <motion.article
      variants={staggerItem}
      whileHover={!isDisabled ? { y: -3 } : {}}
      className={cn(
        "group relative bg-white border rounded-xs overflow-hidden transition-all duration-300 h-full flex flex-col",
        isDisabled
          ? "border-gray-100 opacity-60 cursor-default"
          : "border-gray-100 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-50 cursor-pointer"
      )}
    >
      {/* Static top stripe (disabled state) */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-300"
        style={{
          background: isDisabled
            ? "#e5e7eb"
            : `linear-gradient(to right, ${tool.accentColor}, ${tool.accentColor}80)`,
          opacity: isDisabled ? 1 : 0,
        }}
      />
      {/* Animated top stripe (hover) */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
        style={{
          background: `linear-gradient(to right, ${tool.accentColor}, ${tool.accentColor}80)`,
        }}
      />

      <div className="p-6 flex flex-col flex-1">

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-xs flex items-center justify-center text-2xl border transition-all duration-200"
              style={{
                backgroundColor: `${tool.accentColor}10`,
                borderColor:     `${tool.accentColor}20`,
              }}
            >
              {tool.icon}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200 leading-snug">
                  {tool.name}
                </h3>
                {tool.isNew && (
                  <span className="text-[9px] font-black tracking-widest uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded-xs">
                    NEW
                  </span>
                )}
                {tool.isPremium && (
                  <Lock className="w-3 h-3 text-amber-500" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: catCfg.color }}
                >
                  {catCfg.icon} {tool.category}
                </span>
              </div>
            </div>
          </div>

          {/* Status badge */}
          <span
            className={`shrink-0 flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-xs border ${status.bg} ${status.border} ${status.color}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* Tagline */}
        <p className="text-sm font-medium text-gray-700 mb-2 leading-snug">
          {tool.tagline}
        </p>

        {/* Description */}
        <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-4 flex-1">
          {tool.description}
        </p>

        {/* Features — top 3 from DB */}
        {tool.features.length > 0 && (
          <ul className="space-y-1.5 mb-5">
            {tool.features.slice(0, 3).map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: tool.accentColor }}
                />
                {f}
              </li>
            ))}
          </ul>
        )}

        {/* Tags */}
        {tool.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {tool.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
          <div className="flex items-center gap-3">
            {tool.ratingCount > 0 && (
              <StarRating rating={tool.ratingAvg} count={tool.ratingCount} />
            )}
            {tool.usageCount > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-300">
                <Users className="w-3 h-3" />
                {tool.usageCount.toLocaleString()}
              </span>
            )}
            {/* Token cost */}
            {tool.tokenCost != null && tool.tokenCost > 0 && (
              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-xs">
                🪙 {tool.tokenCost}
              </span>
            )}
          </div>

          {!isDisabled && (
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Zap className="w-3 h-3" />
              Try it
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
            </div>
          )}
        </div>

      </div>
    </motion.article>
  );

  if (isDisabled) return CardContent;
  return (
    <Link href={`/tools/${tool.slug}`} className="block h-full">
      {CardContent}
    </Link>
  );
};





// "use client";

// import React from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { ArrowRight, Users, Zap, Lock, Sparkles } from "lucide-react";
// import { StarRating } from "./star-rating";
// import { staggerItem } from "@/lib/animations";
// import { cn } from "@/lib/utils";
// import { type Tool, STATUS_CONFIG, TOOL_CATEGORIES } from "@/lib/data/tools-data";

// export const ToolCard = ({ tool }: { tool: Tool }) => {
//   const status = STATUS_CONFIG[tool.status];
//   const category = TOOL_CATEGORIES.find((c) => c.name === tool.category);
//   const isDisabled = tool.status === "COMING_SOON";

//   const CardContent = (
//     <motion.article
//       variants={staggerItem}
//       whileHover={!isDisabled ? { y: -3 } : {}}
//       className={cn(
//         "group relative bg-white border rounded-xs overflow-hidden transition-all duration-300 h-full flex flex-col",
//         isDisabled
//           ? "border-gray-100 opacity-60 cursor-default"
//           : "border-gray-100 hover:border-amber-300 hover:shadow-xl hover:shadow-amber-50 cursor-pointer"
//       )}
//     >
//       {/* Top color stripe */}
//       <div
//         className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-300"
//         style={{
//           background: isDisabled
//             ? "#e5e7eb"
//             : `linear-gradient(to right, ${tool.accentColor}, ${tool.accentColor}80)`,
//           opacity: isDisabled ? 1 : 0,
//         }}
//       />
//       <div
//         className="absolute top-0 left-0 right-0 h-0.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"
//         style={{
//           background: `linear-gradient(to right, ${tool.accentColor}, ${tool.accentColor}80)`,
//         }}
//       />

//       <div className="p-6 flex flex-col flex-1">
//         {/* Header */}
//         <div className="flex items-start justify-between mb-4">
//           <div className="flex items-center gap-3">
//             {/* Icon */}
//             <div
//               className="w-11 h-11 rounded-xs flex items-center justify-center text-2xl border transition-all duration-200"
//               style={{
//                 backgroundColor: `${tool.accentColor}10`,
//                 borderColor: `${tool.accentColor}20`,
//               }}
//             >
//               {tool.icon}
//             </div>
//             <div>
//               <div className="flex items-center gap-2">
//                 <h3 className="text-base font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-200 leading-snug">
//                   {tool.name}
//                 </h3>
//                 {tool.isNew && (
//                   <span className="text-[9px] font-black tracking-widest uppercase bg-amber-500 text-white px-1.5 py-0.5 rounded-xs">
//                     NEW
//                   </span>
//                 )}
//                 {tool.isPremium && (
//                   <Lock className="w-3 h-3 text-amber-500" />
//                 )}
//               </div>
//               <div className="flex items-center gap-2 mt-0.5">
//                 {/* Category */}
//                 <span
//                   className="text-[10px] font-semibold"
//                   style={{ color: category?.color }}
//                 >
//                   {category?.icon} {tool.category}
//                 </span>
//               </div>
//             </div>
//           </div>

//           {/* Status badge */}
//           <span
//             className={`shrink-0 flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-xs border ${status.bg} ${status.border} ${status.color}`}
//           >
//             <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
//             {status.label}
//           </span>
//         </div>

//         {/* Tagline */}
//         <p className="text-sm font-medium text-gray-700 mb-2 leading-snug">
//           {tool.tagline}
//         </p>

//         {/* Description */}
//         <p className="text-sm text-gray-400 leading-relaxed line-clamp-2 mb-4 flex-1">
//           {tool.description}
//         </p>

//         {/* Features list */}
//         <ul className="space-y-1.5 mb-5">
//           {tool.features.slice(0, 3).map((f) => (
//             <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
//               <span
//                 className="w-1.5 h-1.5 rounded-full shrink-0"
//                 style={{ backgroundColor: tool.accentColor }}
//               />
//               {f}
//             </li>
//           ))}
//         </ul>

//         {/* Tags */}
//         <div className="flex flex-wrap gap-1.5 mb-5">
//           {tool.tags.map((tag) => (
//             <span
//               key={tag}
//               className="text-[10px] font-medium text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-xs"
//             >
//               {tag}
//             </span>
//           ))}
//         </div>

//         {/* Footer */}
//         <div className="flex items-center justify-between pt-4 border-t border-gray-50">
//           <div className="flex items-center gap-3">
//             {tool.ratingCount > 0 && (
//               <StarRating rating={tool.ratingAvg} count={tool.ratingCount} />
//             )}
//             {tool.usageCount > 0 && (
//               <span className="flex items-center gap-1 text-xs text-gray-300">
//                 <Users className="w-3 h-3" />
//                 {tool.usageCount.toLocaleString()}
//               </span>
//             )}
//           </div>

//           {!isDisabled && (
//             <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
//               <Zap className="w-3 h-3" />
//               Try it
//               <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
//             </div>
//           )}
//         </div>
//       </div>
//     </motion.article>
//   );

//   if (isDisabled) return CardContent;
//   return (
//   <Link href={`/tools/${tool.slug}`} className="block h-full">
//       {CardContent}
//     </Link>
//   );
// };



