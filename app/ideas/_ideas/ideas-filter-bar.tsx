"use client";

import React from "react";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { IDEA_CATEGORIES, type IdeaCategory, type IdeaStatus } from "@/lib/data/ideas-data";
import { cn } from "@/lib/utils";

interface IdeasFilterBarProps {
  search: string;
  onSearch: (v: string) => void;
  activeCategory: IdeaCategory | "All";
  onCategory: (c: IdeaCategory | "All") => void;
  activeStatus: IdeaStatus | "All";
  onStatus: (s: IdeaStatus | "All") => void;
  totalResults: number;
}

const STATUS_OPTIONS: (IdeaStatus | "All")[] = [
  "All",
  "CONCEPT",
  "EXPLORING",
  "DEVELOPING",
  "LAUNCHED",
];

const STATUS_LABELS: Record<string, string> = {
  All: "All Statuses",
  CONCEPT: "Concept",
  EXPLORING: "Exploring",
  DEVELOPING: "Developing",
  LAUNCHED: "Launched",
};

export const IdeasFilterBar = ({
  search,
  onSearch,
  activeCategory,
  onCategory,
  activeStatus,
  onStatus,
  totalResults,
}: IdeasFilterBarProps) => {
  const hasFilters = activeCategory !== "All" || activeStatus !== "All" || search.length > 0;

  return (
    <div className="sticky top-16 z-30 bg-gray-950/95 backdrop-blur-md border-b border-white/5 py-4">
      <div className="max-w-6xl mx-auto px-4 space-y-4">
        {/* Top row: search + results count */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search ideas..."
              className="w-full bg-white/5 border border-white/10 rounded-xs pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all duration-200"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-white/30">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              <span className="text-white/60 font-semibold">{totalResults}</span> idea{totalResults !== 1 ? "s" : ""}
            </span>
          </div>

          {hasFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => {
                onSearch("");
                onCategory("All");
                onStatus("All");
              }}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/20 hover:border-amber-500/40 px-3 py-2 rounded-xs transition-all duration-200"
            >
              <X className="w-3 h-3" />
              Clear filters
            </motion.button>
          )}
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => onCategory("All")}
            className={cn(
              "shrink-0 text-xs font-semibold px-4 py-2 rounded-xs border transition-all duration-200",
              activeCategory === "All"
                ? "bg-amber-500 border-amber-500 text-white"
                : "bg-transparent border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
            )}
          >
            All
          </button>

          {IDEA_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => onCategory(cat.name)}
              className={cn(
                "shrink-0 flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xs border transition-all duration-200",
                activeCategory === cat.name
                  ? "bg-amber-500/10 border-amber-500/50 text-amber-400"
                  : "bg-transparent border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
              )}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/30 shrink-0">Status:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => onStatus(s)}
                className={cn(
                  "shrink-0 text-xs px-3 py-1.5 rounded-xs border transition-all duration-200",
                  activeStatus === s
                    ? "bg-white/10 border-white/20 text-white font-semibold"
                    : "bg-transparent border-white/5 text-white/40 hover:text-white/60 hover:border-white/10"
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};