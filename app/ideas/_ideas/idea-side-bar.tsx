"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3, ArrowRight, Flame } from "lucide-react";
import { IDEAS, IDEA_CATEGORIES, STATUS_CONFIG, type IdeaCategory } from "@/lib/data/ideas-data";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface IdeasSidebarProps {
  activeCategory: IdeaCategory | "All";
  onCategory: (c: IdeaCategory | "All") => void;
}

// Sort by trending score (likes * 3 + comments * 5 + views) / hours
const trending = [...IDEAS]
  .sort((a, b) => {
    const scoreA = a.likeCount * 3 + a.commentCount * 5 + a.viewCount * 0.1;
    const scoreB = b.likeCount * 3 + b.commentCount * 5 + b.viewCount * 0.1;
    return scoreB - scoreA;
  })
  .slice(0, 5);

// Count by category
const catCounts = IDEA_CATEGORIES.map((cat) => ({
  ...cat,
  count: IDEAS.filter((i) => i.category === cat.name).length,
})).sort((a, b) => b.count - a.count);

// Count by status
const statusCounts = Object.entries(STATUS_CONFIG).map(([key, config]) => ({
  key,
  ...config,
  count: IDEAS.filter((i) => i.status === key).length,
}));

export const IdeasSidebar = ({ activeCategory, onCategory }: IdeasSidebarProps) => (
  <motion.aside
    variants={staggerContainer}
    initial="hidden"
    animate="visible"
    className="space-y-6"
  >
    {/* Categories breakdown */}
    <motion.div
      variants={staggerItem}
      className="bg-gray-900 border border-white/8 rounded-xs p-5"
    >
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 className="w-4 h-4 text-amber-500" />
        <h3 className="text-xs font-semibold tracking-widest uppercase text-white/40">
          Browse by Category
        </h3>
      </div>

      <div className="space-y-1">
        <button
          onClick={() => onCategory("All")}
          className={cn(
            "w-full flex items-center justify-between px-3 py-2.5 rounded-xs text-sm transition-all duration-200",
            activeCategory === "All"
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "text-white/50 hover:text-white hover:bg-white/4"
          )}
        >
          <span className="font-medium">All Ideas</span>
          <span className="text-xs bg-white/5 px-2 py-0.5 rounded-xs">
            {IDEAS.length}
          </span>
        </button>

        {catCounts.map((cat) => (
          <button
            key={cat.name}
            onClick={() => onCategory(cat.name)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all duration-200",
              activeCategory === cat.name
                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : "text-white/50 hover:text-white hover:bg-white/4"
            )}
          >
            <span className="text-base">{cat.icon}</span>
            <span className="flex-1 text-left font-medium">{cat.name}</span>
            <span className="text-xs text-white/25">{cat.count}</span>
          </button>
        ))}
      </div>
    </motion.div>

    {/* Status breakdown */}
    <motion.div
      variants={staggerItem}
      className="bg-gray-900 border border-white/8 rounded-xs p-5"
    >
      <h3 className="text-xs font-semibold tracking-widest uppercase text-white/40 mb-5">
        Status Breakdown
      </h3>
      <div className="space-y-3">
        {statusCounts.filter((s) => s.count > 0).map((s) => (
          <div key={s.key} className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${s.dot}`} />
            <span className={`text-sm flex-1 ${s.color}`}>{s.label}</span>
            <div className="flex items-center gap-2">
              {/* Bar */}
              <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-current rounded-full opacity-40 transition-all duration-700"
                  style={{ width: `${(s.count / IDEAS.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-white/30 w-3 text-right">{s.count}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>

    {/* Trending ideas */}
    <motion.div
      variants={staggerItem}
      className="bg-gray-900 border border-white/8 rounded-xs p-5"
    >
      <div className="flex items-center gap-2 mb-5">
        <Flame className="w-4 h-4 text-orange-400" />
        <h3 className="text-xs font-semibold tracking-widest uppercase text-white/40">
          Trending Ideas
        </h3>
      </div>
      <ol className="space-y-4">
        {trending.map((idea, i) => (
          <li key={idea.id} className="flex items-start gap-3 group">
            <span className="text-xl font-black text-white/8 leading-none mt-0.5 select-none shrink-0 w-5">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <Link
                href={`/ideas/${idea.slug}`}
                className="text-sm font-medium text-white/60 hover:text-white leading-snug line-clamp-2 transition-colors duration-200"
              >
                {idea.title}
              </Link>
              <div className="flex items-center gap-2 mt-1.5">
                <TrendingUp className="w-3 h-3 text-amber-500/50" />
                <span className="text-xs text-white/25">
                  {(idea.likeCount * 3 + idea.commentCount * 5 + idea.viewCount * 0.1).toFixed(0)} score
                </span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </motion.div>

    {/* Submit idea CTA */}
    <motion.div
      variants={staggerItem}
      className="relative bg-gradient-to-br from-amber-900/30 to-gray-900 border border-amber-500/20 rounded-xs p-5 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
      <div className="relative z-10">
        <p className="text-sm font-bold text-white mb-2">Have an idea?</p>
        <p className="text-xs text-white/45 leading-relaxed mb-4">
          Submit a concept for discussion. The best ideas start as conversations.
        </p>
        <Link
          href="/ask"
          className="group inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors duration-200"
        >
          Share your idea
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-200" />
        </Link>
      </div>
    </motion.div>
  </motion.aside>
);