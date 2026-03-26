// =============================================================================
// isaacpaha.com — Social OAuth Initiator
// app/api/admin/social/oauth/[platform]/route.ts
//
// GET → returns { url, state } to open in a popup.
//
// ─── Twitter Developer Portal setup (REQUIRED before this will work) ────────
//
// 1. Go to https://developer.twitter.com/en/portal/projects-and-apps
// 2. Select your App → Settings → "User authentication settings" → Edit
// 3. Enable OAuth 2.0
// 4. App type: Web App, Automated App or Bot
// 5. Callback URI — add EXACTLY:
//      https://yourdomain.com/api/admin/social/oauth/callback?platform=TWITTER
//    (Add your cloudflare tunnel URL for local dev, e.g.:
//      https://perception-loose-obtained-tops.trycloudflare.com/api/admin/social/oauth/callback?platform=TWITTER)
// 6. Website URL: https://isaacpaha.com
// 7. Save → copy Client ID + Client Secret to .env
//
// ─── LinkedIn ────────────────────────────────────────────────────────────────
// 1. https://www.linkedin.com/developers/apps → Auth tab
// 2. OAuth 2.0 settings → Authorized redirect URLs:
//      https://yourdomain.com/api/admin/social/oauth/callback?platform=LINKEDIN
// 3. Products → request "Share on LinkedIn" + "Sign In with LinkedIn using OpenID Connect"
//
// ─── Facebook / Instagram ────────────────────────────────────────────────────
// 1. https://developers.facebook.com → App → Facebook Login → Settings
// 2. Valid OAuth Redirect URIs:
//      https://yourdomain.com/api/admin/social/oauth/callback?platform=FACEBOOK
//      https://yourdomain.com/api/admin/social/oauth/callback?platform=INSTAGRAM
//
// ─── Required .env vars ──────────────────────────────────────────────────────
//   NEXT_PUBLIC_BASE_URL=https://yourdomain.com   ← NO trailing slash
//   OAUTH_STATE_SECRET=any-random-32-char-string
//   TWITTER_CLIENT_ID=         TWITTER_CLIENT_SECRET=
//   LINKEDIN_CLIENT_ID=        LINKEDIN_CLIENT_SECRET=
//   FACEBOOK_APP_ID=           FACEBOOK_APP_SECRET=
//   TIKTOK_CLIENT_KEY=         TIKTOK_CLIENT_SECRET=
//   GOOGLE_CLIENT_ID=          GOOGLE_CLIENT_SECRET=
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth }                      from "@clerk/nextjs/server";
import crypto                        from "crypto";
import { prismadb }                  from "@/lib/db";

async function requireAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
  return user?.role === "ADMIN";
}

const BASE_URL      = (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001").replace(/\/$/, "");
const CALLBACK_BASE = `${BASE_URL}/api/admin/social/oauth/callback`;
const STATE_SECRET  = process.env.OAUTH_STATE_SECRET ?? "dev-secret-change-in-prod";

function generateState(platform: string): string {
  const raw  = `${platform}:${Date.now()}:${crypto.randomBytes(16).toString("hex")}`;
  const hmac = crypto.createHmac("sha256", STATE_SECRET).update(raw).digest("hex");
  return Buffer.from(`${raw}|${hmac}`).toString("base64url");
}

// Store PKCE code_verifier in DB so the callback route can retrieve it
async function storePkceVerifier(platform: string, verifier: string): Promise<void> {
  const key = `oauth_pkce_${platform.toLowerCase()}`;
  await prismadb.siteSetting.upsert({
    where:  { key },
    create: { key, value: verifier, type: "string", label: `PKCE verifier for ${platform}` },
    update: { value: verifier },
  });
}

type BuildResult = { url: string };

const BUILDERS: Record<string, (state: string) => Promise<BuildResult>> = {

  TWITTER: async (state) => {
    const codeVerifier  = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
    await storePkceVerifier("TWITTER", codeVerifier);  // ← stored so callback can use it
    const params = new URLSearchParams({
      response_type:         "code",
      client_id:             process.env.TWITTER_CLIENT_ID!,
      redirect_uri:          `${CALLBACK_BASE}?platform=TWITTER`,
      scope:                 "tweet.read tweet.write users.read offline.access",
      state,
      code_challenge:        codeChallenge,
      code_challenge_method: "S256",
    });
    return { url: `https://twitter.com/i/oauth2/authorize?${params}` };
  },

  LINKEDIN: async (state) => {
    const params = new URLSearchParams({
      response_type: "code",
      client_id:     process.env.LINKEDIN_CLIENT_ID!,
      redirect_uri:  `${CALLBACK_BASE}?platform=LINKEDIN`,
      state,
      scope:         "openid profile email w_member_social",
    });
    return { url: `https://www.linkedin.com/oauth/v2/authorization?${params}` };
  },

  FACEBOOK: async (state) => {
    const params = new URLSearchParams({
      client_id:     process.env.FACEBOOK_APP_ID!,
      redirect_uri:  `${CALLBACK_BASE}?platform=FACEBOOK`,
      state,
      scope:         "pages_show_list,pages_manage_posts,pages_read_engagement,public_profile",
      response_type: "code",
    });
    return { url: `https://www.facebook.com/v19.0/dialog/oauth?${params}` };
  },

  INSTAGRAM: async (state) => {
    const params = new URLSearchParams({
      client_id:     process.env.FACEBOOK_APP_ID!,
      redirect_uri:  `${CALLBACK_BASE}?platform=INSTAGRAM`,
      state,
      scope:         "instagram_basic,instagram_content_publish,instagram_manage_insights,pages_show_list",
      response_type: "code",
    });
    return { url: `https://www.facebook.com/v19.0/dialog/oauth?${params}` };
  },

  THREADS: async (state) => {
    const params = new URLSearchParams({
      client_id:     process.env.THREADS_APP_ID ?? process.env.FACEBOOK_APP_ID!,
      redirect_uri:  `${CALLBACK_BASE}?platform=THREADS`,
      state,
      scope:         "threads_basic,threads_content_publish",
      response_type: "code",
    });
    return { url: `https://threads.net/oauth/authorize?${params}` };
  },

  TIKTOK: async (state) => {
    const codeVerifier  = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
    await storePkceVerifier("TIKTOK", codeVerifier);
    const params = new URLSearchParams({
      client_key:            process.env.TIKTOK_CLIENT_KEY!,
      redirect_uri:          `${CALLBACK_BASE}?platform=TIKTOK`,
      state,
      scope:                 "user.info.basic,video.upload",
      response_type:         "code",
      code_challenge:        codeChallenge,
      code_challenge_method: "S256",
    });
    return { url: `https://www.tiktok.com/v2/auth/authorize?${params}` };
  },

  YOUTUBE: async (state) => {
    const params = new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      redirect_uri:  `${CALLBACK_BASE}?platform=YOUTUBE`,
      state,
      scope:         "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
      response_type: "code",
      access_type:   "offline",
      prompt:        "consent",
    });
    return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` };
  },
};

// Required env vars per platform — checked before building the URL
const ENV_CHECKS: Record<string, string[]> = {
  TWITTER:   ["TWITTER_CLIENT_ID", "TWITTER_CLIENT_SECRET"],
  LINKEDIN:  ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"],
  FACEBOOK:  ["FACEBOOK_APP_ID",    "FACEBOOK_APP_SECRET"],
  INSTAGRAM: ["FACEBOOK_APP_ID",    "FACEBOOK_APP_SECRET"],
  THREADS:   ["FACEBOOK_APP_ID"],
  TIKTOK:    ["TIKTOK_CLIENT_KEY",  "TIKTOK_CLIENT_SECRET"],
  YOUTUBE:   ["GOOGLE_CLIENT_ID",   "GOOGLE_CLIENT_SECRET"],
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ platform: string }> }
) {

  const { platform } = await params;

  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const platformName = platform.toUpperCase();
  console.log("Platform Name", platformName)
  const builder  = BUILDERS[platformName];

  if (!builder) {
    return NextResponse.json({ error: `Unsupported platform: ${platformName}` }, { status: 400 });
  }

  // Check required env vars exist before building the URL
  const missing = (ENV_CHECKS[platform] ?? []).filter((k) => !process.env[k]);
  if (missing.length) {
    return NextResponse.json({
      error:   `Missing env var${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`,
      missing,
      hint:    `Add ${missing.join(" and ")} to your .env file and restart the dev server.`,
    }, { status: 400 });
  }

  try {
    const state       = generateState(platform);
    const { url }     = await builder(state);
    return NextResponse.json({ url, state });
  } catch (err: unknown) {
    console.error(`[oauth/${platform}]`, err);
    return NextResponse.json({ error: (err as Error).message ?? "Failed to build OAuth URL" }, { status: 500 });
  }
}





// import { NextRequest, NextResponse } from "next/server";
// import { auth }                      from "@clerk/nextjs/server";
// import crypto                        from "crypto";
// import { prismadb }                  from "@/lib/db";

// async function requireAdmin(): Promise<boolean> {
//   const { userId } = await auth();
//   if (!userId) return false;
//   const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
//   return user?.role === "ADMIN";
// }

// const BASE_URL    = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001";
// const CALLBACK    = `${BASE_URL}/api/admin/social/oauth/callback`;
// const STATE_SECRET = process.env.OAUTH_STATE_SECRET ?? "dev-secret-change-in-prod";

// function generateState(platform: string): string {
//   const raw   = `${platform}:${Date.now()}:${crypto.randomBytes(16).toString("hex")}`;
//   const hmac  = crypto.createHmac("sha256", STATE_SECRET).update(raw).digest("hex");
//   return Buffer.from(`${raw}|${hmac}`).toString("base64url");
// }

// const OAUTH_CONFIGS: Record<string, (state: string) => string> = {
//   TWITTER: (state) => {
//     const codeVerifier  = crypto.randomBytes(32).toString("base64url");
//     const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
//     const params = new URLSearchParams({
//       response_type:         "code",
//       client_id:             process.env.TWITTER_CLIENT_ID ?? "",
//       redirect_uri:          `${CALLBACK}?platform=TWITTER`,
//       scope:                 "tweet.read tweet.write users.read offline.access",
//       state,
//       code_challenge:        codeChallenge,
//       code_challenge_method: "S256",
//     });
//     // Note: store codeVerifier in session/cookie for the callback
//     return `https://twitter.com/i/oauth2/authorize?${params}`;
//   },
//   LINKEDIN: (state) => {
//     const params = new URLSearchParams({
//       response_type: "code",
//       client_id:     process.env.LINKEDIN_CLIENT_ID ?? "",
//       redirect_uri:  `${CALLBACK}?platform=LINKEDIN`,
//       state,
//       scope:         "openid profile email w_member_social",
//     });
//     return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
//   },
//   FACEBOOK: (state) => {
//     const params = new URLSearchParams({
//       client_id:     process.env.FACEBOOK_APP_ID ?? "",
//       redirect_uri:  `${CALLBACK}?platform=FACEBOOK`,
//       state,
//       scope:         "pages_show_list,pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish",
//       response_type: "code",
//     });
//     return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
//   },
//   INSTAGRAM: (state) => {
//     // Instagram uses same Facebook OAuth flow with specific scopes
//     const params = new URLSearchParams({
//       client_id:     process.env.FACEBOOK_APP_ID ?? "",
//       redirect_uri:  `${CALLBACK}?platform=INSTAGRAM`,
//       state,
//       scope:         "instagram_basic,instagram_content_publish,instagram_manage_insights",
//       response_type: "code",
//     });
//     return `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
//   },
//   THREADS: (state) => {
//     const params = new URLSearchParams({
//       client_id:     process.env.THREADS_APP_ID ?? process.env.FACEBOOK_APP_ID ?? "",
//       redirect_uri:  `${CALLBACK}?platform=THREADS`,
//       state,
//       scope:         "threads_basic,threads_content_publish",
//       response_type: "code",
//     });
//     return `https://threads.net/oauth/authorize?${params}`;
//   },
//   TIKTOK: (state) => {
//     const params = new URLSearchParams({
//       client_key:    process.env.TIKTOK_CLIENT_KEY ?? "",
//       redirect_uri:  `${CALLBACK}?platform=TIKTOK`,
//       state,
//       scope:         "user.info.basic,video.upload",
//       response_type: "code",
//     });
//     return `https://www.tiktok.com/v2/auth/authorize?${params}`;
//   },
//   YOUTUBE: (state) => {
//     const params = new URLSearchParams({
//       client_id:     process.env.GOOGLE_CLIENT_ID ?? "",
//       redirect_uri:  `${CALLBACK}?platform=YOUTUBE`,
//       state,
//       scope:         "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly",
//       response_type: "code",
//       access_type:   "offline",
//     });
//     return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
//   },
// };

// export async function GET(
//   _req: NextRequest,
//   { params }: { params: Promise<Promise<{ platform: string }> }
// ) {

//   const { platform } = await params;

//   if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   const platformName = platform.toUpperCase();
//   const builder  = OAUTH_CONFIGS[platformName];
//   if (!builder)  return NextResponse.json({ error: `Unsupported platform: ${platformName}` }, { status: 400 });
//   const state = generateState(platformName);
//   const url   = builder(state);
//   return NextResponse.json({ url, state });
// }