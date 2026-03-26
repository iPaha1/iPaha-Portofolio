"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Box, Rocket, Globe, BarChart3, ArrowDown } from "lucide-react";
import { APPS, COMPANIES, STATUS_CONFIG } from "@/lib/data/apps-data";


// Animated counter hook
function useCounter(target: number, duration = 1600) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

const HERO_STATS = [
  { icon: Box,      label: "Applications",    value: APPS.length,                                            suffix: "" },
  { icon: Rocket,   label: "Shipping Live",   value: APPS.filter(a => a.status === "LIVE").length,           suffix: "" },
  { icon: Globe,    label: "Countries",       value: 3,                                                      suffix: "" },
  { icon: BarChart3,label: "Years Shipping",  value: new Date().getFullYear() - 2019,                        suffix: "+" },
];

function StatItem({ icon: Icon, label, value, suffix }: typeof HERO_STATS[0]) {
  const count = useCounter(value, 1800);
  return (
    <div className="flex flex-col items-center gap-1.5 px-6 py-5 border-r border-white/[0.06] last:border-0">
      <Icon className="w-4 h-4 text-white/25 mb-0.5" />
      <span className="text-3xl font-black text-white tabular-nums">
        {count}{suffix}
      </span>
      <span className="text-[11px] font-medium text-white/30 tracking-wide uppercase">{label}</span>
    </div>
  );
}

export function AppsHero() {
  return (
    <section className="relative min-h-screen bg-[#080810] flex flex-col items-center justify-center overflow-hidden pt-16">

      {/* ── Grid overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* ── Radial glow blobs ── */}
      <div className="absolute top-1/4 left-1/3 w-[700px] h-[700px] rounded-full bg-amber-500/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-500/[0.04] blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] rounded-full bg-emerald-500/[0.03] blur-[120px] pointer-events-none" />

      {/* ── Top colour bar ── */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

      {/* ── Floating company badges (decorative) ── */}
      <div className="absolute top-24 right-10 hidden xl:flex flex-col gap-3 opacity-40">
        {Object.values(COMPANIES).map((co, i) => (
          <motion.div
            key={co.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }}
            className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded px-3 py-2"
          >
            <span className="text-base">{co.flag}</span>
            <span className="text-xs font-semibold text-white/60">{co.shortName}</span>
            <span
              className="w-1.5 h-1.5 rounded-full ml-1"
              style={{ backgroundColor: co.primaryColor }}
            />
          </motion.div>
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center">

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22,1,0.36,1] }}
          className="inline-flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded px-4 py-2 mb-10"
        >
          <span className="flex gap-1">
            {APPS.filter(a => a.status === "LIVE").slice(0, 3).map(a => (
              <span key={a.id} className="text-sm">{a.icon}</span>
            ))}
          </span>
          <span className="text-xs font-semibold tracking-[0.2em] uppercase text-white/40">
            {APPS.filter(a => a.status === "LIVE").length} live · {APPS.filter(a => a.status === "BETA").length} in beta · {APPS.filter(a => a.status === "IN_DEVELOPMENT" || a.status === "COMING_SOON").length} building
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: [0.22,1,0.36,1] }}
          className="text-6xl md:text-8xl lg:text-[105px] font-black text-white leading-[0.9] tracking-tight mb-6"
        >
          Things I&apos;ve
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 40%, #fcd34d 100%)",
            }}
          >
            built &amp; shipped.
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-white/35 max-w-2xl mx-auto leading-relaxed mb-16"
        >
          Real products, real users, genuine problems solved. From jobs platforms serving
          West Africa to AI productivity tools and marketplace infrastructure — seven apps
          across three companies in two countries.
        </motion.p>

        {/* Stats bar */}
       <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="
          flex flex-wrap justify-center gap-4               // changed: wrap + gap instead of inline-flex
          bg-white/[0.03] border border-white/[0.07] rounded 
          overflow-hidden mb-16
        "
      >
        {HERO_STATS.map((s) => (
          <StatItem
            key={s.label}
            icon={s.icon}
            label={s.label}
            value={s.value}
            suffix={s.suffix}
          />
        ))}
      </motion.div>

        {/* Status legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-20"
        >
          {(["LIVE","BETA","IN_DEVELOPMENT","COMING_SOON"] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const count = APPS.filter(a => a.status === s).length;
            return (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${cfg.dotClass}`}
                  style={{ backgroundColor: cfg.textColor }}
                />
                <span className="text-xs text-white/35 font-medium">
                  {cfg.label} ({count})
                </span>
              </div>
            );
          })}
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex flex-col items-center gap-2 text-white/20"
        >
          <span className="text-[11px] tracking-widest uppercase font-semibold">Explore apps</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          >
            <ArrowDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}