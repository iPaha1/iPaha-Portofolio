"use client";

// =============================================================================
// isaacpaha.com — Featured Idea Card
// app/ideas/_ideas/featured-idea-card.tsx
// =============================================================================

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, Heart, MessageSquare, Clock, ArrowRight, Star } from "lucide-react";
import type { DBIdea } from "@/lib/types/idea";
import { IDEA_CATEGORY_CONFIG, IDEA_STATUS_CONFIG, parseIdeaTags } from "@/lib/types/idea";
import { staggerContainer, staggerItem } from "@/lib/animations";

export const FeaturedIdeaCard = ({ idea }: { idea: DBIdea }) => {
  const category = IDEA_CATEGORY_CONFIG[idea.category];
  const status   = IDEA_STATUS_CONFIG[idea.status];
  const tags     = parseIdeaTags(idea.tags);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="max-w-6xl mx-auto px-4 mb-8"
    >
      <motion.div variants={staggerItem} className="mb-4 flex items-center gap-2">
        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-400">
          Featured Idea
        </span>
      </motion.div>

      <Link href={`/ideas/${idea.slug}`} className="block group">
        <motion.article
          variants={staggerItem}
          whileHover={{ y: -2 }}
          className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-white/10 rounded-xs overflow-hidden hover:border-amber-500/30 transition-all duration-500"
        >
          {/* Amber glow top */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60" />

          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize:  "24px 24px",
            }}
          />

          <div className="relative z-10 p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
              {/* Main content */}
              <div className="lg:col-span-3">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                  <span
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xs border"
                    style={{
                      color:           category.color,
                      backgroundColor: `${category.color}15`,
                      borderColor:     `${category.color}30`,
                    }}
                  >
                    <span>{category.icon}</span>
                    {category.label}
                  </span>

                  <span
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xs border ${status.bg} ${status.border} ${status.color}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                    {status.label}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-5 group-hover:text-amber-100 transition-colors duration-300">
                  {idea.title}
                </h2>

                {/* Summary */}
                <p className="text-white/60 text-lg leading-relaxed mb-8">
                  {idea.summary}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs text-white/40 bg-white/5 border border-white/8 px-3 py-1 rounded-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 group-hover:text-amber-300 transition-colors duration-200">
                  Explore this idea
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>

              {/* Stats panel */}
              <div className="lg:col-span-2">
                <div className="bg-white/3 border border-white/8 rounded-xs p-6 space-y-4">
                  <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-5">
                    Engagement
                  </p>

                  {[
                    { icon: Eye,           value: idea.viewCount.toLocaleString(),   label: "Views"     },
                    { icon: Heart,         value: idea.likeCount.toLocaleString(),   label: "Likes"     },
                    { icon: MessageSquare, value: idea.commentCount.toLocaleString(),label: "Comments"  },
                    { icon: Clock,         value: "5 min",                           label: "Read time" },
                  ].map(({ icon: Icon, value, label }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-white/30" />
                        <span className="text-sm text-white/50">{label}</span>
                      </div>
                      <span className="text-sm font-bold text-white">{value}</span>
                    </div>
                  ))}

                  {idea.publishedAt && (
                    <div className="pt-2">
                      <p className="text-xs text-white/30">
                        Published{" "}
                        <span className="text-white/50">
                          {new Date(idea.publishedAt).toLocaleDateString("en-GB", {
                            day: "numeric", month: "long", year: "numeric",
                          })}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.article>
      </Link>
    </motion.div>
  );
};





// "use client";

// import React from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { Eye, Heart, MessageSquare, Clock, ArrowRight, Star } from "lucide-react";
// import { type Idea, STATUS_CONFIG, IDEA_CATEGORIES } from "@/lib/data/ideas-data";
// import { staggerContainer, staggerItem } from "@/lib/animations";

// export const FeaturedIdeaCard = ({ idea }: { idea: Idea }) => {
//   const status = STATUS_CONFIG[idea.status];
//   const category = IDEA_CATEGORIES.find((c) => c.name === idea.category);

//   return (
//     <motion.div
//       variants={staggerContainer}
//       initial="hidden"
//       whileInView="visible"
//       viewport={{ once: true, margin: "-60px" }}
//       className="max-w-6xl mx-auto px-4 mb-8"
//     >
//       <motion.div variants={staggerItem} className="mb-4 flex items-center gap-2">
//         <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
//         <span className="text-xs font-semibold tracking-[0.2em] uppercase text-amber-400">
//           Featured Idea
//         </span>
//       </motion.div>

//       <Link href={`/ideas/${idea.slug}`} className="block group">
//         <motion.article
//           variants={staggerItem}
//           whileHover={{ y: -2 }}
//           className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-white/10 rounded-xs overflow-hidden hover:border-amber-500/30 transition-all duration-500"
//         >
//           {/* Amber glow top */}
//           <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60" />

//           {/* Background pattern */}
//           <div
//             className="absolute inset-0 opacity-[0.03]"
//             style={{
//               backgroundImage:
//                 "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
//               backgroundSize: "24px 24px",
//             }}
//           />

//           <div className="relative z-10 p-8 md:p-12">
//             <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
//               {/* Main content */}
//               <div className="lg:col-span-3">
//                 {/* Badges */}
//                 <div className="flex flex-wrap items-center gap-2 mb-6">
//                   {/* Category */}
//                   <span
//                     className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xs border"
//                     style={{
//                       color: category?.color,
//                       backgroundColor: `${category?.color}15`,
//                       borderColor: `${category?.color}30`,
//                     }}
//                   >
//                     <span>{category?.icon}</span>
//                     {idea.category}
//                   </span>

//                   {/* Status */}
//                   <span
//                     className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xs border ${status.bg} ${status.border} ${status.color}`}
//                   >
//                     <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
//                     {status.label}
//                   </span>
//                 </div>

//                 {/* Title */}
//                 <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-5 group-hover:text-amber-100 transition-colors duration-300">
//                   {idea.title}
//                 </h2>

//                 {/* Summary */}
//                 <p className="text-white/60 text-lg leading-relaxed mb-8">
//                   {idea.summary}
//                 </p>

//                 {/* Tags */}
//                 <div className="flex flex-wrap gap-2 mb-8">
//                   {idea.tags.map((tag) => (
//                     <span
//                       key={tag}
//                       className="text-xs text-white/40 bg-white/5 border border-white/8 px-3 py-1 rounded-xs"
//                     >
//                       {tag}
//                     </span>
//                   ))}
//                 </div>

//                 {/* CTA */}
//                 <div className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 group-hover:text-amber-300 transition-colors duration-200">
//                   Explore this idea
//                   <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
//                 </div>
//               </div>

//               {/* Stats panel */}
//               <div className="lg:col-span-2">
//                 <div className="bg-white/3 border border-white/8 rounded-xs p-6 space-y-4">
//                   <p className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-5">
//                     Engagement
//                   </p>

//                   {[
//                     { icon: Eye, value: idea.viewCount.toLocaleString(), label: "Views" },
//                     { icon: Heart, value: idea.likeCount.toLocaleString(), label: "Likes" },
//                     { icon: MessageSquare, value: idea.commentCount.toLocaleString(), label: "Comments" },
//                     { icon: Clock, value: `${idea.readingTime} min`, label: "Read time" },
//                   ].map(({ icon: Icon, value, label }) => (
//                     <div key={label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
//                       <div className="flex items-center gap-3">
//                         <Icon className="w-4 h-4 text-white/30" />
//                         <span className="text-sm text-white/50">{label}</span>
//                       </div>
//                       <span className="text-sm font-bold text-white">{value}</span>
//                     </div>
//                   ))}

//                   <div className="pt-2">
//                     <p className="text-xs text-white/30">
//                       Published{" "}
//                       <span className="text-white/50">
//                         {new Date(idea.publishedAt).toLocaleDateString("en-GB", {
//                           day: "numeric",
//                           month: "long",
//                           year: "numeric",
//                         })}
//                       </span>
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </motion.article>
//       </Link>
//     </motion.div>
//   );
// };