"use server";

// =============================================================================
// isaacpaha.com — User Sync Action
// lib/auth/sync-user.ts
//
// Role logic:
//   - First login (no DB record) → READER by default
//   - Subsequent logins → use the role already stored in the DB
//     (so you can promote a user to ADMIN directly in the DB/Prisma Studio
//      and it won't get overwritten on their next login)
// =============================================================================

import { currentUser } from "@clerk/nextjs/server";
import { UserRole } from "../generated/prisma/enums";
import { prismadb } from "../db";



export async function syncUser() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) return null;

    const firstName   = clerkUser.firstName ?? "";
    const lastName    = clerkUser.lastName  ?? "";
    const displayName =
      [firstName, lastName].filter(Boolean).join(" ") ||
      clerkUser.username ||
      email.split("@")[0] ||
      "Anonymous";

    // ── Step 1: Check if user already exists in DB ──────────────────────────
    const existingUser = await prismadb.user.findUnique({
      where:  { clerkId: clerkUser.id },
      select: { role: true },
    });

    // ── Step 2: Determine role ───────────────────────────────────────────────
    // If user exists → keep their current DB role (preserves manual promotions)
    // If new user    → default to READER
    const role: UserRole = existingUser?.role ?? UserRole.READER;

    // ── Step 3: Upsert ───────────────────────────────────────────────────────
    const user = await prismadb.user.upsert({
      where: { clerkId: clerkUser.id },
      create: {
        clerkId:       clerkUser.id,
        email,
        emailVerified: clerkUser.emailAddresses[0]?.verification?.status === "verified",
        displayName,
        firstName:     firstName || null,
        lastName:      lastName  || null,
        avatarUrl:     clerkUser.imageUrl || null,
        username:      clerkUser.username || null,
        role,           // READER on first login
        lastSeenAt:    new Date(),
        lastLoginAt:   new Date(),
      },
      update: {
        // Sync Clerk profile changes (name, avatar, email)
        email,
        emailVerified: clerkUser.emailAddresses[0]?.verification?.status === "verified",
        displayName,
        firstName:     firstName || null,
        lastName:      lastName  || null,
        avatarUrl:     clerkUser.imageUrl || null,
        username:      clerkUser.username || null,
        // role is NOT updated here — only set on create.
        // To change a role: update directly in DB or Prisma Studio.
        lastSeenAt:    new Date(),
        lastLoginAt:   new Date(),
      },
      select: {
        id:          true,
        clerkId:     true,
        email:       true,
        displayName: true,
        role:        true,
        avatarUrl:   true,
      },
    });

    console.log(`[syncUser] ${user.email} — role: ${user.role}`);
    return user;

  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("clerkMiddleware")) {
      return null; // Middleware not running on this route (static assets etc.)
    }
    console.error("[syncUser] Unexpected error:", error);
    return null;
  }
}

// =============================================================================
// Lightweight read-only helper — use this anywhere you need the current user
// without triggering a DB write (e.g. in Server Components, API routes)
// =============================================================================

export async function getCurrentDbUser() {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    return prismadb.user.findUnique({
      where:  { clerkId: clerkUser.id },
      select: {
        id:          true,
        clerkId:     true,
        email:       true,
        displayName: true,
        role:        true,
        avatarUrl:   true,
      },
    });
  } catch {
    return null;
  }
}