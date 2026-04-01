// =============================================================================
// isaacpaha.com — Tools Lab Page (Server Component)
// app/tools/page.tsx
// =============================================================================

import type { Metadata }  from "next";
import { getPublicTools } from "@/lib/actions/tools-actions";
import { ToolsLabClient } from "./_tools/tools-lab-client";
import type { DbTool }    from "./_tools/tools-lab-client";

export const metadata: Metadata = {
  title:       "Tools Lab — AI-Powered Tools for Builders, Students & Job Seekers",
  description: "20+ sharp AI tools for the moments that matter. CV analyser, startup validator, debt planner, learning engines, and more. Most are free to try.",
  openGraph: {
    title:       "Tools Lab | Isaac Paha",
    description: "20+ AI tools for job seekers, founders, students, and anyone with a problem to solve.",
    url:         "https://www.isaacpaha.com/tools",
  },
  twitter: {
    title:       "Tools Lab | Isaac Paha",
    description: "20+ AI tools. Real problems. No fluff.",
    card:        "summary_large_image",
  },
  alternates: { canonical: "https://www.isaacpaha.com/tools" },
  keywords: [
    "AI tools", "CV analyser", "startup idea generator", "debt planner",
    "learning roadmap", "chemistry engine", "physics engine", "Isaac Paha",
  ],
};

export default async function ToolsLabPage() {
  const dbTools = await getPublicTools();
  console.log("Tools fetched from DB:", dbTools);
  console.log(`==============[ToolsLabPage] Fetched ${dbTools.length} tools from the database================`);

  return <ToolsLabClient tools={dbTools as DbTool[]} />;
}






// // =============================================================================
// // isaacpaha.com — Tools Lab Page
// // app/tools/page.tsx
// // =============================================================================

// import type { Metadata }   from "next";
// import { ToolsLabClient }  from "./_tools/tools-lab-client";
// import { prismadb } from "@/lib/db";

// export const metadata: Metadata = {
//   title:       "Tools Lab — AI-Powered Tools for Builders, Students & Job Seekers",
//   description: `${20}+ sharp AI tools for the moments that matter. CV analyser, startup validator, debt planner, learning engines, and more. Most are free to try — no faff, no filler.`,
//   openGraph: {
//     title:       "Tools Lab | Isaac Paha",
//     description: "20+ AI tools for job seekers, founders, students, and anyone with a problem to solve.",
//     url:         "https://www.isaacpaha.com/tools",
//   },
//   twitter: {
//     title:       "Tools Lab | Isaac Paha",
//     description: "20+ AI tools. Real problems. No fluff.",
//     card:        "summary_large_image",
//   },
//   alternates: { canonical: "https://www.isaacpaha.com/tools" },
//   keywords: [
//     "AI tools", "CV analyser", "startup idea generator", "debt planner",
//     "learning roadmap", "chemistry engine", "physics engine", "Isaac Paha",
//   ],
// };

// export default async function ToolsLabPage() {

//   // Let's Get all the tools from the database and pass them to the client component.

//   const tools = await prismadb.tool.findMany({
//     where: { isActive: true },
//     orderBy: { createdAt: "desc" },
//   });
//   console.log("Tools fetched from DB:", tools);
//   console.log(`==============[ToolsLabPage] Fetched ${tools.length} tools from the database================`);


//   return <ToolsLabClient />;
// }
