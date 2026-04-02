// =============================================================================
// isaacpaha.com — Homepage
// app/page.tsx
// =============================================================================

import { BlogPreviewSection } from "@/components/_home/blog-preview-section";
import Footer from "@/components/_home/footer";
import { GameTeaserSection } from "@/components/_home/game-teaser-section";
import { HeroSection } from "@/components/_home/hero";
import Navbar from "@/components/_home/navbar";
import { NewsletterSection } from "@/components/_home/news-letter-section";
import { ProductsSection } from "@/components/_home/products-section";
import { TechStackSection } from "@/components/_home/tech-stack-section";
import { VisionSection } from "@/components/_home/vision-section";
import { SectionDivider } from "@/components/shared/section";
import { syncUser } from "@/lib/auth/sync-user";
import { prismadb } from "@/lib/db";
import type { DBPost, DBCategory } from "@/lib/types/blog";

export const metadata = {
  title: "Isaac Paha — Technologist, Entrepreneur & Thinker",
  description:
    "Building companies, products, and ideas that matter — impacting the world around me.",
};

export const revalidate = 600;

async function getHomepageBlogData(): Promise<{
  posts:      DBPost[];
  categories: DBCategory[];
}> {
  try {
    const [posts, categories] = await Promise.all([
      // 3 most recently published posts — no category filter so nulls are fine
      prismadb.blogPost.findMany({
        where: {
          status:    "PUBLISHED",
          deletedAt: null,
        },
        orderBy: { publishedAt: "desc" },
        take:    3,
        select: {
          id:                 true,
          slug:               true,
          title:              true,
          excerpt:            true,
          coverColor:         true,
          coverEmoji:         true,
          coverImage:         true,
          coverImageAlt:      true,
          tags:               true,
          publishedAt:        true,
          readingTimeMinutes: true,
          viewCount:          true,
          likeCount:          true,
          commentCount:       true,
          isFeatured:         true,
          isEditorPick:       true,
          seriesPart:         true,
          series:             { select: { title: true } },
          category:           { select: { name: true, color: true, icon: true } },
        },
      }),

      // Active categories for the pills
      prismadb.blogCategory.findMany({
        where:   { isActive: true },
        orderBy: { sortOrder: "asc" },
        take:    6,
        select: {
          id:          true,
          name:        true,
          slug:        true,
          icon:        true,
          color:       true,
          description: true,
        },
      }),
    ]);

    console.log("Fetched homepage blog posts:", posts.length);
    console.log("Fetched homepage categories:", categories.length);

    return { posts: posts as DBPost[], categories: categories as DBCategory[] };
  } catch (err) {
    console.error("Homepage blog fetch error:", err);
    return { posts: [], categories: [] };
  }
}

export default async function HomePage() {
  const [dbUser, { posts, categories }] = await Promise.all([
    syncUser(),
    getHomepageBlogData(),
  ]);

  return (
    <main>
      {/* --- Navbar */}
      <Navbar
        isAdmin={dbUser?.role === "ADMIN"}
        userId={dbUser?.clerkId ?? null}
      />

      {/* ── Hero ─────────────────────────── */}
      <HeroSection />

      {/* ── Products ──────────────────────── */}
      <SectionDivider />
      <ProductsSection />

      {/* ── Game Teaser ───────────────────── */}
      <GameTeaserSection />

      {/* ── Blog Preview ──────────────────── */}
      <SectionDivider />
      <BlogPreviewSection posts={posts} categories={categories} />

      {/* ── Vision / Manifesto ────────────── */}
      <VisionSection />

      {/* ── Tech Stack ────────────────────── */}
      <SectionDivider />
      <TechStackSection />

      {/* ── Newsletter ────────────────────── */}
      <SectionDivider />
      <NewsletterSection />

      {/* --- Footer */}
      <Footer />
    </main>
  );
}




// // =============================================================================
// // isaacpaha.com — Homepage
// // app/page.tsx
// // =============================================================================

// import { BlogPreviewSection } from "@/components/_home/blog-preview-section";
// import Footer from "@/components/_home/footer";
// import { GameTeaserSection } from "@/components/_home/game-teaser-section";
// import { HeroSection } from "@/components/_home/hero";
// import Navbar from "@/components/_home/navbar";
// import { NewsletterSection } from "@/components/_home/news-letter-section";
// import { ProductsSection } from "@/components/_home/products-section";
// import { TechStackSection } from "@/components/_home/tech-stack-section";
// import { VisionSection } from "@/components/_home/vision-section";
// import { SectionDivider } from "@/components/shared/section";
// import { syncUser } from "@/lib/auth/sync-user";
// import type { DBPost, DBCategory } from "@/lib/types/blog";

// export const metadata = {
//   title: "Isaac Paha — Technologist, Entrepreneur & Thinker",
//   description:
//     "Building companies, products, and ideas that matter — impacting the world around me.",
// };

// // Revalidate every 10 minutes — homepage doesn't need to be real-time
// export const revalidate = 600;

// const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.isaacpaha.com"

// async function getHomepageBlogData(): Promise<{
//   posts:      DBPost[];
//   categories: DBCategory[];
// }> {
//   try {
//     const res = await fetch(
//       `${BASE}/api/blog?pageSize=3&sort=latest`,
//       { next: { revalidate: 600 } }
//     );

//     if (!res.ok) return { posts: [], categories: [] };

//     const data = await res.json();

//     // Prefer editor's picks; fall back to latest 3
//     const editorsPicks: DBPost[] = (data.posts as DBPost[]).filter(
//       (p) => p.isEditorPick
//     );
//     const posts =
//       editorsPicks.length >= 2
//         ? editorsPicks.slice(0, 3)
//         : (data.posts as DBPost[]).slice(0, 3);

//     return {
//       posts,
//       categories: (data.categories as DBCategory[]).slice(0, 6),
//     };
//   } catch {
//     return { posts: [], categories: [] };
//   }
// }

// export default async function HomePage() {
//   const [dbUser, { posts, categories }] = await Promise.all([
//     syncUser(),
//     getHomepageBlogData(),
//   ]);
//   console.log("DB user:", dbUser);
//   console.log("Fetched homepage blog posts:", posts);
//   console.log("Fetched homepage categories:", categories);

//   return (
//     <main>
//       {/* --- Navbar */}
//       <Navbar
//         isAdmin={dbUser?.role === "ADMIN"}
//         userId={dbUser?.clerkId ?? null}
//       />

//       {/* ── Hero ─────────────────────────── */}
//       <HeroSection />

//       {/* ── Products ──────────────────────── */}
//       <SectionDivider />
//       <ProductsSection />

//       {/* ── Game Teaser ───────────────────── */}
//       <GameTeaserSection />

//       {/* ── Blog Preview ──────────────────── */}
//       <SectionDivider />
//       <BlogPreviewSection posts={posts} categories={categories} />

//       {/* ── Vision / Manifesto ────────────── */}
//       <VisionSection />

//       {/* ── Tech Stack ────────────────────── */}
//       <SectionDivider />
//       <TechStackSection />

//       {/* ── Newsletter ────────────────────── */}
//       <SectionDivider />
//       <NewsletterSection />

//       {/* --- Footer */}
//       <Footer />
//     </main>
//   );
// }





// // =============================================================================
// // isaacpaha.com — Homepage
// // app/page.tsx
// // =============================================================================

// import { BlogPreviewSection } from "@/components/_home/blog-preview-section";
// import Footer from "@/components/_home/footer";
// import { GameTeaserSection } from "@/components/_home/game-teaser-section";
// // import { CompaniesSection } from "@/components/_home/company-section";
// import { HeroSection } from "@/components/_home/hero";
// import Navbar from "@/components/_home/navbar";
// import { NewsletterSection } from "@/components/_home/news-letter-section";
// import { ProductsSection } from "@/components/_home/products-section";
// import { TechStackSection } from "@/components/_home/tech-stack-section";
// import { VisionSection } from "@/components/_home/vision-section";
// import { SectionDivider } from "@/components/shared/section";
// import { syncUser } from "@/lib/auth/sync-user";



// export const metadata = {
//   title: "Isaac Paha — Technologist, Entrepreneur & Thinker",
//   description:
//     "Building companies, products, and ideas that matter — impacting the world around me.",
// };

// export default async function HomePage() {
//   const dbUser = await syncUser();
//     // console.log("DB user:", dbUser);

//     // LET'S TRY OUT LOADING COMPONENT FOR 5 MINUTES TO SEE IF IT WORKS
//     // await new Promise((resolve) => setTimeout(resolve, 300000)); // Simulate loading delay of 5 minutes
//     // await new Promise((resolve) => setTimeout(resolve, 20000)); // Simulate loading delay
//   return (
    
//     <main>
//       {/* --- Navbar */}
//     <Navbar
//         isAdmin={dbUser?.role === "ADMIN"}
//         userId={dbUser?.clerkId ?? null}
//       />
//       {/* ── Hero ─────────────────────────── */}
//       <HeroSection />

//       {/* ── Companies ─────────────────────── */}
//       {/* <SectionDivider />
//       <CompaniesSection /> */}

//       {/* ── Products ──────────────────────── */}
//       <SectionDivider />
//       <ProductsSection />

//        {/* ── Game Teaser ───────────────────────────────────────────────── */}
//       {/*
//         Placed after Products and before Blog — visible, high-intent moment.
//         Users have seen what Isaac builds. Now they see a reason to stay and play.
//       */}
//       <GameTeaserSection />

//       {/* ── Blog Preview ──────────────────── */}
//       <SectionDivider />
//       <BlogPreviewSection />

//       {/* ── Vision / Manifesto ────────────── */}
//       <VisionSection />

//       {/* ── Tech Stack ────────────────────── */}
//       <SectionDivider />
//       <TechStackSection />

//       {/* ── Newsletter ────────────────────── */}
//       <SectionDivider />
//       <NewsletterSection />

//       {/* --- Footer -------------- */}
//       <Footer />
//     </main>
//   );
// }