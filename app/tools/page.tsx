// =============================================================================
// isaacpaha.com — Tools Lab Page
// app/tools/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { ToolsLabClient } from "./_tools/tools-lab-client";


export const metadata: Metadata = {
  title: "Tools Lab — Free AI-Powered Tools for Builders",
  description:
    "Free AI-powered tools built for job seekers, founders, students, and writers. CV analyzer, startup idea generator, learning roadmap builder, readability checker and more. No accounts needed.",
  openGraph: {
    title: "Tools Lab | Isaac Paha",
    description:
      "Free AI-powered tools for job seekers, founders, students, and writers. No accounts needed.",
    url: "https://www.isaacpaha.com/tools",
  },
  twitter: {
    title: "Tools Lab | Isaac Paha",
    description:
      "Free AI-powered tools for job seekers, founders, students, and writers.",
    card: "summary_large_image",
  },
  alternates: {
    canonical: "https://www.isaacpaha.com/tools",
  },
  keywords: [
    "free AI tools",
    "CV analyzer",
    "startup idea generator",
    "learning roadmap",
    "career tools",
    "Isaac Paha",
  ],
};

export default async function ToolsLabPage() {

  return <ToolsLabClient />;
}