"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import type { NormalisedTool } from "./tools-lab-client";

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
  { label: "Job seekers", emoji: "💼" },
  { label: "Founders",    emoji: "🚀" },
  { label: "Students",    emoji: "🎓" },
  { label: "Writers",     emoji: "✍️" },
  { label: "Developers",  emoji: "⚡" },
  { label: "Parents",     emoji: "👨‍👩‍👧" },
];

interface Props {
  tools?: NormalisedTool[];
}

// Default to [] so filter/reduce never run on undefined
export const ToolsHero = ({ tools = [] }: Props) => {
  const liveCount   = tools.filter((t) => t.status === "LIVE").length;
  const betaCount   = tools.filter((t) => t.status === "BETA").length;
  const totalUsage  = tools.reduce((s, t) => s + (t.usageCount ?? 0), 0);
  const categorySet = new Set(tools.map((t) => t.category));

  return (
    <div
      className="relative overflow-hidden border-b border-stone-100"
      style={{ backgroundColor: "#fafafa", fontFamily: "Sora, sans-serif" }}
    >
      <div
        className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 100% 0%, rgba(245,158,11,0.08) 0%, transparent 70%)" }}
      />

      <div className="relative max-w-6xl mx-auto px-4 pt-14 pb-12">

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

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base md:text-lg text-stone-500 leading-relaxed max-w-xl mb-7"
        >
          {tools.length > 0 ? tools.length : "20"}+ tools for the moments that matter — career
          pivots, money decisions, learning, writing, and life admin. Most are free to try.
          Premium tools use a small token balance so the AI stays fast and honest.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {TAGS.map(({ label, emoji }) => (
            <span
              key={label}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 bg-white border border-stone-200 px-3 py-1.5 rounded-xs"
            >
              <span>{emoji}</span>{label}
            </span>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-wrap items-center gap-6 pt-6 border-t border-stone-100"
        >
          {[
            { label: "Tools live",     value: liveCount,                    suffix: "",   color: "#10b981" },
            { label: "Categories",     value: categorySet.size,              suffix: "",   color: "#6366f1" },
            { label: "Total uses",     value: Math.round(totalUsage / 1000), suffix: "k+", color: "#f59e0b" },
            { label: "Avg build time", value: null, raw: "~6 seconds",       color: "#0ea5e9" },
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
};




// "use client";

// import React, { useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import { Zap, Sparkles } from "lucide-react";
// import { TOOLS } from "@/lib/data/tools-data";

// const liveCount    = TOOLS.filter(t => t.status === "LIVE").length;
// const betaCount    = TOOLS.filter(t => t.status === "BETA").length;
// const totalUsage   = TOOLS.reduce((s, t) => s + t.usageCount, 0);
// const categorySet  = new Set(TOOLS.map(t => t.category));

// // Animated count-up
// function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
//   const [val, setVal] = useState(0);
//   useEffect(() => {
//     const steps   = 50;
//     const stepVal = to / steps;
//     let   step    = 0;
//     const t = setInterval(() => {
//       step++;
//       setVal(Math.min(Math.round(stepVal * step), to));
//       if (step >= steps) clearInterval(t);
//     }, 28);
//     return () => clearInterval(t);
//   }, [to]);
//   return <>{val.toLocaleString()}{suffix}</>;
// }

// const TAGS = [
//   { label: "Job seekers",    emoji: "💼" },
//   { label: "Founders",       emoji: "🚀" },
//   { label: "Students",       emoji: "🎓" },
//   { label: "Writers",        emoji: "✍️" },
//   { label: "Developers",     emoji: "⚡" },
//   { label: "Parents",        emoji: "👨‍👩‍👧" },
// ];

// export const ToolsHero = () => (
//   <div
//     className="relative overflow-hidden border-b border-stone-100"
//     style={{ backgroundColor: "#fafafa", fontFamily: "Sora, sans-serif" }}
//   >
//     {/* Background grid */}
//     {/* <div className="absolute inset-0 pointer-events-none opacity-[0.035]">
//       <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
//         <defs>
//           <pattern id="hero-grid" width="40" height="40" patternUnits="userSpaceOnUse">
//             <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#000" strokeWidth="0.8" />
//           </pattern>
//         </defs>
//         <rect width="100%" height="100%" fill="url(#hero-grid)" />
//       </svg>
//     </div> */}

//     {/* Amber accent glow */}
//     <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
//       style={{ background: "radial-gradient(ellipse at 100% 0%, rgba(245,158,11,0.08) 0%, transparent 70%)" }} />

//     <div className="relative max-w-6xl mx-auto px-4 pt-14 pb-12 ">

//       {/* Label */}
//       <motion.div
//         initial={{ opacity: 0, y: -10 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.4 }}
//         className="inline-flex items-center gap-2 mb-6 px-3.5 py-2 rounded-xs border border-amber-200 bg-amber-50"
//       >
//         <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
//         <span className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-600">
//           Tools Lab
//         </span>
//         <span className="w-px h-3 bg-amber-200" />
//         <span className="text-[11px] font-semibold text-amber-500">
//           {liveCount} live · {betaCount} in beta
//         </span>
//       </motion.div>

//       {/* Headline */}
//       <motion.div
//         initial={{ opacity: 0, y: 16 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5, delay: 0.1 }}
//         className="mb-5 max-w-3xl"
//       >
//         <h1 className="text-4xl md:text-6xl font-black text-stone-900 leading-[1.05] tracking-tight">
//           Sharp AI tools
//           <br />
//           <span style={{ color: "#f59e0b" }}>built to actually</span>
//           <br />
//           get things done.
//         </h1>
//       </motion.div>

//       {/* Sub copy — honest and marketable */}
//       <motion.p
//         initial={{ opacity: 0, y: 12 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5, delay: 0.2 }}
//         className="text-base md:text-lg text-stone-500 leading-relaxed max-w-xl mb-7"
//       >
//         {TOOLS.length}+ tools for the moments that matter — career pivots, money decisions,
//         learning, writing, and life admin. Most are free to try. Premium tools use a small
//         token balance so the AI stays fast and honest.
//       </motion.p>

//       {/* Audience tags */}
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ duration: 0.5, delay: 0.3 }}
//         className="flex flex-wrap gap-2 mb-10"
//       >
//         {TAGS.map(({ label, emoji }) => (
//           <span key={label}
//             className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 bg-white border border-stone-200 px-3 py-1.5 rounded-xs">
//             <span>{emoji}</span>{label}
//           </span>
//         ))}
//       </motion.div>

//       {/* Stats row */}
//       <motion.div
//         initial={{ opacity: 0, y: 8 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.5, delay: 0.4 }}
//         className="flex flex-wrap items-center gap-6 pt-6 border-t border-stone-100"
//       >
//         {[
//           { label: "Tools live",      value: liveCount,              suffix: "",  color: "#10b981" },
//           { label: "Categories",      value: categorySet.size,       suffix: "",  color: "#6366f1" },
//           { label: "Total uses",      value: Math.round(totalUsage / 1000), suffix: "k+", color: "#f59e0b" },
//           { label: "Avg build time",  value: null, raw: "~6 seconds", color: "#0ea5e9" },
//         ].map(({ label, value, suffix, raw, color }) => (
//           <div key={label} className="flex items-baseline gap-2">
//             <span className="text-2xl font-black tabular-nums" style={{ color }}>
//               {raw ?? <CountUp to={value!} suffix={suffix} />}
//             </span>
//             <span className="text-xs text-stone-400 font-semibold">{label}</span>
//           </div>
//         ))}
//       </motion.div>
//     </div>
//   </div>
// );

