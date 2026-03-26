// =============================================================================
// isaacpaha.com — Comparative Scripture Explorer — Server Page
// app/tools/scripture-explorer/page.tsx
// Route: /tools/scripture-explorer
// =============================================================================

import type { Metadata }          from "next";
import { currentUser }            from "@clerk/nextjs/server";
import { ScriptureExplorerPage } from "./_scripture-explorer/scripture-explorer-page";


export const metadata: Metadata = {
  title:       "Comparative Scripture Explorer — Bible, Qur'an & Tanakh Side by Side",
  description: "Explore themes, stories, and teachings across the Bible, Qur'an, and Hebrew Bible / Tanakh. AI-powered, neutral, educational. Understand similarities, differences, and historical context across the Abrahamic traditions.",
  openGraph: {
    title:       "Comparative Scripture Explorer | Isaac Paha Tools",
    description: "Respectful, educational AI tool for exploring the Bible, Qur'an, and Tanakh side by side. No rankings. No judgment. Just understanding.",
    url:         "https://isaacpaha.com/tools/scripture-explorer",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Comparative Scripture Explorer | Free Educational Tool",
    description: "Explore the Bible, Qur'an, and Tanakh side by side with AI. Neutral, respectful, educational.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/scripture-explorer" },
  keywords: [
    "comparative religion", "Bible Quran Tanakh comparison", "Abrahamic religions",
    "interfaith education", "scripture comparison tool", "Islam Christianity Judaism",
    "religious studies tool", "Bible study", "Quranic studies", "Torah study",
    "comparative theology", "interfaith understanding",
  ],
};

export default async function ScriptureExplorerServerPage() {
  const clerkUser = await currentUser().catch(() => null);
  return <ScriptureExplorerPage isSignedIn={!!clerkUser} />;
}