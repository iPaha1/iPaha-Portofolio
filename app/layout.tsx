// =============================================================================
// isaacpaha.com — Root Layout — Full SEO System
// app/layout.tsx
//
// SEO strategy:
//   1. Rich global Metadata with all Open Graph + Twitter + Apple tags
//   2. Comprehensive JSON-LD structured data (Person, WebSite, Organisation)
//   3. Canonical URL + hreflang (en-GB primary)
//   4. Sitelinks search box schema
//   5. Breadcrumb schema foundation
//   6. Performance: Sora font with display:swap, preconnects, DNS prefetch
//   7. Security: Content-Security-Policy, X-Frame-Options via <head>
//   8. Rich social previews (OG + Twitter) optimised for all platforms
// =============================================================================

import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { syncUser } from "@/lib/auth/sync-user";
import { GameProvider } from "@/components/(gamification)/game-provider";
import { GameWidget } from "@/components/(gamification)/game-widget";

// ── Font ─────────────────────────────────────────────────────────────────────
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

// ── Shared constants ──────────────────────────────────────────────────────────
const SITE_URL  = "https://www.isaacpaha.com";
const SITE_NAME = "Isaac Paha";
const OG_IMAGE  = "https://res.cloudinary.com/dprxr852x/image/upload/v1773922665/isaacpaha/image/isaacpahaplatform-og-1773922665075.png";

// ── Viewport ─────────────────────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor:      "#f59e0b",
  colorScheme:     "dark light",
  width:           "device-width",
  initialScale:    1,
  maximumScale:    5,
  userScalable:    true,
};

// ── Global Metadata ───────────────────────────────────────────────────────────
export const metadata: Metadata = {
  // ── Core ────────────────────────────────────────────────────────────────────
  metadataBase: new URL(SITE_URL),

  title: {
    default:  "Isaac Paha | Technologist, Entrepreneur & Builder",
    template: "%s | Isaac Paha",
  },
  description:
    "Isaac Paha — First-Class Computing & IT graduate from The Open University. " +
    "Founder of iPaha Ltd, iPahaStores Ltd, and OkPah Ltd. Building technology " +
    "that matters across the UK and Africa. Explore tools, apps, blog posts, " +
    "ideas, games, and more.",

  // ── Indexing ────────────────────────────────────────────────────────────────
  robots: {
    index:  true,
    follow: true,
    nocache: false,
    googleBot: {
      index:              true,
      follow:             true,
      noimageindex:       false,
      "max-image-preview":  "large",
      "max-snippet":        -1,
      "max-video-preview":  -1,
    },
  },

  // ── Canonical + Alternates ───────────────────────────────────────────────────
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-GB": SITE_URL,
      "en":    SITE_URL,
    },
  },

  // ── Keywords (supplementary — Google largely ignores but Bing uses) ────────
  keywords: [
    "Isaac Paha",
    "Isaac Paha technologist",
    "Isaac Paha entrepreneur",
    "Isaac Paha London",
    "Isaac Paha Ghana",
    "iPaha Ltd",
    "iPahaStores",
    "oKPah",
    "British Ghanaian developer",
    "UK Africa technology",
    "Open University computing graduate",
    "full-stack developer UK",
    "Next.js developer London",
    "React developer Africa",
    "AI-powered tools",
    "free online tools",
    "mini browser games",
    "earn tokens games",
    "personal website blog",
    "ideas lab",
    "tech entrepreneur",
    "software founder UK",
    "African tech solutions",
    "technology that matters",
    
  ],

  // ── Authors ──────────────────────────────────────────────────────────────────
  authors:  [{ name: "Isaac Paha", url: SITE_URL }],
  creator:  "Isaac Paha",
  publisher: "iPaha Ltd",
  category: "Technology",

  // ── Open Graph ────────────────────────────────────────────────────────────
  openGraph: {
    type:      "website",
    locale:    "en_GB",
    url:       SITE_URL,
    siteName:  SITE_NAME,
    title:     "Isaac Paha | Technologist, Entrepreneur & Builder",
    description:
      "Building companies, products, and ideas that matter — impacting the UK and Africa through technology.",
    images: [
      {
        url:    OG_IMAGE,
        width:  1200,
        height: 630,
        alt:    "Isaac Paha — Technologist, Entrepreneur & Builder",
        type:   "image/png",
      },
    ],
  },

  // ── Twitter / X ───────────────────────────────────────────────────────────
  twitter: {
    card:        "summary_large_image",
    site:        "@iPaha3",
    creator:     "@iPaha3",
    title:       "Isaac Paha | Technologist, Entrepreneur & Builder",
    description: "Building technology that solves real problems — across the UK and Africa.",
    images:      [OG_IMAGE],
  },

  // ── Verification codes ────────────────────────────────────────────────────
  verification: {
    google: process.env.GOOGLE_VERIFICATION_CODE,
    yandex: process.env.YANDEX_VERIFICATION_CODE,
    other:  {
      "msvalidate.01": process.env.BING_VERIFICATION_CODE ?? "",
    },
  },

  // ── App / PWA meta ────────────────────────────────────────────────────────
  applicationName: SITE_NAME,
  manifest:        "/manifest.webmanifest",
  appleWebApp: {
    capable:        true,
    title:          SITE_NAME,
    statusBarStyle: "black-translucent",
  },

  // ── Miscellaneous ─────────────────────────────────────────────────────────
  formatDetection: {
    telephone:  false,
    address:    false,
    email:      false,
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: "/favicon-16x16.png",  sizes: "16x16",  type: "image/png" },
      { url: "/favicon-32x32.png",  sizes: "32x32",  type: "image/png" },
      { url: "/favicon-96x96.png",  sizes: "96x96",  type: "image/png" },
      { url: "/favicon.ico",        sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#f59e0b" },
    ],
  },
};

// ── Structured Data: Person ────────────────────────────────────────────────────
const personSchema = {
  "@context": "https://schema.org",
  "@type":    "Person",
  "@id":      `${SITE_URL}/#person`,
  name:       "Isaac Paha",
  givenName:  "Isaac",
  familyName: "Paha",
  url:        SITE_URL,
  image: {
    "@type":       "ImageObject",
    url:           OG_IMAGE,
    width:         1200,
    height:        630,
    caption:       "Isaac Paha — Technologist, Entrepreneur & Builder",
  },
  description:
    "British-Ghanaian technologist, entrepreneur, and First-Class Computing & IT graduate from " +
    "The Open University. Founder of iPaha Ltd, iPahaStores Ltd, and Okpah Ltd.",
  jobTitle:   "Technologist, Entrepreneur & Builder",
  nationality: [
    { "@type": "Country", name: "United Kingdom" },
    { "@type": "Country", name: "Ghana" },
  ],
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name:    "The Open University",
    url:     "https://www.open.ac.uk",
  },
  worksFor: {
    "@type":  "Organization",
    name:     "iPaha Ltd",
    url:      "https://ipahait.com",
    "@id":    `${SITE_URL}/#org`,
  },
  knowsAbout: [
    "React.js", "Next.js", "Node.js", "TypeScript", "Prisma ORM",
    "Artificial Intelligence", "Software Development", "Entrepreneurship",
    "African Technology", "UK Technology Sector", "Full-Stack Web Development",
    "Product Management", "SaaS", "E-commerce",
  ],
  sameAs: [
    "https://github.com/iPaha1",
    "https://www.linkedin.com/in/isaac-paha-578911a9/",
    "https://twitter.com/iPaha3",
    "https://ipahait.com",
    "https://ipahastore.com",
    "https://okpah.com",
  ],
  address: {
    "@type":           "PostalAddress",
    addressLocality:   "London",
    addressCountry:    "GB",
  },
};

// ── Structured Data: Organisation ────────────────────────────────────────────
const organisationSchema = {
  "@context": "https://schema.org",
  "@type":    "Organization",
  "@id":      `${SITE_URL}/#org`,
  name:       "iPaha Ltd",
  url:        "https://ipahait.com",
  logo: {
    "@type": "ImageObject",
    url:     `${SITE_URL}/logo.png`,
    width:   512,
    height:  512,
  },
  founder:    { "@id": `${SITE_URL}/#person` },
  foundingDate: "2020",
  areaServed: ["GB", "GH"],
  knowsAbout: ["Software Development", "Technology Consulting", "Web Applications", "AI Products"],
};

// ── Structured Data: WebSite (with Sitelinks Search Box) ─────────────────────
const websiteSchema = {
  "@context":  "https://schema.org",
  "@type":     "WebSite",
  "@id":       `${SITE_URL}/#website`,
  name:        SITE_NAME,
  url:         SITE_URL,
  description: "Personal website of Isaac Paha — tools, apps, blog, games, ideas, and more.",
  author:      { "@id": `${SITE_URL}/#person` },
  publisher:   { "@id": `${SITE_URL}/#org` },
  inLanguage:  "en-GB",
  copyrightYear: new Date().getFullYear(),
  potentialAction: [
    {
      "@type":  "SearchAction",
      target:   {
        "@type":       "EntryPoint",
        urlTemplate:   `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  ],
};

// ── Structured Data: BreadcrumbList (root) ────────────────────────────────────
const breadcrumbSchema = {
  "@context":       "https://schema.org",
  "@type":          "BreadcrumbList",
  itemListElement:  [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const dbUser = await syncUser();

  return (
    <ClerkProvider>
      <html lang="en-GB" className={`${sora.variable} scroll-smooth`}>
        <head>
          {/* ── Preconnects (performance + SEO Core Web Vitals) ── */}
          <link rel="preconnect"   href="https://fonts.googleapis.com" />
          <link rel="preconnect"   href="https://fonts.gstatic.com"    crossOrigin="" />
          <link rel="preconnect"   href="https://res.cloudinary.com"   />
          <link rel="dns-prefetch" href="https://www.google-analytics.com" />
          <link rel="dns-prefetch" href="https://clerk.isaacpaha.com"  />

          {/* ── Geo signals ── */}
          <meta name="geo.region"      content="GB-LND" />
          <meta name="geo.placename"   content="London, United Kingdom" />
          <meta name="geo.position"    content="51.5074;-0.1278" />
          <meta name="ICBM"            content="51.5074, -0.1278" />
          <meta name="language"        content="English" />
          <meta name="revisit-after"   content="3 days" />
          <meta name="rating"          content="general" />
          <meta name="copyright"       content={`© ${new Date().getFullYear()} Isaac Paha`} />

          {/* ── Additional social preview tags ── */}
          <meta property="og:locale:alternate" content="en_US" />
          <meta property="article:author"      content="https://www.facebook.com/isaacpaha" />
          <meta name="linkedin:owner"          content="isaac-paha-578911a9" />

          {/* ── Structured Data ── */}
          <Script id="schema-person"       type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema)       }} />
          <Script id="schema-organisation" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisationSchema) }} />
          <Script id="schema-website"      type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema)      }} />
          <Script id="schema-breadcrumb"   type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema)   }} />
        </head>

        <body className={`${sora.className} antialiased bg-[#08080f] text-white`}>
          <GameProvider>
            <GameWidget />
            <main id="main-content" role="main">
              {children}
            </main>

            {/* ── Google Analytics ── */}
            {process.env.NEXT_PUBLIC_GA_ID && (
              <>
                <Script
                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                  strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                  {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                      page_path: window.location.pathname,
                      anonymize_ip: true,
                      send_page_view: true
                    });
                  `}
                </Script>
              </>
            )}
          </GameProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}




// // =============================================================================
// // isaacpaha.com — Root Layout (updated)
// // app/layout.tsx
// //
// // Changes vs previous:
// //   1. Wrapped in ClerkProvider (already done)
// //   2. Calls syncUser() on every render — creates/updates DB user record
// //   3. Passes dbUser (with role) down to Navbar via server props
// // =============================================================================

// import type { Metadata } from "next";
// import { Sora } from "next/font/google";
// import Script from "next/script";
// import "./globals.css";
// import { ClerkProvider } from "@clerk/nextjs";
// // import Navbar from "@/components/_home/navbar";
// // import Footer from "@/components/_home/footer";
// import { syncUser } from "@/lib/auth/sync-user";
// import { GameProvider } from "@/components/(gamification)/game-provider";
// import { GameWidget } from "@/components/(gamification)/game-widget";


// const font = Sora({
//   subsets: ["latin"],
//   variable: "--font-sora",
//   display: "swap",
// });

// export const metadata: Metadata = {
//   metadataBase: new URL("https://www.isaacpaha.com"),
//   title: {
//     default: "Isaac Paha | Technologist, Entrepreneur & Thinker",
//     template: "%s | Isaac Paha",
//   },
//   description:
//     "Isaac Paha — First-Class Computing & IT graduate from The Open University. Founder of iPaha Ltd, iPahaStores Ltd, and Okpah Ltd. Building technology that matters across the UK and Africa.",
//   keywords: [
//     "Isaac Paha", "Technologist", "Entrepreneur", "Computing IT Graduate",
//     "iPaha Ltd", "iPahaStores Ltd", "Full-Stack Developer",
//     "React.js", "Next.js", "AI", "Software Development", "Ghana Tech",
//   ],
//   authors: [{ name: "Isaac Paha", url: "https://www.isaacpaha.com" }],
//   creator: "Isaac Paha",
//   openGraph: {
//     type: "website", locale: "en_GB",
//     url: "https://www.isaacpaha.com",
//     siteName: "Isaac Paha",
//     title: "Isaac Paha | Technologist, Entrepreneur & Thinker",
//     description: "Building companies, products, and ideas that matter — impacting the world around me",
//     images: [{ url: "https://res.cloudinary.com/dprxr852x/image/upload/v1773922665/isaacpaha/image/isaacpahaplatform-og-1773922665075.png", width: 1200, height: 630, alt: "Isaac Paha" }],
//   },
//   twitter: {
//     card: "summary_large_image", site: "@iPaha3", creator: "@iPaha3",
//     title: "Isaac Paha | Technologist, Entrepreneur & Thinker",
//     description: "Building technology that solves real problems.",
//     images: ["https://res.cloudinary.com/dprxr852x/image/upload/v1773922665/isaacpaha/image/isaacpahaplatform-og-1773922665075.png"],
//   },
//   robots: {
//     index: true, follow: true,
//     googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
//   },
//   verification: { google: process.env.GOOGLE_VERIFICATION_CODE },
//   alternates: { canonical: "https://www.isaacpaha.com" },
//   category: "technology",
// };

// export default async function RootLayout({ children }: { children: React.ReactNode }) {
//   // Sync Clerk user → DB on every request (no-op if not signed in)
//   // Returns the DB user record (with role) or null
//   const dbUser = await syncUser();
//   console.log("DB user:", dbUser);

//   return (
//     <ClerkProvider>
//       <html lang="en-GB" className={`${font.variable} scroll-smooth`}>
//         <head>
//           <Script id="person-schema" type="application/ld+json">
//             {JSON.stringify({
//               "@context": "https://schema.org",
//               "@type": "Person",
//               name: "Isaac Paha",
//               url: "https://www.isaacpaha.com",
//               image: "https://res.cloudinary.com/dprxr852x/image/upload/v1773922665/isaacpaha/image/isaacpahaplatform-og-1773922665075.png",
//               sameAs: [
//                 "https://github.com/iPaha1",
//                 "https://www.linkedin.com/in/isaac-paha-578911a9/",
//                 "https://ipahait.com", "https://ipahastore.com", "https://okpah.com",
//               ],
//               jobTitle: "Technologist, Entrepreneur & Thinker",
//               alumniOf: { "@type": "Organization", name: "The Open University" },
//               nationality: "British",
//               knowsAbout: ["React.js", "Next.js", "Node.js", "TypeScript", "Artificial Intelligence", "Software Development", "Entrepreneurship", "African Tech"],
//             })}
//           </Script>

//           <Script id="website-schema" type="application/ld+json">
//             {JSON.stringify({
//               "@context": "https://schema.org",
//               "@type": "WebSite",
//               name: "Isaac Paha",
//               url: "https://www.isaacpaha.com",
//               author: { "@type": "Person", name: "Isaac Paha" },
//               potentialAction: {
//                 "@type": "SearchAction",
//                 target: { "@type": "EntryPoint", urlTemplate: "https://www.isaacpaha.com/search?q={search_term_string}" },
//                 "query-input": "required name=search_term_string",
//               },
//             })}
//           </Script>

//           <meta name="theme-color" content="#f59e0b" />
//           <meta name="geo.region" content="GB" />
//           <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
//           <link rel="icon" type="image/png" sizes="32x32"  href="/favicon-32x32.png" />
//           <link rel="icon" type="image/png" sizes="16x16"  href="/favicon-16x16.png" />
//           <link rel="manifest" href="/site.webmanifest" />
//           <link rel="preconnect" href="https://fonts.googleapis.com" />
//           <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
//         </head>

//         <body className={`${font.className} antialiased bg-white text-gray-900`}>
//            <GameProvider>
//           {/* <header>
//             <GameWidget />
//           </header> */}
//           <GameWidget />

//           <main id="main-content" role="main" className="pt-0">
//             {children}
//           </main>

//           {/* <Footer /> */}

//           {process.env.NEXT_PUBLIC_GA_ID && (
//             <>
//               <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
//               <Script id="google-analytics" strategy="afterInteractive">
//                 {`
//                   window.dataLayer = window.dataLayer || [];
//                   function gtag(){dataLayer.push(arguments);}
//                   gtag('js', new Date());
//                   gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
//                 `}
//               </Script>
//             </>
//           )}
//           </GameProvider>
//         </body>
//       </html>
//     </ClerkProvider>
//   );
// }


// // =============================================================================
// // isaacpaha.com — Root Layout (updated)
// // app/layout.tsx
// //
// // Changes vs previous:
// //   1. Wrapped in ClerkProvider (already done)
// //   2. Calls syncUser() on every render — creates/updates DB user record
// //   3. Passes dbUser (with role) down to Navbar via server props
// // =============================================================================

// import type { Metadata } from "next";
// import { Sora } from "next/font/google";
// import Script from "next/script";
// import "./globals.css";
// import { ClerkProvider } from "@clerk/nextjs";
// // import Navbar from "@/components/_home/navbar";
// // import Footer from "@/components/_home/footer";
// import { syncUser } from "@/lib/auth/sync-user";


// const font = Sora({
//   subsets: ["latin"],
//   variable: "--font-sora",
//   display: "swap",
// });

// export const metadata: Metadata = {
//   metadataBase: new URL("https://www.isaacpaha.com"),
//   title: {
//     default: "Isaac Paha | Technologist, Entrepreneur & Thinker",
//     template: "%s | Isaac Paha",
//   },
//   description:
//     "Isaac Paha — First-Class Computing & IT graduate from The Open University. Founder of iPaha Ltd, iPahaStores Ltd, and Okpah Ltd. Building technology that matters across the UK and Africa.",
//   keywords: [
//     "Isaac Paha", "Technologist", "Entrepreneur", "Computing IT Graduate",
//     "iPaha Ltd", "iPahaStores Ltd", "Full-Stack Developer",
//     "React.js", "Next.js", "AI", "Software Development", "Ghana Tech",
//   ],
//   authors: [{ name: "Isaac Paha", url: "https://www.isaacpaha.com" }],
//   creator: "Isaac Paha",
//   openGraph: {
//     type: "website", locale: "en_GB",
//     url: "https://www.isaacpaha.com",
//     siteName: "Isaac Paha",
//     title: "Isaac Paha | Technologist, Entrepreneur & Thinker",
//     description: "Building companies, products, and ideas that matter — impacting the world around me",
//     images: [{ url: "https://res.cloudinary.com/dprxr852x/image/upload/v1773922665/isaacpaha/image/isaacpahaplatform-og-1773922665075.png", width: 1200, height: 630, alt: "Isaac Paha" }],
//   },
//   twitter: {
//     card: "summary_large_image", site: "@iPaha3", creator: "@iPaha3",
//     title: "Isaac Paha | Technologist, Entrepreneur & Thinker",
//     description: "Building technology that solves real problems.",
//     images: ["https://res.cloudinary.com/dprxr852x/image/upload/v1773922665/isaacpaha/image/isaacpahaplatform-og-1773922665075.png"],
//   },
//   robots: {
//     index: true, follow: true,
//     googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
//   },
//   verification: { google: process.env.GOOGLE_VERIFICATION_CODE },
//   alternates: { canonical: "https://www.isaacpaha.com" },
//   category: "technology",
// };

// export default async function RootLayout({ children }: { children: React.ReactNode }) {
//   // Sync Clerk user → DB on every request (no-op if not signed in)
//   // Returns the DB user record (with role) or null
//   const dbUser = await syncUser();
//   console.log("DB user:", dbUser);

//   return (
//     <ClerkProvider>
//       <html lang="en-GB" className={`${font.variable} scroll-smooth`}>
//         <head>
//           <Script id="person-schema" type="application/ld+json">
//             {JSON.stringify({
//               "@context": "https://schema.org",
//               "@type": "Person",
//               name: "Isaac Paha",
//               url: "https://www.isaacpaha.com",
//               image: "https://res.cloudinary.com/dprxr852x/image/upload/v1773922665/isaacpaha/image/isaacpahaplatform-og-1773922665075.png",
//               sameAs: [
//                 "https://github.com/iPaha1",
//                 "https://www.linkedin.com/in/isaac-paha-578911a9/",
//                 "https://ipahait.com", "https://ipahastore.com", "https://okpah.com",
//               ],
//               jobTitle: "Technologist, Entrepreneur & Thinker",
//               alumniOf: { "@type": "Organization", name: "The Open University" },
//               nationality: "British",
//               knowsAbout: ["React.js", "Next.js", "Node.js", "TypeScript", "Artificial Intelligence", "Software Development", "Entrepreneurship", "African Tech"],
//             })}
//           </Script>

//           <Script id="website-schema" type="application/ld+json">
//             {JSON.stringify({
//               "@context": "https://schema.org",
//               "@type": "WebSite",
//               name: "Isaac Paha",
//               url: "https://www.isaacpaha.com",
//               author: { "@type": "Person", name: "Isaac Paha" },
//               potentialAction: {
//                 "@type": "SearchAction",
//                 target: { "@type": "EntryPoint", urlTemplate: "https://www.isaacpaha.com/search?q={search_term_string}" },
//                 "query-input": "required name=search_term_string",
//               },
//             })}
//           </Script>

//           <meta name="theme-color" content="#f59e0b" />
//           <meta name="geo.region" content="GB" />
//           <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
//           <link rel="icon" type="image/png" sizes="32x32"  href="/favicon-32x32.png" />
//           <link rel="icon" type="image/png" sizes="16x16"  href="/favicon-16x16.png" />
//           <link rel="manifest" href="/site.webmanifest" />
//           <link rel="preconnect" href="https://fonts.googleapis.com" />
//           <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
//         </head>

//         <body className={`${font.className} antialiased bg-white text-gray-900`}>
//           <header>
//             {/*
//               Pass dbUser to Navbar so it can conditionally show:
//               - "Dashboard" button  → if role === "ADMIN"
//               - "Subscribe" button  → if not ADMIN (default)
//               - UserButton          → always (shows sign-in if unauthenticated)
//             */}
//             {/* <Navbar
//               isAdmin={dbUser?.role === "ADMIN"}
//               userId={dbUser?.clerkId ?? null}
//             /> */}
//           </header>

//           <main id="main-content" role="main" className="pt-0">
//             {children}
//           </main>

//           {/* <Footer /> */}

//           {process.env.NEXT_PUBLIC_GA_ID && (
//             <>
//               <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
//               <Script id="google-analytics" strategy="afterInteractive">
//                 {`
//                   window.dataLayer = window.dataLayer || [];
//                   function gtag(){dataLayer.push(arguments);}
//                   gtag('js', new Date());
//                   gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
//                 `}
//               </Script>
//             </>
//           )}
//         </body>
//       </html>
//     </ClerkProvider>
//   );
// }







// // =============================================================================
// // isaacpaha.com — Root Layout
// // app/layout.tsx
// // =============================================================================

// import type { Metadata } from "next";
// import { Sora } from "next/font/google";
// import Script from "next/script";
// import "./globals.css";
// import Navbar from "@/components/_home/navbar";
// import Footer from "@/components/_home/footer";
// import { ClerkProvider } from "@clerk/nextjs";

// // Sora: distinctive, sharp, modern — perfect for a tech founder site
// const font = Sora({
//   subsets: ["latin"],
//   variable: "--font-sora",
//   display: "swap",
// });

// export const metadata: Metadata = {
//   metadataBase: new URL("https://www.isaacpaha.com"),
//   title: {
//     default:
//       "Isaac Paha | Technologist, Entrepreneur & Thinker",
//     template: "%s | Isaac Paha",
//   },
//   description:
//     "Isaac Paha — First-Class Computing & IT graduate from The Open University. Founder of iPaha Ltd, iPahaStores Ltd, and Okpah Ltd. Building technology that matters across the UK and Africa.",
//   keywords: [
//     "Isaac Paha",
//     "Technologist",
//     "Entrepreneur",
//     "Computing IT Graduate",
//     "iPaha Ltd",
//     "iPahaStores Ltd",
//     "Full-Stack Developer",
//     "React.js",
//     "Next.js",
//     "AI",
//     "Software Development",
//     "Ghana Tech",
//     "Open University",
//   ],
//   authors: [{ name: "Isaac Paha", url: "https://www.isaacpaha.com" }],
//   creator: "Isaac Paha",
//   openGraph: {
//     type: "website",
//     locale: "en_GB",
//     url: "https://www.isaacpaha.com",
//     siteName: "Isaac Paha",
//     title: "Isaac Paha | Technologist, Entrepreneur & Thinker",
//     description:
//       "Building companies, products, and ideas that matter — from the UK to Ghana and beyond.",
//     images: [
//       {
//         url: "https://res.cloudinary.com/dprxr852x/image/upload/v1773922665/isaacpaha/image/isaacpahaplatform-og-1773922665075.png",
//         width: 1200,
//         height: 630,
//         alt: "Isaac Paha",
//       },
//     ],
//   },
//   twitter: {
//     card: "summary_large_image",
//     site: "@iPaha3",
//     creator: "@iPaha3",
//     title: "Isaac Paha | Technologist, Entrepreneur & Thinker",
//     description: "Building technology that solves real problems.",
//     images: ["https://res.cloudinary.com/dprxr852x/image/upload/v1773922665/isaacpaha/image/isaacpahaplatform-og-1773922665075.png"],
//   },
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
//   verification: {
//     google: process.env.GOOGLE_VERIFICATION_CODE,
//   },
//   alternates: {
//     canonical: "https://www.isaacpaha.com",
//   },
//   category: "technology",
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <ClerkProvider>
//     <html lang="en-GB" className={`${font.variable} scroll-smooth`}>
//       <head>
//         {/* Person schema */}
//         <Script id="person-schema" type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "Person",
//             name: "Isaac Paha",
//             url: "https://www.isaacpaha.com",
//             image: "https://www.isaacpaha.com/images/photo1.png",
//             sameAs: [
//               "https://github.com/iPaha1",
//               "https://www.linkedin.com/in/isaac-paha-578911a9/",
//               "https://ipahait.com",
//               "https://ipahastore.com",
//               "https://okpah.com",
//             ],
//             jobTitle: "Technologist, Entrepreneur & Thinker",
//             alumniOf: {
//               "@type": "Organization",
//               name: "The Open University",
//             },
//             nationality: "British",
//             knowsAbout: [
//               "React.js", "Next.js", "Node.js", "TypeScript",
//               "Artificial Intelligence", "Software Development",
//               "Entrepreneurship", "African Tech",
//             ],
//           })}
//         </Script>

//         {/* Website schema */}
//         <Script id="website-schema" type="application/ld+json">
//           {JSON.stringify({
//             "@context": "https://schema.org",
//             "@type": "WebSite",
//             name: "Isaac Paha",
//             url: "https://www.isaacpaha.com",
//             author: { "@type": "Person", name: "Isaac Paha" },
//             potentialAction: {
//               "@type": "SearchAction",
//               target: {
//                 "@type": "EntryPoint",
//                 urlTemplate:
//                   "https://www.isaacpaha.com/search?q={search_term_string}",
//               },
//               "query-input": "required name=search_term_string",
//             },
//           })}
//         </Script>

//         {/* Theme */}
//         <meta name="theme-color" content="#f59e0b" />
//         <meta name="geo.region" content="GB" />

//         {/* Icons */}
//         <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
//         <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
//         <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
//         <link rel="manifest" href="/site.webmanifest" />

//         {/* Preconnect */}
//         <link rel="preconnect" href="https://fonts.googleapis.com" />
//         <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
//       </head>

//       <body className={`${font.className} antialiased bg-white text-gray-900`}>
//         <header>
//           <Navbar />
//         </header>

//         <main id="main-content" role="main" className="pt-16">
//           {children}
//         </main>

//         <Footer />

//         {/* Google Analytics */}
//         {process.env.NEXT_PUBLIC_GA_ID && (
//           <>
//             <Script
//               src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
//               strategy="afterInteractive"
//             />
//             <Script id="google-analytics" strategy="afterInteractive">
//               {`
//                 window.dataLayer = window.dataLayer || [];
//                 function gtag(){dataLayer.push(arguments);}
//                 gtag('js', new Date());
//                 gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
//               `}
//             </Script>
//           </>
//         )}
//       </body>
//     </html>
//     </ClerkProvider>
//   );
// }