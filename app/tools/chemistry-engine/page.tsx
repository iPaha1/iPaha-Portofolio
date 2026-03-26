// =============================================================================
// isaacpaha.com — Chemistry Understanding Engine — Server Page
// app/tools/chemistry-engine/page.tsx
// =============================================================================

import { auth }                 from "@clerk/nextjs/server";
import { prismadb }             from "@/lib/db";
import { ChemistryEnginePage } from "./_chemistry-engine/chemistry-engine-page";


export const metadata = {
  title:       "Chemistry Understanding Engine | Isaac Paha",
  description: "Enter any chemistry topic and receive a 10-layer breakdown: plain definition, particle-level explanation, core law, history, theory, real-world applications, misconceptions corrected, and Try It experiments. GCSE, A-Level, University.",
};

export default async function ChemistryEnginePageRoute() {
  const { userId } = await auth();

  let isSignedIn = false;
  if (userId) {
    const user = await prismadb.user.findUnique({
      where:  { clerkId: userId },
      select: { id: true },
    });
    isSignedIn = !!user;
  }

  return <ChemistryEnginePage isSignedIn={isSignedIn} />;
}