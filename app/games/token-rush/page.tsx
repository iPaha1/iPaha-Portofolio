

// =============================================================================
// Token Rush — app/token-rush/page.tsx
// Server component: SEO metadata + JSON-LD. All interactivity in _client/.
// =============================================================================

import type { Metadata } from "next";
import { GAME_LIST } from "./_token-rush/game-registry";
import { TokenRushClient } from "./_token-rush/token-rush-client";


// ── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title:       "Token Rush — Bet & Battle | Isaac Paha",
  description:
    "The world's most intense token-wagering game arena. Challenge real players, stake your tokens, and win big. Neural Dominance and Phantom Grid — two mind-bending skill games where the smartest player takes all. Cash out via PayPal at 1,000,000 tokens.",
  openGraph: {
    title:       "Token Rush — Bet Tokens. Battle Minds. Win Real Rewards.",
    description: "Real-time multiplayer wagering on isaacpaha.com. Create a challenge, broadcast it to all online players, stake tokens, winner takes the pot minus 5% platform fee.",
    url:         "https://www.isaacpaha.com/token-rush",
    type:        "website",
    images: [{
      url:    "https://res.cloudinary.com/dprxr852x/image/upload/v1774612989/isaacpaha/image/isaacpahaplatformog-1774612988459.png",
      width:  1200,
      height: 630,
      alt:    "Token Rush — Isaac Paha",
    }],
  },
  twitter: {
    card:        "summary_large_image",
    site:        "@iPaha3",
    creator:     "@iPaha3",
    title:       "Token Rush — Bet & Battle | Isaac Paha",
    description: "Challenge real players. Stake tokens. Winner takes all.",
    images: ["https://res.cloudinary.com/dprxr852x/image/upload/v1774612989/isaacpaha/image/isaacpahaplatformog-1774612988459.png"],
  },
  alternates: {
    canonical: "https://www.isaacpaha.com/token-rush",
  },
  keywords: [
    "token wagering game", "play for tokens online", "skill betting game",
    "multiplayer mind game", "neural dominance game", "phantom grid game",
    "token prize game", "psychological strategy game", "Isaac Paha token rush",
    "win tokens online", "token cash out paypal", "competitive brain game",
    ...GAME_LIST.map(g => `${g.name} game`),
  ],
  robots: {
    index:     true,
    follow:    true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

// ── Structured data ───────────────────────────────────────────────────────────

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type":                "WebApplication",
      "@id":                  "https://www.isaacpaha.com/token-rush#webapp",
      name:                   "Token Rush — Wagering Arena",
      url:                    "https://www.isaacpaha.com/token-rush",
      description:            "A token-wagering platform where players challenge each other in world-first skill games. Winners keep all tokens minus a 5% platform fee. Minimum 1,000,000 tokens to cash out via PayPal.",
      applicationCategory:    "GameApplication",
      operatingSystem:        "Web Browser",
      offers: { "@type": "Offer", price: "0", priceCurrency: "GBP", availability: "https://schema.org/InStock" },
      author:    { "@type": "Person",       name: "Isaac Paha", url: "https://www.isaacpaha.com" },
      publisher: { "@type": "Organization", name: "iPaha Ltd",  url: "https://ipahait.com" },
      featureList: [
        "Token wagering between real players",
        "Live challenge broadcasting to all online users",
        "Winner-takes-all prize pool",
        "5% platform fee deducted at game time",
        "PayPal cash-out at 1,000,000 tokens",
        "Anti-cheat server-validated moves",
        ...GAME_LIST.map(g => `${g.name} — ${g.tagline}`),
      ],
    },
    {
      "@type":         "ItemList",
      "@id":           "https://www.isaacpaha.com/token-rush#gamelist",
      name:            "Token Rush Games",
      numberOfItems:   GAME_LIST.length,
      itemListElement: GAME_LIST.map((g, i) => ({
        "@type":       "ListItem",
        position:      i + 1,
        name:          g.name,
        description:   g.description,
        url:           `https://www.isaacpaha.com/token-rush#${g.name.toLowerCase().replace(/\s+/g,"-")}`,
      })),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home",       item: "https://www.isaacpaha.com" },
        { "@type": "ListItem", position: 2, name: "Game Center",item: "https://www.isaacpaha.com/games" },
        { "@type": "ListItem", position: 3, name: "Token Rush", item: "https://www.isaacpaha.com/token-rush" },
      ],
    },
  ],
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TokenRushPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TokenRushClient />
    </>
  );
}



// // =============================================================================
// // TOKEN RUSH — app/token-rush/page.tsx
// //
// // Server component: exports full Metadata (title, description, OG, Twitter,
// // JSON-LD structured data, canonical, keywords).
// // All interactive client logic lives in ./_client/token-rush-client.tsx
// // =============================================================================

// import type { Metadata } from "next";
// import { TokenRushClient } from "./_token-rush/token-rush-client";


// // ── Game descriptions for structured data ────────────────────────────────────
// const RUSH_GAMES = [
//   {
//     name: "Neural Dominance",
//     description:
//       "A real-time psychological prediction war. Out-think your opponent across 12 escalating rounds — every move you predict correctly earns points, every move they predict of yours costs you. Pure mental chess at lightning speed.",
//   },
//   {
//     name: "Phantom Grid",
//     description:
//       "A fog-of-war territory battle. Claim cells on a shared 8×8 grid using deduction, bluffing, and spatial reasoning. Reveal your opponent's phantom pieces before they reveal yours. Strategy meets deception.",
//   },
// ];

// // ── Metadata ─────────────────────────────────────────────────────────────────
// export const metadata: Metadata = {
//   title: "Token Rush — Bet & Battle | Isaac Paha",
//   description:
//     "The world's most intense token-wagering game arena. Challenge real players, bet your tokens, win big. Neural Dominance and Phantom Grid — two mind-bending skill games where the best thinker takes all. Minimum 1,000,000 tokens to cash out via PayPal.",
//   openGraph: {
//     title: "Token Rush — Bet Tokens. Battle Minds. Win Real Rewards.",
//     description:
//       "Real-time multiplayer wagering games on isaacpaha.com. Challenge any player, stake your tokens, winner takes the pot minus a small platform fee. Two mind-blowing skill games — Neural Dominance and Phantom Grid.",
//     url: "https://www.isaacpaha.com/token-rush",
//     type: "website",
//     images: [
//       {
//         url: "https://res.cloudinary.com/dprxr852x/image/upload/v1774612989/isaacpaha/image/isaacpahaplatformog-1774612988459.png",
//         width: 1200,
//         height: 630,
//         alt: "Token Rush — Isaac Paha",
//       },
//     ],
//   },
//   twitter: {
//     card: "summary_large_image",
//     site: "@iPaha3",
//     creator: "@iPaha3",
//     title: "Token Rush — Bet & Battle | Isaac Paha",
//     description:
//       "Challenge real players. Stake tokens. Winner takes all (minus platform fee). Two world-first mind games.",
//     images: [
//       "https://res.cloudinary.com/dprxr852x/image/upload/v1774612989/isaacpaha/image/isaacpahaplatformog-1774612988459.png",
//     ],
//   },
//   alternates: {
//     canonical: "https://www.isaacpaha.com/token-rush",
//   },
//   keywords: [
//     "token wagering game",
//     "play for tokens online",
//     "skill betting game",
//     "multiplayer mind game",
//     "neural dominance game",
//     "phantom grid game",
//     "token prize game",
//     "psychological strategy game",
//     "Isaac Paha token rush",
//     "win tokens online",
//     "token cash out paypal",
//     "competitive brain game",
//     "real money mind game",
//     "best multiplayer skill game",
//     ...RUSH_GAMES.map((g) => `${g.name} game`),
//   ],
//   robots: {
//     index: true,
//     follow: true,
//     googleBot: {
//       index: true,
//       follow: true,
//       "max-image-preview": "large",
//       "max-snippet": -1,
//     },
//   },
// };

// // ── Structured Data ───────────────────────────────────────────────────────────
// const structuredData = {
//   "@context": "https://schema.org",
//   "@graph": [
//     {
//       "@type": "WebApplication",
//       "@id": "https://www.isaacpaha.com/token-rush#webapp",
//       name: "Token Rush — Wagering Arena",
//       url: "https://www.isaacpaha.com/token-rush",
//       description:
//         "A real-money-equivalent token wagering platform where players challenge each other in world-first skill games. Winners keep all tokens minus a platform fee. Minimum 1,000,000 tokens required to cash out.",
//       applicationCategory: "GameApplication",
//       operatingSystem: "Web Browser",
//       offers: {
//         "@type": "Offer",
//         price: "0",
//         priceCurrency: "GBP",
//         availability: "https://schema.org/InStock",
//       },
//       author: {
//         "@type": "Person",
//         name: "Isaac Paha",
//         url: "https://www.isaacpaha.com",
//       },
//       publisher: {
//         "@type": "Organization",
//         name: "iPaha Ltd",
//         url: "https://ipahait.com",
//       },
//       featureList: [
//         "Token wagering between real players",
//         "Live challenge broadcasting to all online users",
//         "Winner-takes-all token prize pool",
//         "Platform fee deducted from winnings",
//         "PayPal cash-out at 1,000,000 tokens",
//         "Anti-cheat real-time server validation",
//         "Neural Dominance — psychological prediction war",
//         "Phantom Grid — fog-of-war territory battle",
//       ],
//     },
//     {
//       "@type": "ItemList",
//       "@id": "https://www.isaacpaha.com/token-rush#gamelist",
//       name: "Token Rush Games",
//       url: "https://www.isaacpaha.com/token-rush",
//       numberOfItems: RUSH_GAMES.length,
//       itemListElement: RUSH_GAMES.map((game, i) => ({
//         "@type": "ListItem",
//         position: i + 1,
//         name: game.name,
//         description: game.description,
//         url: `https://www.isaacpaha.com/token-rush#${game.name
//           .toLowerCase()
//           .replace(/\s+/g, "-")}`,
//       })),
//     },
//     {
//       "@type": "BreadcrumbList",
//       itemListElement: [
//         {
//           "@type": "ListItem",
//           position: 1,
//           name: "Home",
//           item: "https://www.isaacpaha.com",
//         },
//         {
//           "@type": "ListItem",
//           position: 2,
//           name: "Game Center",
//           item: "https://www.isaacpaha.com/games",
//         },
//         {
//           "@type": "ListItem",
//           position: 3,
//           name: "Token Rush",
//           item: "https://www.isaacpaha.com/token-rush",
//         },
//       ],
//     },
//   ],
// };

// // ── Page component ────────────────────────────────────────────────────────────
// export default function TokenRushPage() {
//   return (
//     <>
//       <script
//         type="application/ld+json"
//         dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
//       />
//       <TokenRushClient />
//     </>
//   );
// }


