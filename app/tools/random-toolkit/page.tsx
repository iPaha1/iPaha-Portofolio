// =============================================================================
// isaacpaha.com — Random Generator Toolkit — Dedicated Tool Page
// app/tools/random-toolkit/page.tsx
// Route: /tools/random-toolkit
//
// Pure server component — no auth or DB needed.
// This tool is fully client-side with zero data persistence.
// =============================================================================

import type { Metadata }        from "next";
import { RandomToolkitPage } from "./_random-toolkits/random-toolkit-page";


// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Random Generator Toolkit — 10 Free Generators for Developers",
  description:
    "10 random generators in one toolkit: secure passwords, random strings, UUID v4, numbers, fake test data, colours, dates, Lorem ipsum, Git commit messages, and hashes (SHA-256/512). All client-side, zero data stored.",
  openGraph: {
    title:       "Random Generator Toolkit | Free Developer Tools — Isaac Paha",
    description: "10 generators: passwords, UUIDs, strings, fake data, colours, hashes, and more. All instant, all free, all in your browser.",
    url:         "https://isaacpaha.com/tools/random-toolkit",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/random-toolkit.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Random Generator Toolkit | 10 Free Developer Tools",
    description: "Passwords, UUIDs, fake data, colours, hashes + more. All instant, all free.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/random-toolkit" },
  keywords: [
    "random generator", "password generator", "uuid generator", "random string generator",
    "fake data generator", "hash generator", "sha256 generator", "random number generator",
    "random colour generator", "lorem ipsum generator", "developer tools", "free tools",
    "random picker", "git commit message generator",
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RandomToolkit() {
  // No auth or DB prefetch needed — this is a pure client-side tool
  return <RandomToolkitPage />;
}