"use client";

// =============================================================================
// isaacpaha.com — Blog Sidebar
// app/blog/_blog/blog-sidebar.tsx
// =============================================================================

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Star, Mail, Check, ArrowRight, Loader2 } from "lucide-react";
import type { DBPost, DBCategory } from "@/lib/types/blog";
import { BlogCard } from "./blog-card";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";

interface BlogSidebarProps {
  activeCategory: string;
  onCategory:     (c: string) => void;
  categories:     DBCategory[];
  posts:          DBPost[];      // full list for category counts
  trending:       DBPost[];
  editorsPicks:   DBPost[];
}

export const BlogSidebar = ({
  activeCategory,
  onCategory,
  categories,
  posts,
  trending,
  editorsPicks,
}: BlogSidebarProps) => {
  const [email,      setEmail]      = useState("");
  const [emailState, setEmailState] = useState<"idle" | "loading" | "success">("idle");

  const subscribe = async () => {
    if (!email || !email.includes("@")) return;
    setEmailState("loading");
    await new Promise((r) => setTimeout(r, 1200));
    setEmailState("success");
  };

  return (
    <motion.aside
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Categories */}
      <motion.div
        variants={staggerItem}
        className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm"
      >
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
          Browse Topics
        </p>
        <div className="space-y-1">
          <button
            onClick={() => onCategory("All")}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-xs text-sm transition-all duration-200",
              activeCategory === "All"
                ? "bg-gray-900 text-white font-semibold"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <span>All Essays</span>
            <span className={cn("text-xs px-2 py-0.5 rounded-xs", activeCategory === "All" ? "bg-white/20" : "bg-gray-100 text-gray-400")}>
              {posts.length}
            </span>
          </button>
          {categories.map((cat) => {
            // Use _count from API if present, fall back to counting from posts prop
            const count = cat._count?.posts ?? posts.filter((p) => p.category?.name === cat.name).length;
            if (count === 0) return null;
            return (
              <button
                key={cat.id}
                onClick={() => onCategory(cat.name)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all duration-200",
                  activeCategory === cat.name
                    ? "bg-amber-50 border border-amber-200 text-amber-800 font-semibold"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <span className="text-base">{cat.icon}</span>
                <span className="flex-1 text-left">{cat.name}</span>
                <span className="text-xs text-gray-300">{count}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Trending — from DB (trendingScore) */}
      {trending.length > 0 && (
        <motion.div
          variants={staggerItem}
          className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
              Trending Now
            </p>
          </div>
          <ol className="space-y-4">
            {trending.map((post, i) => (
              <li key={post.id} className="flex items-start gap-3 group">
                <span className="text-2xl font-black text-gray-100 leading-none w-6 shrink-0 select-none">
                  {i + 1}
                </span>
                <div>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-sm font-semibold text-gray-700 group-hover:text-amber-700 leading-snug line-clamp-2 transition-colors duration-200 block"
                  >
                    {post.title}
                  </Link>
                  <p className="text-xs text-gray-300 mt-1">
                    {post.viewCount.toLocaleString()} reads
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </motion.div>
      )}

      {/* Editor's picks — from DB */}
      {editorsPicks.length > 0 && (
        <motion.div
          variants={staggerItem}
          className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
              Editor&apos;s Picks
            </p>
          </div>
          <div className="space-y-1">
            {editorsPicks.map((post) => (
              <BlogCard key={post.id} post={post} variant="compact" />
            ))}
          </div>
        </motion.div>
      )}

      {/* Newsletter widget */}
      <motion.div
        variants={staggerItem}
        className="relative bg-gray-900 rounded-xs p-6 overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize:  "20px 20px",
          }}
        />
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <Mail className="w-6 h-6 text-amber-400 mb-3" />
          <p className="text-base font-black text-white mb-2">Get new essays first</p>
          <p className="text-xs text-white/50 leading-relaxed mb-5">
            No newsletters. No noise. Just a note when something new and worth reading is published.
          </p>

          {emailState === "success" ? (
            <div className="flex items-center gap-2 text-green-400">
              <Check className="w-4 h-4" />
              <span className="text-sm font-semibold">You&apos;re subscribed!</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && subscribe()}
                placeholder="your@email.com"
                className="w-full bg-white/8 border border-white/15 rounded-xs px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-all"
              />
              <button
                onClick={subscribe}
                disabled={emailState === "loading" || !email.includes("@")}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xs transition-all duration-200"
              >
                {emailState === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Subscribe<ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.aside>
  );
};







// "use client";

// import React, { useState } from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import {
//   Flame,
//   Star,
//   Mail,
//   Check,
//   ArrowRight,
//   Loader2,
// } from "lucide-react";
// import { BLOG_POSTS, BLOG_CATEGORIES, type BlogCategory } from "@/lib/data/blog-data";
// import { BlogCard } from "./blog-card";
// import { staggerContainer, staggerItem } from "@/lib/animations";
// import { cn } from "@/lib/utils";

// interface BlogSidebarProps {
//   activeCategory: BlogCategory | "All";
//   onCategory: (c: BlogCategory | "All") => void;
// }

// const trending = [...BLOG_POSTS]
//   .sort(
//     (a, b) =>
//       b.likeCount * 3 + b.commentCount * 5 + b.viewCount * 0.1 -
//       (a.likeCount * 3 + a.commentCount * 5 + a.viewCount * 0.1)
//   )
//   .slice(0, 5);

// const editorsPicks = BLOG_POSTS.filter((p) => p.isEditorsPick);

// export const BlogSidebar = ({ activeCategory, onCategory }: BlogSidebarProps) => {
//   const [email, setEmail] = useState("");
//   const [emailState, setEmailState] = useState<"idle" | "loading" | "success">("idle");

//   const subscribe = async () => {
//     if (!email || !email.includes("@")) return;
//     setEmailState("loading");
//     await new Promise((r) => setTimeout(r, 1200));
//     setEmailState("success");
//   };

//   return (
//     <motion.aside
//       variants={staggerContainer}
//       initial="hidden"
//       animate="visible"
//       className="space-y-6"
//     >
//       {/* Categories */}
//       <motion.div
//         variants={staggerItem}
//         className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm"
//       >
//         <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
//           Browse Topics
//         </p>
//         <div className="space-y-1">
//           <button
//             onClick={() => onCategory("All")}
//             className={cn(
//               "w-full flex items-center justify-between px-3 py-2.5 rounded-xs text-sm transition-all duration-200",
//               activeCategory === "All"
//                 ? "bg-gray-900 text-white font-semibold"
//                 : "text-gray-600 hover:bg-gray-50"
//             )}
//           >
//             <span>All Essays</span>
//             <span className={cn("text-xs px-2 py-0.5 rounded-xs", activeCategory === "All" ? "bg-white/20" : "bg-gray-100 text-gray-400")}>
//               {BLOG_POSTS.length}
//             </span>
//           </button>
//           {BLOG_CATEGORIES.map((cat) => {
//             const count = BLOG_POSTS.filter((p) => p.category === cat.name).length;
//             if (count === 0) return null;
//             return (
//               <button
//                 key={cat.name}
//                 onClick={() => onCategory(cat.name)}
//                 className={cn(
//                   "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all duration-200",
//                   activeCategory === cat.name
//                     ? "bg-amber-50 border border-amber-200 text-amber-800 font-semibold"
//                     : "text-gray-600 hover:bg-gray-50"
//                 )}
//               >
//                 <span className="text-base">{cat.icon}</span>
//                 <span className="flex-1 text-left">{cat.name}</span>
//                 <span className="text-xs text-gray-300">{count}</span>
//               </button>
//             );
//           })}
//         </div>
//       </motion.div>

//       {/* Trending */}
//       <motion.div
//         variants={staggerItem}
//         className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm"
//       >
//         <div className="flex items-center gap-2 mb-5">
//           <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
//           <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
//             Trending Now
//           </p>
//         </div>
//         <ol className="space-y-4">
//           {trending.map((post, i) => (
//             <li key={post.id} className="flex items-start gap-3 group">
//               <span className="text-2xl font-black text-gray-100 leading-none w-6 shrink-0 select-none">
//                 {i + 1}
//               </span>
//               <div>
//                 <Link
//                   href={`/blog/${post.slug}`}
//                   className="text-sm font-semibold text-gray-700 group-hover:text-amber-700 leading-snug line-clamp-2 transition-colors duration-200 block"
//                 >
//                   {post.title}
//                 </Link>
//                 <p className="text-xs text-gray-300 mt-1">
//                   {post.viewCount.toLocaleString()} reads
//                 </p>
//               </div>
//             </li>
//           ))}
//         </ol>
//       </motion.div>

//       {/* Editor's picks */}
//       {editorsPicks.length > 0 && (
//         <motion.div
//           variants={staggerItem}
//           className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm"
//         >
//           <div className="flex items-center gap-2 mb-5">
//             <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
//             <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
//               Editor&apos;s Picks
//             </p>
//           </div>
//           <div className="space-y-1">
//             {editorsPicks.map((post) => (
//               <BlogCard key={post.id} post={post} variant="compact" />
//             ))}
//           </div>
//         </motion.div>
//       )}

//       {/* Newsletter widget */}
//       <motion.div
//         variants={staggerItem}
//         className="relative bg-gray-900 rounded-xs p-6 overflow-hidden"
//       >
//         <div
//           className="absolute inset-0 opacity-[0.04]"
//           style={{
//             backgroundImage:
//               "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
//             backgroundSize: "20px 20px",
//           }}
//         />
//         <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
//         <div className="relative z-10">
//           <Mail className="w-6 h-6 text-amber-400 mb-3" />
//           <p className="text-base font-black text-white mb-2">
//             Get new essays first
//           </p>
//           <p className="text-xs text-white/50 leading-relaxed mb-5">
//             No newsletters. No noise. Just a note when something new and worth reading is published.
//           </p>

//           {emailState === "success" ? (
//             <div className="flex items-center gap-2 text-green-400">
//               <Check className="w-4 h-4" />
//               <span className="text-sm font-semibold">You&apos;re subscribed!</span>
//             </div>
//           ) : (
//             <div className="space-y-2.5">
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 onKeyDown={(e) => e.key === "Enter" && subscribe()}
//                 placeholder="your@email.com"
//                 className="w-full bg-white/8 border border-white/15 rounded-xs px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/50 transition-all"
//               />
//               <button
//                 onClick={subscribe}
//                 disabled={emailState === "loading" || !email.includes("@")}
//                 className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xs transition-all duration-200"
//               >
//                 {emailState === "loading" ? (
//                   <Loader2 className="w-4 h-4 animate-spin" />
//                 ) : (
//                   <>Subscribe<ArrowRight className="w-4 h-4" /></>
//                 )}
//               </button>
//             </div>
//           )}
//         </div>
//       </motion.div>
//     </motion.aside>
//   );
// };