"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Sparkles } from "lucide-react";
import { TOOLS } from "@/lib/data/tools-data";

const liveCount    = TOOLS.filter(t => t.status === "LIVE").length;
const betaCount    = TOOLS.filter(t => t.status === "BETA").length;
const totalUsage   = TOOLS.reduce((s, t) => s + t.usageCount, 0);
const categorySet  = new Set(TOOLS.map(t => t.category));

// Animated count-up
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const steps   = 50;
    const stepVal = to / steps;
    let   step    = 0;
    const t = setInterval(() => {
      step++;
      setVal(Math.min(Math.round(stepVal * step), to));
      if (step >= steps) clearInterval(t);
    }, 28);
    return () => clearInterval(t);
  }, [to]);
  return <>{val.toLocaleString()}{suffix}</>;
}

const TAGS = [
  { label: "Job seekers",    emoji: "💼" },
  { label: "Founders",       emoji: "🚀" },
  { label: "Students",       emoji: "🎓" },
  { label: "Writers",        emoji: "✍️" },
  { label: "Developers",     emoji: "⚡" },
  { label: "Parents",        emoji: "👨‍👩‍👧" },
];

export const ToolsHero = () => (
  <div
    className="relative overflow-hidden border-b border-stone-100"
    style={{ backgroundColor: "#fafafa", fontFamily: "Sora, sans-serif" }}
  >
    {/* Background grid */}
    {/* <div className="absolute inset-0 pointer-events-none opacity-[0.035]">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#000" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>
    </div> */}

    {/* Amber accent glow */}
    <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
      style={{ background: "radial-gradient(ellipse at 100% 0%, rgba(245,158,11,0.08) 0%, transparent 70%)" }} />

    <div className="relative max-w-6xl mx-auto px-4 pt-14 pb-12 ">

      {/* Label */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 mb-6 px-3.5 py-2 rounded-xs border border-amber-200 bg-amber-50"
      >
        <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">
          Tools Lab
        </span>
        <span className="w-px h-3 bg-amber-200" />
        <span className="text-[11px] font-semibold text-amber-500">
          {liveCount} live · {betaCount} in beta
        </span>
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-5 max-w-3xl"
      >
        <h1 className="text-4xl md:text-6xl font-black text-stone-900 leading-[1.05] tracking-tight">
          Sharp AI tools
          <br />
          <span style={{ color: "#f59e0b" }}>built to actually</span>
          <br />
          get things done.
        </h1>
      </motion.div>

      {/* Sub copy — honest and marketable */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-base md:text-lg text-stone-500 leading-relaxed max-w-xl mb-7"
      >
        {TOOLS.length}+ tools for the moments that matter — career pivots, money decisions,
        learning, writing, and life admin. Most are free to try. Premium tools use a small
        token balance so the AI stays fast and honest.
      </motion.p>

      {/* Audience tags */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-wrap gap-2 mb-10"
      >
        {TAGS.map(({ label, emoji }) => (
          <span key={label}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 bg-white border border-stone-200 px-3 py-1.5 rounded-xs">
            <span>{emoji}</span>{label}
          </span>
        ))}
      </motion.div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex flex-wrap items-center gap-6 pt-6 border-t border-stone-100"
      >
        {[
          { label: "Tools live",      value: liveCount,              suffix: "",  color: "#10b981" },
          { label: "Categories",      value: categorySet.size,       suffix: "",  color: "#6366f1" },
          { label: "Total uses",      value: Math.round(totalUsage / 1000), suffix: "k+", color: "#f59e0b" },
          { label: "Avg build time",  value: null, raw: "~6 seconds", color: "#0ea5e9" },
        ].map(({ label, value, suffix, raw, color }) => (
          <div key={label} className="flex items-baseline gap-2">
            <span className="text-2xl font-black tabular-nums" style={{ color }}>
              {raw ?? <CountUp to={value!} suffix={suffix} />}
            </span>
            <span className="text-xs text-stone-400 font-semibold">{label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  </div>
);


// "use client";

// import React from "react";
// import { motion } from "framer-motion";
// import { Wrench, Zap, Users, Star } from "lucide-react";
// import { staggerContainer, staggerItem } from "@/lib/animations";
// import { TOOLS } from "@/lib/data/tools-data";

// const totalUsage = TOOLS.reduce((s, t) => s + t.usageCount, 0);
// const liveTools = TOOLS.filter((t) => t.status === "LIVE").length;
// const avgRating =
//   TOOLS.filter((t) => t.ratingCount > 0).reduce((s, t) => s + t.ratingAvg, 0) /
//   TOOLS.filter((t) => t.ratingCount > 0).length;

// const STATS = [
//   { icon: Wrench, value: TOOLS.length.toString(), label: "Total Tools" },
//   { icon: Zap, value: liveTools.toString(), label: "Live Now" },
//   {
//     icon: Users,
//     value: `${(totalUsage / 1000).toFixed(0)}k+`,
//     label: "Times Used",
//   },
//   { icon: Star, value: avgRating.toFixed(1), label: "Avg Rating" },
// ];

// export const ToolsHero = () => (
//   <section className="relative pt-32 pb-16 px-4 overflow-hidden bg-white">
//     {/* Grid background */}
//     <div
//       className="absolute inset-0 opacity-[0.03]"
//       style={{
//         backgroundImage:
//           "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
//         backgroundSize: "48px 48px",
//       }}
//     />

//     {/* Amber blob */}
//     <div className="absolute top-20 right-1/3 w-[500px] h-[500px] bg-amber-400/8 rounded-full blur-3xl pointer-events-none" />

//     {/* Large ghost text */}
//     <div
//       className="absolute bottom-0 right-0 text-[16vw] font-black leading-none text-black/[0.025] pointer-events-none select-none"
//       aria-hidden
//     >
//       TOOLS
//     </div>

//     <div className="max-w-6xl mx-auto relative z-10">
//       <motion.div
//         variants={staggerContainer}
//         initial="hidden"
//         animate="visible"
//         className="max-w-3xl"
//       >
//         {/* Eyebrow */}
//         <motion.div variants={staggerItem} className="flex items-center gap-3 mb-6">
//           <div className="w-10 h-10 rounded-xs bg-amber-50 border border-amber-200 flex items-center justify-center">
//             <Wrench className="w-5 h-5 text-amber-600" />
//           </div>
//           <span className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-600">
//             Isaac&apos;s Tool Lab
//           </span>
//           <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-xs">
//             <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
//             {liveTools} live
//           </span>
//         </motion.div>

//         {/* Title */}
//         <motion.h1
//           variants={staggerItem}
//           className="text-5xl md:text-7xl font-black text-gray-900 leading-[0.95] tracking-tight mb-6"
//         >
//           Tools that
//           <br />
//           <span className="text-amber-500">actually work.</span>
//         </motion.h1>

//         {/* Description */}
//         <motion.p
//           variants={staggerItem}
//           className="text-lg text-gray-500 leading-relaxed max-w-xl mb-12"
//         >
//           Free, AI-powered tools built for job seekers, founders, students, and
//           writers. No accounts, no paywalls for the core experience — just sharp
//           tools that solve real problems in seconds.
//         </motion.p>

//         {/* Stats row */}
//         <motion.div
//           variants={staggerItem}
//           className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100 rounded-xs overflow-hidden border border-gray-100"
//         >
//           {STATS.map(({ icon: Icon, value, label }) => (
//             <div
//               key={label}
//               className="bg-white px-6 py-5 flex flex-col gap-1 hover:bg-amber-50/50 transition-colors duration-200"
//             >
//               <Icon className="w-4 h-4 text-amber-500 mb-1" />
//               <span className="text-2xl font-black text-gray-900">{value}</span>
//               <span className="text-xs text-gray-400 font-medium">{label}</span>
//             </div>
//           ))}
//         </motion.div>
//       </motion.div>
//     </div>
//   </section>
// );