"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, Eye, MessageSquare, ArrowRight, Flame } from "lucide-react";
import { type BlogPost, BLOG_CATEGORIES } from "@/lib/data/blog-data";
import { staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface BlogCardProps {
  post: BlogPost;
  variant?: "default" | "large" | "compact" | "horizontal";
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export const BlogCard = ({ post, variant = "default" }: BlogCardProps) => {
  const category = BLOG_CATEGORIES.find((c) => c.name === post.category);
  const isHot = post.viewCount > 10000;

  if (variant === "compact") {
    return (
      <motion.div variants={staggerItem}>
        <Link href={`/blog/${post.slug}`} className="group flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
          <div
            className="w-10 h-10 rounded-xs shrink-0 flex items-center justify-center text-xl"
            style={{ backgroundColor: `${post.coverColor}12` }}
          >
            {post.coverEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 group-hover:text-amber-700 leading-snug line-clamp-2 transition-colors duration-200">
              {post.title}
            </p>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
              <span>{post.readingTime} min</span>
              <span>·</span>
              <span>{post.viewCount.toLocaleString()} reads</span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  if (variant === "horizontal") {
    return (
      <motion.div variants={staggerItem}>
        <Link href={`/blog/${post.slug}`} className="group flex gap-5 p-5 bg-white border border-gray-100 rounded-xs hover:border-amber-200 hover:shadow-md hover:shadow-amber-50 transition-all duration-300">
          {/* Cover swatch */}
          <div
            className="w-20 h-20 md:w-24 md:h-24 rounded-xs shrink-0 flex items-center justify-center text-3xl relative overflow-hidden"
            style={{ backgroundColor: `${post.coverColor}10` }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, ${post.coverColor}50 1px, transparent 0)`,
                backgroundSize: "16px 16px",
              }}
            />
            <span className="relative z-10">{post.coverEmoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: category?.color }}
              >
                {category?.icon} {post.category}
              </span>
              {post.isEditorsPick && (
                <span className="text-[9px] font-black tracking-widest uppercase bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-xs">
                  Editor&apos;s Pick
                </span>
              )}
              {isHot && (
                <span className="flex items-center gap-0.5 text-[9px] font-black text-orange-500">
                  <Flame className="w-2.5 h-2.5 fill-orange-500" /> Hot
                </span>
              )}
            </div>
            <h3 className="text-base font-black text-gray-900 group-hover:text-amber-800 leading-tight mb-2 line-clamp-2 transition-colors duration-200">
              {post.title}
            </h3>
            <p className="text-sm text-gray-400 line-clamp-1 mb-3">{post.excerpt}</p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readingTime} min</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.viewCount.toLocaleString()}</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{post.commentCount}</span>
              <span className="ml-auto">{formatDate(post.publishedAt)}</span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Default card
  return (
    <motion.div variants={staggerItem} className="h-full">
      <Link href={`/blog/${post.slug}`} className="group block h-full">
        <article
          className={cn(
            "h-full flex flex-col bg-white border border-gray-100 rounded-xs overflow-hidden hover:border-amber-200 hover:shadow-xl hover:shadow-amber-50/60 transition-all duration-400",
            variant === "large" && "md:flex-row"
          )}
        >
          {/* Cover */}
          <div
            className={cn(
              "relative flex items-center justify-center overflow-hidden",
              variant === "large" ? "md:w-2/5 min-h-[220px]" : "min-h-[160px]"
            )}
            style={{ backgroundColor: `${post.coverColor}10` }}
          >
            <div
              className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, ${post.coverColor}60 1px, transparent 0)`,
                backgroundSize: "20px 20px",
              }}
            />
            <span className="text-6xl relative z-10 group-hover:scale-110 transition-transform duration-500">
              {post.coverEmoji}
            </span>
            {post.isEditorsPick && (
              <div className="absolute top-3 left-3 text-[9px] font-black tracking-widest uppercase bg-amber-500 text-white px-2 py-1 rounded-xs">
                Editor&apos;s Pick
              </div>
            )}
            {isHot && (
              <div className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-200 px-2 py-1 rounded-xs">
                <Flame className="w-2.5 h-2.5 fill-orange-500" /> Trending
              </div>
            )}
            {post.seriesName && (
              <div className="absolute bottom-3 left-3 text-[9px] font-bold text-gray-600 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-xs border border-gray-200">
                {post.seriesName} · Part {post.seriesPart}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col flex-1 p-6">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-[10px] font-bold tracking-[0.15em] uppercase px-2.5 py-1 rounded-xs"
                style={{
                  color: category?.color,
                  backgroundColor: `${category?.color}12`,
                }}
              >
                {category?.icon} {post.category}
              </span>
            </div>

            <h3
              className={cn(
                "font-black text-gray-900 group-hover:text-amber-800 leading-tight mb-3 transition-colors duration-200",
                variant === "large" ? "text-2xl" : "text-lg"
              )}
            >
              {post.title}
            </h3>

            <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4 flex-1">
              {post.excerpt}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-xs"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.readingTime} min
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.viewCount.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {post.commentCount}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
};