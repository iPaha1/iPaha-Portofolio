// app/apps/tools/layout.tsx
// =============================================================================
// Server layout for the /tools section.
// Checks isToolsTermsAccepted from the database and passes it to ToolsTermsPopup
// so the popup only appears when truly needed — no flash of popup for users
// who have already accepted.
// =============================================================================

import Navbar from "@/components/_home/navbar";
import Footer from "@/components/_home/footer";
import { syncUser } from "@/lib/auth/sync-user";
import { Toaster } from "sonner";
import { ToolsTermsPopup } from "./_tools/tools-terms-popup";
import { prismadb } from "@/lib/db";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

const homepageUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.isaacpaha.com";

export default async function ToolsLayout({ children }: { children: React.ReactNode }) {
  // Get the authenticated user's Clerk ID
  const { userId: clerkId } = await auth();
  
  let dbUser = null;
  let hasAcceptedToolsTerms = false;
  let isBanned = false;
  let userRole = null;
  
  // Only query the database if we have a clerkId
  if (clerkId) {
    try {
      dbUser = await prismadb.user.findUnique({
        where: { clerkId },
        select: { 
          clerkId: true, 
          role: true, 
          isToolsTermsAccepted: true, 
          isBanned: true 
        },
      });
      
      hasAcceptedToolsTerms = dbUser?.isToolsTermsAccepted ?? false;
      isBanned = dbUser?.isBanned ?? false;
      userRole = dbUser?.role ?? null;
      
      console.log(`[ToolsLayout] DB check - hasAcceptedToolsTerms: ${hasAcceptedToolsTerms}, isBanned: ${isBanned}`);
      console.log(`[ToolsLayout] User ID: ${clerkId}`);
    } catch (error) {
      console.error("[ToolsLayout] Error checking user status:", error);
      hasAcceptedToolsTerms = false;
      isBanned = false;
    }
  } else {
    console.log("[ToolsLayout] No authenticated user, showing popup for unauthenticated access");
    // Unauthenticated users should see the popup
    hasAcceptedToolsTerms = false;
    isBanned = false;
  }

  // If user is banned, redirect with ban parameter
  if (isBanned) {
    redirect(`${homepageUrl}?toolsBan=true`);
  }

  console.log(`[ToolsLayout] Rendering layout - hasAcceptedToolsTerms: ${hasAcceptedToolsTerms}`);

  return (
    <>
      <header>
        <Navbar
          isAdmin={userRole === "ADMIN"}
          userId={clerkId ?? null}
        />
      </header>
      <main id="main-content" role="main" className="pt-0">
        {/* Wrap children with ToolsTermsPopup to enforce terms acceptance */}
        <ToolsTermsPopup initialAccepted={hasAcceptedToolsTerms}>
          {children}
        </ToolsTermsPopup>
        <Toaster />
      </main>
      <Footer />
    </>
  );
}


// // app/apps/tools/page.tsx
// // =============================================================================

// import Navbar from "@/components/_home/navbar";
// import Footer from "@/components/_home/footer";
// import { syncUser } from "@/lib/auth/sync-user"; // if you still need dbUser here
// import { Toaster } from "sonner";


// export default async function SiteLayout({ children }: { children: React.ReactNode }) {
//   // Optional: re-fetch user if navbar needs role/info (you can also pass from props if lifted higher)
//   const dbUser = await syncUser();

//   return (
//     <>
//       <header>
//         <Navbar
//           isAdmin={dbUser?.role === "ADMIN"}
//           userId={dbUser?.clerkId ?? null}
//         />
//       </header>
//       <main id="main-content" role="main" className="pt-0">
//         {children}
//         <Toaster />
//       </main>
//       <Footer />
//     </>
//   );
// }