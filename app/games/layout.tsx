// app/games/layout.tsx
//
// Server layout for the /games section.
// Checks isGameTermsAccepted from the database and passes it to GamesTermsPopup
// so the popup only appears when truly needed — no flash of popup for users
// who have already accepted.
// =============================================================================

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/db";
import { GamesTermsPopup } from "./token-rush/_token-rush/games-terms-popup";

const homepageUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.isaacpaha.com";

export default async function GamesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ── Check acceptance from the database server-side ──────────────────────
  // This runs on the server so there's no flash of popup for accepted users.
  let hasAccepted = false;
  let isGameBanned = false;
  let clerkId = null;

  try {
    const { userId } = await auth();
    clerkId = userId;

    if (clerkId) {
      const user = await prismadb.user.findUnique({
        where:  { clerkId },
        select: { isGameTermsAccepted: true, isGameBanned: true },
      });
      hasAccepted = user?.isGameTermsAccepted ?? false;
      isGameBanned = user?.isGameBanned ?? false;
    }
    
    console.log(`[GamesLayout] DB check - hasAccepted: ${hasAccepted}, isGameBanned: ${isGameBanned}`);
    console.log(`[GamesLayout] User ID: ${clerkId}`);
    
  } catch (error) {
    // Only handle database/authentication errors here
    // DO NOT catch NEXT_REDIRECT errors
    console.error("[GamesLayout] Error checking user status:", error);
    hasAccepted = false;
    isGameBanned = false;
  }
  
  // Check for ban AFTER the try-catch, outside of it
  // This way the redirect can do its job without being caught
  if (isGameBanned) {
    redirect(`${homepageUrl}?gameBan=true`);
  }
  
  console.log(`[GamesLayout] Rendering layout - hasAccepted: ${hasAccepted}`);

  return (
    // GamesTermsPopup is a "use client" component — Next.js handles the
    // client/server boundary automatically here.
    <GamesTermsPopup initialAccepted={hasAccepted}>
      {children}
    </GamesTermsPopup>
  );
}



// // =============================================================================
// // app/games/layout.tsx
// //
// // Server layout for the /games section.
// // Checks isGameTermsAccepted from the database and passes it to GamesTermsPopup
// // so the popup only appears when truly needed — no flash of popup for users
// // who have already accepted.
// // =============================================================================

// import { auth } from "@clerk/nextjs/server";
// import { prismadb } from "@/lib/db";
// import { GamesTermsPopup } from "./token-rush/_token-rush/games-terms-popup";


// export default async function GamesLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   // ── Check acceptance from the database server-side ──────────────────────
//   // This runs on the server so there's no flash of popup for accepted users.
//   let hasAccepted = false;

//   try {
//     const { userId: clerkId } = await auth();

//     if (clerkId) {
//       const user = await prismadb.user.findUnique({
//         where:  { clerkId },
//         select: { isGameTermsAccepted: true },
//       });
//       hasAccepted = user?.isGameTermsAccepted ?? false;
//     }
//     // Unauthenticated users: hasAccepted stays false → popup will show
//   } catch {
//     // If DB check fails, default to showing the popup (safe fallback)
//     hasAccepted = false;
//   }

//   return (
//     // GamesTermsPopup is a "use client" component — Next.js handles the
//     // client/server boundary automatically here.
//     <GamesTermsPopup initialAccepted={hasAccepted}>
//       {children}
//     </GamesTermsPopup>
//   );
// }