"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Eye,
  Heart,
  MessageSquare,
  Clock,
  Share2,
  BookOpen,
  ArrowRight,
  Check,
  ChevronUp,
} from "lucide-react";
import { type Idea, STATUS_CONFIG, IDEA_CATEGORIES } from "@/lib/data/ideas-data";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { IdeaCard } from "./idea-card";


interface Props {
  idea: Idea;
  related: Idea[];
}

// ─── Reading progress bar ────────────────────────────────────────────────────
const ReadingProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="fixed top-16 left-0 right-0 z-40 h-0.5 bg-white/5">
      <motion.div
        className="h-full bg-amber-500"
        style={{ width: `${progress}%` }}
        transition={{ duration: 0 }}
      />
    </div>
  );
};

// ─── Comments section placeholder ─────────────────────────────────────────────
const CommentsSection = ({ count }: { count: number }) => {
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="mt-16 pt-12 border-t border-white/8">
      <h2 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
        <MessageSquare className="w-6 h-6 text-amber-500" />
        Discussion
        <span className="text-sm font-normal text-white/30">({count} comments)</span>
      </h2>

      {submitted ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-green-900/20 border border-green-700/30 rounded-xs p-5 mb-8"
        >
          <Check className="w-5 h-5 text-green-400" />
          <p className="text-sm text-green-300">
            Your comment has been submitted and is awaiting moderation. Thank you!
          </p>
        </motion.div>
      ) : (
        <div className="bg-gray-900 border border-white/8 rounded-xs p-6 mb-10">
          <p className="text-sm font-semibold text-white/60 mb-5">
            Share your thoughts on this idea
          </p>
          <div className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-white/4 border border-white/10 rounded-xs px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 transition-all"
            />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What do you think? Agree, disagree, extend the idea..."
              rows={4}
              className="w-full bg-white/4 border border-white/10 rounded-xs px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
            />
            <button
              onClick={() => name && comment && setSubmitted(true)}
              className="bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold px-6 py-3 rounded-xs transition-all duration-200 disabled:opacity-40"
              disabled={!name || !comment}
            >
              Post Comment
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      <div className="text-center py-12 text-white/20">
        <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Be the first to comment on this idea.</p>
      </div>
    </div>
  );
};

// ─── Main detail component ────────────────────────────────────────────────────
export const IdeaDetailClient = ({ idea, related }: Props) => {
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const status = STATUS_CONFIG[idea.status];
  const category = IDEA_CATEGORIES.find((c) => c.name === idea.category);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <ReadingProgress />

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-32 right-1/4 w-96 h-96 bg-amber-500/4 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-1/3 w-64 h-64 bg-amber-600/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-28 pb-20">
        {/* Back nav */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <Link
            href="/ideas"
            className="group inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
            Back to Ideas Lab
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* ── Main article ────────────────────── */}
          <motion.article
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2"
          >
            {/* Badges */}
            <motion.div variants={staggerItem} className="flex flex-wrap gap-2 mb-6">
              <span
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xs border"
                style={{
                  color: category?.color,
                  backgroundColor: `${category?.color}12`,
                  borderColor: `${category?.color}25`,
                }}
              >
                {category?.icon} {idea.category}
              </span>
              <span
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xs border ${status.bg} ${status.border} ${status.color}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-white/30 bg-white/4 border border-white/8 px-3 py-1.5 rounded-xs">
                <Clock className="w-3 h-3" />
                {idea.readingTime} min read
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              variants={staggerItem}
              className="text-4xl md:text-5xl font-black text-white leading-tight mb-6"
            >
              {idea.title}
            </motion.h1>

            {/* Summary (lead) */}
            <motion.p
              variants={staggerItem}
              className="text-xl text-amber-400/80 leading-relaxed mb-10 font-light border-l-2 border-amber-500/40 pl-5"
            >
              {idea.summary}
            </motion.p>

            {/* Divider */}
            <motion.div
              variants={staggerItem}
              className="h-px bg-gradient-to-r from-amber-500/40 to-transparent mb-10"
            />

            {/* Body */}
            <motion.div
              variants={staggerItem}
              className="prose prose-invert prose-lg max-w-none mb-12"
              style={{
                "--tw-prose-body": "rgba(255,255,255,0.6)",
                "--tw-prose-headings": "rgba(255,255,255,0.9)",
                "--tw-prose-lead": "rgba(255,255,255,0.7)",
              } as React.CSSProperties}
            >
              {idea.body.split("\n\n").map((para, i) => (
                <p key={i} className="text-white/60 leading-relaxed mb-5 text-base">
                  {para}
                </p>
              ))}

              {/* Extended discussion prompt */}
              <div className="mt-10 bg-amber-900/15 border border-amber-500/15 rounded-xs p-6">
                <p className="text-amber-300/80 font-semibold text-sm mb-3">
                  💭 Open question
                </p>
                <p className="text-white/50 text-sm leading-relaxed">
                  Every idea in this lab is a starting point, not a conclusion. What would
                  you add? What am I missing? Use the discussion section below or{" "}
                  <Link href="/ask" className="text-amber-400 hover:text-amber-300 underline">
                    ask me directly
                  </Link>
                  .
                </p>
              </div>
            </motion.div>

            {/* Tags */}
            <motion.div variants={staggerItem} className="flex flex-wrap gap-2 mb-10">
              {idea.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-white/40 bg-white/4 border border-white/8 px-3 py-1.5 rounded-xs hover:border-amber-500/25 hover:text-white/60 transition-all duration-200 cursor-default"
                >
                  {tag}
                </span>
              ))}
            </motion.div>

            {/* Engagement bar */}
            <motion.div
              variants={staggerItem}
              className="flex items-center justify-between py-5 border-t border-b border-white/8"
            >
              <div className="flex items-center gap-5">
                <button
                  onClick={() => setLiked((l) => !l)}
                  className="group flex items-center gap-2 text-sm transition-all duration-200"
                >
                  <div
                    className={`flex items-center justify-center w-9 h-9 rounded-xs border transition-all duration-200 ${
                      liked
                        ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                        : "bg-white/4 border-white/10 text-white/40 hover:border-rose-500/30 hover:text-rose-400"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${liked ? "fill-rose-400" : ""}`} />
                  </div>
                  <span className={`font-semibold ${liked ? "text-rose-400" : "text-white/40"}`}>
                    {idea.likeCount + (liked ? 1 : 0)}
                  </span>
                </button>

                <span className="flex items-center gap-2 text-sm text-white/30">
                  <Eye className="w-4 h-4" />
                  {idea.viewCount.toLocaleString()} views
                </span>

                <span className="flex items-center gap-2 text-sm text-white/30">
                  <BookOpen className="w-4 h-4" />
                  {idea.readingTime} min
                </span>
              </div>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-sm text-white/40 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-xs transition-all duration-200"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    Share
                  </>
                )}
              </button>
            </motion.div>

            {/* Comments */}
            <CommentsSection count={idea.commentCount} />
          </motion.article>

          {/* ── Sticky sidebar ──────────────────── */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-28 space-y-6">
              {/* Meta card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-900 border border-white/8 rounded-xs p-5"
              >
                <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-5">
                  Idea Details
                </p>
                {[
                  { label: "Published", value: new Date(idea.publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) },
                  { label: "Status", value: status.label },
                  { label: "Category", value: idea.category },
                  { label: "Read time", value: `${idea.readingTime} min` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-3 border-b border-white/5 last:border-0 text-sm">
                    <span className="text-white/35">{label}</span>
                    <span className="text-white/70 font-medium">{value}</span>
                  </div>
                ))}
              </motion.div>

              {/* Navigation between ideas */}
              {related.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gray-900 border border-white/8 rounded-xs p-5"
                >
                  <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-4">
                    More in {idea.category}
                  </p>
                  <div className="space-y-3">
                    {related.map((r) => (
                      <Link
                        key={r.id}
                        href={`/ideas/${r.slug}`}
                        className="group flex items-start gap-3 py-2"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-amber-500/40 mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform duration-200" />
                        <span className="text-sm text-white/50 group-hover:text-white leading-snug transition-colors duration-200 line-clamp-2">
                          {r.title}
                        </span>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Back to top */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={scrollTop}
                className="w-full flex items-center justify-center gap-2 text-xs text-white/30 hover:text-white border border-white/8 hover:border-white/15 py-3 rounded-xs transition-all duration-200"
              >
                <ChevronUp className="w-4 h-4" />
                Back to top
              </motion.button>
            </div>
          </aside>
        </div>

        {/* Related ideas */}
        {related.length > 0 && (
          <div className="mt-20 pt-12 border-t border-white/5">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white">
                More ideas in{" "}
                <span className="text-amber-400">{idea.category}</span>
              </h2>
              <Link
                href="/ideas"
                className="group text-sm text-amber-500/60 hover:text-amber-400 inline-flex items-center gap-1.5 transition-colors duration-200"
              >
                All ideas
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((r) => (
                <IdeaCard key={r.id} idea={r} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};