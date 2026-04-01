"use client";

// =============================================================================
// isaacpaha.com — Featured Tool Card
// app/tools/_tools/featured-tools-card.tsx
// Now accepts NormalisedTool (from DB) instead of the old hardcoded Tool type.
// =============================================================================

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Users, Star, Clock, Sparkles, ExternalLink } from "lucide-react";
import type { NormalisedTool } from "./tools-lab-client";

const STATUS_CONFIG = {
  LIVE:        { label: "Live",        color: "text-green-400", bg: "bg-green-900/20", border: "border-green-700/40", dot: "bg-green-400" },
  BETA:        { label: "Beta",        color: "text-amber-400", bg: "bg-amber-900/20", border: "border-amber-700/40", dot: "bg-amber-400 animate-pulse" },
  COMING_SOON: { label: "Coming Soon", color: "text-gray-400",  bg: "bg-gray-800/50",  border: "border-gray-700",    dot: "bg-gray-500" },
} as const;

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

export const FeaturedToolCard = ({ tool }: { tool: NormalisedTool }) => {
  const status   = STATUS_CONFIG[tool.status];
  const catCfg   = CATEGORY_CFG[tool.category] ?? { icon: "🔧", color: "#6b7280" };

  return (
    <div className="max-w-6xl mx-auto px-4 mb-6" style={{ fontFamily: "Sora, sans-serif" }}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        className="flex items-center gap-2 mb-4"
      >
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600">Featured Tool</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", damping: 22, stiffness: 200 }}
        className="relative bg-white border border-stone-100 rounded-xs overflow-hidden shadow-sm"
        style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.04), 0 4px 32px rgba(0,0,0,0.05)" }}
      >
        {/* Top accent bar */}
        <div className="h-1" style={{ background: `linear-gradient(90deg, ${tool.accentColor}, ${tool.accentColor}40)` }} />

        <div className="p-7 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

            {/* LEFT — 3 cols */}
            <div className="lg:col-span-3">
              <div className="flex items-start gap-5 mb-6">
                <div
                  className="w-16 h-16 rounded-xs flex items-center justify-center text-4xl flex-shrink-0 border"
                  style={{ backgroundColor: `${tool.accentColor}10`, borderColor: `${tool.accentColor}20` }}
                >
                  {tool.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: catCfg.color }}>
                      {catCfg.icon} {tool.category}
                    </span>
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

              <p className="text-base font-semibold text-stone-700 mb-3 leading-snug">{tool.tagline}</p>
              <p className="text-sm text-stone-500 leading-relaxed mb-6">{tool.description}</p>

              {tool.features.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-7">
                  {tool.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm text-stone-700">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tool.accentColor }} />
                      {f}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-5 pt-5 border-t border-stone-50">
                {tool.ratingAvg > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold text-stone-800">{tool.ratingAvg.toFixed(1)}</span>
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
                    <Clock className="w-4 h-4" />{tool.buildTime}
                  </div>
                )}
                {tool.tokenCost != null && tool.tokenCost > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-xs ml-auto">
                    🪙 {tool.tokenCost} tokens
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT — 2 cols: CTA panel */}
            <div className="lg:col-span-2">
              <div
                className="rounded-xs overflow-hidden border"
                style={{ borderColor: `${tool.accentColor}20`, backgroundColor: `${tool.accentColor}05` }}
              >
                <div className="px-6 py-8 text-center border-b" style={{ borderColor: `${tool.accentColor}15` }}>
                  <div
                    className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-5xl mb-4 border-2"
                    style={{ backgroundColor: `${tool.accentColor}12`, borderColor: `${tool.accentColor}25` }}
                  >
                    {tool.icon}
                  </div>
                  <p className="text-xs font-black uppercase tracking-wider text-stone-400 mb-2">Ready to use</p>
                  <p className="text-sm text-stone-600 leading-relaxed">Full tool — every feature, no stripped-down preview.</p>
                </div>

                <div className="px-5 py-4 space-y-2.5 border-b" style={{ borderColor: `${tool.accentColor}12` }}>
                  {[
                    { icon: "⚡", text: tool.buildTime ? `Builds in ${tool.buildTime}` : "Fast results" },
                    { icon: "🔒", text: "Sign in to save your results" },
                    { icon: tool.tokenCost && tool.tokenCost > 0 ? "🪙" : "✅",
                      text: tool.tokenCost && tool.tokenCost > 0 ? `Uses ${tool.tokenCost} tokens per run` : "Free to use" },
                  ].map(({ icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5 text-sm text-stone-600">
                      <span className="text-base">{icon}</span>{text}
                    </div>
                  ))}
                </div>

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
                    <ExternalLink className="w-3.5 h-3.5" />Browse all tools
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

// // =============================================================================
// // Featured Tool Card — redesigned
// // Replaces the broken "try it now" inline widget with a compelling
// // visual showcase + direct link to the full tool page.
// // =============================================================================

// import React from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import {
//   ArrowRight, Zap, Users, Star, Clock, Sparkles, ExternalLink,
// } from "lucide-react";
// import { type Tool, STATUS_CONFIG, TOOL_CATEGORIES } from "@/lib/data/tools-data";

// export const FeaturedToolCard = ({ tool }: { tool: Tool }) => {
//   const status   = STATUS_CONFIG[tool.status];
//   const category = TOOL_CATEGORIES.find(c => c.name === tool.category);

//   return (
//     <div className="max-w-6xl mx-auto px-4 mb-6" style={{ fontFamily: "Sora, sans-serif" }}>

//       {/* Label */}
//       <motion.div
//         initial={{ opacity: 0, x: -10 }}
//         whileInView={{ opacity: 1, x: 0 }}
//         viewport={{ once: true }}
//         className="flex items-center gap-2 mb-4"
//       >
//         <Sparkles className="w-4 h-4 text-amber-500" />
//         <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-600">
//           Featured Tool
//         </span>
//       </motion.div>

//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         whileInView={{ opacity: 1, y: 0 }}
//         viewport={{ once: true }}
//         transition={{ type: "spring", damping: 22, stiffness: 200 }}
//         className="relative bg-white border border-stone-100 rounded-xs overflow-hidden shadow-sm"
//         style={{ boxShadow: `0 0 0 1px rgba(0,0,0,0.04), 0 4px 32px rgba(0,0,0,0.05)` }}
//       >
//         {/* Top accent bar */}
//         <div className="h-1" style={{ background: `linear-gradient(90deg, ${tool.accentColor}, ${tool.accentColor}40)` }} />

//         <div className="p-7 md:p-10">
//           <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

//             {/* LEFT — 3 cols */}
//             <div className="lg:col-span-3">

//               {/* Icon + meta */}
//               <div className="flex items-start gap-5 mb-6">
//                 <div
//                   className="w-16 h-16 rounded-xs flex items-center justify-center text-4xl flex-shrink-0 border"
//                   style={{ backgroundColor: `${tool.accentColor}10`, borderColor: `${tool.accentColor}20` }}
//                 >
//                   {tool.icon}
//                 </div>
//                 <div>
//                   <div className="flex items-center gap-2 flex-wrap mb-1.5">
//                     {category && (
//                       <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: category.color }}>
//                         {category.icon} {category.name}
//                       </span>
//                     )}
//                     <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-xs border ${status.bg} ${status.border} ${status.color}`}>
//                       <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
//                       {status.label}
//                     </span>
//                     {tool.isNew && (
//                       <span className="text-[10px] font-black text-white bg-amber-500 px-1.5 py-0.5 rounded-xs">NEW</span>
//                     )}
//                   </div>
//                   <h2 className="text-2xl font-black text-stone-900 leading-tight">{tool.name}</h2>
//                 </div>
//               </div>

//               {/* Tagline */}
//               <p className="text-base font-semibold text-stone-700 mb-3 leading-snug">{tool.tagline}</p>
//               <p className="text-sm text-stone-500 leading-relaxed mb-6">{tool.description}</p>

//               {/* Feature list */}
//               <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 mb-7">
//                 {tool.features.map(f => (
//                   <div key={f} className="flex items-center gap-2.5 text-sm text-stone-700">
//                     <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: tool.accentColor }} />
//                     {f}
//                   </div>
//                 ))}
//               </div>

//               {/* Stats row */}
//               <div className="flex flex-wrap items-center gap-5 pt-5 border-t border-stone-50">
//                 {tool.ratingAvg > 0 && (
//                   <div className="flex items-center gap-1.5">
//                     <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
//                     <span className="text-sm font-bold text-stone-800">{tool.ratingAvg}</span>
//                     <span className="text-xs text-stone-400">({tool.ratingCount.toLocaleString()})</span>
//                   </div>
//                 )}
//                 {tool.usageCount > 0 && (
//                   <div className="flex items-center gap-1.5 text-sm text-stone-400">
//                     <Users className="w-4 h-4" />
//                     {tool.usageCount.toLocaleString()} uses
//                   </div>
//                 )}
//                 {tool.buildTime && (
//                   <div className="flex items-center gap-1.5 text-sm text-stone-400">
//                     <Clock className="w-4 h-4" />
//                     {tool.buildTime}
//                   </div>
//                 )}
//                 {tool.tokenCost && tool.tokenCost > 0 && (
//                   <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-xs ml-auto">
//                     🪙 {tool.tokenCost} tokens
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* RIGHT — 2 cols: visual CTA panel */}
//             <div className="lg:col-span-2">
//               <div
//                 className="rounded-xs overflow-hidden border"
//                 style={{ borderColor: `${tool.accentColor}20`, backgroundColor: `${tool.accentColor}05` }}
//               >
//                 {/* Visual header */}
//                 <div className="px-6 py-8 text-center border-b" style={{ borderColor: `${tool.accentColor}15` }}>
//                   <div
//                     className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-5xl mb-4 border-2"
//                     style={{ backgroundColor: `${tool.accentColor}12`, borderColor: `${tool.accentColor}25` }}
//                   >
//                     {tool.icon}
//                   </div>
//                   <p className="text-xs font-black uppercase tracking-wider text-stone-400 mb-2">
//                     Ready to use
//                   </p>
//                   <p className="text-sm text-stone-600 leading-relaxed">
//                     Full tool — every feature, no stripped-down preview.
//                   </p>
//                 </div>

//                 {/* What you get */}
//                 <div className="px-5 py-4 space-y-2.5 border-b" style={{ borderColor: `${tool.accentColor}12` }}>
//                   {[
//                     { icon: "⚡", text: `Builds in ${tool.buildTime ?? "seconds"}` },
//                     { icon: "🔒", text: "Sign in to save your results" },
//                     { icon: tool.tokenCost && tool.tokenCost > 0 ? "🪙" : "✅",
//                       text: tool.tokenCost && tool.tokenCost > 0
//                         ? `Uses ${tool.tokenCost} tokens per run`
//                         : "Free to use" },
//                   ].map(({ icon, text }) => (
//                     <div key={text} className="flex items-center gap-2.5 text-sm text-stone-600">
//                       <span className="text-base">{icon}</span>
//                       {text}
//                     </div>
//                   ))}
//                 </div>

//                 {/* CTAs */}
//                 <div className="px-5 py-5 space-y-3">
//                   <Link
//                     href={`/tools/${tool.slug}`}
//                     className="group w-full flex items-center justify-center gap-2 text-sm font-black text-stone-900 py-3.5 rounded-xs transition-all hover:opacity-90"
//                     style={{ backgroundColor: tool.accentColor }}
//                   >
//                     <Zap className="w-4 h-4" />
//                     Open {tool.name}
//                     <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
//                   </Link>
//                   <Link
//                     href="/tools"
//                     className="group w-full flex items-center justify-center gap-2 text-xs font-semibold text-stone-500 py-2.5 rounded-xs border border-stone-200 hover:border-stone-400 hover:text-stone-700 transition-all"
//                   >
//                     <ExternalLink className="w-3.5 h-3.5" />
//                     Browse all tools
//                   </Link>
//                 </div>
//               </div>
//             </div>

//           </div>
//         </div>
//       </motion.div>
//     </div>
//   );
// };

