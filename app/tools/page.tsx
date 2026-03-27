// =============================================================================
// isaacpaha.com — Tools Lab Page
// app/tools/page.tsx
// =============================================================================

import type { Metadata }   from "next";
import { ToolsLabClient }  from "./_tools/tools-lab-client";

export const metadata: Metadata = {
  title:       "Tools Lab — AI-Powered Tools for Builders, Students & Job Seekers",
  description: `${20}+ sharp AI tools for the moments that matter. CV analyser, startup validator, debt planner, learning engines, and more. Most are free to try — no faff, no filler.`,
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

export default function ToolsLabPage() {
  return <ToolsLabClient />;
}



// // =============================================================================
// // isaacpaha.com — Tools Lab Page
// // app/tools/page.tsx
// // =============================================================================

// import type { Metadata } from "next";
// import { ToolsLabClient } from "./_tools/tools-lab-client";


// export const metadata: Metadata = {
//   title: "Tools Lab — Free AI-Powered Tools for Builders",
//   description:
//     "Free AI-powered tools built for job seekers, founders, students, and writers. CV analyzer, startup idea generator, learning roadmap builder, readability checker and more. No accounts needed.",
//   openGraph: {
//     title: "Tools Lab | Isaac Paha",
//     description:
//       "Free AI-powered tools for job seekers, founders, students, and writers. No accounts needed.",
//     url: "https://www.isaacpaha.com/tools",
//   },
//   twitter: {
//     title: "Tools Lab | Isaac Paha",
//     description:
//       "Free AI-powered tools for job seekers, founders, students, and writers.",
//     card: "summary_large_image",
//   },
//   alternates: {
//     canonical: "https://www.isaacpaha.com/tools",
//   },
//   keywords: [
//     "free AI tools",
//     "CV analyzer",
//     "startup idea generator",
//     "learning roadmap",
//     "career tools",
//     "Isaac Paha",
//   ],
// };

// export default async function ToolsLabPage() {

//   return <ToolsLabClient />;
// }