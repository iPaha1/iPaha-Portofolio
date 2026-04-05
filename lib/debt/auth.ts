// lib/debt/auth.ts
// Server-side email guard used by all /api/debt/* routes.

import { auth, currentUser } from "@clerk/nextjs/server";
import { isAllowedEmail }    from "./constants";

export async function getDebtSessionEmail(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const primaryEmail = user?.emailAddresses?.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  if (!primaryEmail) return null;
  if (!isAllowedEmail(primaryEmail)) return null;

  return primaryEmail.toLowerCase();
}

/** Use in API route handlers. Returns 401 json if not allowed. */
export async function requireDebtAccess(): Promise<
  { email: string; error: null } | { email: null; error: Response }
> {
  const email = await getDebtSessionEmail();
  if (!email) {
    return {
      email: null,
      error: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { email, error: null };
}