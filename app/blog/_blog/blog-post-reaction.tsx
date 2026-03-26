"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { REACTIONS } from "@/lib/data/blog-data";

interface PostReactionsProps {
  postId: string;
  initialLikes: number;
}

export const PostReactions = ({  initialLikes }: PostReactionsProps) => {
  const [reactions, setReactions] = useState<Record<string, number>>(
    Object.fromEntries(
      REACTIONS.map((r, i) => [
        r.emoji,
        Math.max(0, Math.floor(initialLikes / (i + 1) / 3)),
      ])
    )
  );
  const [myReactions, setMyReactions] = useState<Set<string>>(new Set());
  const [burst, setBurst] = useState<string | null>(null);

  const react = (emoji: string) => {
    const isActive = myReactions.has(emoji);
    setMyReactions((prev) => {
      const next = new Set(prev);
      if (isActive) next.delete(emoji);
      else next.add(emoji);
      return next;
    });
    setReactions((prev) => ({
      ...prev,
      [emoji]: prev[emoji] + (isActive ? -1 : 1),
    }));
    if (!isActive) {
      setBurst(emoji);
      setTimeout(() => setBurst(null), 600);
    }
  };

  const total = Object.values(reactions).reduce((s, n) => s + n, 0);

  return (
    <div className="py-8 border-t border-b border-gray-100 my-10">
      <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4 text-center">
        React to this essay
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {REACTIONS.map(({ emoji, label }) => {
          const isActive = myReactions.has(emoji);
          const count = reactions[emoji];

          return (
            <motion.button
              key={emoji}
              onClick={() => react(emoji)}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.05 }}
              title={label}
              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xs border text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-amber-50 border-amber-300 text-amber-800 shadow-sm shadow-amber-100"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {/* Burst animation */}
              <AnimatePresence>
                {burst === emoji && (
                  <motion.span
                    initial={{ scale: 1, opacity: 1, y: 0 }}
                    animate={{ scale: 2.5, opacity: 0, y: -30 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55 }}
                    className="absolute inset-0 flex items-center justify-center text-xl pointer-events-none"
                  >
                    {emoji}
                  </motion.span>
                )}
              </AnimatePresence>

              <span className="text-lg">{emoji}</span>
              <span>{count > 0 ? count.toLocaleString() : label}</span>
            </motion.button>
          );
        })}
      </div>

      {total > 0 && (
        <p className="text-xs text-gray-400 text-center mt-4">
          {total.toLocaleString()} total reactions
        </p>
      )}
    </div>
  );
};