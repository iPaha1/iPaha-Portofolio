// =============================================================================
// isaacpaha.com — Blog Page
// app/blog/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { BlogClient } from "./_blog/blog-client";


export const metadata: Metadata = {
  title: "Blog — Essays on Technology, Business, Africa & Life",
  description:
    "Isaac Paha's writing on technology, startups, AI, Africa, education, and life. Thoughtful long-form essays for builders, founders, and curious minds.",
  openGraph: {
    title: "Blog | Isaac Paha",
    description:
      "Long-form essays on technology, startups, AI, Africa, and life.",
    url: "https://www.isaacpaha.com/blog",
    type: "website",
  },
  twitter: {
    title: "Blog | Isaac Paha",
    description:
      "Long-form essays on technology, startups, AI, Africa, and life.",
    card: "summary_large_image",
    creator: "@iPaha3",
  },
  alternates: {
    canonical: "https://www.isaacpaha.com/blog",
  },
  keywords: [
    "Isaac Paha blog",
    "technology essays",
    "Africa tech",
    "startup insights",
    "AI future",
    "software engineering",
  ],
};

export default function BlogPage() {
  return <BlogClient />;
}