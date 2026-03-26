// =============================================================================
// isaacpaha.com — Ideas Lab Page
// app/ideas/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { IdeasLabClient } from "./_ideas/ideas-lab-client";


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

export default function IdeasLabPage() {
  return <IdeasLabClient />;
}