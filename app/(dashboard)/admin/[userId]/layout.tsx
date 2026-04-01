// =============================================================================
// isaacpaha.com — Admin Layout (Server Component + Auth Guard)
// app/admin/[userId]/layout.tsx
// =============================================================================

import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { AdminLayoutShell } from "./dashboard/_dashboard/admin-layout-shell";


interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}

export default async function AdminLayout({
  children,
  params,
}: AdminLayoutProps) {
    const { userId } = await params;
  const { userId: authUserId } = await auth();
  console.log("AdminLayout: authUserId =", authUserId, "URL userId =", userId);

  // 1. Not authenticated → sign in
  if (!authUserId) {
    redirect("/sign-in?redirect_url=/admin/dashboard");
  }

  // 2. URL userId doesn't match authenticated user → forbidden
  if (authUserId !== userId) {
    redirect("/403");
  }

  // 3. Fetch user details from Clerk
  const user = await currentUser();

  // 4. Check admin role in Clerk publicMetadata
  // Set this in Clerk dashboard: publicMetadata: { role: "admin" }
  
//   const isAdmin = (user?.publicMetadata?.role as string) === "admin";
//   if (!isAdmin) {
//     redirect("/403");
//   }

  const userName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Admin";
  const userEmail = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const userInitials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || "IP";

  return (
    <AdminLayoutShell
      userId={userId}
      userName={userName}
      userEmail={userEmail}
      userInitials={userInitials}
    >
      {children}
    </AdminLayoutShell>
  );
}