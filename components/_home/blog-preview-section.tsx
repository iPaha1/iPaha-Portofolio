"use client";

// =============================================================================
// isaacpaha.com — Homepage Blog Preview Section
// components/_home/blog-preview-section.tsx
// =============================================================================

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Calendar } from "lucide-react";
import { Section, SectionHeader } from "@/components/shared/section";
import { staggerContainer, staggerItem } from "@/lib/animations";
import type { DBPost, DBCategory } from "@/lib/types/blog";

// ─── Category pill ────────────────────────────────────────────────────────────

const CategoryPill = ({ category }: { category: DBCategory }) => (
  <motion.div variants={staggerItem}>
    <Link
      href={`/blog?category=${encodeURIComponent(category.name)}`}
      className="group flex items-center gap-2.5 border border-gray-100 bg-white hover:border-amber-200 hover:bg-amber-50 px-4 py-2.5 rounded-xs transition-all duration-200"
    >
      <span className="text-lg">{category.icon}</span>
      <span className="text-sm font-medium text-gray-700 group-hover:text-amber-700">
        {category.name}
      </span>
      <ArrowRight className="w-3.5 h-3.5 ml-auto text-gray-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all duration-200" />
    </Link>
  </motion.div>
);

// ─── Featured post card ───────────────────────────────────────────────────────

const FeaturedPostCard = ({ post, index }: { post: DBPost; index: number }) => (
  <motion.div variants={staggerItem}>
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="relative bg-white border border-gray-100 rounded-xs p-7 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-50 transition-all duration-300 h-full overflow-hidden">
        {/* Accent line */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

        {/* Post number */}
        <span className="text-5xl font-black text-gray-50 absolute top-4 right-6 select-none pointer-events-none group-hover:text-amber-50 transition-colors duration-300">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Category — only shown if assigned */}
        {post.category?.name && (
          <span className="inline-block text-xs font-semibold tracking-widest uppercase text-amber-600 mb-4">
            {post.category.name}
          </span>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug group-hover:text-amber-700 transition-colors duration-200 pr-8">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-2">
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {post.readingTimeMinutes} min read
          </span>
          {post.publishedAt && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {new Date(post.publishedAt).toLocaleDateString("en-GB", {
                day:   "numeric",
                month: "short",
                year:  "numeric",
              })}
            </span>
          )}
        </div>

        {/* Read more */}
        <div className="flex items-center gap-1.5 mt-5 text-sm font-medium text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          Read article
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
        </div>
      </article>
    </Link>
  </motion.div>
);

// ─── Blog Preview Section ─────────────────────────────────────────────────────

interface BlogPreviewSectionProps {
  posts:      DBPost[];
  categories: DBCategory[];
}

export const BlogPreviewSection = ({
  posts,
  categories,
}: BlogPreviewSectionProps) => (
  <Section id="blog">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      {/* Left: header + categories */}
      <div className="lg:col-span-1">
        <SectionHeader
          eyebrow="From the Blog"
          title="Ideas worth reading"
          subtitle="Exploring technology, business, society, and the human experience."
          align="left"
        />

        {categories.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-2"
          >
            {categories.map((cat) => (
              <CategoryPill key={cat.id} category={cat} />
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8"
        >
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-6 py-3 rounded-xs transition-all duration-200 shadow-sm shadow-amber-200"
          >
            All Articles
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </motion.div>
      </div>

      {/* Right: posts */}
      <div className="lg:col-span-2">
        {posts.length === 0 ? (
          <div className="flex items-center justify-center h-full min-h-[200px] text-sm text-gray-400">
            No posts published yet.
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="space-y-5"
          >
            {posts.map((post, i) => (
              <FeaturedPostCard key={post.id} post={post} index={i} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  </Section>
);





// "use client";

// // =============================================================================
// // isaacpaha.com — Homepage Blog Preview Section
// // components/_home/blog-preview-section.tsx
// // =============================================================================

// import React from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { ArrowRight, Clock, Calendar } from "lucide-react";
// import { Section, SectionHeader } from "@/components/shared/section";
// import { staggerContainer, staggerItem } from "@/lib/animations";
// import type { DBPost, DBCategory } from "@/lib/types/blog";
// import { parseTags } from "@/lib/types/blog";

// // ─── Category pill ────────────────────────────────────────────────────────────

// const CategoryPill = ({ category }: { category: DBCategory }) => (
//   <motion.div variants={staggerItem}>
//     <Link
//       href={`/blog?category=${encodeURIComponent(category.name)}`}
//       className="group flex items-center gap-2.5 border border-gray-100 bg-white hover:border-amber-200 hover:bg-amber-50 px-4 py-2.5 rounded-xs transition-all duration-200"
//     >
//       <span className="text-lg">{category.icon}</span>
//       <span className="text-sm font-medium text-gray-700 group-hover:text-amber-700">
//         {category.name}
//       </span>
//       <ArrowRight className="w-3.5 h-3.5 ml-auto text-gray-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all duration-200" />
//     </Link>
//   </motion.div>
// );

// // ─── Featured post card ───────────────────────────────────────────────────────

// const FeaturedPostCard = ({
//   post,
//   index,
// }: {
//   post:  DBPost;
//   index: number;
// }) => (
//   <motion.div variants={staggerItem}>
//     <Link href={`/blog/${post.slug}`} className="group block">
//       <article className="relative bg-white border border-gray-100 rounded-xs p-7 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-50 transition-all duration-300 h-full overflow-hidden">
//         {/* Accent line */}
//         <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

//         {/* Post number */}
//         <span className="text-5xl font-black text-gray-50 absolute top-4 right-6 select-none pointer-events-none group-hover:text-amber-50 transition-colors duration-300">
//           {String(index + 1).padStart(2, "0")}
//         </span>

//         {/* Category */}
//         <span className="inline-block text-xs font-semibold tracking-widest uppercase text-amber-600 mb-4">
//           {post.category?.name}
//         </span>

//         {/* Title */}
//         <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug group-hover:text-amber-700 transition-colors duration-200 pr-8">
//           {post.title}
//         </h3>

//         {/* Excerpt */}
//         <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-2">
//           {post.excerpt}
//         </p>

//         {/* Meta */}
//         <div className="flex items-center gap-4 text-xs text-gray-400">
//           <span className="flex items-center gap-1.5">
//             <Clock className="w-3 h-3" />
//             {post.readingTimeMinutes} min read
//           </span>
//           <span className="flex items-center gap-1.5">
//             <Calendar className="w-3 h-3" />
//             {post.publishedAt
//               ? new Date(post.publishedAt).toLocaleDateString("en-GB", {
//                   day:   "numeric",
//                   month: "short",
//                   year:  "numeric",
//                 })
//               : ""}
//           </span>
//         </div>

//         {/* Read more */}
//         <div className="flex items-center gap-1.5 mt-5 text-sm font-medium text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
//           Read article
//           <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
//         </div>
//       </article>
//     </Link>
//   </motion.div>
// );

// // ─── Blog Preview Section ─────────────────────────────────────────────────────

// interface BlogPreviewSectionProps {
//   posts:      DBPost[];
//   categories: DBCategory[];
// }

// export const BlogPreviewSection = ({
//   posts,
//   categories,
// }: BlogPreviewSectionProps) => (
//   <Section id="blog">
//     <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
//       {/* Left: header + categories */}
//       <div className="lg:col-span-1">
//         <SectionHeader
//           eyebrow="From the Blog"
//           title="Ideas worth reading"
//           subtitle="Exploring technology, business, society, and the human experience."
//           align="left"
//         />

//         <motion.div
//           variants={staggerContainer}
//           initial="hidden"
//           whileInView="visible"
//           viewport={{ once: true, margin: "-60px" }}
//           className="space-y-2"
//         >
//           {categories.map((cat) => (
//             <CategoryPill key={cat.id} category={cat} />
//           ))}
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           transition={{ delay: 0.4, duration: 0.5 }}
//           className="mt-8"
//         >
//           <Link
//             href="/blog"
//             className="group inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-6 py-3 rounded-xs transition-all duration-200 shadow-sm shadow-amber-200"
//           >
//             All Articles
//             <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
//           </Link>
//         </motion.div>
//       </div>

//       {/* Right: featured posts */}
//       <div className="lg:col-span-2">
//         <motion.div
//           variants={staggerContainer}
//           initial="hidden"
//           whileInView="visible"
//           viewport={{ once: true, margin: "-60px" }}
//           className="space-y-5"
//         >
//           {posts.map((post, i) => (
//             <FeaturedPostCard key={post.id} post={post} index={i} />
//           ))}
//         </motion.div>
//       </div>
//     </div>
//   </Section>
// );





// "use client";

// import React from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { ArrowRight, Clock, Calendar } from "lucide-react";
// import { Section, SectionHeader } from "@/components/shared/section";
// import { staggerContainer, staggerItem } from "@/lib/animations";
// import { BLOG_CATEGORIES, FEATURED_POSTS } from "@/lib/data/site-data";


// // ─── Category pill ────────────────────────────────────────────────────────────
// const CategoryPill = ({
//   category,
// }: {
//   category: (typeof BLOG_CATEGORIES)[0];
// }) => (
//   <motion.div variants={staggerItem}>
//     <Link
//       href={`/blog/category/${category.slug}`}
//       className="group flex items-center gap-2.5 border border-gray-100 bg-white hover:border-amber-200 hover:bg-amber-50 px-4 py-2.5 rounded-xs transition-all duration-200"
//     >
//       <span className="text-lg">{category.icon}</span>
//       <span className="text-sm font-medium text-gray-700 group-hover:text-amber-700">
//         {category.name}
//       </span>
//       <ArrowRight className="w-3.5 h-3.5 ml-auto text-gray-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all duration-200" />
//     </Link>
//   </motion.div>
// );

// // ─── Featured post card ───────────────────────────────────────────────────────
// const FeaturedPostCard = ({
//   post,
//   index,
// }: {
//   post: (typeof FEATURED_POSTS)[0];
//   index: number;
// }) => (
//   <motion.div variants={staggerItem}>
//     <Link href={`/blog/${post.slug}`} className="group block">
//       <article className="relative bg-white border border-gray-100 rounded-xs p-7 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-50 transition-all duration-300 h-full overflow-hidden">
//         {/* Accent line */}
//         <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

//         {/* Post number */}
//         <span className="text-5xl font-black text-gray-50 absolute top-4 right-6 select-none pointer-events-none group-hover:text-amber-50 transition-colors duration-300">
//           {String(index + 1).padStart(2, "0")}
//         </span>

//         {/* Category */}
//         <span className="inline-block text-xs font-semibold tracking-widest uppercase text-amber-600 mb-4">
//           {post.category}
//         </span>

//         {/* Title */}
//         <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug group-hover:text-amber-700 transition-colors duration-200 pr-8">
//           {post.title}
//         </h3>

//         {/* Excerpt */}
//         <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-2">
//           {post.excerpt}
//         </p>

//         {/* Meta */}
//         <div className="flex items-center gap-4 text-xs text-gray-400">
//           <span className="flex items-center gap-1.5">
//             <Clock className="w-3 h-3" />
//             {post.readingTime} min read
//           </span>
//           <span className="flex items-center gap-1.5">
//             <Calendar className="w-3 h-3" />
//             {new Date(post.publishedAt).toLocaleDateString("en-GB", {
//               day: "numeric",
//               month: "short",
//               year: "numeric",
//             })}
//           </span>
//         </div>

//         {/* Read more */}
//         <div className="flex items-center gap-1.5 mt-5 text-sm font-medium text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
//           Read article
//           <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
//         </div>
//       </article>
//     </Link>
//   </motion.div>
// );

// // ─── Blog Section ─────────────────────────────────────────────────────────────
// export const BlogPreviewSection = () => (
//   <Section id="blog">
//     <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
//       {/* Left: header + categories */}
//       <div className="lg:col-span-1">
//         <SectionHeader
//           eyebrow="From the Blog"
//           title="Ideas worth reading"
//           subtitle="Exploring technology, business, society, and the human experience."
//           align="left"
//         />

//         <motion.div
//           variants={staggerContainer}
//           initial="hidden"
//           whileInView="visible"
//           viewport={{ once: true, margin: "-60px" }}
//           className="space-y-2"
//         >
//           {BLOG_CATEGORIES.map((cat) => (
//             <CategoryPill key={cat.slug} category={cat} />
//           ))}
//         </motion.div>

//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           viewport={{ once: true }}
//           transition={{ delay: 0.4, duration: 0.5 }}
//           className="mt-8"
//         >
//           <Link
//             href="/blog"
//             className="group inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm px-6 py-3 rounded-xs transition-all duration-200 shadow-sm shadow-amber-200"
//           >
//             All Articles
//             <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
//           </Link>
//         </motion.div>
//       </div>

//       {/* Right: featured posts */}
//       <div className="lg:col-span-2">
//         <motion.div
//           variants={staggerContainer}
//           initial="hidden"
//           whileInView="visible"
//           viewport={{ once: true, margin: "-60px" }}
//           className="space-y-5"
//         >
//           {FEATURED_POSTS.map((post, i) => (
//             <FeaturedPostCard key={post.slug} post={post} index={i} />
//           ))}
//         </motion.div>
//       </div>
//     </div>
//   </Section>
// );