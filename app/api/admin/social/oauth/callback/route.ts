// =============================================================================
// isaacpaha.com — Social OAuth Callback
// app/api/admin/social/oauth/callback/route.ts
//
// This is the redirect_uri that Twitter/LinkedIn/Facebook etc. call after the
// user grants permission. It:
//   1. Validates the state param (HMAC check)
//   2. Exchanges the code for access + refresh tokens
//   3. Fetches the user's profile from the platform API
//   4. Saves the connection to the DB via upsertConnection()
//   5. Returns an HTML page that posts a message to the opener window and closes
//
// The popup (opened by platform-connect.tsx) listens for the postMessage,
// receives the token data, and calls the /api/admin/social/connections endpoint
// to persist it — then closes itself.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import crypto                        from "crypto";
import { prismadb }                  from "@/lib/db";
import { upsertConnection }          from "@/lib/actions/social-actions";

const BASE_URL     = (process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001").replace(/\/$/, "");
const STATE_SECRET = process.env.OAUTH_STATE_SECRET ?? "dev-secret-change-in-prod";

// ─── State validation ─────────────────────────────────────────────────────────
 
function validateState(state: string): { platform: string } | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf-8");
    const lastPipe = decoded.lastIndexOf("|");
    if (lastPipe === -1) return null;
    const raw  = decoded.slice(0, lastPipe);
    const hmac = decoded.slice(lastPipe + 1);
    const expected = crypto.createHmac("sha256", STATE_SECRET).update(raw).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))) return null;
    const platform = raw.split(":")[0];
    return platform ? { platform } : null;
  } catch {
    return null;
  }
}
 
// ─── Retrieve stored PKCE verifier ───────────────────────────────────────────
 
async function getPkceVerifier(platform: string): Promise<string | null> {
  const key     = `oauth_pkce_${platform.toLowerCase()}`;
  const setting = await prismadb.siteSetting.findUnique({ where: { key } });
  return setting?.value ?? null;
}
 
// ─── Token exchange per platform ─────────────────────────────────────────────
 
type TokenResult = {
  accessToken:   string;
  refreshToken?: string;
  expiresIn?:    number;
  handle?:       string;
  profileUrl?:   string;
  followerCount?: number;
  userId?:       string;
};
 
async function exchangeToken(platform: string, code: string): Promise<TokenResult> {
  const callbackUrl = `${BASE_URL}/api/admin/social/oauth/callback?platform=${platform}`;
 
  switch (platform) {
 
    case "TWITTER": {
      const verifier = await getPkceVerifier("TWITTER");
      if (!verifier) throw new Error("PKCE verifier missing — restart the OAuth flow");
 
      const tokenRes = await fetch("https://api.twitter.com/2/oauth2/token", {
        method: "POST",
        headers: {
          "Content-Type":  "application/x-www-form-urlencoded",
          "Authorization": `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type:    "authorization_code",
          code,
          redirect_uri:  callbackUrl,
          code_verifier: verifier,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.error_description ?? tokenData.error ?? "Twitter token exchange failed");
 
      // Fetch profile
      const meRes  = await fetch("https://api.twitter.com/2/users/me?user.fields=public_metrics,profile_image_url,username", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const me     = await meRes.json();
      const user   = me.data ?? {};
 
      return {
        accessToken:   tokenData.access_token,
        refreshToken:  tokenData.refresh_token,
        expiresIn:     tokenData.expires_in,
        handle:        user.username,
        profileUrl:    `https://twitter.com/${user.username}`,
        followerCount: user.public_metrics?.followers_count ?? null,
        userId:        user.id,
      };
    }
 
    case "LINKEDIN": {
      const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type:    "authorization_code",
          code,
          redirect_uri:  callbackUrl,
          client_id:     process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) throw new Error(tokenData.error_description ?? "LinkedIn token exchange failed");
 
      // Fetch profile via OpenID
      const meRes  = await fetch("https://api.linkedin.com/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const me = await meRes.json();
 
      return {
        accessToken:  tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn:    tokenData.expires_in,
        handle:       me.sub ?? me.id,
        profileUrl:   `https://www.linkedin.com/in/${me.sub}`,
        userId:       me.sub,
      };
    }
 
    case "FACEBOOK": {
      const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}&redirect_uri=${encodeURIComponent(callbackUrl)}`
      );
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || tokenData.error) throw new Error(tokenData.error?.message ?? "Facebook token exchange failed");
 
      // Get long-lived token
      const longRes  = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
      );
      const longData = await longRes.json();
      const finalToken = longData.access_token ?? tokenData.access_token;
 
      // Get pages (we'll use the first page's token for posting)
      const pagesRes  = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${finalToken}`);
      const pagesData = await pagesRes.json();
      const page      = pagesData.data?.[0];
 
      return {
        accessToken:  page?.access_token ?? finalToken,  // page token for posting
        handle:       page?.name ?? "Facebook Page",
        profileUrl:   `https://facebook.com/${page?.id}`,
        userId:       page?.id,
      };
    }
 
    case "INSTAGRAM": {
      // Instagram uses Facebook OAuth — get page token then Instagram account
      const tokenRes = await fetch(
        `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}&redirect_uri=${encodeURIComponent(callbackUrl)}`
      );
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || tokenData.error) throw new Error(tokenData.error?.message ?? "Instagram token exchange failed");
 
      // Get pages linked to user
      const pagesRes  = await fetch(`https://graph.facebook.com/v19.0/me/accounts?access_token=${tokenData.access_token}`);
      const pagesData = await pagesRes.json();
      const fbPage    = pagesData.data?.[0];
      if (!fbPage) throw new Error("No Facebook Page found. Instagram Business requires a linked Facebook Page.");
 
      // Get Instagram account linked to the page
      const igRes  = await fetch(`https://graph.facebook.com/v19.0/${fbPage.id}?fields=instagram_business_account&access_token=${fbPage.access_token}`);
      const igData = await igRes.json();
      const igId   = igData.instagram_business_account?.id;
      if (!igId) throw new Error("No Instagram Business Account linked to this Facebook Page.");
 
      // Get Instagram profile
      const profileRes  = await fetch(`https://graph.facebook.com/v19.0/${igId}?fields=username,followers_count,profile_picture_url&access_token=${fbPage.access_token}`);
      const profile     = await profileRes.json();
 
      return {
        accessToken:   fbPage.access_token,
        handle:        profile.username,
        profileUrl:    `https://instagram.com/${profile.username}`,
        followerCount: profile.followers_count,
        userId:        igId,
      };
    }
 
    case "TIKTOK": {
      const verifier = await getPkceVerifier("TIKTOK");
      const body     = new URLSearchParams({
        client_key:    process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type:    "authorization_code",
        redirect_uri:  callbackUrl,
        ...(verifier ? { code_verifier: verifier } : {}),
      });
      const tokenRes  = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body,
      });
      const tokenData = await tokenRes.json();
      if (tokenData.error) throw new Error(tokenData.error_description ?? "TikTok token exchange failed");
 
      return {
        accessToken:  tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresIn:    tokenData.expires_in,
        handle:       tokenData.open_id,
        userId:       tokenData.open_id,
      };
    }
 
    case "YOUTUBE": {
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id:     process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code,
          grant_type:    "authorization_code",
          redirect_uri:  callbackUrl,
        }),
      });
      const tokenData = await tokenRes.json();
      if (tokenData.error) throw new Error(tokenData.error_description ?? "YouTube token exchange failed");
 
      // Get channel info
      const channelRes  = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&access_token=${tokenData.access_token}`
      );
      const channelData = await channelRes.json();
      const channel     = channelData.items?.[0];
 
      return {
        accessToken:   tokenData.access_token,
        refreshToken:  tokenData.refresh_token,
        expiresIn:     tokenData.expires_in,
        handle:        channel?.snippet?.title ?? "YouTube Channel",
        profileUrl:    `https://youtube.com/channel/${channel?.id}`,
        followerCount: parseInt(channel?.statistics?.subscriberCount ?? "0", 10),
        userId:        channel?.id,
      };
    }
 
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
 
// ─── HTML response helpers ────────────────────────────────────────────────────
 
function successPage(platform: string, tokenData: TokenResult): NextResponse {
  const payload = JSON.stringify({
    platform,
    accessToken:   tokenData.accessToken,
    refreshToken:  tokenData.refreshToken ?? null,
    handle:        tokenData.handle ?? null,
    profileUrl:    tokenData.profileUrl ?? null,
    followerCount: tokenData.followerCount ?? null,
    userId:        tokenData.userId ?? null,
    expiresAt:     tokenData.expiresIn
      ? new Date(Date.now() + tokenData.expiresIn * 1000).toISOString()
      : null,
  });
 
  const html = `<!DOCTYPE html><html><body>
<script>
  // Send token data to the parent window, then close the popup
  if (window.opener) {
    window.opener.postMessage({ type: 'OAUTH_SUCCESS', platform: '${platform}', data: ${payload} }, '*');
    setTimeout(() => window.close(), 500);
  } else {
    // Fallback: no opener (e.g. same-tab redirect) — store in localStorage
    localStorage.setItem('oauth_${platform}', '${payload.replace(/'/g, "\\'")}');
    document.body.innerHTML = '<p style="font-family:sans-serif;padding:2rem;color:#1a1a1a"><strong>${platform} connected!</strong><br>You can close this window.</p>';
  }
</script>
<p style="font-family:sans-serif;padding:2rem;color:#1a1a1a">Connecting ${platform}… closing window.</p>
</body></html>`;
 
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html" },
  });
}
 
function errorPage(platform: string, message: string): NextResponse {
  const html = `<!DOCTYPE html><html><body>
<script>
  if (window.opener) {
    window.opener.postMessage({ type: 'OAUTH_ERROR', platform: '${platform}', error: ${JSON.stringify(message)} }, '*');
    setTimeout(() => window.close(), 2000);
  }
</script>
<p style="font-family:sans-serif;padding:2rem;color:#dc2626"><strong>Connection failed:</strong><br>${message}</p>
<p style="font-family:sans-serif;padding:0 2rem;color:#6b7280;font-size:14px">You can close this window and try again.</p>
</body></html>`;
 
  return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
}
 
// ─── Route handler ────────────────────────────────────────────────────────────
 
export async function GET(req: NextRequest) {
  const sp       = new URL(req.url).searchParams;
  const platform = (sp.get("platform") ?? "").toUpperCase();
  const code     = sp.get("code");
  const state    = sp.get("state");
  const error    = sp.get("error");
  const errorDesc = sp.get("error_description");
 
  // Platform denied / user cancelled
  if (error) {
    console.error(`[oauth/callback] ${platform} error:`, error, errorDesc);
    return errorPage(platform, errorDesc ?? error ?? "User cancelled or access denied");
  }
 
  if (!code || !state) {
    return errorPage(platform, "Missing code or state parameter");
  }
 
  // Validate state (HMAC)
  const stateData = validateState(state);
  if (!stateData) {
    return errorPage(platform, "Invalid state parameter — possible CSRF. Please try again.");
  }
 
  // Exchange code for tokens
  try {
    const tokenData = await exchangeToken(platform, code);
 
    // Persist to DB
    await upsertConnection({
      platform,
      handle:        tokenData.handle        ?? undefined,
      // displayName:   tokenData.displayName   ?? undefined,
      // avatarUrl:     tokenData.avatarUrl     ?? undefined,
      accessToken:   tokenData.accessToken,
      refreshToken:  tokenData.refreshToken  ?? undefined,
      tokenExpiry:   tokenData.expiresIn
        ? new Date(Date.now() + tokenData.expiresIn * 1000)
        : undefined,
      profileUrl:    tokenData.profileUrl    ?? undefined,
      followerCount: tokenData.followerCount ?? undefined,
    });
 
    return successPage(platform, tokenData);
  } catch (err: any) {
    console.error(`[oauth/callback] ${platform} token exchange failed:`, err);
    return errorPage(platform, err.message ?? "Token exchange failed");
  }
}



// import { NextRequest, NextResponse }  from "next/server";
// import { auth }                       from "@clerk/nextjs/server";
// import { prismadb }                   from "@/lib/db";
// import {
//   getSocialPostById, updateSocialPost,
//   deleteSocialPost, duplicateSocialPost,
// } from "@/lib/actions/social-actions";

// async function requireAdmin() {
//   const { userId } = await auth();
//   if (!userId) return false;
//   const user = await prismadb.user.findUnique({ where: { clerkId: userId }, select: { role: true } });
//   return user?.role === "ADMIN";
// }

// export async function GET(_: NextRequest, { params }: { params: Promise<{ platformId: string }> }) {
//     const { platformId } = await params;
//   if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   const post = await getSocialPostById(platformId);
//   if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
//   return NextResponse.json(post);
// }

// export async function PATCH(req: NextRequest, { params }: { params: Promise<{ platformId: string }> }) {
//     const { platformId } = await params;
//   if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   const body = await req.json();
//   if (body._action === "duplicate") return NextResponse.json(await duplicateSocialPost(platformId));
//   if (body._action === "publish") {
//     // Actually post to the platform
//     const post       = await getSocialPostById(platformId);
//     if (!post)       return NextResponse.json({ error: "Not found" }, { status: 404 });
//     const connection = post.connection;
//     // Call the platform publish function (platform-specific)
//     const result = await publishToPlatform(post, connection);
//     if (result.error) {
//       await updateSocialPost(platformId, { status: "failed" });
//       return NextResponse.json({ error: result.error }, { status: 500 });
//     }
//     const updated = await updateSocialPost(platformId, {
//       status: "published", platformPostId: result.postId,
//     });
//     // Update lastPostedAt on connection
//     await prismadb.socialConnection.update({
//       where: { id: connection.id }, data: { lastPostedAt: new Date() },
//     });
//     return NextResponse.json(updated);
//   }
//   const updated = await updateSocialPost(platformId, body);
//   return NextResponse.json(updated);
// }

// export async function DELETE(_: NextRequest, { params }: { params: Promise<{ platformId: string }> }) {
//     const { platformId } = await params;
//   if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   await deleteSocialPost(platformId);
//   return NextResponse.json({ ok: true });
// }

// // Platform-specific publish implementations
// async function publishToPlatform(post: any, connection: any): Promise<{ postId?: string; error?: string }> {
//   try {
//     switch (post.platform) {
//       case "TWITTER": {
//         const media = post.mediaUrls ? JSON.parse(post.mediaUrls) : [];
//         const body: any = { text: post.content };
//         const res = await fetch("https://api.twitter.com/2/tweets", {
//           method: "POST",
//           headers: {
//             "Authorization": `Bearer ${connection.accessToken}`,
//             "Content-Type":  "application/json",
//           },
//           body: JSON.stringify(body),
//         });
//         const data = await res.json();
//         if (!res.ok) return { error: data.detail ?? data.title ?? "Twitter post failed" };
//         return { postId: data.data?.id };
//       }
//       case "LINKEDIN": {
//         const body = {
//           author:     `urn:li:person:${connection.handle}`,
//           lifecycleState: "PUBLISHED",
//           specificContent: {
//             "com.linkedin.ugc.ShareContent": {
//               shareCommentary: { text: post.content },
//               shareMediaCategory: "NONE",
//             },
//           },
//           visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
//         };
//         const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
//           method: "POST",
//           headers: {
//             "Authorization": `Bearer ${connection.accessToken}`,
//             "Content-Type":  "application/json",
//             "X-Restli-Protocol-Version": "2.0.0",
//           },
//           body: JSON.stringify(body),
//         });
//         const data = await res.json();
//         if (!res.ok) return { error: data.message ?? "LinkedIn post failed" };
//         return { postId: data.id };
//       }
//       case "FACEBOOK": {
//         const res = await fetch(`https://graph.facebook.com/v19.0/${connection.handle}/feed`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ message: post.content, access_token: connection.accessToken }),
//         });
//         const data = await res.json();
//         if (!res.ok || data.error) return { error: data.error?.message ?? "Facebook post failed" };
//         return { postId: data.id };
//       }
//       case "INSTAGRAM": {
//         // Step 1: create media container
//         const media = post.mediaUrls ? JSON.parse(post.mediaUrls) : [];
//         const createRes = await fetch(
//           `https://graph.facebook.com/v19.0/${connection.handle}/media`,
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               image_url:    media[0],
//               caption:      post.content,
//               access_token: connection.accessToken,
//             }),
//           }
//         );
//         const createData = await createRes.json();
//         if (!createRes.ok) return { error: createData.error?.message ?? "Instagram media creation failed" };
//         // Step 2: publish
//         const publishRes = await fetch(
//           `https://graph.facebook.com/v19.0/${connection.handle}/media_publish`,
//           {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ creation_id: createData.id, access_token: connection.accessToken }),
//           }
//         );
//         const publishData = await publishRes.json();
//         if (!publishRes.ok) return { error: publishData.error?.message ?? "Instagram publish failed" };
//         return { postId: publishData.id };
//       }
//       default:
//         return { error: `Publishing to ${post.platform} is not yet implemented` };
//     }
//   } catch (err: any) {
//     return { error: err.message ?? "Publish failed" };
//   }
// }