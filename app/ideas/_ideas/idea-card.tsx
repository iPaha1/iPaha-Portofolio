"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Heart, MessageSquare, ArrowRight } from "lucide-react";
import { type Idea, STATUS_CONFIG, IDEA_CATEGORIES } from "@/lib/data/ideas-data";
import { staggerItem } from "@/lib/animations";

export const IdeaCard = ({ idea }: { idea: Idea }) => {
  const [liked, setLiked] = useState(false);
  const status = STATUS_CONFIG[idea.status];
  const category = IDEA_CATEGORIES.find((c) => c.name === idea.category);

  return (
    <motion.div variants={staggerItem} className="h-full">
      <article className="group relative bg-gray-900 border border-white/8 rounded-xs overflow-hidden hover:border-amber-500/25 hover:bg-gray-800/80 transition-all duration-300 h-full flex flex-col">
        {/* Top accent — revealed on hover */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-center" />

        <div className="p-6 flex flex-col flex-1">
          {/* Header badges */}
          <div className="flex items-center justify-between mb-4">
            <span
              className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xs border"
              style={{
                color: category?.color,
                backgroundColor: `${category?.color}12`,
                borderColor: `${category?.color}25`,
              }}
            >
              {category?.icon} {idea.category}
            </span>

            <span
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-xs border ${status.bg} ${status.border} ${status.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>

          {/* Title */}
          <Link href={`/ideas/${idea.slug}`} className="block mb-3">
            <h3 className="text-lg font-bold text-white leading-snug group-hover:text-amber-100 transition-colors duration-200 line-clamp-2">
              {idea.title}
            </h3>
          </Link>

          {/* Summary */}
          <p className="text-sm text-white/45 leading-relaxed line-clamp-3 mb-5 flex-1">
            {idea.summary}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {idea.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[11px] text-white/35 bg-white/4 border border-white/6 px-2.5 py-0.5 rounded-xs"
              >
                {tag}
              </span>
            ))}
            {idea.tags.length > 3 && (
              <span className="text-[11px] text-white/25 px-2 py-0.5">
                +{idea.tags.length - 3}
              </span>
            )}
          </div>

          {/* Footer: metrics + CTA */}
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <div className="flex items-center gap-4">
              {/* Like button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setLiked((l) => !l);
                }}
                className="flex items-center gap-1.5 text-xs text-white/35 hover:text-rose-400 transition-colors duration-200"
              >
                <Heart
                  className={`w-3.5 h-3.5 transition-all duration-200 ${
                    liked ? "fill-rose-400 text-rose-400 scale-110" : ""
                  }`}
                />
                <span>{idea.likeCount + (liked ? 1 : 0)}</span>
              </button>

              <span className="flex items-center gap-1.5 text-xs text-white/30">
                <MessageSquare className="w-3.5 h-3.5" />
                {idea.commentCount}
              </span>

              <span className="flex items-center gap-1.5 text-xs text-white/30">
                <Eye className="w-3.5 h-3.5" />
                {idea.viewCount.toLocaleString()}
              </span>
            </div>

            <Link
              href={`/ideas/${idea.slug}`}
              className="flex items-center gap-1 text-xs font-semibold text-amber-500/60 hover:text-amber-400 transition-colors duration-200 group/link"
            >
              Read
              <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform duration-200" />
            </Link>
          </div>
        </div>
      </article>
    </motion.div>
  );
};