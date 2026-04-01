// =============================================================================
// isaacpaha.com — Shared Shopping List Page
// app/tools/smart-shopping-list/share/[shareId]/page.tsx
//
// Route: /tools/smart-shopping-list/share/[shareId]
//
// Server component: fetches the list by shareId on request.
// Hands off to a client component for real-time polling + interactions.
// Anyone with the link can view, tick off items, and add new items.
// =============================================================================

import type { Metadata }      from "next";
import { notFound }           from "next/navigation";
import { SharedListClient } from "../../_smart-shopping-list/shopping-list-share-client";


interface Props {
  params: Promise<{ shareId: string }>;
}

// ─── Fetch list server-side ───────────────────────────────────────────────────

async function getList(shareId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/tools/shopping/share?shareId=${shareId}`, {
      next: { revalidate: 0 },           // always fresh — it's a live collaborative list
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.list ?? null;
  } catch {
    return null;
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
        const { shareId } = await params;

  const list = await getList(shareId);
  if (!list) return { title: "Shared Shopping List" };

  const done    = list.boughtCount ?? 0;
  const total   = list.itemCount   ?? 0;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

  return {
    title:       `${list.emoji} ${list.name} — Shared Shopping List`,
    description: `${total} item${total !== 1 ? "s" : ""} · ${pct}% done · Tap to tick off items as you shop.`,
    robots:      { index: false, follow: false },  // shared lists are personal — don't index
    openGraph: {
      title:       `${list.emoji} ${list.name}`,
      description: `Shared shopping list — ${total} items. Open to shop together.`,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SharedListPage({ params }: Props) {
    const { shareId } = await params;
  const list = await getList(shareId);
  console.log("Shopping list:", list)
  if (!list) notFound();

  return <SharedListClient initialList={list} shareId={shareId} />;
}