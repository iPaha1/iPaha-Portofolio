"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Users, Zap, Lock, Sparkles } from "lucide-react";
import { StarRating } from "./star-rating";
import { staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { type Tool, STATUS_CONFIG, TOOL_CATEGORIES } from "@/lib/data/tools-data";

export const ToolCard = ({ tool }: { tool: Tool }) => {
  const status = STATUS_CONFIG[tool.status];
  const category = TOOL_CATEGORIES.find((c) => c.name === tool.category);
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
      {/* Top color stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 transition-all duration-300"
        style={{
          background: isDisabled
            ? "#e5e7eb"
            : `linear-gradient(to right, ${tool.accentColor}, ${tool.accentColor}80)`,
          opacity: isDisabled ? 1 : 0,
        }}
      />
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
                borderColor: `${tool.accentColor}20`,
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
                {/* Category */}
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: category?.color }}
                >
                  {category?.icon} {tool.category}
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

        {/* Features list */}
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

        {/* Tags */}
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

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
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
// import { ArrowRight, Users, Zap, Lock } from "lucide-react";
// import { type Tool, STATUS_CONFIG, TOOL_CATEGORIES } from "@/lib/data/tools-data";
// import { staggerItem } from "@/lib/animations";
// import { cn } from "@/lib/utils";
// import { StarRating } from "./star-rating";

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
//     <Link href={`/tools/${tool.slug}`} className="block h-full">
//       {CardContent}
//     </Link>
//   );
// };