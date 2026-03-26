"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen } from "lucide-react";
import { BlogCard } from "./blog-card";
import { staggerContainer } from "@/lib/animations";
import type { BlogPost } from "@/lib/data/blog-data";

interface BlogGridProps {
  posts: BlogPost[];
}

export const BlogGrid = ({ posts }: BlogGridProps) => {
  if (posts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-16 h-16 rounded-xs bg-gray-50 border border-gray-200 flex items-center justify-center mb-5">
          <BookOpen className="w-7 h-7 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-400 mb-2">No essays found</h3>
        <p className="text-sm text-gray-300 max-w-xs">
          Try different filters or search terms.
        </p>
      </motion.div>
    );
  }

  // Editorial layout: first post large, rest in 2-col grid, with a horizontal card
  const [first, second, ...rest] = posts;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={posts.map((p) => p.id).join("-")}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-5"
      >
        {/* Top pair: large + default */}
        {posts.length >= 2 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <BlogCard post={first} variant="large" />
            <BlogCard post={second} variant="default" />
          </div>
        ) : (
          <BlogCard post={first} variant="large" />
        )}

        {/* Rest: 2-column grid */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {rest.map((post, i) => (
              <BlogCard
                key={post.id}
                post={post}
                variant={i % 5 === 0 ? "horizontal" : "default"}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};