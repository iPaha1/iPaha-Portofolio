// =============================================================================
// isaacpaha.com — Ideas Lab Page (Server Component)
// app/ideas/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { IdeasLabClient } from "./_ideas/ideas-lab-client";
import { prismadb } from "@/lib/db";
import type { DBIdea } from "@/lib/types/idea";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ideas Lab — Where Ideas Get Dangerous",
  description:
    "Isaac Paha's innovation playground. A living collection of startup concepts, future technologies, thought experiments, and half-baked theories exploring AI, Africa, fintech, education, and society.",
  openGraph: {
    title: "Ideas Lab | Isaac Paha",
    description:
      "A living collection of startup concepts, future technologies, and thought experiments.",
    url: "https://www.isaacpaha.com/ideas",
  },
  twitter: {
    title: "Ideas Lab | Isaac Paha",
    description:
      "A living collection of startup concepts, future technologies, and thought experiments.",
  },
  alternates: {
    canonical: "https://www.isaacpaha.com/ideas",
  },
};

const IDEA_SELECT = {
  id:          true,
  slug:        true,
  title:       true,
  summary:     true,
  coverImage:  true,
  category:    true,
  status:      true,
  tags:        true,
  isPublished: true,
  publishedAt: true,
  isFeatured:  true,
  viewCount:   true,
  likeCount:   true,
  commentCount:true,
} as const;

async function getIdeasPageData(): Promise<{
  ideas:       DBIdea[];
  featuredIdea: DBIdea | null;
  stats: {
    total:       number;
    developing:  number;
    launched:    number;
    totalViews:  number;
  };
}> {
  const [ideas, aggregate] = await Promise.all([
    prismadb.idea.findMany({
      where:   { isPublished: true },
      orderBy: { publishedAt: "desc" },
      select:  IDEA_SELECT,
    }),
    prismadb.idea.aggregate({
      where:  { isPublished: true },
      _count: { id: true },
      _sum:   { viewCount: true },
    }),
  ]);
  console.log("Fetched ideas from DB:", ideas);

  const featuredIdea = ideas.find((i) => i.isFeatured) ?? null;

  const stats = {
    total:      aggregate._count.id,
    developing: ideas.filter((i) => i.status === "DEVELOPING").length,
    launched:   ideas.filter((i) => i.status === "LAUNCHED").length,
    totalViews: aggregate._sum.viewCount ?? 0,
  };

  return { ideas: ideas as DBIdea[], featuredIdea: featuredIdea as DBIdea | null, stats };
}

export default async function IdeasLabPage() {
  const { ideas, featuredIdea, stats } = await getIdeasPageData();
  return <IdeasLabClient ideas={ideas} featuredIdea={featuredIdea} stats={stats} />;
}





// // =============================================================================
// // isaacpaha.com — Ideas Lab Page
// // app/ideas/page.tsx
// // =============================================================================

// import type { Metadata } from "next";
// import { IdeasLabClient } from "./_ideas/ideas-lab-client";

// const dynamic = 'force-dynamic'; // Ensure this page is always server-rendered for SEO and structured data purposes.
// export const metadata: Metadata = {
//   title: "Ideas Lab — Where Ideas Get Dangerous",
//   description:
//     "Isaac Paha's innovation playground. A living collection of startup concepts, future technologies, thought experiments, and half-baked theories exploring AI, Africa, fintech, education, and society.",
//   openGraph: {
//     title: "Ideas Lab | Isaac Paha",
//     description:
//       "A living collection of startup concepts, future technologies, and thought experiments.",
//     url: "https://www.isaacpaha.com/ideas",
//   },
//   twitter: {
//     title: "Ideas Lab | Isaac Paha",
//     description:
//       "A living collection of startup concepts, future technologies, and thought experiments.",
//   },
//   alternates: {
//     canonical: "https://www.isaacpaha.com/ideas",
//   },
// };

// export default function IdeasLabPage() {
//   return <IdeasLabClient />;
// }