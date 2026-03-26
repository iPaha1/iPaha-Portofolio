// =============================================================================
// lib/seo/structured-data.ts — JSON-LD Structured Data Builders
//
// Exports builder functions for every page type.
// Import and render as:
//   <script type="application/ld+json"
//     dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBlogPostSchema(post)) }} />
// =============================================================================

const SITE_URL  = "https://www.isaacpaha.com";
const AUTHOR_ID = `${SITE_URL}/#person`;
const ORG_ID    = `${SITE_URL}/#org`;

// ── Blog Post (Article) ───────────────────────────────────────────────────────

export function buildBlogPostSchema(post: {
  title:        string;
  excerpt:      string;
  slug:         string;
  coverImage?:  string | null;
  publishedAt:  Date | string | null;
  updatedAt:    Date | string;
  category?:    string | null;
  tags?:        string[] | null;
  readingTime?: number;
  wordCount?:   number;
}) {
  return {
    "@context": "https://schema.org",
    "@type":    "BlogPosting",
    "@id":      `${SITE_URL}/blog/${post.slug}#article`,
    headline:   post.title,
    description: post.excerpt,
    url:        `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : new Date().toISOString(),
    dateModified:  new Date(post.updatedAt).toISOString(),
    author:   { "@id": AUTHOR_ID },
    publisher:{ "@id": ORG_ID },
    ...(post.coverImage ? {
      image: {
        "@type": "ImageObject",
        url:    post.coverImage,
        width:  1200,
        height: 630,
      },
    } : {}),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id":   `${SITE_URL}/blog/${post.slug}`,
    },
    articleSection: post.category ?? "Technology",
    keywords:       (post.tags ?? []).join(", "),
    ...(post.wordCount   ? { wordCount:   post.wordCount   } : {}),
    ...(post.readingTime ? {
      timeRequired: `PT${post.readingTime}M`,
    } : {}),
    inLanguage:  "en-GB",
    isPartOf:    { "@id": `${SITE_URL}/blog#section` },
  };
}

// ── Blog Section (CollectionPage) ────────────────────────────────────────────

export function buildBlogSectionSchema(posts: { title: string; slug: string; excerpt: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type":    "CollectionPage",
    "@id":      `${SITE_URL}/blog#section`,
    name:       "Blog — Isaac Paha",
    description:"Essays on technology, Africa, startups, AI, and life by Isaac Paha.",
    url:        `${SITE_URL}/blog`,
    author:     { "@id": AUTHOR_ID },
    hasPart:    posts.map(p => ({
      "@type":     "BlogPosting",
      "@id":       `${SITE_URL}/blog/${p.slug}#article`,
      headline:    p.title,
      description: p.excerpt,
      url:         `${SITE_URL}/blog/${p.slug}`,
    })),
  };
}

// ── Tool (SoftwareApplication) ────────────────────────────────────────────────

export function buildToolSchema(tool: {
  name:        string;
  description: string;
  slug:        string;
  category?:   string;
  rating?:     number;
  reviewCount?: number;
  isFree?:     boolean;
}) {
  return {
    "@context":           "https://schema.org",
    "@type":              "SoftwareApplication",
    "@id":                `${SITE_URL}/tools/${tool.slug}#tool`,
    name:                 tool.name,
    description:          tool.description,
    url:                  `${SITE_URL}/tools/${tool.slug}`,
    applicationCategory:  tool.category ?? "UtilityApplication",
    operatingSystem:      "Web Browser",
    offers: {
      "@type":      "Offer",
      price:        "0",
      priceCurrency:"GBP",
      availability: "https://schema.org/InStock",
    },
    author:   { "@id": AUTHOR_ID },
    provider: { "@id": ORG_ID },
    ...(tool.rating ? {
      aggregateRating: {
        "@type":       "AggregateRating",
        ratingValue:   tool.rating,
        ratingCount:   tool.reviewCount ?? 1,
        bestRating:    5,
        worstRating:   1,
      },
    } : {}),
  };
}

// ── Tools Collection ──────────────────────────────────────────────────────────

export function buildToolsCollectionSchema(tools: { name: string; slug: string; description: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type":    "ItemList",
    "@id":      `${SITE_URL}/tools#list`,
    name:       "Free Online Tools — Isaac Paha",
    description:"30+ free AI-powered tools built by Isaac Paha.",
    url:        `${SITE_URL}/tools`,
    numberOfItems: tools.length,
    itemListElement: tools.map((t, i) => ({
      "@type":    "ListItem",
      position:   i + 1,
      name:       t.name,
      description:t.description,
      url:        `${SITE_URL}/tools/${t.slug}`,
    })),
  };
}

// ── App / Product (SoftwareApplication) ──────────────────────────────────────

export function buildAppSchema(app: {
  name:         string;
  description:  string;
  slug:         string;
  category?:    string;
  url?:         string;
  imageUrl?:    string;
  launchedAt?:  Date | string;
}) {
  return {
    "@context":          "https://schema.org",
    "@type":             "SoftwareApplication",
    "@id":               `${SITE_URL}/apps/${app.slug}#app`,
    name:                app.name,
    description:         app.description,
    url:                 app.url ?? `${SITE_URL}/apps/${app.slug}`,
    applicationCategory: app.category ?? "WebApplication",
    operatingSystem:     "Web Browser",
    author:              { "@id": AUTHOR_ID },
    publisher:           { "@id": ORG_ID },
    ...(app.imageUrl ? {
      image: { "@type": "ImageObject", url: app.imageUrl, width: 1200, height: 630 },
    } : {}),
    ...(app.launchedAt ? {
      dateCreated: new Date(app.launchedAt).toISOString(),
    } : {}),
    offers: {
      "@type":      "Offer",
      price:        "0",
      priceCurrency:"GBP",
      availability: "https://schema.org/InStock",
    },
  };
}

// ── Apps Collection ───────────────────────────────────────────────────────────

export function buildAppsCollectionSchema(apps: { name: string; slug: string; description: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type":    "ItemList",
    "@id":      `${SITE_URL}/apps#list`,
    name:       "Apps & Products — Isaac Paha",
    url:        `${SITE_URL}/apps`,
    numberOfItems: apps.length,
    itemListElement: apps.map((a, i) => ({
      "@type":    "ListItem",
      position:   i + 1,
      name:       a.name,
      description:a.description,
      url:        `${SITE_URL}/apps/${a.slug}`,
    })),
  };
}

// ── Ideas Collection ──────────────────────────────────────────────────────────

export function buildIdeasCollectionSchema(ideas: { title: string; slug: string; excerpt: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type":    "CollectionPage",
    "@id":      `${SITE_URL}/ideas#section`,
    name:       "Ideas Lab — Isaac Paha",
    description:"Raw concepts, product experiments, and explorations by Isaac Paha.",
    url:        `${SITE_URL}/ideas`,
    hasPart:    ideas.map(i => ({
      "@type":     "CreativeWork",
      "@id":       `${SITE_URL}/ideas/${i.slug}`,
      name:        i.title,
      description: i.excerpt,
      url:         `${SITE_URL}/ideas/${i.slug}`,
    })),
  };
}

// ── Game Center (WebApplication + ItemList) ───────────────────────────────────

const GAME_LIST = [
  "Click Hunt", "Token Rain", "Mystery Box", "Reaction Test", "Memory Match",
  "Bubble Burst", "Speed Typer", "Dodge Rush", "Number Pulse", "Colour Tap",
  "Mole Mash", "Gravity Flip", "Math Blitz", "Shadow Trace", "Tile Flip",
  "Pixel Paint", "Signal Chain", "Rhythm Pulse", "Star Connect", "Precision Stop",
  "Chain Reaction", "Mirror Painter", "Word Hunt", "Neon Trail", "Frequency Match",
  "Ice Slide", "Sonar Sweep", "Auction Blitz",
];

export function buildGamesSchema() {
  return [
    {
      "@context":           "https://schema.org",
      "@type":              "WebApplication",
      "@id":                `${SITE_URL}/game#webapp`,
      name:                 "Isaac Paha Game Center",
      description:          "30 unique browser mini-games. Earn tokens, compete on leaderboards.",
      url:                  `${SITE_URL}/game`,
      applicationCategory:  "GameApplication",
      operatingSystem:      "Web Browser",
      offers: {
        "@type":      "Offer",
        price:        "0",
        priceCurrency:"GBP",
        availability: "https://schema.org/InStock",
      },
      author:    { "@id": AUTHOR_ID },
      publisher: { "@id": ORG_ID },
      featureList: ["30 unique mini-games", "Token reward system", "Global leaderboard",
        "Daily streak bonuses", "Flash events", "Mobile compatible"],
    },
    {
      "@context":      "https://schema.org",
      "@type":         "ItemList",
      "@id":           `${SITE_URL}/game#gamelist`,
      name:            "30 Mini-Games",
      url:             `${SITE_URL}/game`,
      numberOfItems:   GAME_LIST.length,
      itemListElement: GAME_LIST.map((name, i) => ({
        "@type":   "ListItem",
        position:  i + 1,
        name,
        url:       `${SITE_URL}/game#${name.toLowerCase().replace(/\s+/g, "-")}`,
      })),
    },
  ];
}

// ── FAQ Page ──────────────────────────────────────────────────────────────────

export function buildFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context":  "https://schema.org",
    "@type":     "FAQPage",
    mainEntity:  faqs.map(f => ({
      "@type":         "Question",
      name:            f.question,
      acceptedAnswer:  { "@type": "Answer", text: f.answer },
    })),
  };
}

// ── Generic Breadcrumb ────────────────────────────────────────────────────────

export function buildBreadcrumbSchema(
  crumbs: { name: string; href: string }[]
) {
  return {
    "@context":      "https://schema.org",
    "@type":         "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type":   "ListItem",
      position:  i + 1,
      name:      c.name,
      item:      c.href.startsWith("http") ? c.href : `${SITE_URL}${c.href}`,
    })),
  };
}

// ── Now Page (Person + current status) ───────────────────────────────────────

export function buildNowPageSchema(snapshot?: {
  location?:    string;
  mode?:        string;
  building?:    string;
  updatedAt?:   Date;
}) {
  return {
    "@context":   "https://schema.org",
    "@type":      "ProfilePage",
    "@id":        `${SITE_URL}/now`,
    name:         "Now — What Isaac Paha Is Doing Right Now",
    description:  "A living /now page tracking Isaac Paha's current projects, reading, and life.",
    url:          `${SITE_URL}/now`,
    about:        { "@id": AUTHOR_ID },
    dateModified: snapshot?.updatedAt?.toISOString() ?? new Date().toISOString(),
    mainEntity:   { "@id": AUTHOR_ID },
  };
}