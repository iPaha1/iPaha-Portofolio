// app/apps/layout.tsx

import Navbar from "@/components/_home/navbar";
// import Footer from "@/components/_home/footer";
import { syncUser } from "@/lib/auth/sync-user"; // if you still need dbUser here

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Optional: re-fetch user if navbar needs role/info (you can also pass from props if lifted higher)
  const dbUser = await syncUser();

  return (
    <>
      <header>
        <Navbar
          isAdmin={dbUser?.role === "ADMIN"}
          userId={dbUser?.clerkId ?? null}
        />
      </header>
      <main id="main-content" role="main" className="pt-0">
        {children}
      </main>
      {/* <Footer /> */}
    </>
  );
}