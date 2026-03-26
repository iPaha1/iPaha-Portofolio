"use client";

import React from "react";
import { motion } from "framer-motion";
import { Lightbulb, FlaskConical, Zap, TrendingUp } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { IDEAS } from "@/lib/data/ideas-data";


// const totalLikes = IDEAS.reduce((s, i) => s + i.likeCount, 0);
const totalViews = IDEAS.reduce((s, i) => s + i.viewCount, 0);

const STATS = [
  { icon: Lightbulb, value: IDEAS.length.toString(), label: "Ideas Published" },
  { icon: FlaskConical, value: IDEAS.filter(i => i.status === "DEVELOPING").length.toString(), label: "In Development" },
  { icon: Zap, value: IDEAS.filter(i => i.status === "LAUNCHED").length.toString(), label: "Launched" },
  { icon: TrendingUp, value: `${(totalViews / 1000).toFixed(1)}k`, label: "Total Views" },
];

export const IdeasHero = () => (
  <section className="relative pt-32 pb-20 px-4 overflow-hidden">
    {/* Large background text */}
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      aria-hidden
    >
      <span className="text-[20vw] font-black text-white/[0.015] leading-none tracking-tighter">
        IDEAS
      </span>
    </div>

    {/* Amber orb */}
    <div className="absolute top-24 right-1/4 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
    <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

    <div className="max-w-6xl mx-auto relative z-10">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-3xl"
      >
        {/* Eyebrow */}
        <motion.div variants={staggerItem} className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xs bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-500">
            Isaac&apos;s Ideas Lab
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={staggerItem}
          className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tight mb-6"
        >
          Where ideas
          <br />
          <span className="text-amber-400">get dangerous.</span>
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={staggerItem}
          className="text-lg text-white/50 leading-relaxed max-w-xl mb-12"
        >
          This is my innovation playground — a living collection of startup concepts,
          future technologies, thought experiments, and half-baked theories that refuse
          to leave me alone. Some will become products. Most will stay questions.
          All are worth thinking about.
        </motion.p>

        {/* Stats row */}
        <motion.div
          variants={staggerItem}
          className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 rounded-xs overflow-hidden border border-white/5"
        >
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="bg-gray-900 px-6 py-5 flex flex-col gap-1"
            >
              <Icon className="w-4 h-4 text-amber-500 mb-1" />
              <span className="text-2xl font-black text-white">{value}</span>
              <span className="text-xs text-white/40 font-medium">{label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  </section>
);