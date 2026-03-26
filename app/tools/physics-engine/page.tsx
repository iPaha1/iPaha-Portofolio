// =============================================================================
// isaacpaha.com — Physics Understanding Engine — Server Page
// app/tools/physics-engine/page.tsx
// Route: /tools/physics-engine
// =============================================================================

import type { Metadata }    from "next";
import { currentUser }      from "@clerk/nextjs/server";
import { PhysicsEnginePage } from "./_physics-engine/physics-engine-page";


export const metadata: Metadata = {
  title: "Physics Understanding Engine — Not Just Formulas. The Full Story.",
  description:
    "Type any physics topic and get a complete 8-layer breakdown: plain definition, governing law, why it was discovered, who discovered it, real-world applications, mental models, misconceptions corrected, and experiments to try. GCSE, A-Level, University. Free.",
  openGraph: {
    title:       "Physics Understanding Engine | Isaac Paha Tools",
    description: "Physics explained the way it should be — concept, history, why it exists, real world, intuition, misconceptions, and experiments. GCSE to University.",
    url:         "https://isaacpaha.com/tools/physics-engine",
    type:        "website",
    images: [{ url: "https://isaacpaha.com/og/physics-engine.png", width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Physics Understanding Engine | Free Tool",
    description: "Not just formulas — the story, the history, the why, and the real world. Free AI physics tool.",
    creator:     "@iPaha3",
  },
  alternates: { canonical: "https://isaacpaha.com/tools/physics-engine" },
  keywords: [
    "physics explanation tool", "GCSE physics help", "A-Level physics tutor",
    "physics concepts explained", "why does physics work", "physics understanding",
    "AI physics tutor", "free physics help", "Newton's laws explained",
    "quantum mechanics explained", "electromagnetism explained", "physics history",
    "real world physics", "physics misconceptions", "physics for beginners",
  ],
};

export default async function PhysicsEngineServerPage() {
  const clerkUser = await currentUser().catch(() => null);
  return <PhysicsEnginePage isSignedIn={!!clerkUser} />;
}