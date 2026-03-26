"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";
import { IdeaCard } from "./idea-card";
import { staggerContainer } from "@/lib/animations";
import type { Idea } from "@/lib/data/ideas-data";

interface IdeasGridProps {
  ideas: Idea[];
}

export const IdeasGrid = ({ ideas }: IdeasGridProps) => {
  if (ideas.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-16 h-16 rounded-xs bg-white/4 border border-white/8 flex items-center justify-center mb-5">
          <Lightbulb className="w-7 h-7 text-white/20" />
        </div>
        <h3 className="text-lg font-bold text-white/40 mb-2">No ideas found</h3>
        <p className="text-sm text-white/25 max-w-xs">
          Try adjusting your filters or search terms to find what you&apos;re looking for.
        </p>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={ideas.map((i) => i.id).join("-")}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} />
        ))}
      </motion.div>
    </AnimatePresence>
  );
};