"use client";

// =============================================================================
// isaacpaha.com — Blog Post Client
// app/blog/[slug]/_post/blog-post-client.tsx
// =============================================================================

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Clock,
  Eye,
  MessageSquare,
  Check,
  Twitter,
  Linkedin,
  Link2,
  ChevronRight,
  Heart,
  ChevronUp,
  BookOpen,
} from "lucide-react";
import type { DBPostFull, DBPost } from "@/lib/types/blog";
import { parseTags, formatPostDateLong } from "@/lib/types/blog";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { AISummariser }    from "./blog-ai-summariser";
import { TableOfContents } from "./blog-table-of-content";
import { PostContent }     from "./blog-post-content";
import { PostReactions }   from "./blog-post-reaction";
import { CommentsSection } from "./blog-comments";
import { BlogCard }        from "../_blog/blog-card";
import Image from "next/image";

// ─── Reading progress bar ─────────────────────────────────────────────────────

const ReadingProgress = ({ color }: { color: string }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const el           = document.documentElement;
      const scrollTop    = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div className="fixed top-16 left-0 right-0 z-40 h-1 bg-gray-100">
      <motion.div
        className="h-full"
        style={{ width: `${progress}%`, backgroundColor: color }}
        transition={{ duration: 0 }}
      />
    </div>
  );
};

// ─── Share bar ────────────────────────────────────────────────────────────────

const ShareBar = ({ title, slug }: { title: string; slug: string }) => {
  const [copied, setCopied] = useState(false);
  const url =
    typeof window !== "undefined"
      ? window.location.href
      : `https://www.isaacpaha.com/blog/${slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const twitterUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${title}" by @iPaha3`)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">
        Share:
      </span>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 bg-sky-50 border border-sky-200 hover:bg-sky-100 px-3 py-2 rounded-xs transition-all"
      >
        <Twitter className="w-3.5 h-3.5" />
        Twitter
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-2 rounded-xs transition-all"
      >
        <Linkedin className="w-3.5 h-3.5" />
        LinkedIn
      </a>
      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:border-gray-400 px-3 py-2 rounded-xs transition-all"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-green-500" />
            <span className="text-green-600">Copied!</span>
          </>
        ) : (
          <>
            <Link2 className="w-3.5 h-3.5" />
            Copy link
          </>
        )}
      </button>
    </div>
  );
};

// ─── Sticky reading sidebar ───────────────────────────────────────────────────

const ReadingSidebar = ({
  post,
  progress,
}: {
  post:     DBPostFull;
  progress: number;
}) => {
  const [liked,   setLiked]   = useState(false);
  const [likes,   setLikes]   = useState(post.likeCount);
  const [scrolled, setScrolled] = useState(0);

  useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      setScrolled(el.scrollTop || document.body.scrollTop);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // const toggleLike = () => {
  //   setLiked((l) => !l);
  //   setLikes((n) => n + (liked ? -1 : 1));
  //   // Optimistic only — PostReactions handles the persistent reaction save
  // };

  // Point the toggleLike to it's api route to persist the like in the database
  const toggleLike = async () => {
    try {
      const res = await fetch(`/api/blog/${post.slug}/like`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to update like count");
      const data = await res.json();
      setLiked(data.liked);
      setLikes(data.likeCount);
    } catch (error) {
      console.error("Error updating like count:", error);
    }
  };

  const color = post.coverColor ?? "#f59e0b";

  return (
    <div className="hidden xl:flex flex-col gap-4 sticky top-24">
      {/* Progress circle */}
      <div className="bg-white border border-gray-100 rounded-xs p-4 shadow-sm text-center">
        <div className="relative w-14 h-14 mx-auto mb-3">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#f3f4f6" strokeWidth="4" />
            <circle
              cx="28"
              cy="28"
              r="24"
              fill="none"
              stroke={color}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-700">
            {Math.round(progress)}%
          </span>
        </div>
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
          Reading
        </p>
      </div>

      {/* Like */}
      <button
        onClick={toggleLike}
        className={`flex flex-col items-center gap-1 p-4 rounded-xs border shadow-sm transition-all duration-200 ${
          liked
            ? "bg-red-50 border-red-200 text-red-500"
            : "bg-white border-gray-100 text-gray-400 hover:border-red-200 hover:text-red-400"
        }`}
      >
        <Heart className={`w-5 h-5 ${liked ? "fill-red-500" : ""}`} />
        <span className="text-xs font-bold">{likes}</span>
      </button>

      {/* Scroll to top */}
      {scrolled > 400 && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex flex-col items-center gap-1 p-3 bg-white border border-gray-100 rounded-xs text-gray-400 hover:text-gray-700 hover:border-gray-300 shadow-sm transition-all"
        >
          <ChevronUp className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Top</span>
        </button>
      )}
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  post:    DBPostFull;
  related: DBPost[];
}

export const BlogPostClient = ({ post, related }: Props) => {
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const el           = document.documentElement;
      const scrollTop    = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setReadingProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  // Derive values from DB post
  const color     = post.coverColor ?? "#f59e0b";
  const category  = post.category;
  const tags      = parseTags(post.tags);
  const wordCount = post.wordCount ||
    Math.round(post.content.split(/\s+/).filter(Boolean).length / 100) * 100;

  const breadcrumbs = [
    { label: "Blog",             href: "/blog" },
    { label: category?.name ?? "", href: `/blog?category=${encodeURIComponent(category?.name ?? "")}` },
    { label: post.title,         href: "#" },
  ];

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <ReadingProgress color={color} />

      {/* Subtle grain texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='1' fill='%23d1d5db' opacity='0.3'/%3E%3C/svg%3E\")",
          backgroundSize: "4px 4px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-20">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 text-xs text-gray-400 mb-10"
          aria-label="Breadcrumb"
        >
          <Link href="/" className="hover:text-gray-700 transition-colors">
            Home
          </Link>
          {breadcrumbs.map((bc) => (
            <React.Fragment key={bc.label}>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              {bc.href === "#" ? (
                <span className="text-gray-700 font-medium truncate max-w-[200px]">
                  {bc.label}
                </span>
              ) : (
                <Link
                  href={bc.href}
                  className="hover:text-gray-700 transition-colors truncate max-w-[120px]"
                >
                  {bc.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </motion.nav>

        <div className="grid grid-cols-1 xl:grid-cols-[48px_1fr_300px] gap-8 items-start">
          {/* Left: sticky sidebar (desktop only) */}
          <ReadingSidebar post={post} progress={readingProgress} />

          {/* Center: main article */}
          <motion.article variants={staggerContainer} initial="hidden" animate="visible">
            {/* Article header */}
            <header className="mb-10">
              {/* Category + series + badges */}
              <motion.div
                variants={staggerItem}
                className="flex flex-wrap items-center gap-2.5 mb-5"
              >
                {category && (
                  <span
                    className="text-xs font-bold tracking-[0.15em] uppercase px-3 py-1.5 rounded-xs"
                    style={{
                      color:           category.color ?? "#f59e0b",
                      backgroundColor: `${category.color ?? "#f59e0b"}12`,
                    }}
                  >
                    {category.icon} {category.name}
                  </span>
                )}
                {post.isEditorPick && (
                  <span className="text-[9px] font-black tracking-widest uppercase bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-xs">
                    Editor&apos;s Pick
                  </span>
                )}
                {post.series && (
                  <span className="text-[9px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-xs">
                    {post.series.title} · Part {post.seriesPart}
                  </span>
                )}
              </motion.div>

              {/* Title */}
              <motion.h1
                variants={staggerItem}
                className="text-4xl md:text-6xl font-black text-gray-900 leading-tight mb-6"
                style={{ lineHeight: "1.05" }}
              >
                {post.title}
              </motion.h1>

              {/* Excerpt / deck */}
              <motion.p
                variants={staggerItem}
                className="text-xl text-gray-500 leading-relaxed mb-8 font-light max-w-2xl border-l-4 pl-5"
                style={{ borderColor: color }}
              >
                {post.excerpt}
              </motion.p>

              {/* Meta row */}
              <motion.div
                variants={staggerItem}
                className="flex flex-wrap items-center gap-5 pb-6 border-b border-gray-200"
              >
                {/* Author */}
                <div className="flex items-center gap-3">
                  {post.authorImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <Image
                      src={post.authorImage}
                      alt={post.authorName}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover border-2"
                      style={{ borderColor: `${color}40` }}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white border-2"
                      style={{ backgroundColor: color, borderColor: `${color}40` }}
                    >
                      {post.authorName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-gray-900">{post.authorName}</p>
                    <p className="text-xs text-gray-400">
                      {formatPostDateLong(post.publishedAt ?? null)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-400 ml-auto flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {post.readingTimeMinutes} min read
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    {post.viewCount.toLocaleString()} reads
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    {post.commentCount} comments
                  </span>
                </div>
              </motion.div>

              {/* Tags */}
              <motion.div variants={staggerItem} className="flex flex-wrap gap-2 pt-5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-xs hover:border-amber-300 transition-colors cursor-default"
                  >
                    {tag}
                  </span>
                ))}
              </motion.div>
            </header>

            {/* AI Summariser */}
            <motion.div variants={staggerItem}>
              <AISummariser title={post.title} content={post.content} />
            </motion.div>

            {/* Table of contents */}
            <motion.div variants={staggerItem}>
              <TableOfContents content={post.content} />
            </motion.div>

            {/* Article body */}
            <motion.div variants={staggerItem} className="mt-2">
              <PostContent content={post.content} />
            </motion.div>

            {/* Post footer: author + share */}
            <motion.div
              variants={staggerItem}
              className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
            >
              <div className="flex items-center gap-3">
                {post.authorImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <Image
                    src={post.authorImage}
                    alt={post.authorName}
                    className="w-12 h-12 rounded-full object-cover"
                    style={{ backgroundColor: color }}
                    width={48}
                    height={48}
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white"
                    style={{ backgroundColor: color }}
                  >
                    {post.authorName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    Written by {post.authorName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {post.authorBio ?? "Founder · Builder · Thinker"}
                  </p>
                </div>
              </div>
              <ShareBar title={post.title} slug={post.slug} />
            </motion.div>

            {/* Reactions — real DB */}
            <PostReactions
              postId={post.id}
              postSlug={post.slug}
              initialLikes={post.likeCount}
            />

            {/* Comments — real DB */}
            <CommentsSection
              postId={post.id}
              postSlug={post.slug}
              count={post.commentCount}
            />
          </motion.article>

          {/* Right: sticky article sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              {/* About the author */}
              <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
                  About the Author
                </p>
                <div className="flex items-center gap-3 mb-4">
                  {post.authorImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <Image
                      src={post.authorImage}
                      alt={post.authorName}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-base font-black text-white shrink-0"
                      style={{ backgroundColor: color }}
                    >
                      {post.authorName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-bold text-gray-900">{post.authorName}</p>
                    <p className="text-xs text-gray-400">
                      Founder of iPaha, iPahaStores & Okpah
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  {post.authorBio ??
                    "Entrepreneur, builder, and thinker. I write about startups, product design, and the future of work."}
                </p>
                <Link
                  href="/about"
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  Read full bio →
                </Link>
              </div>

              {/* Post stats — all from DB */}
              <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
                  Post Stats
                </p>
                {[
                  { id: "reads", icon: Eye, label: "Total reads", value: post.viewCount.toLocaleString() },
                  { id: "likes", icon: Heart, label: "Likes", value: post.likeCount.toLocaleString() },
                  { id: "comments", icon: MessageSquare, label: "Comments", value: post.commentCount.toString() },
                  { id: "reading", icon: Clock, label: "Reading time", value: `${post.readingTimeMinutes} min` },
                  { id: "words", icon: BookOpen, label: "Word count", value: `~${wordCount.toLocaleString()}` },
                ].map(({ id, icon: Icon, label, value }) => (
                  <div
                    key={id}  // Use a guaranteed unique ID instead of label
                    className="flex justify-between py-2.5 border-b border-gray-50 last:border-0 text-xs"
                  >
                    <span className="flex items-center gap-2 text-gray-500">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </span>
                    <span className="font-bold text-gray-800">{value}</span>
                  </div>
                ))}
              </div>

              {/* Related posts */}
              {related.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
                    More to Read
                  </p>
                  <div className="space-y-3">
                    {related.slice(0, 3).map((r) => (
                      <Link
                        key={r.id}
                        href={`/blog/${r.slug}`}
                        className="group flex items-start gap-2.5 py-1.5"
                      >
                        <span className="text-xl shrink-0 mt-0.5">{r.coverEmoji}</span>
                        <p className="text-xs font-medium text-gray-600 group-hover:text-amber-700 leading-snug line-clamp-2 transition-colors">
                          {r.title}
                        </p>
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/blog"
                    className="group mt-4 flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-semibold transition-colors"
                  >
                    All essays
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Related posts grid */}
        {related.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-gray-900">
                More to{" "}
                <span style={{ color }}>read</span>
              </h2>
              <Link
                href="/blog"
                className="group text-sm text-amber-600 hover:text-amber-700 inline-flex items-center gap-1.5 font-semibold transition-colors"
              >
                All essays
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((r) => (
                <BlogCard key={r.id} post={r} variant="default" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};






// "use client";

// import React, { useState, useEffect } from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import {
//   Clock,
//   Eye,
//   MessageSquare,
//   Check,
//   Twitter,
//   Linkedin,
//   Link2,
//   ChevronRight,
//   Heart,
//   ChevronUp,
//   BookOpen,
// } from "lucide-react";
// import { type BlogPost, BLOG_CATEGORIES } from "@/lib/data/blog-data";
// import { staggerContainer, staggerItem } from "@/lib/animations";
// import { AISummariser } from "./blog-ai-summariser";
// import { TableOfContents } from "./blog-table-of-content";
// import { PostContent } from "./blog-post-content";
// import { PostReactions } from "./blog-post-reaction";
// import { CommentsSection } from "./blog-comments";
// import { BlogCard } from "./blog-card";

// // ─── Reading progress bar ─────────────────────────────────────────────────────
// const ReadingProgress = ({ color }: { color: string }) => {
//   const [progress, setProgress] = useState(0);

//   useEffect(() => {
//     const update = () => {
//       const el = document.documentElement;
//       const scrollTop = el.scrollTop || document.body.scrollTop;
//       const scrollHeight = el.scrollHeight - el.clientHeight;
//       setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
//     };
//     window.addEventListener("scroll", update, { passive: true });
//     return () => window.removeEventListener("scroll", update);
//   }, []);

//   return (
//     <div className="fixed top-16 left-0 right-0 z-40 h-1 bg-gray-100">
//       <motion.div
//         className="h-full"
//         style={{ width: `${progress}%`, backgroundColor: color }}
//         transition={{ duration: 0 }}
//       />
//     </div>
//   );
// };

// // ─── Share button row ─────────────────────────────────────────────────────────
// const ShareBar = ({ title, slug }: { title: string; slug: string }) => {
//   const [copied, setCopied] = useState(false);
//   const url = typeof window !== "undefined" ? window.location.href : `https://www.isaacpaha.com/blog/${slug}`;

//   const copyLink = () => {
//     navigator.clipboard.writeText(url);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`"${title}" by @iPaha3`)}&url=${encodeURIComponent(url)}`;
//   const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

//   return (
//     <div className="flex flex-wrap items-center gap-2">
//       <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-1">Share:</span>
//       <a
//         href={twitterUrl}
//         target="_blank"
//         rel="noopener noreferrer"
//         className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 bg-sky-50 border border-sky-200 hover:bg-sky-100 px-3 py-2 rounded-xs transition-all"
//       >
//         <Twitter className="w-3.5 h-3.5" />
//         Twitter
//       </a>
//       <a
//         href={linkedinUrl}
//         target="_blank"
//         rel="noopener noreferrer"
//         className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-2 rounded-xs transition-all"
//       >
//         <Linkedin className="w-3.5 h-3.5" />
//         LinkedIn
//       </a>
//       <button
//         onClick={copyLink}
//         className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:border-gray-400 px-3 py-2 rounded-xs transition-all"
//       >
//         {copied ? (
//           <><Check className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600">Copied!</span></>
//         ) : (
//           <><Link2 className="w-3.5 h-3.5" />Copy link</>
//         )}
//       </button>
//     </div>
//   );
// };

// // ─── Sticky reading sidebar ────────────────────────────────────────────────────
// const ReadingSidebar = ({
//   post,
//   progress,
// }: {
//   post: BlogPost;
//   progress: number;
// }) => {
//   const [liked, setLiked] = useState(false);
//   const [scrolled, setScrolled] = useState(0);

//   useEffect(() => {
//     const update = () => {
//       const el = document.documentElement;
//       setScrolled(el.scrollTop || document.body.scrollTop);
//     };
//     window.addEventListener("scroll", update, { passive: true });
//     return () => window.removeEventListener("scroll", update);
//   }, []);

//   return (
//     <div className="hidden xl:flex flex-col gap-4 sticky top-24">
//       {/* Progress circle */}
//       <div className="bg-white border border-gray-100 rounded-xs p-4 shadow-sm text-center">
//         <div className="relative w-14 h-14 mx-auto mb-3">
//           <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
//             <circle cx="28" cy="28" r="24" fill="none" stroke="#f3f4f6" strokeWidth="4" />
//             <circle
//               cx="28"
//               cy="28"
//               r="24"
//               fill="none"
//               stroke={post.coverColor}
//               strokeWidth="4"
//               strokeDasharray={`${2 * Math.PI * 24}`}
//               strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
//               strokeLinecap="round"
//               className="transition-all duration-300"
//             />
//           </svg>
//           <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-gray-700">
//             {Math.round(progress)}%
//           </span>
//         </div>
//         <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Reading</p>
//       </div>

//       {/* Like */}
//       <button
//         onClick={() => setLiked((l) => !l)}
//         className={`flex flex-col items-center gap-1 p-4 rounded-xs border shadow-sm transition-all duration-200 ${
//           liked
//             ? "bg-red-50 border-red-200 text-red-500"
//             : "bg-white border-gray-100 text-gray-400 hover:border-red-200 hover:text-red-400"
//         }`}
//       >
//         <Heart className={`w-5 h-5 ${liked ? "fill-red-500" : ""}`} />
//         <span className="text-xs font-bold">
//           {post.likeCount + (liked ? 1 : 0)}
//         </span>
//       </button>

//       {/* Scroll to top */}
//       {scrolled > 400 && (
//         <button
//           onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
//           className="flex flex-col items-center gap-1 p-3 bg-white border border-gray-100 rounded-xs text-gray-400 hover:text-gray-700 hover:border-gray-300 shadow-sm transition-all"
//         >
//           <ChevronUp className="w-5 h-5" />
//           <span className="text-[10px] font-semibold">Top</span>
//         </button>
//       )}
//     </div>
//   );
// };

// // ─── Main component ───────────────────────────────────────────────────────────
// interface Props {
//   post: BlogPost;
//   related: BlogPost[];
// }

// export const BlogPostClient = ({ post, related }: Props) => {
//   const [readingProgress, setReadingProgress] = useState(0);
//   const category = BLOG_CATEGORIES.find((c) => c.name === post.category);

//   useEffect(() => {
//     const update = () => {
//       const el = document.documentElement;
//       const scrollTop = el.scrollTop || document.body.scrollTop;
//       const scrollHeight = el.scrollHeight - el.clientHeight;
//       setReadingProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
//     };
//     window.addEventListener("scroll", update, { passive: true });
//     return () => window.removeEventListener("scroll", update);
//   }, []);

//   const breadcrumbs = [
//     { label: "Blog", href: "/blog" },
//     { label: post.category, href: `/blog?category=${post.category}` },
//     { label: post.title, href: "#" },
//   ];

//   return (
//     <div className="min-h-screen bg-[#fafaf8]">
//       <ReadingProgress color={post.coverColor} />

//       {/* Subtle grain texture */}
//       <div
//         className="fixed inset-0 pointer-events-none opacity-[0.35]"
//         style={{
//           backgroundImage:
//             "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='1' fill='%23d1d5db' opacity='0.3'/%3E%3C/svg%3E\")",
//           backgroundSize: "4px 4px",
//         }}
//       />

//       <div className="relative z-10 max-w-7xl mx-auto px-4 pt-24 pb-20">
//         {/* Breadcrumb */}
//         <motion.nav
//           initial={{ opacity: 0, y: -8 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="flex items-center gap-1.5 text-xs text-gray-400 mb-10"
//           aria-label="Breadcrumb"
//         >
//           <Link href="/" className="hover:text-gray-700 transition-colors">Home</Link>
//           {breadcrumbs.map((bc) => (
//             <React.Fragment key={bc.label}>
//               <ChevronRight className="w-3 h-3 text-gray-300" />
//               {bc.href === "#" ? (
//                 <span className="text-gray-700 font-medium truncate max-w-[200px]">{bc.label}</span>
//               ) : (
//                 <Link href={bc.href} className="hover:text-gray-700 transition-colors truncate max-w-[120px]">
//                   {bc.label}
//                 </Link>
//               )}
//             </React.Fragment>
//           ))}
//         </motion.nav>

//         <div className="grid grid-cols-1 xl:grid-cols-[48px_1fr_300px] gap-8 items-start">
//           {/* Left: sticky sidebar (desktop only) */}
//           <ReadingSidebar post={post} progress={readingProgress} />

//           {/* Center: main article */}
//           <motion.article
//             variants={staggerContainer}
//             initial="hidden"
//             animate="visible"
//           >
//             {/* Article header */}
//             <header className="mb-10">
//               {/* Category + series + badges */}
//               <motion.div
//                 variants={staggerItem}
//                 className="flex flex-wrap items-center gap-2.5 mb-5"
//               >
//                 <span
//                   className="text-xs font-bold tracking-[0.15em] uppercase px-3 py-1.5 rounded-xs"
//                   style={{
//                     color: category?.color,
//                     backgroundColor: `${category?.color}12`,
//                   }}
//                 >
//                   {category?.icon} {post.category}
//                 </span>
//                 {post.isEditorsPick && (
//                   <span className="text-[9px] font-black tracking-widest uppercase bg-amber-100 text-amber-700 border border-amber-200 px-2 py-1 rounded-xs">
//                     Editor&apos;s Pick
//                   </span>
//                 )}
//                 {post.seriesName && (
//                   <span className="text-[9px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-1 rounded-xs">
//                     {post.seriesName} · Part {post.seriesPart}
//                   </span>
//                 )}
//               </motion.div>

//               {/* Title */}
//               <motion.h1
//                 variants={staggerItem}
//                 className="text-4xl md:text-6xl font-black text-gray-900 leading-tight mb-6"
//                 style={{ lineHeight: "1.05" }}
//               >
//                 {post.title}
//               </motion.h1>

//               {/* Excerpt / deck */}
//               <motion.p
//                 variants={staggerItem}
//                 className="text-xl text-gray-500 leading-relaxed mb-8 font-light max-w-2xl border-l-4 pl-5"
//                 style={{ borderColor: post.coverColor }}
//               >
//                 {post.excerpt}
//               </motion.p>

//               {/* Meta row */}
//               <motion.div
//                 variants={staggerItem}
//                 className="flex flex-wrap items-center gap-5 pb-6 border-b border-gray-200"
//               >
//                 {/* Author */}
//                 <div className="flex items-center gap-3">
//                   <div
//                     className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white border-2"
//                     style={{ backgroundColor: post.coverColor, borderColor: `${post.coverColor}40` }}
//                   >
//                     IP
//                   </div>
//                   <div>
//                     <p className="text-sm font-bold text-gray-900">Isaac Paha</p>
//                     <p className="text-xs text-gray-400">
//                       {new Date(post.publishedAt).toLocaleDateString("en-GB", {
//                         day: "numeric",
//                         month: "long",
//                         year: "numeric",
//                       })}
//                     </p>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-4 text-xs text-gray-400 ml-auto flex-wrap">
//                   <span className="flex items-center gap-1.5">
//                     <Clock className="w-3.5 h-3.5" />
//                     {post.readingTime} min read
//                   </span>
//                   <span className="flex items-center gap-1.5">
//                     <Eye className="w-3.5 h-3.5" />
//                     {post.viewCount.toLocaleString()} reads
//                   </span>
//                   <span className="flex items-center gap-1.5">
//                     <MessageSquare className="w-3.5 h-3.5" />
//                     {post.commentCount} comments
//                   </span>
//                 </div>
//               </motion.div>

//               {/* Tags */}
//               <motion.div variants={staggerItem} className="flex flex-wrap gap-2 pt-5">
//                 {post.tags.map((tag) => (
//                   <span
//                     key={tag}
//                     className="text-xs text-gray-500 bg-white border border-gray-200 px-3 py-1.5 rounded-xs hover:border-amber-300 transition-colors cursor-default"
//                   >
//                     {tag}
//                   </span>
//                 ))}
//               </motion.div>
//             </header>

//             {/* ── AI Summariser ── */}
//             <motion.div variants={staggerItem}>
//               <AISummariser title={post.title} content={post.content} />
//             </motion.div>

//             {/* ── Table of contents ── */}
//             <motion.div variants={staggerItem}>
//               <TableOfContents content={post.content} />
//             </motion.div>

//             {/* ── Article body ── */}
//             <motion.div variants={staggerItem} className="mt-2">
//               <PostContent content={post.content} />
//             </motion.div>

//             {/* ── Post footer: share ── */}
//             <motion.div
//               variants={staggerItem}
//               className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
//             >
//               <div className="flex items-center gap-3">
//                 <div
//                   className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black text-white"
//                   style={{ backgroundColor: post.coverColor }}
//                 >
//                   IP
//                 </div>
//                 <div>
//                   <p className="text-sm font-bold text-gray-900">Written by Isaac Paha</p>
//                   <p className="text-xs text-gray-400">
//                     Founder · Builder · Thinker
//                   </p>
//                 </div>
//               </div>
//               <ShareBar title={post.title} slug={post.slug} />
//             </motion.div>

//             {/* ── Reactions ── */}
//             <PostReactions postId={post.id} initialLikes={post.likeCount} />

//             {/* ── Comments ── */}
//             <CommentsSection postId={post.id} count={post.commentCount} />
//           </motion.article>

//           {/* Right: sticky article sidebar */}
//           <aside className="hidden lg:block">
//             <div className="sticky top-24 space-y-5">
//               {/* About the author */}
//               <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                 <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
//                   About the Author
//                 </p>
//                 <div className="flex items-center gap-3 mb-4">
//                   <div
//                     className="w-12 h-12 rounded-full flex items-center justify-center text-base font-black text-white shrink-0"
//                     style={{ backgroundColor: post.coverColor }}
//                   >
//                     IP
//                   </div>
//                   <div>
//                     <p className="text-sm font-bold text-gray-900">Isaac Paha</p>
//                     <p className="text-xs text-gray-400">
//                       Founder of iPaha, iPahaStores & Okpah
//                     </p>
//                   </div>
//                 </div>
//                 <p className="text-xs text-gray-500 leading-relaxed mb-4">
//                   First-Class Computing & IT graduate. Building technology companies focused on Africa, education, and the future of work.
//                 </p>
//                 <Link
//                   href="/about"
//                   className="text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
//                 >
//                   Read full bio →
//                 </Link>
//               </div>

//               {/* Post stats */}
//               <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                 <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
//                   Post Stats
//                 </p>
//                 {[
//                   { icon: Eye, label: "Total reads", value: post.viewCount.toLocaleString() },
//                   { icon: Heart, label: "Likes", value: post.likeCount.toLocaleString() },
//                   { icon: MessageSquare, label: "Comments", value: post.commentCount.toString() },
//                   { icon: Clock, label: "Reading time", value: `${post.readingTime} min` },
//                   { icon: BookOpen, label: "Word count", value: `~${Math.round(post.content.split(" ").length / 100) * 100}` },
//                 ].map(({ icon: Icon, label, value }) => (
//                   <div key={label} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0 text-xs">
//                     <span className="flex items-center gap-2 text-gray-500">
//                       <Icon className="w-3.5 h-3.5" />
//                       {label}
//                     </span>
//                     <span className="font-bold text-gray-800">{value}</span>
//                   </div>
//                 ))}
//               </div>

//               {/* Navigation */}
//               {related.length > 0 && (
//                 <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                   <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
//                     More to Read
//                   </p>
//                   <div className="space-y-3">
//                     {related.slice(0, 3).map((r) => (
//                       <Link
//                         key={r.id}
//                         href={`/blog/${r.slug}`}
//                         className="group flex items-start gap-2.5 py-1.5"
//                       >
//                         <span className="text-xl shrink-0 mt-0.5">{r.coverEmoji}</span>
//                         <p className="text-xs font-medium text-gray-600 group-hover:text-amber-700 leading-snug line-clamp-2 transition-colors">
//                           {r.title}
//                         </p>
//                       </Link>
//                     ))}
//                   </div>
//                   <Link
//                     href="/blog"
//                     className="group mt-4 flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-semibold transition-colors"
//                   >
//                     All essays
//                     <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
//                   </Link>
//                 </div>
//               )}
//             </div>
//           </aside>
//         </div>

//         {/* ── Related posts ── */}
//         {related.length > 0 && (
//           <div className="mt-20 pt-12 border-t border-gray-200">
//             <div className="flex items-center justify-between mb-8">
//               <h2 className="text-3xl font-black text-gray-900">
//                 More to <span style={{ color: post.coverColor }}>read</span>
//               </h2>
//               <Link
//                 href="/blog"
//                 className="group text-sm text-amber-600 hover:text-amber-700 inline-flex items-center gap-1.5 font-semibold transition-colors"
//               >
//                 All essays
//                 <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
//               </Link>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//               {related.map((r) => (
//                 <BlogCard key={r.id} post={r} variant="default" />
//               ))}
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };