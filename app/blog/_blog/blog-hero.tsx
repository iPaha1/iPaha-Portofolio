"use client";

// =============================================================================
// isaacpaha.com — Blog Hero
// app/blog/_blog/blog-hero.tsx
// =============================================================================

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Eye, BookOpen, TrendingUp } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import type { DBPost, DBCategory, DBPostFull } from "@/lib/types/blog";
import { parseTags, formatPostDateLong } from "@/lib/types/blog";

interface BlogHeroProps {
  featuredPost:    Partial<DBPostFull> | null;
  totalPosts:      number;
  totalViews:      number;
  editorPickCount: number;
  categories:      DBCategory[];
  posts:           DBPost[]; // for category post counts in ribbon
}

export const BlogHero = ({
  featuredPost,
  totalPosts,
  totalViews,
  editorPickCount,
  categories,
  posts,
}: BlogHeroProps) => {
  if (!featuredPost) return null;

  const tags = parseTags(featuredPost.tags);

  return (
    <section className="relative bg-[#fafaf8] pt-28 pb-0 overflow-hidden">
      {/* Subtle texture */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='1' fill='%23d1d5db' opacity='0.3'/%3E%3C/svg%3E\")",
          backgroundSize: "4px 4px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          {/* Top section */}
          <motion.div
            variants={staggerItem}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-600">
                  Isaac Paha — Writing
                </span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-gray-900 leading-[0.9] tracking-tight">
                The<br />
                <span className="italic font-serif text-amber-500">Blog</span>
              </h1>
            </div>

            {/* Stats row — live from DB */}
            <div className="flex items-center gap-8 pb-1">
              {[
                { value: totalPosts.toString(),                           label: "Essays" },
                { value: `${(totalViews / 1000).toFixed(0)}k`,           label: "Reads" },
                { value: editorPickCount.toString(),                      label: "Editor's picks" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-black text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Decorative rule */}
          <motion.div
            variants={staggerItem}
            className="h-px bg-gradient-to-r from-gray-900 via-gray-300 to-transparent mb-10"
          />

          {/* Featured article */}
          <motion.div variants={staggerItem}>
            <Link href={`/blog/${featuredPost.slug}`} className="block group">
              <article className="grid grid-cols-1 lg:grid-cols-5 gap-0 border border-gray-200 hover:border-amber-300 transition-all duration-500 bg-white overflow-hidden rounded-xs shadow-sm hover:shadow-xl hover:shadow-amber-50">
                {/* Left: content */}
                <div className="lg:col-span-3 p-8 md:p-12 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <span
                        className="text-xs font-bold tracking-[0.15em] uppercase px-3 py-1.5 rounded-xs"
                        style={{
                          color:           featuredPost.category?.color ?? "#f59e0b",
                          backgroundColor: `${featuredPost.category?.color ?? "#f59e0b"}12`,
                        }}
                      >
                        {featuredPost.category?.icon} {featuredPost.category?.name}
                      </span>
                      <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">
                        Featured
                      </span>
                    </div>

                    <h2 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-6 group-hover:text-amber-900 transition-colors duration-300">
                      {featuredPost.title}
                    </h2>

                    <p className="text-lg text-gray-500 leading-relaxed mb-8 font-light max-w-lg">
                      {featuredPost.excerpt}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-8">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <div className="flex items-center gap-5 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {featuredPost.readingTimeMinutes} min read
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        {featuredPost.viewCount?.toLocaleString()} reads
                      </span>
                      <span>{formatPostDateLong(featuredPost.publishedAt ?? null)}</span>
                    </div>
                    <div className="group/cta flex items-center gap-2 font-semibold text-sm text-amber-600 group-hover:text-amber-500">
                      Read essay
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  </div>
                </div>

                {/* Right: decorative cover */}
                <div
                  className="lg:col-span-2 min-h-[280px] lg:min-h-full flex items-center justify-center relative overflow-hidden"
                  style={{ backgroundColor: `${featuredPost.coverColor ?? "#f59e0b"}10` }}
                >
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `radial-gradient(circle at 2px 2px, ${featuredPost.coverColor ?? "#f59e0b"}40 1px, transparent 0)`,
                      backgroundSize:  "28px 28px",
                    }}
                  />
                  <div className="relative z-10 text-center">
                    <span className="text-[120px] leading-none filter drop-shadow-xl">
                      {featuredPost.coverEmoji}
                    </span>
                    <div
                      className="mt-4 inline-block text-xs font-black tracking-[0.25em] uppercase px-4 py-2 rounded-xs"
                      style={{
                        color:            featuredPost.coverColor ?? "#f59e0b",
                        backgroundColor:  `${featuredPost.coverColor ?? "#f59e0b"}20`,
                        border:           `1px solid ${featuredPost.coverColor ?? "#f59e0b"}30`,
                      }}
                    >
                      Featured Essay
                    </div>
                  </div>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
                    style={{ backgroundColor: featuredPost.coverColor ?? "#f59e0b" }}
                  />
                </div>
              </article>
            </Link>
          </motion.div>

          {/* Category ribbon — counts from live posts */}
          <motion.div
            variants={staggerItem}
            className="flex items-center gap-2 overflow-x-auto scrollbar-none py-6"
          >
            {categories.map((cat) => {
              const count = cat._count?.posts ?? posts.filter((p) => p.category?.name === cat.name).length;
              return (
                <Link
                  key={cat.name}
                  href={`/blog?category=${encodeURIComponent(cat.name)}`}
                  className="shrink-0 group flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-amber-300 rounded-xs transition-all duration-200 hover:shadow-sm"
                >
                  <span>{cat.icon}</span>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
                    {cat.name}
                  </span>
                  <span className="text-xs text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded-xs">
                    {count}
                  </span>
                </Link>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};






// "use client";

// import React from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { ArrowRight, Clock, Eye, BookOpen, TrendingUp } from "lucide-react";
// import { staggerContainer, staggerItem } from "@/lib/animations";
// import { BLOG_POSTS, BLOG_CATEGORIES } from "@/lib/data/blog-data";

// const totalViews = BLOG_POSTS.reduce((s, p) => s + p.viewCount, 0);
// const totalPosts = BLOG_POSTS.length;
// const editorsPicks = BLOG_POSTS.filter((p) => p.isEditorsPick).length;

// export const BlogHero = () => {
//   const featured = BLOG_POSTS.find((p) => p.isFeatured)!;

//   return (
//     <section className="relative bg-[#fafaf8] pt-28 pb-0 overflow-hidden">
//       {/* Subtle texture */}
//       <div
//         className="absolute inset-0 opacity-[0.4]"
//         style={{
//           backgroundImage:
//             "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='1' height='1' fill='%23d1d5db' opacity='0.3'/%3E%3C/svg%3E\")",
//           backgroundSize: "4px 4px",
//         }}
//       />

//       <div className="max-w-7xl mx-auto px-4 relative z-10">
//         <motion.div
//           variants={staggerContainer}
//           initial="hidden"
//           animate="visible"
//         >
//           {/* Top section */}
//           <motion.div
//             variants={staggerItem}
//             className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-4"
//           >
//             <div>
//               <div className="flex items-center gap-2 mb-3">
//                 <BookOpen className="w-5 h-5 text-amber-600" />
//                 <span className="text-xs font-semibold tracking-[0.25em] uppercase text-amber-600">
//                   Isaac Paha — Writing
//                 </span>
//               </div>
//               <h1 className="text-6xl md:text-8xl font-black text-gray-900 leading-[0.9] tracking-tight">
//                 The<br />
//                 <span className="italic font-serif text-amber-500">Blog</span>
//               </h1>
//             </div>

//             {/* Stats row */}
//             <div className="flex items-center gap-8 pb-1">
//               {[
//                 { icon: BookOpen, value: totalPosts.toString(), label: "Essays" },
//                 { icon: Eye, value: `${(totalViews / 1000).toFixed(0)}k`, label: "Reads" },
//                 { icon: TrendingUp, value: editorsPicks.toString(), label: "Editor's picks" },
//               ].map(({ value, label }) => (
//                 <div key={label} className="text-center">
//                   <p className="text-2xl font-black text-gray-900">{value}</p>
//                   <p className="text-xs text-gray-400 mt-0.5">{label}</p>
//                 </div>
//               ))}
//             </div>
//           </motion.div>

//           {/* Decorative rule */}
//           <motion.div
//             variants={staggerItem}
//             className="h-px bg-gradient-to-r from-gray-900 via-gray-300 to-transparent mb-10"
//           />

//           {/* Featured article — editorial spread */}
//           <motion.div variants={staggerItem}>
//             <Link href={`/blog/${featured.slug}`} className="block group">
//               <article className="grid grid-cols-1 lg:grid-cols-5 gap-0 border border-gray-200 hover:border-amber-300 transition-all duration-500 bg-white overflow-hidden rounded-xs shadow-sm hover:shadow-xl hover:shadow-amber-50">
//                 {/* Left: content */}
//                 <div className="lg:col-span-3 p-8 md:p-12 flex flex-col justify-between">
//                   <div>
//                     {/* Meta */}
//                     <div className="flex items-center gap-3 mb-6">
//                       <span
//                         className="text-xs font-bold tracking-[0.15em] uppercase px-3 py-1.5 rounded-xs"
//                         style={{
//                           color: featured.coverColor,
//                           backgroundColor: `${featured.coverColor}12`,
//                         }}
//                       >
//                         {featured.category}
//                       </span>
//                       <span className="text-xs text-gray-400 font-semibold tracking-wider uppercase">
//                         Featured
//                       </span>
//                     </div>

//                     {/* Title */}
//                     <h2 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-6 group-hover:text-amber-900 transition-colors duration-300">
//                       {featured.title}
//                     </h2>

//                     {/* Excerpt */}
//                     <p className="text-lg text-gray-500 leading-relaxed mb-8 font-light max-w-lg">
//                       {featured.excerpt}
//                     </p>

//                     {/* Tags */}
//                     <div className="flex flex-wrap gap-2 mb-8">
//                       {featured.tags.map((tag) => (
//                         <span
//                           key={tag}
//                           className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-xs"
//                         >
//                           {tag}
//                         </span>
//                       ))}
//                     </div>
//                   </div>

//                   {/* Footer */}
//                   <div className="flex items-center justify-between pt-6 border-t border-gray-100">
//                     <div className="flex items-center gap-5 text-sm text-gray-400">
//                       <span className="flex items-center gap-1.5">
//                         <Clock className="w-3.5 h-3.5" />
//                         {featured.readingTime} min read
//                       </span>
//                       <span className="flex items-center gap-1.5">
//                         <Eye className="w-3.5 h-3.5" />
//                         {featured.viewCount.toLocaleString()} reads
//                       </span>
//                       <span>
//                         {new Date(featured.publishedAt).toLocaleDateString("en-GB", {
//                           day: "numeric",
//                           month: "long",
//                           year: "numeric",
//                         })}
//                       </span>
//                     </div>
//                     <div className="group/cta flex items-center gap-2 font-semibold text-sm text-amber-600 group-hover:text-amber-500">
//                       Read essay
//                       <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Right: decorative cover */}
//                 <div
//                   className="lg:col-span-2 min-h-[280px] lg:min-h-full flex items-center justify-center relative overflow-hidden"
//                   style={{ backgroundColor: `${featured.coverColor}10` }}
//                 >
//                   {/* Pattern */}
//                   <div
//                     className="absolute inset-0 opacity-30"
//                     style={{
//                       backgroundImage: `radial-gradient(circle at 2px 2px, ${featured.coverColor}40 1px, transparent 0)`,
//                       backgroundSize: "28px 28px",
//                     }}
//                   />
//                   {/* Large emoji */}
//                   <div className="relative z-10 text-center">
//                     <span className="text-[120px] leading-none filter drop-shadow-xl">
//                       {featured.coverEmoji}
//                     </span>
//                     <div
//                       className="mt-4 inline-block text-xs font-black tracking-[0.25em] uppercase px-4 py-2 rounded-xs"
//                       style={{
//                         color: featured.coverColor,
//                         backgroundColor: `${featured.coverColor}20`,
//                         border: `1px solid ${featured.coverColor}30`,
//                       }}
//                     >
//                       Featured Essay
//                     </div>
//                   </div>
//                   {/* Hover overlay */}
//                   <div
//                     className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500"
//                     style={{ backgroundColor: featured.coverColor }}
//                   />
//                 </div>
//               </article>
//             </Link>
//           </motion.div>

//           {/* Category ribbon */}
//           <motion.div
//             variants={staggerItem}
//             className="flex items-center gap-2 overflow-x-auto scrollbar-none py-6"
//           >
//             {BLOG_CATEGORIES.map((cat) => {
//               const count = BLOG_POSTS.filter((p) => p.category === cat.name).length;
//               return (
//                 <Link
//                   key={cat.name}
//                   href={`/blog?category=${cat.name}`}
//                   className="shrink-0 group flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:border-amber-300 rounded-xs transition-all duration-200 hover:shadow-sm"
//                 >
//                   <span>{cat.icon}</span>
//                   <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">
//                     {cat.name}
//                   </span>
//                   <span className="text-xs text-gray-300 bg-gray-50 px-1.5 py-0.5 rounded-xs">
//                     {count}
//                   </span>
//                 </Link>
//               );
//             })}
//           </motion.div>
//         </motion.div>
//       </div>
//     </section>
//   );
// };