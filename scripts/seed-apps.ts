// =============================================================================
// isaacpaha.com — Apps Seed Script
// scripts/seed-apps.ts
//
// Seeds: Company records, then each App with all related records:
//   AppFeature, AppMetric, AppTechItem, AppChangelog, AppScreenshot,
//   AppCategoryEntry (many-to-many)
//
// Run: npx tsx scripts/seed-apps.ts
// Or:  npm run seed:apps
//
// Safe to re-run — uses find-then-create/update throughout.
// Re-running REPLACES all child records for each app (delete + recreate).
// =============================================================================

import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient }  from "../lib/generated/prisma/client";

// ─── DB client ────────────────────────────────────────────────────────────────

const adapter = new PrismaMariaDb({
  host:            process.env.DATABASE_HOST,
  port:            parseInt(process.env.DATABASE_PORT || "3306"),
  user:            process.env.DATABASE_USER,
  password:        process.env.DATABASE_PASSWORD,
  database:        process.env.DATABASE_NAME,
  connectionLimit: 5,
  ssl:             { rejectUnauthorized: false },
});

const prisma = new PrismaClient({ adapter } as any);

// ─── Slug helper ──────────────────────────────────────────────────────────────

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// ─── Category mapper (old string → DB AppCategory enum) ──────────────────────

function mapCategory(cat: string): string {
  const map: Record<string, string> = {
    "Jobs & Recruitment": "SAAS",
    "E-Commerce":         "E_COMMERCE",
    "Fintech":            "FINTECH",
    "AI & Productivity":  "PRODUCTIVITY",
    "Education":          "SAAS",
    "Logistics":          "LOGISTICS",
    "Marketplace":        "E_COMMERCE",
  };
  return map[cat] ?? "OTHER";
}

// ─── Company data ─────────────────────────────────────────────────────────────

const COMPANIES = [
  {
    slug:        "ipaha",
    name:        "iPaha Ltd",
    flag:        "🇬🇧",
    description: "UK-based technology company building SaaS tools and AI-powered products for professionals and businesses.",
    website:     "https://ipaha.co.uk",
    foundedYear: 2019,
  },
  {
    slug:        "ipahaStores",
    name:        "iPahaStores Ltd",
    flag:        "🇬🇧",
    description: "UK-based e-commerce company building multi-vendor marketplace platforms and commerce tooling for retailers.",
    website:     "https://ipahastore.com",
    foundedYear: 2020,
  },
  {
    slug:        "okpah",
    name:        "Okpah Ltd",
    flag:        "🇬🇭",
    description: "Ghana-based technology company building digital infrastructure and applications tailored to West African markets.",
    website:     "https://okpah.com",
    foundedYear: 2021,
  },
];

// ─── App data (enhanced to match schema) ─────────────────────────────────────

const APPS = [
  // ── oKadwuma ──────────────────────────────────────────────────────────────
  {
    slug:           "okadwuma",
    name:           "oKadwuma",
    tagline:        "West Africa's professional jobs platform",
    description:    "Smart job matching, verified employer listings, and a talent network built on trust — connecting skilled professionals with great companies across Ghana and West Africa.",
    fullDescription:"oKadwuma (meaning 'work' in Twi) exists because professional hiring in West Africa is still dominated by personal networks and word-of-mouth. If you don't know the right person, you don't get the opportunity. We're fixing that.\n\nThe platform is mobile-first and optimised for the reality of how West Africans use the internet. Every employer is verified. Salary ranges are visible by default. Job seekers can track applications in real time, and our AI matching engine learns from behaviour to surface increasingly relevant opportunities over time.\n\nFor employers, oKadwuma provides a full applicant tracking system, WhatsApp integration for candidate messaging, and access to a verified talent pool that grows every week.",
    companySlug:    "okpah",
    primaryCategory:"Jobs & Recruitment",
    categories:     ["SAAS"],
    status:         "LIVE",
    isPublished:    true,
    isFeatured:     true,
    isNew:          false,
    emoji:          "💼",
    icon:           "💼",
    primaryColor:   "#10b981",
    accentColor:    "#34d399",
    liveUrl:        "https://okadwuma.com",
    launchedYear:   2022,
    problemSolved:  "Professional hiring in West Africa relies on personal networks. Talented candidates without the right connections are invisible to employers — and vice versa.",
    targetUsers:    "Job-seeking professionals and employers across Ghana and West Africa",
    businessModel:  "Freemium — free for candidates, subscription tiers for employers (Starter / Growth / Enterprise)",
    nextMilestone:  "Expand to Nigeria — target Q2 2026",
    keywords:       JSON.stringify(["jobs", "ghana", "west africa", "recruitment", "careers", "okadwuma"]),
    features: [
      { icon: "🎯", title: "AI Job Matching",       description: "Learns your skills, preferences and career trajectory to surface the most relevant opportunities — not just keyword matches.", order: 0 },
      { icon: "✅", title: "Verified Employers",     description: "Every company is manually verified. No ghost listings, no scams. A job ad means a real job.", order: 1 },
      { icon: "💰", title: "Salary Transparency",   description: "Salary ranges visible by default on every listing. Candidates know what they're applying for before they apply.", order: 2 },
      { icon: "📱", title: "WhatsApp Integration",  description: "Employers can message shortlisted candidates directly via WhatsApp. Candidates get alerts via WhatsApp or SMS.", order: 3 },
      { icon: "📊", title: "Applicant Tracking",    description: "Full ATS for employers — pipeline views, collaborative notes, interview scheduling, and offer management.", order: 4 },
      { icon: "🌍", title: "Pan-West Africa",        description: "Jobs across Ghana, Nigeria, Senegal, Ivory Coast, and expanding. One profile, every market.", order: 5 },
    ],
    metrics: [
      { label: "Active Listings",       value: "2,400+", trend: "up",   trendValue: "+18% MoM", order: 0 },
      { label: "Registered Users",      value: "8,500+", trend: "up",   trendValue: "+24% MoM", order: 1 },
      { label: "Employer Accounts",     value: "320+",   trend: "up",   trendValue: null,       order: 2 },
      { label: "Successful Placements", value: "890+",   trend: "up",   trendValue: "All time", order: 3 },
    ],
    techStack: [
      { name: "Next.js 14",    category: "frontend"  },
      { name: "TypeScript",    category: "frontend"  },
      { name: "Tailwind CSS",  category: "frontend"  },
      { name: "Framer Motion", category: "frontend"  },
      { name: "Node.js",       category: "backend"   },
      { name: "Prisma ORM",    category: "backend"   },
      { name: "PostgreSQL",    category: "database"  },
      { name: "Redis",         category: "database"  },
      { name: "Elasticsearch", category: "database"  },
      { name: "Vercel",        category: "infra"     },
      { name: "Clerk Auth",    category: "auth"      },
      { name: "Resend",        category: "api"       },
      { name: "Paystack",      category: "api"       },
    ],
    changelog: [
      { version: "2.5.0", date: new Date("2026-03-01"), type: "feature",     title: "WhatsApp Alerts & Messaging",    description: "Real-time WhatsApp job alerts for candidates. Employer-to-candidate WhatsApp messaging. SMS fallback for users without WhatsApp." },
      { version: "2.4.0", date: new Date("2026-01-15"), type: "improvement", title: "Search & Performance",           description: "Elasticsearch migration — 3x faster search. Salary filter and remote filter added. Employer verification badge system live." },
      { version: "2.0.0", date: new Date("2025-09-01"), type: "launch",      title: "Platform v2 Public Launch",      description: "AI matching engine v1 launched. Employer ATS dashboard released. Mobile app (PWA) launched." },
      { version: "1.0.0", date: new Date("2022-06-01"), type: "launch",      title: "oKadwuma Launches",              description: "Initial launch in Ghana. 500 job listings at launch. First 200 employer accounts." },
    ],
    screenshots: [
      { label: "Job Feed",         order: 0 },
      { label: "Candidate Profile",order: 1 },
      { label: "Employer ATS",     order: 2 },
      { label: "AI Matching",      order: 3 },
    ],
  },

  // ── okDdwa ────────────────────────────────────────────────────────────────
  {
    slug:           "okddwa",
    name:           "okDdwa",
    tagline:        "E-commerce built for West African sellers",
    description:    "A full-featured online selling platform with Mobile Money payments, local delivery integrations, and storefronts that work on slow connections — built for the way West Africa actually shops.",
    fullDescription:"okDdwa (meaning 'shop' in Twi) is e-commerce infrastructure rebuilt from first principles for the West African context.\n\nWestern platforms like Shopify were built for markets with credit cards, reliable broadband, and established logistics networks. None of that describes Ghana in 2026. okDdwa supports Mobile Money as a first-class payment method, is optimised for 2G/3G connections, and integrates natively with local courier services.\n\nSellers can launch a fully branded storefront in under 10 minutes. The admin dashboard is simple enough for market traders and powerful enough for established retailers.",
    companySlug:    "okpah",
    primaryCategory:"E-Commerce",
    categories:     ["E_COMMERCE"],
    status:         "LIVE",
    isPublished:    true,
    isFeatured:     false,
    isNew:          false,
    emoji:          "🛒",
    icon:           "🛒",
    primaryColor:   "#f59e0b",
    accentColor:    "#fbbf24",
    liveUrl:        "https://okdawa.com",
    launchedYear:   2022,
    problemSolved:  "Western e-commerce platforms don't support Mobile Money, aren't optimised for slow connections, and don't integrate with local logistics — leaving West African sellers underserved.",
    targetUsers:    "Small to medium-sized businesses and individual sellers in Ghana and West Africa",
    businessModel:  "Transaction fee (1.5%) + optional monthly subscription for premium features",
    nextMilestone:  "Integrate USSD checkout for feature phone users — Q3 2026",
    keywords:       JSON.stringify(["ecommerce", "ghana", "mobile money", "online shop", "west africa", "okddwa"]),
    features: [
      { icon: "📱", title: "Mobile Money Native",  description: "MTN MoMo, Vodafone Cash, and AirtelTigo Money supported as first-class checkout options. No workarounds.", order: 0 },
      { icon: "⚡", title: "Works on 2G",           description: "Sub-100kb pages, progressive loading, and offline-capable checkout. Every customer can shop, everywhere.", order: 1 },
      { icon: "🏪", title: "10-Minute Storefront",  description: "Go from signup to selling in under 10 minutes. No technical skills needed, no code, no complexity.", order: 2 },
      { icon: "🚚", title: "Local Delivery Network",description: "Built-in integrations with Ghanaian courier services — Courier Plus, Gecko Logistics, and more.", order: 3 },
      { icon: "🌐", title: "Multi-Language",        description: "Storefronts available in English, Twi, Hausa, and French for pan-West African reach.", order: 4 },
      { icon: "📊", title: "Seller Analytics",      description: "Real-time revenue dashboard, inventory alerts, top products, and customer geography maps.", order: 5 },
    ],
    metrics: [
      { label: "Active Stores",    value: "640+",    trend: "up", trendValue: "+12% MoM", order: 0 },
      { label: "Products Listed",  value: "18,000+", trend: "up", trendValue: null,       order: 1 },
      { label: "Orders Processed", value: "24,000+", trend: "up", trendValue: "All time", order: 2 },
      { label: "Monthly GMV",      value: "₵280k+",  trend: "up", trendValue: "+9% MoM",  order: 3 },
    ],
    techStack: [
      { name: "Next.js 14",   category: "frontend"  },
      { name: "TypeScript",   category: "frontend"  },
      { name: "Tailwind CSS", category: "frontend"  },
      { name: "Prisma ORM",   category: "backend"   },
      { name: "MySQL",        category: "database"  },
      { name: "Redis",        category: "database"  },
      { name: "Vercel",       category: "infra"     },
      { name: "Cloudinary",   category: "infra"     },
      { name: "Paystack",     category: "api"       },
      { name: "Stripe",       category: "api"       },
      { name: "Clerk Auth",   category: "auth"      },
    ],
    changelog: [
      { version: "3.2.0", date: new Date("2026-02-15"), type: "feature",     title: "Multi-Language Storefronts",   description: "Twi, Hausa, and French language support. Auto-translate product descriptions (AI). Currency localisation for Francophone markets." },
      { version: "3.0.0", date: new Date("2025-10-01"), type: "launch",      title: "Platform v3",                  description: "Rebuilt storefront builder from scratch. New seller analytics dashboard. Courier Plus and Gecko Logistics integrations." },
      { version: "2.0.0", date: new Date("2022-11-01"), type: "launch",      title: "okDdwa Launches",              description: "Mobile Money integration live. First 100 stores onboarded. SMS order notifications." },
    ],
    screenshots: [
      { label: "Seller Dashboard", order: 0 },
      { label: "Product Manager",  order: 1 },
      { label: "Mobile Checkout",  order: 2 },
      { label: "Delivery Tracking",order: 3 },
    ],
  },

  // ── okSika ────────────────────────────────────────────────────────────────
  {
    slug:           "oksika",
    name:           "okSika",
    tagline:        "Financial tools for the underbanked",
    description:    "Digital savings, micro-lending, and budgeting tools for people who have a mobile phone but limited access to traditional banking — starting in Ghana, built for the world.",
    fullDescription:"okSika (meaning 'money' or 'gold' in Twi) is a financial technology platform for the 500 million West Africans who have mobile phones but no meaningful relationship with formal financial institutions.\n\nWe start with three products: a digital savings wallet that earns real interest, micro-loans assessed on Mobile Money transaction history rather than credit scores, and a budgeting tool designed for the reality of variable, informal-sector income.\n\nThe digital Susu product — a group savings mechanism — is a particularly important innovation. It digitises the traditional West African rotating savings group, making them reliable, transparent, and automatic.",
    companySlug:    "okpah",
    primaryCategory:"Fintech",
    categories:     ["FINTECH", "MOBILE_MONEY"],
    status:         "BETA",
    isPublished:    true,
    isFeatured:     false,
    isNew:          true,
    emoji:          "💰",
    icon:           "💰",
    primaryColor:   "#f97316",
    accentColor:    "#fb923c",
    liveUrl:        "https://oksika.com",
    launchedYear:   2025,
    problemSolved:  "500 million West Africans lack access to formal financial services despite having mobile phones. Mobile Money exists but has no savings, credit, or budgeting layer.",
    targetUsers:    "Underbanked individuals, market traders, and informal sector workers in Ghana and West Africa",
    businessModel:  "Interest spread on savings products + 3% origination fee on micro-loans",
    nextMilestone:  "Launch mobile app (iOS/Android) — Q2 2026",
    keywords:       JSON.stringify(["fintech", "ghana", "savings", "micro-loans", "mobile money", "susu", "oksika"]),
    features: [
      { icon: "🏦", title: "Interest-Bearing Savings", description: "Earn 8% APR on savings balances. Open in 90 seconds with just your phone number and Mobile Money.", order: 0 },
      { icon: "💳", title: "Score-Free Micro-Loans",   description: "Loans from ₵50–₵2,000 assessed against your Mobile Money transaction history, not a bank credit score.", order: 1 },
      { icon: "🤝", title: "Digital Susu Groups",      description: "Digitise your rotating savings group. Automatic collections, transparent tracking, zero disputes.", order: 2 },
      { icon: "📊", title: "Variable Income Budgeting",description: "Budget tools designed for traders, drivers, and market vendors — people with irregular monthly income.", order: 3 },
      { icon: "📱", title: "USSD Access (*711#)",       description: "Every feature accessible via USSD for users without smartphones or data connections.", order: 4 },
      { icon: "🔒", title: "Bank-Grade Security",      description: "256-bit encryption, biometric login, real-time fraud monitoring, and regulatory compliance.", order: 5 },
    ],
    metrics: [
      { label: "Beta Users",             value: "3,400+", trend: "up", trendValue: "+31% MoM", order: 0 },
      { label: "Active Savings Wallets", value: "2,800+", trend: "up", trendValue: null,       order: 1 },
      { label: "Loans Disbursed",        value: "420+",   trend: "up", trendValue: "All time", order: 2 },
      { label: "Total Savings Volume",   value: "₵480k+", trend: "up", trendValue: null,       order: 3 },
    ],
    techStack: [
      { name: "Next.js 14",    category: "frontend"  },
      { name: "TypeScript",    category: "frontend"  },
      { name: "React Native",  category: "frontend"  },
      { name: "Node.js",       category: "backend"   },
      { name: "Prisma ORM",    category: "backend"   },
      { name: "PostgreSQL",    category: "database"  },
      { name: "Redis",         category: "database"  },
      { name: "Paystack",      category: "api"       },
      { name: "AWS",           category: "infra"     },
    ],
    changelog: [
      { version: "1.4.0", date: new Date("2026-02-01"), type: "feature", title: "Digital Susu Groups",   description: "Group savings product launched. Automated WhatsApp collection reminders. Group admin dashboard with contribution tracking." },
      { version: "1.2.0", date: new Date("2025-12-01"), type: "feature", title: "USSD Access Live",      description: "Full feature access via *711#. USSD loan applications enabled. Feature phone savings deposits." },
      { version: "1.0.0", date: new Date("2025-08-01"), type: "launch",  title: "okSika Beta Launch",   description: "Savings wallet and micro-lending live. 1,000 early users onboarded. Paystack integration complete." },
    ],
    screenshots: [
      { label: "Savings Wallet",   order: 0 },
      { label: "Loan Application", order: 1 },
      { label: "Susu Groups",      order: 2 },
      { label: "Budget Tracker",   order: 3 },
    ],
  },

  // ── okSumame ──────────────────────────────────────────────────────────────
  {
    slug:           "oksumame",
    name:           "okSumame",
    tagline:        "Last-mile delivery infrastructure for West Africa",
    description:    "A delivery aggregation platform connecting businesses with a verified network of local couriers — single integration, live tracking, price comparison, and intelligent routing.",
    fullDescription:"okSumame (meaning 'send' in Twi) solves one of the hardest problems in West African commerce: reliable, affordable last-mile delivery.\n\nThe courier landscape in Ghana is fragmented. Sellers have to manage multiple courier relationships, compare prices manually, and have no visibility once a package is collected. We aggregate the entire network into a single API and a single dashboard.\n\nFrom a business's perspective: one integration, every courier option, live tracking, automated customer notifications via WhatsApp, and data on which couriers are actually performing.",
    companySlug:    "okpah",
    primaryCategory:"Logistics",
    categories:     ["LOGISTICS"],
    status:         "IN_DEVELOPMENT",
    isPublished:    true,
    isFeatured:     false,
    isNew:          true,
    emoji:          "🚀",
    icon:           "🚀",
    primaryColor:   "#6366f1",
    accentColor:    "#818cf8",
    launchedYear:   null,
    problemSolved:  "West African sellers manage fragmented courier relationships with no pricing transparency, no unified tracking, and no performance data.",
    targetUsers:    "E-commerce businesses and logistics teams in Ghana and West Africa",
    businessModel:  "Per-delivery fee (5–8% of delivery cost) + enterprise API subscription",
    nextMilestone:  "Public beta — Q3 2026",
    keywords:       JSON.stringify(["delivery", "logistics", "ghana", "courier", "last-mile", "oksumame"]),
    features: [
      { icon: "🔗", title: "Single API",            description: "One integration gives access to the full courier network. Plug in once, choose from all options every time.", order: 0 },
      { icon: "📍", title: "Live GPS Tracking",     description: "Real-time courier location with automated WhatsApp and SMS updates to customers at every stage.", order: 1 },
      { icon: "💰", title: "Instant Price Comparison",description: "Compare all courier rates and ETAs in under 200ms. Choose by price, speed, or reliability rating.", order: 2 },
      { icon: "🤖", title: "Smart Routing",          description: "AI selects the optimal courier based on package type, route history, and real-time courier availability.", order: 3 },
      { icon: "🔄", title: "Returns Management",    description: "Automated return workflows with courier pickup requests and instant refund triggers.", order: 4 },
      { icon: "📊", title: "Delivery Analytics",    description: "Per-courier success rates, average delivery times, cost breakdowns, and SLA performance tracking.", order: 5 },
    ],
    metrics: [
      { label: "Courier Partners", value: "14",      trend: "up",   trendValue: null,       order: 0 },
      { label: "Cities Covered",   value: "8",       trend: "up",   trendValue: null,       order: 1 },
      { label: "Alpha Merchants",  value: "60",      trend: "up",   trendValue: null,       order: 2 },
      { label: "Target Launch",    value: "Q3 2026", trend: "flat", trendValue: null,       order: 3 },
    ],
    techStack: [
      { name: "Next.js 14",        category: "frontend"  },
      { name: "TypeScript",        category: "frontend"  },
      { name: "Node.js",           category: "backend"   },
      { name: "PostgreSQL",        category: "database"  },
      { name: "Redis",             category: "database"  },
      { name: "WebSockets",        category: "backend"   },
      { name: "Google Maps API",   category: "api"       },
      { name: "AWS",               category: "infra"     },
    ],
    changelog: [
      { version: "0.4.0", date: new Date("2026-03-01"), type: "milestone", title: "14 Courier Partners Signed", description: "14 courier APIs integrated. Alpha expanded to 60 merchants. Real-time tracking map complete." },
      { version: "0.2.0", date: new Date("2025-12-01"), type: "feature",   title: "Core Routing Engine",        description: "Smart courier selection algorithm v1. Price comparison API live. 6 initial courier integrations." },
      { version: "0.1.0", date: new Date("2025-10-01"), type: "launch",    title: "Private Alpha",              description: "Architecture complete. First 3 courier partner agreements. 10 alpha merchants." },
    ],
    screenshots: [
      { label: "Operations Hub",    order: 0 },
      { label: "Price Comparison",  order: 1 },
      { label: "Live Tracking Map", order: 2 },
    ],
  },

  // ── okEdukation ───────────────────────────────────────────────────────────
  {
    slug:           "okedukation",
    name:           "okEdukation",
    tagline:        "Digital infrastructure for African schools",
    description:    "School management, e-learning, and parent communication — offline-first, built for cheap Android devices, and designed around the Ghana Education Service curriculum.",
    fullDescription:"okEdukation is EdTech built for the real constraints of Ghanaian schools: intermittent power, slow internet, inexpensive devices, and an administration system that still runs mostly on paper.\n\nThe platform is offline-first — it works without internet and syncs automatically when connectivity is available. It runs smoothly on ₵300 Android devices. And it's designed for the actual Ghana Education Service curriculum, not a generic Western syllabus.",
    companySlug:    "okpah",
    primaryCategory:"Education",
    categories:     ["SAAS"],
    status:         "COMING_SOON",
    isPublished:    true,
    isFeatured:     false,
    isNew:          false,
    emoji:          "📚",
    icon:           "📚",
    primaryColor:   "#ec4899",
    accentColor:    "#f472b6",
    launchedYear:   null,
    problemSolved:  "Ghana's schools lack affordable, offline-capable digital infrastructure. Most EdTech is designed for Western schools with reliable internet — useless in most Ghanaian classrooms.",
    targetUsers:    "Primary and secondary schools, teachers, parents, and students in Ghana",
    businessModel:  "Per-student annual subscription (₵12/student/year) + NGO grant funding",
    nextMilestone:  "Development begins Q2 2026 — pilot with 5 schools",
    keywords:       JSON.stringify(["edtech", "ghana", "education", "schools", "offline", "okedukation"]),
    features: [
      { icon: "📴", title: "Offline First",          description: "Full functionality without internet. Syncs silently when connectivity appears. No data loss, ever.", order: 0 },
      { icon: "📊", title: "School Administration",  description: "Enrollment, attendance registers, grade management, fee collection, and regulatory reporting — all digital.", order: 1 },
      { icon: "👨‍👩‍👧", title: "Parent Portal",       description: "Attendance, grades, and school notices pushed to parents via WhatsApp automatically.", order: 2 },
      { icon: "📱", title: "Runs on ₵300 Devices",   description: "Optimised for entry-level Android. A working school OS for the most resource-constrained environments.", order: 3 },
      { icon: "📝", title: "GES-Aligned Curriculum", description: "Lesson resources, assessments, and digital textbooks mapped directly to the Ghana Education Service syllabus.", order: 4 },
      { icon: "💰", title: "Mobile Money Fees",      description: "School fee collection via Mobile Money with automated receipts, reminders, and reconciliation.", order: 5 },
    ],
    metrics: [
      { label: "Schools Waitlisted",    value: "200+",    trend: "up",   trendValue: null, order: 0 },
      { label: "Target Students Y1",    value: "50,000+", trend: "flat", trendValue: null, order: 1 },
      { label: "NGO Partners",          value: "5",       trend: "up",   trendValue: null, order: 2 },
      { label: "Target Launch",         value: "Q4 2026", trend: "flat", trendValue: null, order: 3 },
    ],
    techStack: [
      { name: "Next.js 14",    category: "frontend"  },
      { name: "React Native",  category: "frontend"  },
      { name: "TypeScript",    category: "frontend"  },
      { name: "Prisma ORM",    category: "backend"   },
      { name: "PostgreSQL",    category: "database"  },
      { name: "PouchDB",       category: "database"  },
      { name: "Tailwind CSS",  category: "frontend"  },
      { name: "Expo",          category: "infra"     },
    ],
    changelog: [
      { version: "0.1.0", date: new Date("2026-01-01"), type: "milestone", title: "Pre-Build Milestone", description: "Architecture and database schema complete. 200+ schools on waitlist. 5 NGO partnerships confirmed. GES curriculum mapping done." },
    ],
    screenshots: [
      { label: "Admin Dashboard",    order: 0 },
      { label: "Teacher Grade Book", order: 1 },
      { label: "Parent App",         order: 2 },
    ],
  },

  // ── Paralel Me ────────────────────────────────────────────────────────────
  {
    slug:           "paralel-me",
    name:           "Paralel Me",
    tagline:        "Your AI-powered productivity operating system",
    description:    "An intelligent assistant that learns how you work, protects your deep work time, manages your task list, and helps you get more done with less friction.",
    fullDescription:"Paralel Me is built on a simple but radical insight: the most productive people are not doing more — they are doing the right things at the right time.\n\nMost productivity tools ask you to manage them. Paralel Me manages itself around you. It connects to your calendar, learns your work patterns, identifies when you are most focused, and builds a daily plan that protects your deep work time from being fragmented by meetings and context-switching.\n\nThe AI assistant layer understands natural language — capture tasks by typing or dictating naturally, and the system extracts deadlines, priorities, and context automatically.",
    companySlug:    "ipaha",
    primaryCategory:"AI & Productivity",
    categories:     ["PRODUCTIVITY", "SAAS", "WEB_APP"],
    status:         "BETA",
    isPublished:    true,
    isFeatured:     true,
    isNew:          true,
    emoji:          "⚡",
    icon:           "⚡",
    primaryColor:   "#8b5cf6",
    accentColor:    "#a78bfa",
    liveUrl:        "https://paralelme.com",
    launchedYear:   2025,
    problemSolved:  "Productivity tools have become a source of distraction themselves. Most require constant tending and management rather than enabling focused, intentional work.",
    targetUsers:    "Knowledge workers, founders, and professionals who want to be deliberate with their time",
    businessModel:  "Subscription — Free / Pro (£12/mo) / Team (£8/user/mo)",
    nextMilestone:  "Public launch — Q2 2026",
    keywords:       JSON.stringify(["productivity", "AI", "task management", "deep work", "paralel me", "focus"]),
    features: [
      { icon: "🧠", title: "Learns Your Rhythms",    description: "Observes when you do your best work over time and automatically protects those windows in your calendar.", order: 0 },
      { icon: "💬", title: "Natural Language Tasks", description: "Add tasks by talking or typing naturally. AI extracts the date, priority, project, and context automatically.", order: 1 },
      { icon: "📅", title: "Intelligent Scheduling", description: "Connects to Google Calendar and intelligently blocks focused work time around your meetings.", order: 2 },
      { icon: "✍️", title: "AI Writing Layer",       description: "Draft emails, summarise documents, write briefs — context-aware within your workspace.", order: 3 },
      { icon: "📈", title: "Weekly Reviews",         description: "Automated weekly review showing completion rates, focus time, productivity trends, and what to do differently.", order: 4 },
      { icon: "🔌", title: "Stack Integrations",     description: "Native integrations with Notion, Linear, Gmail, Slack, GitHub, and more. Works inside your existing workflow.", order: 5 },
    ],
    metrics: [
      { label: "Beta Users",       value: "1,200+",   trend: "up", trendValue: "+42% MoM", order: 0 },
      { label: "Tasks Completed",  value: "48,000+",  trend: "up", trendValue: "All time", order: 1 },
      { label: "Avg Rating",       value: "4.8 / 5",  trend: "up", trendValue: null,       order: 2 },
      { label: "Hours Saved (Est.)",value: "3,200+",  trend: "up", trendValue: null,       order: 3 },
    ],
    techStack: [
      { name: "Next.js 14",           category: "frontend" },
      { name: "TypeScript",           category: "frontend" },
      { name: "Tailwind CSS",         category: "frontend" },
      { name: "Framer Motion",        category: "frontend" },
      { name: "Claude API",           category: "api"      },
      { name: "Prisma ORM",           category: "backend"  },
      { name: "PostgreSQL",           category: "database" },
      { name: "Redis",                category: "database" },
      { name: "Vercel",               category: "infra"    },
      { name: "Clerk Auth",           category: "auth"     },
      { name: "Google Calendar API",  category: "api"      },
      { name: "OpenAI Whisper",       category: "api"      },
    ],
    changelog: [
      { version: "0.9.0", date: new Date("2026-03-01"), type: "feature",     title: "Gmail Integration & Meeting Summaries", description: "Gmail read/send integration. Automated meeting summary generation via Whisper + Claude. Weekly review v2 with trend charts." },
      { version: "0.8.0", date: new Date("2026-01-15"), type: "improvement", title: "Speed & Mobile",                        description: "AI response latency reduced by 60%. PWA (Progressive Web App) launched. Notion two-way sync fixed." },
      { version: "0.5.0", date: new Date("2025-11-01"), type: "launch",      title: "Closed Beta Launch",                    description: "Core task management live. Google Calendar integration. Natural language task entry. 500 invite-only beta users." },
    ],
    screenshots: [
      { label: "Morning Dashboard", order: 0 },
      { label: "AI Assistant",      order: 1 },
      { label: "Focus Calendar",    order: 2 },
      { label: "Weekly Review",     order: 3 },
    ],
  },

  // ── iPahaStore ────────────────────────────────────────────────────────────
  {
    slug:           "ipahastore-platform",
    name:           "iPahaStore",
    tagline:        "Multi-vendor marketplace platform for UK retailers",
    description:    "Full-featured marketplace infrastructure enabling UK retailers to sell across a shared platform — with AI product optimisation, automated vendor payouts, and an enterprise-grade admin layer.",
    fullDescription:"The iPahaStore Platform is white-label multi-vendor marketplace infrastructure built for the UK retail market.\n\nBuilding a marketplace from scratch takes six months of engineering. Our platform enables launch in weeks. Vendor onboarding, product catalogue management, order routing, payment processing, payout automation, and dispute resolution — all built and maintained, so marketplace operators can focus on growth.\n\nThe AI layer adds real commercial value: automatic product title and description optimisation, pricing recommendations based on market comparables, and demand forecasting for inventory planning.",
    companySlug:    "ipahaStores",
    primaryCategory:"Marketplace",
    categories:     ["E_COMMERCE", "SAAS"],
    status:         "LIVE",
    isPublished:    true,
    isFeatured:     false,
    isNew:          false,
    emoji:          "🏬",
    icon:           "🏬",
    primaryColor:   "#3b82f6",
    accentColor:    "#60a5fa",
    liveUrl:        "https://ipahastore.com",
    launchedYear:   2021,
    problemSolved:  "Building a multi-vendor marketplace from scratch takes 6+ months of engineering. Operators need a platform that lets them focus on vendor growth, not infrastructure.",
    targetUsers:    "UK-based e-commerce businesses and marketplace operators",
    businessModel:  "Platform commission (8–12% per transaction) + monthly operator subscription",
    nextMilestone:  "Launch self-serve operator onboarding — Q2 2026",
    keywords:       JSON.stringify(["marketplace", "uk", "ecommerce", "multi-vendor", "ipahastore", "retail"]),
    features: [
      { icon: "🏪", title: "Vendor Lifecycle Management", description: "Application, verification, onboarding, catalogue approval, performance monitoring, and automated payouts.", order: 0 },
      { icon: "🤖", title: "AI Product Optimisation",     description: "Automatically improves product titles and descriptions, suggests pricing, and flags catalogue issues.", order: 1 },
      { icon: "🔍", title: "Enterprise Search",           description: "Elasticsearch with faceted filtering, synonym handling, typo tolerance, and personalised result ranking.", order: 2 },
      { icon: "💳", title: "Automated Payouts",           description: "Stripe-powered vendor payouts on configurable schedules with full reconciliation and tax reporting.", order: 3 },
      { icon: "⚖️", title: "Dispute Resolution",          description: "Built-in workflow for buyer/seller disputes with mediation tools and automatic resolution paths.", order: 4 },
      { icon: "📊", title: "Marketplace Intelligence",   description: "Platform-wide and per-vendor analytics — sales, traffic, conversion, returns, and customer LTV.", order: 5 },
    ],
    metrics: [
      { label: "Active Vendors",  value: "340+",    trend: "up", trendValue: "+8% MoM",  order: 0 },
      { label: "Products Listed", value: "42,000+", trend: "up", trendValue: null,       order: 1 },
      { label: "Monthly Orders",  value: "8,200+",  trend: "up", trendValue: "+14% MoM", order: 2 },
      { label: "Monthly GMV",     value: "£180k+",  trend: "up", trendValue: "+11% MoM", order: 3 },
    ],
    techStack: [
      { name: "Next.js 14",    category: "frontend"  },
      { name: "TypeScript",    category: "frontend"  },
      { name: "Tailwind CSS",  category: "frontend"  },
      { name: "Node.js",       category: "backend"   },
      { name: "Prisma ORM",    category: "backend"   },
      { name: "PostgreSQL",    category: "database"  },
      { name: "Elasticsearch", category: "database"  },
      { name: "Redis",         category: "database"  },
      { name: "Stripe",        category: "api"       },
      { name: "AWS S3",        category: "infra"     },
      { name: "Vercel",        category: "infra"     },
      { name: "Clerk Auth",    category: "auth"      },
    ],
    changelog: [
      { version: "4.3.0", date: new Date("2026-02-20"), type: "feature",     title: "AI Product Optimiser",   description: "AI title and description optimisation for all vendor products. Pricing recommendation engine. Bulk optimisation tool for vendors with 100+ products." },
      { version: "4.0.0", date: new Date("2025-11-01"), type: "launch",      title: "Platform v4",            description: "Full Elasticsearch migration. Vendor payout automation v2. New storefront builder for operators." },
      { version: "3.0.0", date: new Date("2024-05-01"), type: "launch",      title: "Platform v3",            description: "Multi-currency support. Dispute resolution system. Advanced analytics dashboard." },
      { version: "1.0.0", date: new Date("2021-03-01"), type: "launch",      title: "iPahaStore Launches",    description: "Initial marketplace launch. First 50 vendors onboarded. Stripe integration live." },
    ],
    screenshots: [
      { label: "Marketplace Front", order: 0 },
      { label: "Vendor Dashboard",  order: 1 },
      { label: "Platform Admin",    order: 2 },
      { label: "AI Optimiser",      order: 3 },
    ],
  },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {

  // ── 1. Seed companies ──────────────────────────────────────────────────────

  console.log(`\n🏢 Seeding ${COMPANIES.length} companies...\n`);

  const companyMap: Record<string, string> = {}; // slug → DB id

  for (const co of COMPANIES) {
    try {
      const existing = await prisma.company.findUnique({ where: { slug: co.slug } });
      let record;
      if (existing) {
        record = await prisma.company.update({
          where: { slug: co.slug },
          data:  { name: co.name, flag: co.flag, description: co.description, website: co.website, foundedYear: co.foundedYear },
        });
        console.log(`  🔄 Updated  — ${co.name}`);
      } else {
        record = await prisma.company.create({
          data: { name: co.name, slug: co.slug, flag: co.flag, description: co.description, website: co.website, foundedYear: co.foundedYear },
        });
        console.log(`  ✅ Created  — ${co.name}`);
      }
      companyMap[co.slug] = record.id;
    } catch (err: unknown) {
      console.error(`  ❌ Failed   — ${co.name}:`, err instanceof Error ? err.message : err);
    }
  }

  // ── 2. Seed apps ───────────────────────────────────────────────────────────

  console.log(`\n📱 Seeding ${APPS.length} apps...\n`);

  let created = 0;
  let updated = 0;
  let failed  = 0;

  for (const app of APPS) {
    try {
      const companyId = companyMap[app.companySlug];
      if (!companyId) {
        console.error(`  ❌ No company found for slug "${app.companySlug}" — skipping ${app.name}`);
        failed++;
        continue;
      }

      const appData = {
        name:            app.name,
        tagline:         app.tagline,
        description:     app.description,
        fullDescription: app.fullDescription ?? null,
        companyId,
        primaryCategory: app.primaryCategory ?? null,
        status:          app.status as any,
        isPublished:     app.isPublished,
        isFeatured:      app.isFeatured,
        isNew:           app.isNew,
        comingSoon:      app.status === "COMING_SOON",
        emoji:           app.emoji,
        icon:            app.icon ?? null,
        primaryColor:    app.primaryColor,
        accentColor:     app.accentColor,
        liveUrl:         (app as any).liveUrl ?? null,
        launchedYear:    app.launchedYear ?? null,
        problemSolved:   app.problemSolved ?? null,
        targetUsers:     app.targetUsers   ?? null,
        businessModel:   app.businessModel ?? null,
        nextMilestone:   app.nextMilestone  ?? null,
        keywords:        app.keywords,
        publishedAt:     app.isPublished ? new Date() : null,
      };

      let appRecord;
      const existing = await prisma.app.findUnique({ where: { slug: app.slug } });

      if (existing) {
        appRecord = await prisma.app.update({ where: { slug: app.slug }, data: appData });
        console.log(`  🔄 Updated  — ${app.name}`);
        updated++;
      } else {
        appRecord = await prisma.app.create({ data: { ...appData, slug: app.slug } });
        console.log(`  ✅ Created  — ${app.name}`);
        created++;
      }

      const appId = appRecord.id;

      // Delete and recreate all child records (clean replace on each run)
      await prisma.appFeature.deleteMany(    { where: { appId } });
      await prisma.appMetric.deleteMany(     { where: { appId } });
      await prisma.appTechItem.deleteMany(   { where: { appId } });
      await prisma.appChangelog.deleteMany(  { where: { appId } });
      await prisma.appScreenshot.deleteMany( { where: { appId } });
      await prisma.appCategoryEntry.deleteMany({ where: { appId } });

      // Features
      if (app.features.length > 0) {
        await prisma.appFeature.createMany({
          data: app.features.map(f => ({ appId, icon: f.icon, title: f.title, description: f.description, order: f.order })),
        });
      }

      // Metrics
      if (app.metrics.length > 0) {
        await prisma.appMetric.createMany({
          data: app.metrics.map(m => ({ appId, label: m.label, value: m.value, trend: m.trend ?? null, trendValue: m.trendValue ?? null, order: m.order })),
        });
      }

      // Tech stack
      if (app.techStack.length > 0) {
        await prisma.appTechItem.createMany({
          data: app.techStack.map(t => ({ appId, name: t.name, category: t.category })),
        });
      }

      // Changelog
      if (app.changelog.length > 0) {
        await prisma.appChangelog.createMany({
          data: app.changelog.map(c => ({ appId, version: c.version, title: c.title, description: c.description, type: c.type, releasedAt: c.date })),
        });
      }

      // Screenshots (labels only — no actual image URLs yet)
      if (app.screenshots.length > 0) {
        await prisma.appScreenshot.createMany({
          data: app.screenshots.map(s => ({ appId, url: "", label: s.label, order: s.order })),
        });
      }

      // Category entries (many-to-many)
      if (app.categories.length > 0) {
        await prisma.appCategoryEntry.createMany({
          data: app.categories.map(cat => ({ appId, category: cat as any })),
        });
      }

    } catch (err: unknown) {
      console.error(`  ❌ Failed   — ${app.name}:`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`Companies: ${Object.keys(companyMap).length} seeded`);
  console.log(`✅ Apps created : ${created}`);
  console.log(`🔄 Apps updated : ${updated}`);
  console.log(`❌ Apps failed  : ${failed}`);
  console.log(`📦 Apps total   : ${APPS.length}`);
  console.log(`─────────────────────────────────────\n`);
}

seed()
  .catch((err) => { console.error("Seed failed:", err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });