// =============================================================================
// isaacpaha.com — /admin/[userId]/dashboard
// app/admin/[userId]/dashboard/page.tsx
// =============================================================================

import type { Metadata } from "next";
import { DashboardClient } from "./_dashboard/dashboard-client";


export const metadata: Metadata = {
  title: "Dashboard | Admin — Isaac Paha",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ userId: string }>;
}

export default async function DashboardPage({ params }: Props) {
    const { userId } = await params;
    console.log("DashboardPage: userId =", userId);
  return <DashboardClient userId={userId} />;
}