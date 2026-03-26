"use client";

import React from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronDown } from "lucide-react";
import { TOPICS } from "@/lib/data/ask-isaac-data";

export function AskIsaacHero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative min-h-screen bg-[#070709] flex items-center justify-center overflow-hidden">

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-amber-500/[0.03] blur-[180px]" />
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-500/[0.025] blur-[120px]" />
        {/* Grid */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center py-20 pt-28">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-full px-5 py-2 mb-10"
        >
          <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-amber-400" />
          </div>
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-amber-400">
            AI-Powered · Isaac&apos;s Voice & Experience
          </span>
          <div className="flex items-center gap-1.5 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-semibold">Live</span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-[0.92] tracking-tight mb-6"
        >
          Ask Isaac
          <br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #f59e0b 100%)",
            }}
          >
            anything.
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="text-lg md:text-xl text-white/35 max-w-2xl mx-auto leading-relaxed mb-6"
        >
          Direct access to how I think — about startups, Africa, technology, building products,
          and life. Powered by AI trained on my writing, built on my experience.
          Not polished. Not corporate. Just honest.
        </motion.p>

        {/* Topics preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {TOPICS.filter(t => t.id !== "all").map(t => (
            <span
              key={t.id}
              className="flex items-center gap-1.5 text-xs font-medium text-white/30 bg-white/[0.04] border border-white/[0.06] px-3 py-1.5 rounded-full"
            >
              <span>{t.icon}</span>
              {t.label}
            </span>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <button
            onClick={onStart}
            className="group relative inline-flex items-center gap-3 bg-amber-500 hover:bg-amber-400 text-white text-base font-bold px-8 py-4 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/20"
          >
            <Sparkles className="w-5 h-5" />
            Start Asking
            <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
          </button>
          <p className="text-xs text-white/20 mt-3">No signup · No fluff · 20 questions per session</p>
        </motion.div>

        {/* Feature list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-2xl mx-auto"
        >
          {[
            { icon: "🎯", title: "Real Experience", desc: "Answers grounded in what I've actually built, not theory" },
            { icon: "🌍", title: "Africa & Tech", desc: "Deep knowledge of West African markets and tech ecosystems" },
            { icon: "💬", title: "Multi-Turn Chat", desc: "Have a real conversation, not just Q&A" },
          ].map(f => (
            <div
              key={f.title}
              className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 text-center"
            >
              <span className="text-2xl mb-2 block">{f.icon}</span>
              <p className="text-xs font-bold text-white/60 mb-1">{f.title}</p>
              <p className="text-[11px] text-white/25 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}