// =============================================================================
// isaacpaha.com — Homepage
// app/page.tsx
// =============================================================================

import { BlogPreviewSection } from "@/components/_home/blog-preview-section";
import Footer from "@/components/_home/footer";
import { GameTeaserSection } from "@/components/_home/game-teaser-section";
// import { CompaniesSection } from "@/components/_home/company-section";
import { HeroSection } from "@/components/_home/hero";
import Navbar from "@/components/_home/navbar";
import { NewsletterSection } from "@/components/_home/news-letter-section";
import { ProductsSection } from "@/components/_home/products-section";
import { TechStackSection } from "@/components/_home/tech-stack-section";
import { VisionSection } from "@/components/_home/vision-section";
import { SectionDivider } from "@/components/shared/section";
import { syncUser } from "@/lib/auth/sync-user";



export const metadata = {
  title: "Isaac Paha — Technologist, Entrepreneur & Thinker",
  description:
    "Building companies, products, and ideas that matter — impacting the world around me.",
};

export default async function HomePage() {
  const dbUser = await syncUser();
    // console.log("DB user:", dbUser);

    // LET'S TRY OUT LOADING COMPONENT FOR 5 MINUTES TO SEE IF IT WORKS
    // await new Promise((resolve) => setTimeout(resolve, 300000)); // Simulate loading delay of 5 minutes
    // await new Promise((resolve) => setTimeout(resolve, 20000)); // Simulate loading delay
  return (
    
    <main>
      {/* --- Navbar */}
    <Navbar
        isAdmin={dbUser?.role === "ADMIN"}
        userId={dbUser?.clerkId ?? null}
      />
      {/* ── Hero ─────────────────────────── */}
      <HeroSection />

      {/* ── Companies ─────────────────────── */}
      {/* <SectionDivider />
      <CompaniesSection /> */}

      {/* ── Products ──────────────────────── */}
      <SectionDivider />
      <ProductsSection />

       {/* ── Game Teaser ───────────────────────────────────────────────── */}
      {/*
        Placed after Products and before Blog — visible, high-intent moment.
        Users have seen what Isaac builds. Now they see a reason to stay and play.
      */}
      <GameTeaserSection />

      {/* ── Blog Preview ──────────────────── */}
      <SectionDivider />
      <BlogPreviewSection />

      {/* ── Vision / Manifesto ────────────── */}
      <VisionSection />

      {/* ── Tech Stack ────────────────────── */}
      <SectionDivider />
      <TechStackSection />

      {/* ── Newsletter ────────────────────── */}
      <SectionDivider />
      <NewsletterSection />

      {/* --- Footer -------------- */}
      <Footer />
    </main>
  );
}