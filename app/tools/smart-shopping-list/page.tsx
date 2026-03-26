// =============================================================================
// isaacpaha.com — Smart Shared Shopping List — Dedicated Tool Page
// app/tools/smart-shopping-list/page.tsx
// Route: /tools/smart-shopping-list
// =============================================================================

import type { Metadata }      from "next";
import { currentUser }        from "@clerk/nextjs/server";
import { ShoppingListPage } from "./_smart-shopping-list/shopping-list-page";


// ─── SEO Metadata ─────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Smart Shared Shopping List — Real-Time Collaborative Grocery Lists",
  description:
    "Create and share shopping lists instantly. One link — your family sees updates in real-time as you shop. Add items, tick things off, set budgets, and generate lists from your meal plan with AI. Free.",
  openGraph: {
    title:       "Smart Shared Shopping List | Free Tool — Isaac Paha",
    description: "Create a list, share a link, shop together in real-time. No app download. Free.",
    url:         "https://isaacpaha.com/tools/smart-shopping-list",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/shopping-list.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Smart Shared Shopping List | Free Tool",
    description: "One link, real-time updates, AI meal planner, budget tracker. The shopping list that works for the whole family.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/smart-shopping-list" },
  keywords: [
    "shared shopping list", "collaborative grocery list", "real-time shopping list",
    "family shopping list", "couple shopping list", "grocery list app",
    "shareable shopping list", "AI shopping list", "meal plan shopping list",
    "budget grocery list", "smart shopping list free",
  ],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SmartShoppingListPage() {
  const clerkUser = await currentUser().catch(() => null);
  return <ShoppingListPage isSignedIn={!!clerkUser} />;
}