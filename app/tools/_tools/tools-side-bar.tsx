"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, Clock, ArrowRight, MessageSquare, Sparkles } from "lucide-react";
import type { NormalisedTool } from "./tools-lab-client";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface Category {
  name:  string;
  icon:  string;
  color: string;
}

interface ToolsSidebarProps {
  tools:          NormalisedTool[];
  categories:     Category[];
  activeCategory: string;
  onCategory:     (c: string) => void;
}

export const ToolsSidebar = ({ tools, categories, activeCategory, onCategory }: ToolsSidebarProps) => {
  const mostUsed      = [...tools].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
  const recentlyAdded = tools.filter((t) => t.isNew).slice(0, 3);

  return (
    <motion.aside
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Browse by category */}
      <motion.div variants={staggerItem} className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Browse by Category</p>
        <div className="space-y-1">
          <button
            onClick={() => onCategory("All")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xs text-sm transition-all",
              activeCategory === "All"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <span className="font-medium">All Tools</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-xs", activeCategory === "All" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400")}>
              {tools.length}
            </span>
          </button>
          {categories.map((cat) => {
            const count = tools.filter((t) => t.category === cat.name).length;
            return (
              <button
                key={cat.name}
                onClick={() => onCategory(cat.name)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all",
                  activeCategory === cat.name
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <span>{cat.icon}</span>
                <span className="flex-1 text-left font-medium">{cat.name}</span>
                <span className="text-xs text-gray-300">{count}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Most used */}
      <motion.div variants={staggerItem} className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-amber-500" />
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">Most Used</p>
        </div>
        <ol className="space-y-3">
          {mostUsed.map((tool, i) => (
            <li key={tool.id} className="flex items-center gap-3 group">
              <span className="text-2xl font-black text-gray-100 leading-none w-6 shrink-0 select-none">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <Link
                  href={tool.status !== "COMING_SOON" ? `/tools/${tool.slug}` : "#"}
                  className="text-sm font-medium text-gray-700 hover:text-gray-900 block truncate transition-colors"
                >
                  {tool.icon} {tool.name}
                </Link>
                <p className="text-xs text-gray-300 mt-0.5">{tool.usageCount.toLocaleString()} uses</p>
              </div>
            </li>
          ))}
        </ol>
      </motion.div>

      {/* Recently added */}
      {recentlyAdded.length > 0 && (
        <motion.div variants={staggerItem} className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-blue-500" />
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">Recently Added</p>
          </div>
          <div className="space-y-3">
            {recentlyAdded.map((tool) => (
              <Link key={tool.id} href={`/tools/${tool.slug}`} className="group flex items-center gap-3">
                <span className="text-xl">{tool.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{tool.name}</p>
                  <p className="text-xs text-gray-400 line-clamp-1">{tool.tagline}</p>
                </div>
                <span className="ml-auto text-[9px] font-black text-white bg-amber-500 px-1.5 py-0.5 rounded-xs shrink-0">NEW</span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Request a tool */}
      <motion.div
        variants={staggerItem}
        className="relative bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xs p-5 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/30 rounded-full blur-2xl" />
        <div className="relative z-10">
          <Sparkles className="w-5 h-5 text-amber-500 mb-3" />
          <p className="text-sm font-bold text-gray-900 mb-1.5">Need a different tool?</p>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            Tell me what tool would help you most. I build the ones people actually need.
          </p>
          <Link href="/contact" className="group inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors">
            <MessageSquare className="w-3.5 h-3.5" />
            Request a tool
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </motion.div>
    </motion.aside>
  );
};






// "use client";

// import React from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { TrendingUp, Clock, ArrowRight, MessageSquare, Sparkles } from "lucide-react";
// import { TOOLS, TOOL_CATEGORIES, type ToolCategory } from "@/lib/data/tools-data";
// import { staggerContainer, staggerItem } from "@/lib/animations";
// import { cn } from "@/lib/utils";

// interface ToolsSidebarProps {
//   activeCategory: ToolCategory | "All";
//   onCategory: (c: ToolCategory | "All") => void;
// }

// const mostUsed = [...TOOLS].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
// const recentlyAdded = [...TOOLS]
//   .filter((t) => t.isNew)
//   .slice(0, 3);

// export const ToolsSidebar = ({ activeCategory, onCategory }: ToolsSidebarProps) => (
//   <motion.aside
//     variants={staggerContainer}
//     initial="hidden"
//     animate="visible"
//     className="space-y-5"
//   >
//     {/* Browse by category */}
//     <motion.div
//       variants={staggerItem}
//       className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm"
//     >
//       <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
//         Browse by Category
//       </p>
//       <div className="space-y-1">
//         <button
//           onClick={() => onCategory("All")}
//           className={cn(
//             "w-full flex items-center justify-between px-3 py-2.5 rounded-xs text-sm transition-all duration-200",
//             activeCategory === "All"
//               ? "bg-gray-900 text-white"
//               : "text-gray-600 hover:bg-gray-50"
//           )}
//         >
//           <span className="font-medium">All Tools</span>
//           <span className={cn("text-xs px-2 py-0.5 rounded-xs", activeCategory === "All" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400")}>
//             {TOOLS.length}
//           </span>
//         </button>
//         {TOOL_CATEGORIES.map((cat) => {
//           const count = TOOLS.filter((t) => t.category === cat.name).length;
//           return (
//             <button
//               key={cat.name}
//               onClick={() => onCategory(cat.name)}
//               className={cn(
//                 "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all duration-200",
//                 activeCategory === cat.name
//                   ? "bg-amber-50 text-amber-700 border border-amber-200"
//                   : "text-gray-600 hover:bg-gray-50"
//               )}
//             >
//               <span>{cat.icon}</span>
//               <span className="flex-1 text-left font-medium">{cat.name}</span>
//               <span className="text-xs text-gray-300">{count}</span>
//             </button>
//           );
//         })}
//       </div>
//     </motion.div>

//     {/* Most used */}
//     <motion.div
//       variants={staggerItem}
//       className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm"
//     >
//       <div className="flex items-center gap-2 mb-4">
//         <TrendingUp className="w-4 h-4 text-amber-500" />
//         <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">Most Used</p>
//       </div>
//       <ol className="space-y-3">
//         {mostUsed.map((tool, i) => (
//           <li key={tool.id} className="flex items-center gap-3 group">
//             <span className="text-2xl font-black text-gray-100 leading-none w-6 shrink-0 select-none">
//               {i + 1}
//             </span>
//             <div className="flex-1 min-w-0">
//               <Link
//                 href={tool.status !== "COMING_SOON" ? `/tools/${tool.slug}` : "#"}
//                 className="text-sm font-medium text-gray-700 hover:text-gray-900 block truncate transition-colors"
//               >
//                 {tool.icon} {tool.name}
//               </Link>
//               <p className="text-xs text-gray-300 mt-0.5">
//                 {tool.usageCount.toLocaleString()} uses
//               </p>
//             </div>
//           </li>
//         ))}
//       </ol>
//     </motion.div>

//     {/* New tools */}
//     {recentlyAdded.length > 0 && (
//       <motion.div
//         variants={staggerItem}
//         className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm"
//       >
//         <div className="flex items-center gap-2 mb-4">
//           <Clock className="w-4 h-4 text-blue-500" />
//           <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
//             Recently Added
//           </p>
//         </div>
//         <div className="space-y-3">
//           {recentlyAdded.map((tool) => (
//             <Link
//               key={tool.id}
//               href={`/tools/${tool.slug}`}
//               className="group flex items-center gap-3"
//             >
//               <span className="text-xl">{tool.icon}</span>
//               <div>
//                 <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
//                   {tool.name}
//                 </p>
//                 <p className="text-xs text-gray-400 line-clamp-1">{tool.tagline}</p>
//               </div>
//               <span className="ml-auto text-[9px] font-black text-white bg-amber-500 px-1.5 py-0.5 rounded-xs shrink-0">NEW</span>
//             </Link>
//           ))}
//         </div>
//       </motion.div>
//     )}

//     {/* Request a tool */}
//     <motion.div
//       variants={staggerItem}
//       className="relative bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xs p-5 overflow-hidden"
//     >
//       <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/30 rounded-full blur-2xl" />
//       <div className="relative z-10">
//         <Sparkles className="w-5 h-5 text-amber-500 mb-3" />
//         <p className="text-sm font-bold text-gray-900 mb-1.5">
//           Need a different tool?
//         </p>
//         <p className="text-xs text-gray-500 leading-relaxed mb-4">
//           Tell me what tool would help you most. I build the ones people actually need.
//         </p>
//         <Link
//           href="/contact"
//           className="group inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
//         >
//           <MessageSquare className="w-3.5 h-3.5" />
//           Request a tool
//           <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
//         </Link>
//       </div>
//     </motion.div>
//   </motion.aside>
// );