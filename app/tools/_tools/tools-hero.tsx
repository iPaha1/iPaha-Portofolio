"use client";

import React from "react";
import { motion } from "framer-motion";
import { Wrench, Zap, Users, Star } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { TOOLS } from "@/lib/data/tools-data";

const totalUsage = TOOLS.reduce((s, t) => s + t.usageCount, 0);
const liveTools = TOOLS.filter((t) => t.status === "LIVE").length;
const avgRating =
  TOOLS.filter((t) => t.ratingCount > 0).reduce((s, t) => s + t.ratingAvg, 0) /
  TOOLS.filter((t) => t.ratingCount > 0).length;

const STATS = [
  { icon: Wrench, value: TOOLS.length.toString(), label: "Total Tools" },
  { icon: Zap, value: liveTools.toString(), label: "Live Now" },
  {
    icon: Users,
    value: `${(totalUsage / 1000).toFixed(0)}k+`,
    label: "Times Used",
  },
  { icon: Star, value: avgRating.toFixed(1), label: "Avg Rating" },
];

export const ToolsHero = () => (
  <section className="relative pt-32 pb-16 px-4 overflow-hidden bg-white">
    {/* Grid background */}
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />

    {/* Amber blob */}
    <div className="absolute top-20 right-1/3 w-[500px] h-[500px] bg-amber-400/8 rounded-full blur-3xl pointer-events-none" />

    {/* Large ghost text */}
    <div
      className="absolute bottom-0 right-0 text-[16vw] font-black leading-none text-black/[0.025] pointer-events-none select-none"
      aria-hidden
    >
      TOOLS
    </div>

    <div className="max-w-6xl mx-auto relative z-10">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-3xl"
      >
        {/* Eyebrow */}
        <motion.div variants={staggerItem} className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xs bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-600">
            Isaac&apos;s Tool Lab
          </span>
          <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {liveTools} live
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={staggerItem}
          className="text-5xl md:text-7xl font-black text-gray-900 leading-[0.95] tracking-tight mb-6"
        >
          Tools that
          <br />
          <span className="text-amber-500">actually work.</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={staggerItem}
          className="text-lg text-gray-500 leading-relaxed max-w-xl mb-12"
        >
          Free, AI-powered tools built for job seekers, founders, students, and
          writers. No accounts, no paywalls for the core experience — just sharp
          tools that solve real problems in seconds.
        </motion.p>

        {/* Stats row */}
        <motion.div
          variants={staggerItem}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100 rounded-xs overflow-hidden border border-gray-100"
        >
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="bg-white px-6 py-5 flex flex-col gap-1 hover:bg-amber-50/50 transition-colors duration-200"
            >
              <Icon className="w-4 h-4 text-amber-500 mb-1" />
              <span className="text-2xl font-black text-gray-900">{value}</span>
              <span className="text-xs text-gray-400 font-medium">{label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  </section>
);