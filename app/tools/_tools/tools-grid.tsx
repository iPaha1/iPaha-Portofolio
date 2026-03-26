"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench } from "lucide-react";
import { staggerContainer } from "@/lib/animations";
import type { Tool } from "@/lib/data/tools-data";
import { ToolCard } from "./tools-card";

interface ToolsGridProps {
  tools: Tool[];
}

export const ToolsGrid = ({ tools }: ToolsGridProps) => {
  if (tools.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-16 h-16 rounded-xs bg-gray-50 border border-gray-100 flex items-center justify-center mb-5">
          <Wrench className="w-7 h-7 text-gray-300" />
        </div>
        <h3 className="text-lg font-bold text-gray-400 mb-2">No tools found</h3>
        <p className="text-sm text-gray-300 max-w-xs">
          Try adjusting your filters or search terms.
        </p>
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tools.map((t) => t.id).join("-")}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-5"
      >
        {tools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </motion.div>
    </AnimatePresence>
  );
};