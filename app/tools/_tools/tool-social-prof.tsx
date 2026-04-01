"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Star, TrendingUp, MessageSquare } from "lucide-react";
import type { NormalisedTool } from "./tools-lab-client";

interface Category {
  name:        string;
  icon:        string;
  color:       string;
  description: string;
}

interface Props {
  tools:      NormalisedTool[];
  categories: Category[];
}

export const ToolsSocialProof = ({ tools, categories }: Props) => {
  const totalUsage = tools.reduce((s, t) => s + t.usageCount, 0);
  const topTools   = [...tools].sort((a, b) => b.usageCount - a.usageCount).slice(0, 6);
  const liveCount  = tools.filter((t) => t.status === "LIVE").length;
  const ratedTools = tools.filter((t) => t.ratingCount > 0);
  const avgRating  = ratedTools.length > 0
    ? (ratedTools.reduce((s, t) => s + t.ratingAvg, 0) / ratedTools.length).toFixed(1)
    : "—";

  return (
    <section className="border-t border-stone-100 bg-stone-50" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* Big numbers strip */}
      <div className="bg-stone-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: `${liveCount}+`,                           label: "Tools live",  color: "#f59e0b" },
              { value: `${Math.round(totalUsage / 1000)}k+`,      label: "Total runs",  color: "#10b981" },
              { value: avgRating,                                  label: "Avg rating",  color: "#6366f1" },
              { value: `${categories.length}`,                    label: "Categories",  color: "#0ea5e9" },
            ].map(({ value, label, color }) => (
              <div key={label} className="text-center">
                <p className="text-4xl md:text-5xl font-black tabular-nums" style={{ color }}>{value}</p>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-14 space-y-14">

        {/* Most used tools */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <h2 className="text-lg font-black text-stone-900">Most used tools</h2>
            </div>
            <Link href="#tools-grid"
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors">
              See all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {topTools.map((tool, i) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  href={`/tools/${tool.slug}`}
                  className="group flex items-start gap-4 bg-white border border-stone-100 rounded-xs p-4 hover:border-stone-300 hover:shadow-sm transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-xs flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: `${tool.accentColor}12` }}
                  >
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-800 group-hover:text-stone-900 truncate">{tool.name}</p>
                    <p className="text-[11px] text-stone-400 truncate mt-0.5">{tool.tagline}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {tool.ratingAvg > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-[10px] font-bold text-stone-500">{tool.ratingAvg.toFixed(1)}</span>
                        </div>
                      )}
                      {tool.usageCount > 0 && (
                        <span className="text-[10px] text-stone-400">{tool.usageCount.toLocaleString()} uses</span>
                      )}
                      <span className="ml-auto text-[10px] font-bold text-stone-300 group-hover:text-amber-500 transition-colors">
                        Open →
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Category strips */}
        <div>
          <h2 className="text-lg font-black text-stone-900 mb-5">Browse by what you need</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {categories.map((cat, i) => {
              const count = tools.filter((t) => t.category === cat.name && t.status === "LIVE").length;
              return (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={`/tools?category=${cat.name}`}
                    className="group flex flex-col items-start gap-2 bg-white border border-stone-100 rounded-xs p-4 hover:border-stone-300 hover:shadow-sm transition-all h-full"
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-stone-800 group-hover:text-stone-900">{cat.name}</p>
                      <p className="text-[11px] text-stone-400 mt-0.5">{cat.description}</p>
                    </div>
                    <div className="mt-auto pt-2 flex items-center justify-between w-full border-t border-stone-50">
                      <span className="text-[10px] font-bold text-stone-400">{count} live tool{count !== 1 ? "s" : ""}</span>
                      <ArrowRight className="w-3 h-3 text-stone-300 group-hover:text-stone-600 transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Token explainer + built for */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xs p-6 border" style={{ backgroundColor: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.2)" }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">🪙</span>
              <div>
                <p className="text-sm font-black text-stone-900">How tokens work</p>
                <p className="text-[11px] text-stone-400 mt-0.5">Simple, transparent, fair</p>
              </div>
            </div>
            <div className="space-y-3 mb-5">
              {[
                { step: "1", text: "You get 10 free tokens when you sign up" },
                { step: "2", text: "AI-powered tools cost 10–500 tokens per run" },
                { step: "3", text: "Earn more by playing games — free, every day" },
                { step: "4", text: "Or buy a top-up pack from $5 for 5,000 tokens" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-900 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step}
                  </span>
                  <p className="text-sm text-stone-600 leading-snug">{text}</p>
                </div>
              ))}
            </div>
            <Link href="/game"
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-4 py-2.5 rounded-xs hover:bg-amber-200 transition-colors">
              🎮 Earn free tokens <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="rounded-xs p-6 bg-stone-900 border border-stone-800">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-4 h-4 text-amber-400" />
              <p className="text-sm font-black text-white">Built for real problems</p>
            </div>
            <div className="space-y-3 mb-5">
              {[
                { emoji: "💼", text: "Applying for jobs? The CV Analyser + Interview Prep will get you more callbacks." },
                { emoji: "🚀", text: "Starting something? Startup Idea Generator stress-tests your concept." },
                { emoji: "🎓", text: "Studying? Math, Physics, Chemistry engines explain concepts at your exact level." },
                { emoji: "💸", text: "Tight on money? Debt Planner + Budget Survival Planner create a real path forward." },
              ].map(({ emoji, text }) => (
                <div key={emoji} className="flex items-start gap-2.5">
                  <span className="text-base flex-shrink-0 mt-0.5">{emoji}</span>
                  <p className="text-xs text-white/60 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
            <Link href="/contact"
              className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white border border-white/10 hover:border-white/30 px-4 py-2.5 rounded-xs transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />Request a tool
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};





// "use client";

// // =============================================================================
// // Tools Social Proof Section
// // Replaces the broken InteractiveToolsShowcase.
// // Shows: category breakdown, top tools by usage, token system explainer,
// // and a "what gets built here" statement.
// // =============================================================================

// import React from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { ArrowRight, Zap, Star, TrendingUp, MessageSquare } from "lucide-react";
// import { TOOLS, TOOL_CATEGORIES } from "@/lib/data/tools-data";

// const totalUsage = TOOLS.reduce((s, t) => s + t.usageCount, 0);
// const topTools   = [...TOOLS].sort((a, b) => b.usageCount - a.usageCount).slice(0, 6);
// const liveCount  = TOOLS.filter(t => t.status === "LIVE").length;
// const avgRating  = (
//   TOOLS.filter(t => t.ratingCount > 0)
//     .reduce((s, t) => s + t.ratingAvg, 0) /
//   TOOLS.filter(t => t.ratingCount > 0).length
// ).toFixed(1);

// export const ToolsSocialProof = () => (
//   <section
//     className="border-t border-stone-100 bg-stone-50"
//     style={{ fontFamily: "Sora, sans-serif" }}
//   >

//     {/* ── Top strip — big numbers ── */}
//     <div className="bg-stone-900 text-white">
//       <div className="max-w-6xl mx-auto px-4 py-10">
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
//           {[
//             { value: `${liveCount}+`,                           label: "Tools live",         color: "#f59e0b" },
//             { value: `${Math.round(totalUsage / 1000)}k+`,      label: "Total runs",          color: "#10b981" },
//             { value: avgRating,                                  label: "Avg rating",          color: "#6366f1" },
//             { value: `${TOOL_CATEGORIES.length}`,               label: "Categories",          color: "#0ea5e9" },
//           ].map(({ value, label, color }) => (
//             <div key={label} className="text-center">
//               <p className="text-4xl md:text-5xl font-black tabular-nums" style={{ color }}>{value}</p>
//               <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">{label}</p>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>

//     <div className="max-w-6xl mx-auto px-4 py-14 space-y-14">

//       {/* ── Most used tools ── */}
//       <div>
//         <div className="flex items-center justify-between mb-6">
//           <div className="flex items-center gap-2">
//             <TrendingUp className="w-4 h-4 text-amber-500" />
//             <h2 className="text-lg font-black text-stone-900">Most used tools</h2>
//           </div>
//           <Link href="#tools-grid"
//             className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors">
//             See all <ArrowRight className="w-3 h-3" />
//           </Link>
//         </div>

//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//           {topTools.map((tool, i) => (
//             <motion.div
//               key={tool.id}
//               initial={{ opacity: 0, y: 12 }}
//               whileInView={{ opacity: 1, y: 0 }}
//               viewport={{ once: true }}
//               transition={{ delay: i * 0.06 }}
//             >
//               <Link href={`/tools/${tool.slug}`}
//                 className="group flex items-start gap-4 bg-white border border-stone-100 rounded-xs p-4 hover:border-stone-300 hover:shadow-sm transition-all">
//                 <div className="w-10 h-10 rounded-xs flex items-center justify-center text-xl flex-shrink-0"
//                   style={{ backgroundColor: `${tool.accentColor}12` }}>
//                   {tool.icon}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-bold text-stone-800 group-hover:text-stone-900 truncate">{tool.name}</p>
//                   <p className="text-[11px] text-stone-400 truncate mt-0.5">{tool.tagline}</p>
//                   <div className="flex items-center gap-3 mt-2">
//                     {tool.ratingAvg > 0 && (
//                       <div className="flex items-center gap-1">
//                         <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
//                         <span className="text-[10px] font-bold text-stone-500">{tool.ratingAvg}</span>
//                       </div>
//                     )}
//                     {tool.usageCount > 0 && (
//                       <span className="text-[10px] text-stone-400">
//                         {tool.usageCount.toLocaleString()} uses
//                       </span>
//                     )}
//                     <span className="ml-auto text-[10px] font-bold text-stone-300 group-hover:text-amber-500 transition-colors">
//                       Open →
//                     </span>
//                   </div>
//                 </div>
//               </Link>
//             </motion.div>
//           ))}
//         </div>
//       </div>

//       {/* ── Category strips ── */}
//       <div>
//         <h2 className="text-lg font-black text-stone-900 mb-5">Browse by what you need</h2>
//         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//           {TOOL_CATEGORIES.map((cat, i) => {
//             const count = TOOLS.filter(t => t.category === cat.name && t.status === "LIVE").length;
//             return (
//               <motion.div
//                 key={cat.name}
//                 initial={{ opacity: 0, scale: 0.96 }}
//                 whileInView={{ opacity: 1, scale: 1 }}
//                 viewport={{ once: true }}
//                 transition={{ delay: i * 0.05 }}
//               >
//                 <Link
//                   href={`/tools?category=${cat.name}`}
//                   className="group flex flex-col items-start gap-2 bg-white border border-stone-100 rounded-xs p-4 hover:border-stone-300 hover:shadow-sm transition-all h-full"
//                 >
//                   <span className="text-2xl">{cat.icon}</span>
//                   <div>
//                     <p className="text-sm font-bold text-stone-800 group-hover:text-stone-900">{cat.name}</p>
//                     <p className="text-[11px] text-stone-400 mt-0.5">{cat.description}</p>
//                   </div>
//                   <div className="mt-auto pt-2 flex items-center justify-between w-full border-t border-stone-50">
//                     <span className="text-[10px] font-bold text-stone-400">{count} live tool{count !== 1 ? "s" : ""}</span>
//                     <ArrowRight className="w-3 h-3 text-stone-300 group-hover:text-stone-600 transition-colors" />
//                   </div>
//                 </Link>
//               </motion.div>
//             );
//           })}
//         </div>
//       </div>

//       {/* ── Token explainer ── */}
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {/* How tokens work */}
//         <div
//           className="rounded-xs p-6 border"
//           style={{ backgroundColor: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.2)" }}
//         >
//           <div className="flex items-center gap-3 mb-4">
//             <span className="text-3xl">🪙</span>
//             <div>
//               <p className="text-sm font-black text-stone-900">How tokens work</p>
//               <p className="text-[11px] text-stone-400 mt-0.5">Simple, transparent, fair</p>
//             </div>
//           </div>
//           <div className="space-y-3 mb-5">
//             {[
//               { step: "1", text: "You get 100 free tokens when you sign up" },
//               { step: "2", text: "AI-powered tools cost 10–500 tokens per run" },
//               { step: "3", text: "Earn more by playing games — free, every day" },
//               { step: "4", text: "Or buy a top-up pack from $5 for 5,000 tokens" },
//             ].map(({ step, text }) => (
//               <div key={step} className="flex items-start gap-3">
//                 <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-900 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
//                   {step}
//                 </span>
//                 <p className="text-sm text-stone-600 leading-snug">{text}</p>
//               </div>
//             ))}
//           </div>
//           <Link href="/game"
//             className="inline-flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-100 border border-amber-200 px-4 py-2.5 rounded-xs hover:bg-amber-200 transition-colors">
//             🎮 Earn free tokens
//             <ArrowRight className="w-3.5 h-3.5" />
//           </Link>
//         </div>

//         {/* Who it's built for */}
//         <div className="rounded-xs p-6 bg-stone-900 border border-stone-800">
//           <div className="flex items-center gap-2 mb-4">
//             <Zap className="w-4 h-4 text-amber-400" />
//             <p className="text-sm font-black text-white">Built for real problems</p>
//           </div>
//           <div className="space-y-3 mb-5">
//             {[
//               { emoji: "💼", text: "Applying for jobs? The CV Analyser + Interview Prep will get you more callbacks." },
//               { emoji: "🚀", text: "Starting something? Startup Idea Generator + Africa Market Explorer stress-tests your concept." },
//               { emoji: "🎓", text: "Studying? Math, Physics, Chemistry engines explain concepts at your exact level." },
//               { emoji: "💸", text: "Tight on money? Debt Planner + Budget Survival Planner create a real path forward." },
//             ].map(({ emoji, text }) => (
//               <div key={emoji} className="flex items-start gap-2.5">
//                 <span className="text-base flex-shrink-0 mt-0.5">{emoji}</span>
//                 <p className="text-xs text-white/60 leading-relaxed">{text}</p>
//               </div>
//             ))}
//           </div>
//           <Link href="/contact"
//             className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white border border-white/10 hover:border-white/30 px-4 py-2.5 rounded-xs transition-colors">
//             <MessageSquare className="w-3.5 h-3.5" />
//             Request a tool
//           </Link>
//         </div>
//       </div>

//     </div>
//   </section>
// );