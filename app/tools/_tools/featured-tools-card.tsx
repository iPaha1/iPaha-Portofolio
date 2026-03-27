"use client";

// =============================================================================
// Featured Tool Card — redesigned
// Replaces the broken "try it now" inline widget with a compelling
// visual showcase + direct link to the full tool page.
// =============================================================================

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, Zap, Users, Star, Clock, Sparkles, ExternalLink,
} from "lucide-react";
import { type Tool, STATUS_CONFIG, TOOL_CATEGORIES } from "@/lib/data/tools-data";

export const FeaturedToolCard = ({ tool }: { tool: Tool }) => {
  const status   = STATUS_CONFIG[tool.status];
  const category = TOOL_CATEGORIES.find(c => c.name === tool.category);

  return (
    <div className="max-w-6xl mx-auto px-4 mb-6" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* Label */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="flex items-center gap-2 mb-4"
      >
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600">
          Featured Tool
        </span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", damping: 22, stiffness: 200 }}
        className="relative bg-white border border-stone-100 rounded-xs overflow-hidden shadow-sm"
        style={{ boxShadow: `0 0 0 1px rgba(0,0,0,0.04), 0 4px 32px rgba(0,0,0,0.05)` }}
      >
        {/* Top accent bar */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${tool.accentColor}, ${tool.accentColor}40)` }} />

        <div className="p-7 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

            {/* LEFT — 3 cols */}
            <div className="lg:col-span-3">

              {/* Icon + meta */}
              <div className="flex items-start gap-5 mb-6">
                <div
                  className="w-16 h-16 rounded-xs flex items-center justify-center text-4xl flex-shrink-0 border"
                  style={{ backgroundColor: `${tool.accentColor}10`, borderColor: `${tool.accentColor}20` }}
                >
                  {tool.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {category && (
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: category.color }}>
                        {category.icon} {category.name}
                      </span>
                    )}
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-xs border ${status.bg} ${status.border} ${status.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                    {tool.isNew && (
                      <span className="text-[10px] font-black text-white bg-amber-500 px-1.5 py-0.5 rounded-xs">NEW</span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-stone-900 leading-tight">{tool.name}</h2>
                </div>
              </div>

              {/* Tagline */}
              <p className="text-base font-semibold text-stone-700 mb-3 leading-snug">{tool.tagline}</p>
              <p className="text-sm text-stone-500 leading-relaxed mb-6">{tool.description}</p>

              {/* Feature list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-7">
                {tool.features.map(f => (
                  <div key={f} className="flex items-center gap-2.5 text-sm text-stone-700">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tool.accentColor }} />
                    {f}
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-5 pt-5 border-t border-stone-50">
                {tool.ratingAvg > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-stone-800">{tool.ratingAvg}</span>
                    <span className="text-xs text-stone-400">({tool.ratingCount.toLocaleString()})</span>
                  </div>
                )}
                {tool.usageCount > 0 && (
                  <div className="flex items-center gap-1.5 text-sm text-stone-400">
                    <Users className="w-4 h-4" />
                    {tool.usageCount.toLocaleString()} uses
                  </div>
                )}
                {tool.buildTime && (
                  <div className="flex items-center gap-1.5 text-sm text-stone-400">
                    <Clock className="w-4 h-4" />
                    {tool.buildTime}
                  </div>
                )}
                {tool.tokenCost && tool.tokenCost > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-xs ml-auto">
                    🪙 {tool.tokenCost} tokens
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — 2 cols: visual CTA panel */}
            <div className="lg:col-span-2">
              <div
                className="rounded-xs overflow-hidden border"
                style={{ borderColor: `${tool.accentColor}20`, backgroundColor: `${tool.accentColor}05` }}
              >
                {/* Visual header */}
                <div className="px-6 py-8 text-center border-b" style={{ borderColor: `${tool.accentColor}15` }}>
                  <div
                    className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-5xl mb-4 border-2"
                    style={{ backgroundColor: `${tool.accentColor}12`, borderColor: `${tool.accentColor}25` }}
                  >
                    {tool.icon}
                  </div>
                  <p className="text-xs font-black uppercase tracking-wider text-stone-400 mb-2">
                    Ready to use
                  </p>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    Full tool — every feature, no stripped-down preview.
                  </p>
                </div>

                {/* What you get */}
                <div className="px-5 py-4 space-y-2.5 border-b" style={{ borderColor: `${tool.accentColor}12` }}>
                  {[
                    { icon: "⚡", text: `Builds in ${tool.buildTime ?? "seconds"}` },
                    { icon: "🔒", text: "Sign in to save your results" },
                    { icon: tool.tokenCost && tool.tokenCost > 0 ? "🪙" : "✅",
                      text: tool.tokenCost && tool.tokenCost > 0
                        ? `Uses ${tool.tokenCost} tokens per run`
                        : "Free to use" },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5 text-sm text-stone-600">
                      <span className="text-base">{icon}</span>
                      {text}
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="px-5 py-5 space-y-3">
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="group w-full flex items-center justify-center gap-2 text-sm font-black text-stone-900 py-3.5 rounded-xs transition-all hover:opacity-90"
                    style={{ backgroundColor: tool.accentColor }}
                  >
                    <Zap className="w-4 h-4" />
                    Open {tool.name}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/tools"
                    className="group w-full flex items-center justify-center gap-2 text-xs font-semibold text-stone-500 py-2.5 rounded-xs border border-stone-200 hover:border-stone-400 hover:text-stone-700 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Browse all tools
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
};


// "use client";

// import React, { useState } from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { Users, ArrowRight, Zap, Play, X } from "lucide-react";
// import { type Tool, STATUS_CONFIG, TOOL_CATEGORIES } from "@/lib/data/tools-data";
// import { staggerContainer, staggerItem } from "@/lib/animations";
// import { StarRating } from "./star-rating";
// import { CVAnalyzerTool } from "./cv-analyzer";

// export const FeaturedToolCard = ({ tool }: { tool: Tool }) => {
//   const [tryItOpen, setTryItOpen] = useState(false);
//   const status = STATUS_CONFIG[tool.status];
//   const category = TOOL_CATEGORIES.find((c) => c.name === tool.category);

//   return (
//     <motion.div
//       variants={staggerContainer}
//       initial="hidden"
//       whileInView="visible"
//       viewport={{ once: true }}
//       className="max-w-6xl mx-auto px-4 mb-6"
//     >
//       <motion.div variants={staggerItem} className="mb-4 flex items-center gap-2">
//         <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
//         <span className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-600">
//           Featured Tool
//         </span>
//       </motion.div>

//       <motion.div
//         variants={staggerItem}
//         className="relative bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
//       >
//         {/* Top accent */}
//         <div
//           className="absolute top-0 left-0 right-0 h-1"
//           style={{ background: `linear-gradient(to right, ${tool.accentColor}, ${tool.accentColor}50)` }}
//         />

//         <div className="p-8 md:p-10">
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
//             {/* Left */}
//             <div>
//               {/* Icon + badges */}
//               <div className="flex items-center gap-4 mb-6">
//                 <div
//                   className="w-16 h-16 rounded-xs flex items-center justify-center text-4xl border"
//                   style={{
//                     backgroundColor: `${tool.accentColor}10`,
//                     borderColor: `${tool.accentColor}20`,
//                   }}
//                 >
//                   {tool.icon}
//                 </div>
//                 <div>
//                   <div className="flex items-center gap-2 mb-1">
//                     <span
//                       className="text-[10px] font-semibold"
//                       style={{ color: category?.color }}
//                     >
//                       {category?.icon} {tool.category}
//                     </span>
//                     <span
//                       className={`flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-xs border ${status.bg} ${status.border} ${status.color}`}
//                     >
//                       <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
//                       {status.label}
//                     </span>
//                   </div>
//                   <h2 className="text-2xl font-black text-gray-900">{tool.name}</h2>
//                 </div>
//               </div>

//               <p className="text-lg font-medium text-gray-700 mb-3">{tool.tagline}</p>
//               <p className="text-sm text-gray-500 leading-relaxed mb-6">{tool.description}</p>

//               {/* Features */}
//               <ul className="space-y-2 mb-6">
//                 {tool.features.map((f) => (
//                   <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
//                     <span
//                       className="w-2 h-2 rounded-full shrink-0"
//                       style={{ backgroundColor: tool.accentColor }}
//                     />
//                     {f}
//                   </li>
//                 ))}
//               </ul>

//               {/* Stats + CTA */}
//               <div className="flex flex-wrap items-center gap-5 pt-5 border-t border-gray-50">
//                 <StarRating rating={tool.ratingAvg} count={tool.ratingCount} size="md" />
//                 <span className="flex items-center gap-1.5 text-sm text-gray-400">
//                   <Users className="w-4 h-4" />
//                   {tool.usageCount.toLocaleString()} uses
//                 </span>
//                 <span className="text-xs text-gray-400 ml-auto">
//                   ⚡ Builds in {tool.buildTime}
//                 </span>
//               </div>
//             </div>

//             {/* Right: try it or link */}
//             <div className="flex flex-col gap-4">
//               {!tryItOpen ? (
//                 <div className="border-2 border-dashed border-gray-100 rounded-xs p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
//                   <div
//                     className="w-20 h-20 rounded-full flex items-center justify-center text-5xl mb-6"
//                     style={{ backgroundColor: `${tool.accentColor}10` }}
//                   >
//                     {tool.icon}
//                   </div>
//                   <p className="text-gray-500 text-sm mb-6 max-w-xs">
//                     Try the {tool.name} right here — no sign up needed.
//                   </p>
//                   <button
//                     onClick={() => setTryItOpen(true)}
//                     className="group flex items-center gap-2 font-semibold text-white px-6 py-3 rounded-xs transition-all duration-200 hover:opacity-90"
//                     style={{ backgroundColor: tool.accentColor }}
//                   >
//                     <Play className="w-4 h-4" />
//                     Try it now — it&apos;s free
//                     <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
//                   </button>
//                 </div>
//               ) : (
//                 <div className="border border-gray-100 rounded-xs overflow-hidden">
//                   <div
//                     className="flex items-center justify-between px-4 py-3 border-b border-gray-100"
//                     style={{ backgroundColor: `${tool.accentColor}08` }}
//                   >
//                     <span className="text-sm font-semibold text-gray-700">
//                       {tool.icon} {tool.name}
//                     </span>
//                     <button
//                       onClick={() => setTryItOpen(false)}
//                       className="w-7 h-7 rounded-xs bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
//                     >
//                       <X className="w-3.5 h-3.5" />
//                     </button>
//                   </div>
//                   <div className="p-5 max-h-[500px] overflow-y-auto">
//                     <CVAnalyzerTool />
//                   </div>
//                 </div>
//               )}

//               <Link
//                 href={`/tools/${tool.slug}`}
//                 className="group flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-400 py-3 rounded-xs transition-all duration-200"
//               >
//                 Open full tool page
//                 <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
//               </Link>
//             </div>
//           </div>
//         </div>
//       </motion.div>
//     </motion.div>
//   );
// };