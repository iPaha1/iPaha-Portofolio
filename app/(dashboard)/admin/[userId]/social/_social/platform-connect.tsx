"use client";

// =============================================================================
// isaacpaha.com — Platform Connect Component
// components/admin/social/platform-connect.tsx
// Handles OAuth connections for all platforms with popup flow
// =============================================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ExternalLink, Loader2, AlertCircle,
  Users, Clock, TrendingUp, Link2, Unlink, Shield, Info,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Platform = {
  id:       string;
  label:    string;
  color:    string;
  bg:       string;
  icon:     string;  // emoji or SVG path
  charLimit: number;
  features: string[];
  oauthAvailable: boolean;
  setupNote?: string;
};

type Connection = {
  id:           string;
  platform:     string;
  handle:       string | null;
  displayName:  string | null;
  avatarUrl:    string | null;
  profileUrl:   string | null;
  followerCount: number | null;
  isActive:     boolean;
  lastPostedAt: Date | null;
  connectedAt:  Date;
  _count?:      { posts: number };
};

interface PlatformConnectProps {
  connections:    Connection[];
  onConnected:    (platform: string, data: any) => void;
  onDisconnected: (platform: string) => void;
}

// ─── Platform config ──────────────────────────────────────────────────────────

export const PLATFORMS: Platform[] = [
  {
    id: "TWITTER", label: "X / Twitter", color: "#000000", bg: "#f3f4f6",
    icon: "𝕏", charLimit: 280,
    features: ["Tweets", "Threads", "Replies", "Analytics"],
    oauthAvailable: true,
    setupNote: "Requires Twitter Developer App with OAuth 2.0 (TWITTER_CLIENT_ID + TWITTER_CLIENT_SECRET)",
  },
  {
    id: "LINKEDIN", label: "LinkedIn", color: "#0A66C2", bg: "#dbeafe",
    icon: "in", charLimit: 3000,
    features: ["Posts", "Articles", "Carousels", "Analytics"],
    oauthAvailable: true,
    setupNote: "Requires LinkedIn Developer App (LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET)",
  },
  {
    id: "FACEBOOK", label: "Facebook", color: "#1877F2", bg: "#dbeafe",
    icon: "f", charLimit: 63206,
    features: ["Posts", "Stories", "Pages", "Analytics"],
    oauthAvailable: true,
    setupNote: "Requires Facebook App with pages_manage_posts scope (FACEBOOK_APP_ID + FACEBOOK_APP_SECRET)",
  },
  {
    id: "INSTAGRAM", label: "Instagram", color: "#E1306C", bg: "#fce7f3",
    icon: "📷", charLimit: 2200,
    features: ["Feed Posts", "Reels", "Stories", "Hashtags"],
    oauthAvailable: true,
    setupNote: "Uses Facebook Login — requires Instagram Business Account linked to a Facebook Page",
  },
  {
    id: "THREADS", label: "Threads", color: "#000000", bg: "#f3f4f6",
    icon: "@", charLimit: 500,
    features: ["Threads", "Replies", "Quotes"],
    oauthAvailable: true,
    setupNote: "Requires Threads API access (THREADS_APP_ID) — currently in limited availability",
  },
  {
    id: "TIKTOK", label: "TikTok", color: "#FF0050", bg: "#ffe4e6",
    icon: "♪", charLimit: 2200,
    features: ["Video Captions", "Bio Link", "Creator Tools"],
    oauthAvailable: true,
    setupNote: "Requires TikTok Developer App (TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET)",
  },
  {
    id: "YOUTUBE", label: "YouTube", color: "#FF0000", bg: "#fee2e2",
    icon: "▶", charLimit: 5000,
    features: ["Video Descriptions", "Community Posts", "Chapters"],
    oauthAvailable: true,
    setupNote: "Requires Google Cloud OAuth (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET)",
  },
];

function fmtDate(d: Date | string | null): string {
  if (!d) return "Never";
  const date = new Date(d);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7)  return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ─── Platform card ────────────────────────────────────────────────────────────

function PlatformCard({
  platform, connection, onConnect, onDisconnect,
}: {
  platform:     Platform;
  connection:   Connection | null;
  onConnect:    (p: Platform) => void;
  onDisconnect: (p: Platform) => void;
}) {
  const [showNote, setShowNote] = useState(false);
  const isConnected = !!connection?.isActive;

  return (
    <motion.div
      layout
      className={`border rounded-sm p-5 transition-all ${
        isConnected ? "border-emerald-200 bg-emerald-50/20" : "border-stone-100 bg-white hover:border-stone-200"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-sm flex items-center justify-center text-lg font-black flex-shrink-0 border"
          style={{
            backgroundColor: isConnected ? `${platform.color}15` : platform.bg,
            borderColor:     isConnected ? `${platform.color}30` : "#e5e7eb",
            color:           platform.color,
          }}
        >
          {platform.icon}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-black text-stone-900">{platform.label}</p>
            {isConnected && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-sm">
                <Check className="w-2.5 h-2.5" />Connected
              </span>
            )}
            {!platform.oauthAvailable && (
              <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-sm font-semibold">Manual setup</span>
            )}
          </div>

          {isConnected && connection ? (
            <div className="mt-1.5 space-y-1">
              {connection.displayName && (
                <p className="text-xs text-stone-700 font-bold">{connection.displayName}</p>
              )}
              {connection.handle && (
                <p className="text-xs text-stone-500 font-semibold">@{connection.handle}</p>
              )}
              <div className="flex items-center gap-3 flex-wrap text-[11px] text-stone-400">
                {connection.followerCount !== null && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />{connection.followerCount.toLocaleString()} followers
                  </span>
                )}
                {connection._count && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />{connection._count.posts} posts
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />Last post: {fmtDate(connection.lastPostedAt)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-stone-400 mt-1">
              {platform.charLimit.toLocaleString()} char limit · {platform.features.slice(0, 3).join(", ")}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {platform.setupNote && (
            <button
              onClick={() => setShowNote((p) => !p)}
              className="text-stone-300 hover:text-stone-600 transition-colors"
              title="Setup requirements"
            >
              <Info className="w-4 h-4" />
            </button>
          )}
          {isConnected ? (
            //=============== CHECK WHY YOU'RE GETTING NULL AND UNDEFINED FOR USER ID.  =======================================
            <>
              {connection?.profileUrl && connection.profileUrl !== "https://x.com/null" && !connection.profileUrl.includes("/undefined") && (
                <a
                  href={connection.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 rounded-sm transition-colors"
                  title="View profile"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => onDisconnect(platform)}
                className="flex items-center gap-1.5 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-sm transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" />Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => onConnect(platform)}
              className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm transition-colors"
              style={{ backgroundColor: platform.color }}
            >
              <Link2 className="w-3.5 h-3.5" />Connect
            </button>
          )}
        </div>
      </div>

      {/* Setup note */}
      <AnimatePresence>
        {showNote && platform.setupNote && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}
            className="mt-3 pt-3 border-t border-stone-100 overflow-hidden"
          >
            <div className="flex items-start gap-2">
              <Shield className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-stone-500 leading-relaxed">{platform.setupNote}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── OAuth popup handler ──────────────────────────────────────────────────────
// Uses postMessage (sent by the callback page) instead of localStorage polling.
// The callback route /api/admin/social/oauth/callback sends:
//   { type: 'OAUTH_SUCCESS', platform, data: { accessToken, handle, ... } }
//   { type: 'OAUTH_ERROR',   platform, error: string }

function useOAuthPopup() {
  const [loading,  setLoading]  = useState<string | null>(null);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);

  const openOAuth = async (
    platform: Platform,
    onSuccess: (data: any) => void
  ) => {
    setLoading(platform.id); setError(null); setSuccess(null);
    try {
      // 1. Get the OAuth authorization URL from our backend
      const res  = await fetch(`/api/admin/social/oauth/${platform.id}`);
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.hint ?? data.error ?? "Failed to get OAuth URL");
        setLoading(null);
        return;
      }

      // 2. Open popup window
      const width  = 600; const height = 700;
      const left   = window.screenX + (window.outerWidth  - width)  / 2;
      const top    = window.screenY + (window.outerHeight - height) / 2;
      const popup  = window.open(
        data.url,
        `oauth_${platform.id}`,
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      );

      if (!popup) {
        setError("Popup was blocked. Please allow popups for this site and try again.");
        setLoading(null);
        return;
      }

      // 3. Listen for postMessage from the callback page
      let settled = false;
      const onMessage = (event: MessageEvent) => {
        // Only accept messages from our own origin
        if (event.origin !== window.location.origin) return;
        const msg = event.data;
        if (!msg || msg.platform !== platform.id) return;

        window.removeEventListener("message", onMessage);
        clearTimeout(timeout);
        settled = true;

        if (msg.type === "OAUTH_SUCCESS") {
          onSuccess(msg.data);
          setSuccess(platform.label);
          setTimeout(() => setSuccess(null), 3000);
        } else {
          setError(msg.error ?? `${platform.label} connection failed`);
        }
        setLoading(null);
        popup.close();
      };
      window.addEventListener("message", onMessage);

      // 4. Timeout after 10 minutes
      const timeout = setTimeout(() => {
        if (!settled) {
          window.removeEventListener("message", onMessage);
          setError("Connection timed out. Please try again.");
          setLoading(null);
        }
      }, 600000);

      // 5. Also handle popup being closed manually before completing
      const pollClosed = setInterval(() => {
        if (popup.closed && !settled) {
          clearInterval(pollClosed);
          clearTimeout(timeout);
          window.removeEventListener("message", onMessage);
          if (!settled) {
            setError(`${platform.label} connection cancelled`);
            setLoading(null);
          }
        }
      }, 1000);

    } catch (err: any) {
      setError(err.message ?? "Connection failed");
      setLoading(null);
    }
  };

  return { openOAuth, loading, error, success };
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function PlatformConnect({ connections, onConnected, onDisconnected }: PlatformConnectProps) {
  const { openOAuth, loading, error, success } = useOAuthPopup();
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const getConnection = (platformId: string) =>
    connections.find((c) => c.platform === platformId && c.isActive) ?? null;

  const handleConnect = async (platform: Platform) => {
    await openOAuth(platform, async (tokenData) => {
      // Persist to backend (callback already saved to DB; this refreshes the UI state)
      const res  = await fetch("/api/admin/social/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform:      platform.id,
          accessToken:   tokenData.accessToken,
          refreshToken:  tokenData.refreshToken  ?? null,
          handle:        tokenData.handle        ?? null,
          displayName:   tokenData.displayName   ?? null,
          avatarUrl:     tokenData.avatarUrl     ?? null,
          profileUrl:    tokenData.profileUrl    ?? null,
          followerCount: tokenData.followerCount ?? null,
          tokenExpiry:   tokenData.expiresAt     ?? null,
        }),
      });
      const data = await res.json();
      if (res.ok) onConnected(platform.id, data.connection);
      else console.error("[platform-connect] /connections save failed:", data);
    });
  };

  const handleDisconnect = async (platform: Platform) => {
    setDisconnecting(platform.id);
    await fetch("/api/admin/social/connections", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: platform.id }),
    });
    onDisconnected(platform.id);
    setDisconnecting(null);
  };

  const connectedCount = PLATFORMS.filter((p) => getConnection(p.id)).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-black text-stone-800">Platform Connections</p>
          <p className="text-xs text-stone-400 mt-0.5">
            {connectedCount} of {PLATFORMS.length} connected · Click any platform to connect via OAuth
          </p>
        </div>
      </div>

      {/* Status banners */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3">
            <Check className="w-4 h-4 text-emerald-500" />
            <p className="text-sm font-semibold text-emerald-700">{success} connected successfully!</p>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-sm px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button onClick={() => {}} className="text-red-400 hover:text-red-700">✕</button>
          </motion.div>
        )}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
            <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            <p className="text-sm text-amber-700">Connecting to {PLATFORMS.find((p) => p.id === loading)?.label}… (complete auth in popup)</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Platform grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {PLATFORMS.map((platform) => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            connection={getConnection(platform.id)}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        ))}
      </div>

      {/* OAuth setup info */}
      <div className="bg-stone-50 border border-stone-100 rounded-sm p-4 flex items-start gap-3">
        <Shield className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-stone-600">OAuth Setup Required</p>
          <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
            Each platform requires a Developer App with the correct OAuth credentials set in your environment variables.
            Click the ℹ icon on any platform card for the specific env vars needed. All tokens are stored securely in your database.
          </p>
        </div>
      </div>
    </div>
  );
}


// "use client";

// // =============================================================================
// // isaacpaha.com — Platform Connect Component
// // components/admin/social/platform-connect.tsx
// // Handles OAuth connections for all platforms with popup flow
// // =============================================================================

// import React, { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   Check, ExternalLink, Loader2, AlertCircle,
//   Users, Clock, TrendingUp, Link2, Unlink, Shield, Info,
// } from "lucide-react";

// // ─── Types ────────────────────────────────────────────────────────────────────

// export type Platform = {
//   id:       string;
//   label:    string;
//   color:    string;
//   bg:       string;
//   icon:     string;  // emoji or SVG path
//   charLimit: number;
//   features: string[];
//   oauthAvailable: boolean;
//   setupNote?: string;
// };

// type Connection = {
//   id:           string;
//   platform:     string;
//   handle:       string | null;
//   profileUrl:   string | null;
//   followerCount: number | null;
//   isActive:     boolean;
//   lastPostedAt: Date | null;
//   connectedAt:  Date;
//   _count?:      { posts: number };
// };

// type OAuthCallbackData = {
//   accessToken: string;
//   refreshToken?: string | null;
//   handle?: string | null;
//   profileUrl?: string | null;
//   followerCount?: number | null;
//   expiresAt?: string | Date | null;
// };

// interface PlatformConnectProps {
//   connections:    Connection[];
//   onConnected:    (platform: string, data: unknown) => void;
//   onDisconnected: (platform: string) => void;
// }

// // ─── Platform config ──────────────────────────────────────────────────────────

// export const PLATFORMS: Platform[] = [
//   {
//     id: "TWITTER", label: "X / Twitter", color: "#000000", bg: "#f3f4f6",
//     icon: "𝕏", charLimit: 280,
//     features: ["Tweets", "Threads", "Replies", "Analytics"],
//     oauthAvailable: true,
//     setupNote: "Requires Twitter Developer App with OAuth 2.0 (TWITTER_CLIENT_ID + TWITTER_CLIENT_SECRET)",
//   },
//   {
//     id: "LINKEDIN", label: "LinkedIn", color: "#0A66C2", bg: "#dbeafe",
//     icon: "in", charLimit: 3000,
//     features: ["Posts", "Articles", "Carousels", "Analytics"],
//     oauthAvailable: true,
//     setupNote: "Requires LinkedIn Developer App (LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET)",
//   },
//   {
//     id: "FACEBOOK", label: "Facebook", color: "#1877F2", bg: "#dbeafe",
//     icon: "f", charLimit: 63206,
//     features: ["Posts", "Stories", "Pages", "Analytics"],
//     oauthAvailable: true,
//     setupNote: "Requires Facebook App with pages_manage_posts scope (FACEBOOK_APP_ID + FACEBOOK_APP_SECRET)",
//   },
//   {
//     id: "INSTAGRAM", label: "Instagram", color: "#E1306C", bg: "#fce7f3",
//     icon: "📷", charLimit: 2200,
//     features: ["Feed Posts", "Reels", "Stories", "Hashtags"],
//     oauthAvailable: true,
//     setupNote: "Uses Facebook Login — requires Instagram Business Account linked to a Facebook Page",
//   },
//   {
//     id: "THREADS", label: "Threads", color: "#000000", bg: "#f3f4f6",
//     icon: "@", charLimit: 500,
//     features: ["Threads", "Replies", "Quotes"],
//     oauthAvailable: true,
//     setupNote: "Requires Threads API access (THREADS_APP_ID) — currently in limited availability",
//   },
//   {
//     id: "TIKTOK", label: "TikTok", color: "#FF0050", bg: "#ffe4e6",
//     icon: "♪", charLimit: 2200,
//     features: ["Video Captions", "Bio Link", "Creator Tools"],
//     oauthAvailable: true,
//     setupNote: "Requires TikTok Developer App (TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET)",
//   },
//   {
//     id: "YOUTUBE", label: "YouTube", color: "#FF0000", bg: "#fee2e2",
//     icon: "▶", charLimit: 5000,
//     features: ["Video Descriptions", "Community Posts", "Chapters"],
//     oauthAvailable: true,
//     setupNote: "Requires Google Cloud OAuth (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET)",
//   },
// ];

// function fmtDate(d: Date | string | null): string {
//   if (!d) return "Never";
//   const date = new Date(d);
//   const days = Math.floor((Date.now() - date.getTime()) / 86400000);
//   if (days < 1) return "today";
//   if (days === 1) return "yesterday";
//   if (days < 7)  return `${days}d ago`;
//   return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
// }

// // ─── Platform card ────────────────────────────────────────────────────────────

// function PlatformCard({
//   platform, connection, onConnect, onDisconnect,
// }: {
//   platform:     Platform;
//   connection:   Connection | null;
//   onConnect:    (p: Platform) => void;
//   onDisconnect: (p: Platform) => void;
// }) {
//   const [showNote, setShowNote] = useState(false);
//   const isConnected = !!connection?.isActive;

//   return (
//     <motion.div
//       layout
//       className={`border rounded-sm p-5 transition-all ${
//         isConnected ? "border-emerald-200 bg-emerald-50/20" : "border-stone-100 bg-white hover:border-stone-200"
//       }`}
//     >
//       <div className="flex items-start gap-4">
//         {/* Icon */}
//         <div
//           className="w-12 h-12 rounded-sm flex items-center justify-center text-lg font-black flex-shrink-0 border"
//           style={{
//             backgroundColor: isConnected ? `${platform.color}15` : platform.bg,
//             borderColor:     isConnected ? `${platform.color}30` : "#e5e7eb",
//             color:           platform.color,
//           }}
//         >
//           {platform.icon}
//         </div>

//         {/* Info */}
//         <div className="flex-1 min-w-0">
//           <div className="flex items-center gap-2 flex-wrap">
//             <p className="text-sm font-black text-stone-900">{platform.label}</p>
//             {isConnected && (
//               <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-sm">
//                 <Check className="w-2.5 h-2.5" />Connected
//               </span>
//             )}
//             {!platform.oauthAvailable && (
//               <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-sm font-semibold">Manual setup</span>
//             )}
//           </div>

//           {isConnected && connection ? (
//             <div className="mt-1.5 space-y-1">
//               {connection.handle && (
//                 <p className="text-xs text-stone-600 font-semibold">@{connection.handle}</p>
//               )}
//               <div className="flex items-center gap-3 flex-wrap text-[11px] text-stone-400">
//                 {connection.followerCount !== null && (
//                   <span className="flex items-center gap-1">
//                     <Users className="w-3 h-3" />{connection.followerCount.toLocaleString()} followers
//                   </span>
//                 )}
//                 {connection._count && (
//                   <span className="flex items-center gap-1">
//                     <TrendingUp className="w-3 h-3" />{connection._count.posts} posts
//                   </span>
//                 )}
//                 <span className="flex items-center gap-1">
//                   <Clock className="w-3 h-3" />Last post: {fmtDate(connection.lastPostedAt)}
//                 </span>
//               </div>
//             </div>
//           ) : (
//             <p className="text-[11px] text-stone-400 mt-1">
//               {platform.charLimit.toLocaleString()} char limit · {platform.features.slice(0, 3).join(", ")}
//             </p>
//           )}
//         </div>

//         {/* Actions */}
//         <div className="flex items-center gap-2 flex-shrink-0">
//           {platform.setupNote && (
//             <button
//               onClick={() => setShowNote((p) => !p)}
//               className="text-stone-300 hover:text-stone-600 transition-colors"
//               title="Setup requirements"
//             >
//               <Info className="w-4 h-4" />
//             </button>
//           )}
//           {isConnected ? (
//             <>
//               {connection?.profileUrl && (
//                 <a
//                   href={connection.profileUrl}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 rounded-sm transition-colors"
//                 >
//                   <ExternalLink className="w-3.5 h-3.5" />
//                 </a>
//               )}
//               <button
//                 onClick={() => onDisconnect(platform)}
//                 className="flex items-center gap-1.5 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-sm transition-colors"
//               >
//                 <Unlink className="w-3.5 h-3.5" />Disconnect
//               </button>
//             </>
//           ) : (
//             <button
//               onClick={() => onConnect(platform)}
//               className="flex items-center gap-1.5 text-xs font-bold text-white px-3 py-2 rounded-sm transition-colors"
//               style={{ backgroundColor: platform.color }}
//             >
//               <Link2 className="w-3.5 h-3.5" />Connect
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Setup note */}
//       <AnimatePresence>
//         {showNote && platform.setupNote && (
//           <motion.div
//             initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
//             exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.15 }}
//             className="mt-3 pt-3 border-t border-stone-100 overflow-hidden"
//           >
//             <div className="flex items-start gap-2">
//               <Shield className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
//               <p className="text-[11px] text-stone-500 leading-relaxed">{platform.setupNote}</p>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// }

// // ─── OAuth popup handler ──────────────────────────────────────────────────────

// function useOAuthPopup() {
//   const [loading,  setLoading]  = useState<string | null>(null);
//   const [error,    setError]    = useState<string | null>(null);
//   const [success,  setSuccess]  = useState<string | null>(null);

//   const openOAuth = async (
//     platform: Platform,
//     onSuccess: (data: OAuthCallbackData) => void
//   ) => {
//     setLoading(platform.id); setError(null); setSuccess(null);
//     try {
//       // Get the OAuth URL from our backend
//       const res  = await fetch(`/api/admin/social/oauth/${platform.id}`);
//       const data = await res.json();
//       if (!res.ok || !data.url) {
//         setError(data.error ?? "Failed to get OAuth URL");
//         setLoading(null);
//         return;
//       }

//       // Open popup
//       const width  = 600; const height = 700;
//       const left   = window.screenX + (window.outerWidth  - width)  / 2;
//       const top    = window.screenY + (window.outerHeight - height) / 2;
//       const popup  = window.open(data.url, `oauth_${platform.id}`, `width=${width},height=${height},left=${left},top=${top}`);

//       if (!popup) {
//         setError("Popup was blocked. Please allow popups for this site.");
//         setLoading(null);
//         return;
//       }

//       // Poll for the popup to close (OAuth callback sets localStorage token)
//       const interval = setInterval(async () => {
//         try {
//           if (popup.closed) {
//             clearInterval(interval);
//             // Check if auth was successful via localStorage message
//             const token = localStorage.getItem(`oauth_${platform.id}`);
//             if (token) {
//               localStorage.removeItem(`oauth_${platform.id}`);
//               const tokenData = JSON.parse(token);
//               onSuccess(tokenData);
//               setSuccess(platform.label);
//               setTimeout(() => setSuccess(null), 3000);
//             } else {
//               setError(`${platform.label} connection was cancelled`);
//             }
//             setLoading(null);
//           }
//         } catch { /* Cross-origin check, ignore */ }
//       }, 500);

//       // Timeout after 5 minutes
//       setTimeout(() => { clearInterval(interval); setLoading(null); }, 300000);
//     } catch (err: unknown) {
//       setError(err instanceof Error ? err.message : "Connection failed");
//       setLoading(null);
//     }
//   };

//   return { openOAuth, loading, error, success };
// }

// // ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

// export function PlatformConnect({ connections, onConnected, onDisconnected }: PlatformConnectProps) {
//   const { openOAuth, loading, error, success } = useOAuthPopup();
//   const [disconnecting, setDisconnecting] = useState<string | null>(null);

//   const getConnection = (platformId: string) =>
//     connections.find((c) => c.platform === platformId && c.isActive) ?? null;

//   const handleConnect = async (platform: Platform) => {
//     await openOAuth(platform, async (tokenData) => {
//       // Save the token to our backend
//       const res  = await fetch("/api/admin/social/connections", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           platform:     platform.id,
//           accessToken:  tokenData.accessToken,
//           refreshToken: tokenData.refreshToken,
//           handle:       tokenData.handle,
//           profileUrl:   tokenData.profileUrl,
//           followerCount: tokenData.followerCount,
//           tokenExpiry:  tokenData.expiresAt,
//         }),
//       });
//       const data = await res.json();
//       if (res.ok) onConnected(platform.id, data.connection);
//     });
//   };

//   const handleDisconnect = async (platform: Platform) => {
//     setDisconnecting(platform.id);
//     await fetch("/api/admin/social/connections", {
//       method: "DELETE",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ platform: platform.id }),
//     });
//     onDisconnected(platform.id);
//     setDisconnecting(null);
//   };

//   const connectedCount = PLATFORMS.filter((p) => getConnection(p.id)).length;

//   return (
//     <div className="space-y-5">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <p className="text-sm font-black text-stone-800">Platform Connections</p>
//           <p className="text-xs text-stone-400 mt-0.5">
//             {connectedCount} of {PLATFORMS.length} connected · Click any platform to connect via OAuth
//           </p>
//         </div>
//       </div>

//       {/* Status banners */}
//       <AnimatePresence>
//         {success && (
//           <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
//             className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3">
//             <Check className="w-4 h-4 text-emerald-500" />
//             <p className="text-sm font-semibold text-emerald-700">{success} connected successfully!</p>
//           </motion.div>
//         )}
//         {error && (
//           <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
//             className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-sm px-4 py-3">
//             <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
//             <p className="text-sm text-red-700 flex-1">{error}</p>
//             <button onClick={() => {}} className="text-red-400 hover:text-red-700">✕</button>
//           </motion.div>
//         )}
//         {loading && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
//             <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
//             <p className="text-sm text-amber-700">Connecting to {PLATFORMS.find((p) => p.id === loading)?.label}… (complete auth in popup)</p>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Platform grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
//         {PLATFORMS.map((platform) => (
//           <PlatformCard
//             key={platform.id}
//             platform={platform}
//             connection={getConnection(platform.id)}
//             onConnect={handleConnect}
//             onDisconnect={handleDisconnect}
//           />
//         ))}
//       </div>

//       {/* OAuth setup info */}
//       <div className="bg-stone-50 border border-stone-100 rounded-sm p-4 flex items-start gap-3">
//         <Shield className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
//         <div>
//           <p className="text-xs font-bold text-stone-600">OAuth Setup Required</p>
//           <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
//             Each platform requires a Developer App with the correct OAuth credentials set in your environment variables.
//             Click the ℹ icon on any platform card for the specific env vars needed. All tokens are stored securely in your database.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }