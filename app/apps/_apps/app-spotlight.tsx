"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, ArrowRight, Star, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { APPS, COMPANIES, STATUS_CONFIG } from "@/lib/data/apps-data";

const featured = APPS.filter(a => a.isFeatured);

export function AppSpotlight() {
  const [idx, setIdx] = useState(0);

  if (featured.length === 0) return null;
  const app = featured[idx];
  const company = COMPANIES[app.company];
  const status = STATUS_CONFIG[app.status];

  return (
    <section className="bg-[#080810] px-4 py-12">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-amber-400">Spotlight</span>
          </div>
          {featured.length > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setIdx(i => Math.max(0,i-1))} disabled={idx===0}
                className="w-7 h-7 rounded border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/25 disabled:opacity-20 transition-all">
                <ChevronLeft className="w-3.5 h-3.5"/>
              </button>
              <span className="text-[11px] text-white/25">{idx+1}/{featured.length}</span>
              <button onClick={() => setIdx(i => Math.min(featured.length-1,i+1))} disabled={idx===featured.length-1}
                className="w-7 h-7 rounded border border-white/10 flex items-center justify-center text-white/30 hover:text-white hover:border-white/25 disabled:opacity-20 transition-all">
                <ChevronRight className="w-3.5 h-3.5"/>
              </button>
            </div>
          )}
        </div>

        {/* Spotlight card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22,1,0.36,1] }}
            className="relative rounded overflow-hidden border border-white/[0.07]"
            style={{
              background: `linear-gradient(135deg, ${app.primaryColor}0e 0%, ${app.primaryColor}04 35%, transparent 65%)`,
            }}
          >
            {/* Top accent bar */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, ${app.primaryColor}, ${app.primaryColor}50, transparent)` }}
            />

            {/* Dot pattern BG */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: "28px 28px",
              }}
            />

            <div className="relative z-10 p-8 md:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

              {/* Left — identity & description */}
              <div>
                {/* Badges row */}
                <div className="flex flex-wrap items-center gap-2 mb-8">
                  <span
                    className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded border"
                    style={{ color: company.primaryColor, borderColor: `${company.primaryColor}30`, backgroundColor: `${company.primaryColor}10` }}
                  >
                    {company.flag} {company.name}
                  </span>
                  <span
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded border"
                    style={{ color: status.textColor, borderColor: status.borderColor, backgroundColor: status.bgColor }}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} style={{ backgroundColor: status.textColor }}/>
                    {status.label}
                  </span>
                  {app.isNew && (
                    <span className="text-[9px] font-black tracking-[0.2em] uppercase bg-amber-500 text-white px-2.5 py-1 rounded">
                      NEW
                    </span>
                  )}
                  {app.launchedYear && (
                    <span className="text-[11px] text-white/25 font-medium">
                      Since {app.launchedYear}
                    </span>
                  )}
                </div>

                {/* App icon + name */}
                <div className="flex items-center gap-5 mb-6">
                  <div
                    className="w-20 h-20 rounded-xl flex items-center justify-center text-5xl border flex-shrink-0"
                    style={{ backgroundColor: `${app.primaryColor}12`, borderColor: `${app.primaryColor}25` }}
                  >
                    {app.icon}
                  </div>
                  <div>
                    <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">{app.name}</h2>
                    <p className="text-sm mt-1" style={{ color: `${app.primaryColor}bb` }}>{app.category}</p>
                  </div>
                </div>

                {/* Tagline */}
                <p className="text-xl text-white/70 font-medium leading-snug mb-4">{app.tagline}</p>
                <p className="text-sm text-white/35 leading-relaxed mb-8 max-w-lg">{app.description}</p>

                {/* Top 3 features */}
                <div className="space-y-3 mb-10">
                  {app.features.slice(0, 3).map(f => (
                    <div key={f.title} className="flex items-start gap-3">
                      <span className="text-lg mt-0.5 shrink-0">{f.icon}</span>
                      <p className="text-sm text-white/45 leading-snug">
                        <strong className="text-white/75 font-semibold">{f.title} — </strong>
                        {f.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3">
                  {app.liveUrl && (
                    <a
                      href={app.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2 text-sm font-bold text-white px-6 py-3 rounded transition-all hover:brightness-110"
                      style={{ backgroundColor: app.primaryColor }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit App
                    </a>
                  )}
                  <Link
                    href={`/apps/${app.slug}`}
                    className="group flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white border border-white/12 hover:border-white/25 px-6 py-3 rounded transition-all"
                  >
                    Full Story
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Right — metrics grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {app.metrics.map(m => (
                    <div
                      key={m.label}
                      className="bg-white/[0.04] border border-white/[0.07] rounded p-5"
                    >
                      {m.trend === "up" && (
                        <div className="flex items-center gap-1 mb-2">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                          {m.trendValue && <span className="text-[10px] text-emerald-400 font-semibold">{m.trendValue}</span>}
                        </div>
                      )}
                      <p className="text-2xl font-black text-white mb-0.5">{m.value}</p>
                      <p className="text-[11px] text-white/35 font-medium">{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Tech stack */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded p-5">
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/25 mb-3">Stack</p>
                  <div className="flex flex-wrap gap-1.5">
                    {app.techStack.map(t => (
                      <span
                        key={t.name}
                        className="text-[11px] font-medium text-white/45 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Problem solved */}
                <div
                  className="rounded p-4 border"
                  style={{ backgroundColor: `${app.primaryColor}08`, borderColor: `${app.primaryColor}20` }}
                >
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: `${app.primaryColor}80` }}>
                    Problem Solved
                  </p>
                  <p className="text-sm text-white/50 leading-relaxed">{app.problemStatement}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}