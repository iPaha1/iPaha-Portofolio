// =============================================================================
// isaacpaha.com — AI Kids Birthday Planner — Organiser Dashboard
// app/tools/kids-birthday-planner/[partyId]/page.tsx
// Route: /tools/kids-birthday-planner/[partyId]
//
// Server-side:
//   1. Authenticate via Clerk — redirect to sign-in if not signed in
//   2. Fetch party + guests + checklist + songs from DB
//   3. Verify party belongs to this user
//   4. Render PartyDashboard with full data
// =============================================================================

import type { Metadata }   from "next";
import { redirect }        from "next/navigation";
import { currentUser }     from "@clerk/nextjs/server";
import { prismadb }        from "@/lib/db";
import { PartyDashboard } from "../_birthday-planner/birthday-dashboard";


interface Props {
  params: Promise<{ partyId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title:  "Party Dashboard | AI Kids Birthday Planner",
    robots: { index: false, follow: false },
  };
}

export default async function PartyDashboardPage({ params }: Props) {
  const { partyId } = await params;

  // ── Auth ──────────────────────────────────────────────────────────────────
  const clerkUser = await currentUser().catch(() => null);
  if (!clerkUser) {
    redirect(`/sign-in?redirect_url=/tools/kids-birthday-planner/${partyId}`);
  }

  // ── Resolve DB user ───────────────────────────────────────────────────────
  const dbUser = await prismadb.user.findUnique({
    where:  { clerkId: clerkUser.id },
    select: { id: true },
  });
  if (!dbUser) {
    redirect("/sign-in");
  }

  // ── Fetch party (ownership enforced) ─────────────────────────────────────
  const party = await prismadb.party.findFirst({
    where: {
      id:     partyId,
      userId: dbUser.id,
    },
    include: {
      guests: {
        orderBy: { createdAt: "asc" },
      },
      checklist: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      },
      songs: {
        orderBy: [{ upvotes: "desc" }, { createdAt: "asc" }],
      },
    },
  });

  // ── 404 if not found or wrong owner ──────────────────────────────────────
  if (!party) {
    redirect("/tools/kids-birthday-planner");
  }

  // ── Serialise Prisma dates → plain JS objects safe for client components ─
  const serialised = JSON.parse(JSON.stringify(party));

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Sora, sans-serif" }}>
      {/* Minimal page chrome — the dashboard is the whole page */}
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-24">
        <PartyDashboard initialParty={serialised} />
      </div>
    </div>
  );
}