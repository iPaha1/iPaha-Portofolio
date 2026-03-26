"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ExternalLink, ArrowRight, TrendingUp, Lock } from "lucide-react";
import { type App, COMPANIES, STATUS_CONFIG } from "@/lib/data/apps-data";
import { cn } from "@/lib/utils";

interface AppCardProps {
  app: App;
  variant?: "grid" | "list" | "compact";
  index?: number;
}

export function AppCard({ app, variant = "grid", index = 0 }: AppCardProps) {
  const company = COMPANIES[app.company];
  const status = STATUS_CONFIG[app.status];
  const locked = app.status === "COMING_SOON";

  const inner = (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: (index % 3) * 0.07, ease: [0.22,1,0.36,1] }}
      whileHover={!locked ? { y: -3 } : {}}
      className={cn(
        "group relative rounded overflow-hidden border transition-all duration-300 flex flex-col",
        locked
          ? "border-white/[0.05] opacity-55 cursor-default"
          : "border-white/[0.07] hover:border-white/[0.15] cursor-pointer",
        variant === "grid" ? "bg-[#0e0e18] h-full" : "bg-[#0e0e18]"
      )}
    >
      {/* Hover glow */}
      {!locked && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded"
          style={{
            background: `radial-gradient(circle at 30% 20%, ${app.primaryColor}0a, transparent 60%)`,
          }}
        />
      )}

      {/* Top micro-line */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-[1.5px] transition-opacity duration-300",
          locked ? "opacity-0" : "opacity-0 group-hover:opacity-100"
        )}
        style={{ background: `linear-gradient(90deg, ${app.primaryColor}80, transparent)` }}
      />

      <div className="relative z-10 p-6 flex flex-col flex-1">

        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl border flex-shrink-0"
            style={{ backgroundColor: `${app.primaryColor}12`, borderColor: `${app.primaryColor}22` }}
          >
            {locked ? <Lock className="w-5 h-5 text-white/20" /> : app.icon}
          </div>

          {/* Status + NEW badges */}
          <div className="flex flex-col items-end gap-1.5">
            <span
              className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded border"
              style={{ color: status.textColor, borderColor: status.borderColor, backgroundColor: status.bgColor }}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`}
                style={{ backgroundColor: status.textColor }}
              />
              {status.label}
            </span>
            {app.isNew && (
              <span className="text-[8px] font-black tracking-[0.2em] uppercase bg-amber-500 text-white px-2 py-0.5 rounded">
                NEW
              </span>
            )}
          </div>
        </div>

        {/* Name + company */}
        <div className="mb-1">
          <h3 className="text-[1.35rem] font-black text-white leading-tight group-hover:text-amber-50 transition-colors duration-200">
            {app.name}
          </h3>
          <p className="text-[11px] font-semibold mt-1" style={{ color: `${company.primaryColor}99` }}>
            {company.flag} {company.shortName} · {app.category}
          </p>
        </div>

        {/* Tagline */}
        <p className="text-sm text-white/50 font-medium leading-snug mb-3">
          {app.tagline}
        </p>

        {/* Description */}
        <p className="text-[13px] text-white/30 leading-relaxed line-clamp-2 mb-5 flex-1">
          {app.description}
        </p>

        {/* Metrics preview (top 2) */}
        {!locked && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {app.metrics.slice(0, 2).map(m => (
              <div
                key={m.label}
                className="rounded border p-3 bg-white/[0.025] border-white/[0.05]"
              >
                {m.trend === "up" && (
                  <TrendingUp className="w-2.5 h-2.5 text-emerald-400 mb-1" />
                )}
                <p className="text-sm font-black text-white">{m.value}</p>
                <p className="text-[10px] text-white/30 leading-tight mt-0.5">{m.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tech stack tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {app.techStack.slice(0, 4).map(t => (
            <span
              key={t.name}
              className="text-[10px] font-medium text-white/30 bg-white/[0.03] border border-white/[0.05] px-2 py-0.5 rounded"
            >
              {t.name}
            </span>
          ))}
          {app.techStack.length > 4 && (
            <span className="text-[10px] text-white/20 self-center">+{app.techStack.length - 4}</span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.05] mt-auto">
          {app.liveUrl && !locked ? (
            <a
              href={app.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 text-[11px] font-semibold text-white/35 hover:text-white border border-white/[0.07] hover:border-white/20 px-3 py-1.5 rounded transition-all"
            >
              <ExternalLink className="w-3 h-3" /> Visit
            </a>
          ) : (
            <span className="text-[11px] text-white/20">{status.label}</span>
          )}

          {!locked && (
            <span className="flex items-center gap-1 text-[11px] font-semibold text-white/25 group-hover:text-amber-400 transition-colors duration-200">
              View app <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );

  if (locked) return inner;
  return <Link href={`/apps/${app.slug}`} className="block h-full">{inner}</Link>;
}