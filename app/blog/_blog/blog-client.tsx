"use client";

// =============================================================================
// isaacpaha.com — Blog Client
// app/blog/_blog/blog-client.tsx
// =============================================================================

import React, { useState, useMemo } from "react";
import { BlogFilterBar, type SortOption } from "./blog-filter-bar";
import { BlogHero } from "./blog-hero";
import { BlogGrid } from "./blog-grid";
import { BlogSidebar } from "./blog-sidebar";
import type { DBPost, DBCategory, DBPostFull } from "@/lib/types/blog";
import { parseTags } from "@/lib/types/blog";

interface BlogClientProps {
  posts:           DBPost[];
  total:           number;
  categories:      DBCategory[];
  featuredPost:    Partial<DBPostFull> | null;
  totalPosts:      number;
  totalViews:      number;
  editorPickCount: number;
  trending:        DBPost[];
  editorsPicks:    DBPost[];
}

export const BlogClient = ({
  posts,
  categories,
  featuredPost,
  totalPosts,
  totalViews,
  editorPickCount,
  trending,
  editorsPicks,
}: BlogClientProps) => {
  const [search,         setSearch]         = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sort,           setSort]           = useState<SortOption>("latest");

  const filtered = useMemo(() => {
    let result = posts;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          parseTags(p.tags).some((t) => t.toLowerCase().includes(q)) ||
          p.category?.name.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== "All") {
      result = result.filter((p) => p.category?.name === activeCategory);
    }

    switch (sort) {
      case "popular":
        return [...result].sort((a, b) => b.viewCount - a.viewCount);
      case "trending":
        return [...result].sort(
          (a, b) =>
            b.likeCount * 3 + b.commentCount * 5 + b.viewCount * 0.1 -
            (a.likeCount * 3 + a.commentCount * 5 + a.viewCount * 0.1)
        );
      case "latest":
      default:
        return [...result].sort(
          (a, b) =>
            new Date(b.publishedAt ?? 0).getTime() -
            new Date(a.publishedAt ?? 0).getTime()
        );
    }
  }, [posts, search, activeCategory, sort]);

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <BlogHero
        featuredPost={featuredPost}
        totalPosts={totalPosts}
        totalViews={totalViews}
        editorPickCount={editorPickCount}
        categories={categories}
        posts={posts}
      />

      <BlogFilterBar
        search={search}
        onSearch={setSearch}
        activeCategory={activeCategory}
        onCategory={setActiveCategory}
        sort={sort}
        onSort={setSort}
        totalResults={filtered.length}
        categories={categories}
      />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <BlogGrid posts={filtered} />
          </div>
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-52">
              <BlogSidebar
                activeCategory={activeCategory}
                onCategory={setActiveCategory}
                categories={categories}
                posts={posts}
                trending={trending}
                editorsPicks={editorsPicks}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};





// "use client";

// import React, { useState, useMemo } from "react";
// import { BLOG_POSTS, type BlogCategory } from "@/lib/data/blog-data";
// import { BlogFilterBar, SortOption } from "./blog-filter-bar";
// import { BlogHero } from "./blog-hero";
// import { BlogGrid } from "./blog-grid";
// import { BlogSidebar } from "./blog-sidebar";

// interface BlogClientProps {
//   initialCategory?: BlogCategory | "All";
// }

// export const BlogClient = ({ initialCategory = "All" }: BlogClientProps) => {
//   const [search, setSearch] = useState("");
//   const [activeCategory, setActiveCategory] = useState<BlogCategory | "All">(initialCategory);
//   const [sort, setSort] = useState<SortOption>("latest");

//   const filtered = useMemo(() => {
//     let posts = BLOG_POSTS.filter((p) => p.status === "PUBLISHED");

//     if (search) {
//       const q = search.toLowerCase();
//       posts = posts.filter(
//         (p) =>
//           p.title.toLowerCase().includes(q) ||
//           p.excerpt.toLowerCase().includes(q) ||
//           p.tags.some((t) => t.toLowerCase().includes(q)) ||
//           p.category.toLowerCase().includes(q)
//       );
//     }

//     if (activeCategory !== "All") {
//       posts = posts.filter((p) => p.category === activeCategory);
//     }

//     // Sort
//     switch (sort) {
//       case "popular":
//         return [...posts].sort((a, b) => b.viewCount - a.viewCount);
//       case "trending":
//         return [...posts].sort(
//           (a, b) =>
//             b.likeCount * 3 + b.commentCount * 5 + b.viewCount * 0.1 -
//             (a.likeCount * 3 + a.commentCount * 5 + a.viewCount * 0.1)
//         );
//       case "latest":
//       default:
//         return [...posts].sort(
//           (a, b) =>
//             new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
//         );
//     }
//   }, [search, activeCategory, sort]);

//   return (
//     <div className="min-h-screen bg-[#fafaf8]">
//       <BlogHero />

//       <BlogFilterBar
//         search={search}
//         onSearch={setSearch}
//         activeCategory={activeCategory}
//         onCategory={setActiveCategory}
//         sort={sort}
//         onSort={setSort}
//         totalResults={filtered.length}
//       />

//       <div className="max-w-7xl mx-auto px-4 py-12">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
//           <div className="lg:col-span-2">
//             <BlogGrid posts={filtered} />
//           </div>
//           <div className="lg:col-span-1">
//             <div className="lg:sticky lg:top-52">
//               <BlogSidebar
//                 activeCategory={activeCategory}
//                 onCategory={setActiveCategory}
//               />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };