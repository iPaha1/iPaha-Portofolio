// =============================================================================
// isaacpaha.com — Apps Data
// Single source of truth for all applications across all companies
// =============================================================================

export type AppStatus = "LIVE" | "BETA" | "IN_DEVELOPMENT" | "COMING_SOON";
export type AppCategory =
  | "Jobs & Recruitment"
  | "E-Commerce"
  | "Fintech"
  | "AI & Productivity"
  | "Education"
  | "Logistics"
  | "Marketplace";

export type CompanyId = "ipaha" | "ipahaStores" | "okpah";

export interface TechItem {
  name: string;
  category: "frontend" | "backend" | "database" | "infra" | "api" | "auth";
}

export interface AppFeature {
  icon: string;
  title: string;
  description: string;
}

export interface AppMetric {
  label: string;
  value: string;
  trend?: "up" | "down" | "flat";
  trendValue?: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  type: "launch" | "feature" | "improvement" | "fix" | "milestone";
  title: string;
  notes: string[];
}

export interface MockScreen {
  id: string;
  label: string;
  emoji: string;
  description: string;
  accentColor: string;
}

export interface App {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  fullDescription: string;
  company: CompanyId;
  category: AppCategory;
  status: AppStatus;
  icon: string;
  primaryColor: string;
  accentColor: string;
  liveUrl?: string;
  githubUrl?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  launchedYear?: number;
  techStack: TechItem[];
  metrics: AppMetric[];
  features: AppFeature[];
  screens: MockScreen[];
  changelog: ChangelogEntry[];
  problemStatement: string;
  targetUsers: string;
  businessModel: string;
  nextMilestone?: string;
}

// ─── COMPANIES ────────────────────────────────────────────────────────────────

export const COMPANIES: Record<
  CompanyId,
  {
    id: CompanyId;
    name: string;
    shortName: string;
    tagline: string;
    country: string;
    flag: string;
    website: string;
    primaryColor: string;
    description: string;
    founded: string;
    focus: string;
  }
> = {
  ipaha: {
    id: "ipaha",
    name: "iPaha Ltd",
    shortName: "iPaha",
    tagline: "Technology solutions for modern businesses",
    country: "United Kingdom",
    flag: "🇬🇧",
    website: "https://ipahait.com",
    primaryColor: "#f59e0b",
    description:
      "UK-based technology company building SaaS tools and AI-powered products for professionals and businesses.",
    founded: "2019",
    focus: "AI, SaaS, Productivity",
  },
  ipahaStores: {
    id: "ipahaStores",
    name: "iPahaStores Ltd",
    shortName: "iPahaStores",
    tagline: "Next-generation commerce infrastructure",
    country: "United Kingdom",
    flag: "🇬🇧",
    website: "https://ipahastore.com",
    primaryColor: "#3b82f6",
    description:
      "UK-based e-commerce company building multi-vendor marketplace platforms and commerce tooling for retailers.",
    founded: "2020",
    focus: "E-Commerce, Marketplace",
  },
  okpah: {
    id: "okpah",
    name: "Okpah Ltd",
    shortName: "Okpah",
    tagline: "Technology built for Africa's growing economy",
    country: "Ghana",
    flag: "🇬🇭",
    website: "https://okpah.com",
    primaryColor: "#10b981",
    description:
      "Ghana-based technology company building digital infrastructure and applications tailored to West African markets.",
    founded: "2021",
    focus: "Jobs, Fintech, E-Commerce, Education",
  },
};

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  AppStatus,
  {
    label: string;
    shortLabel: string;
    textColor: string;
    bgColor: string;
    borderColor: string;
    dotClass: string;
    glowColor: string;
  }
> = {
  LIVE: {
    label: "Live",
    shortLabel: "Live",
    textColor: "#34d399",
    bgColor: "rgba(16,185,129,0.08)",
    borderColor: "rgba(16,185,129,0.25)",
    dotClass: "bg-emerald-400",
    glowColor: "rgba(16,185,129,0.15)",
  },
  BETA: {
    label: "Beta",
    shortLabel: "Beta",
    textColor: "#fbbf24",
    bgColor: "rgba(245,158,11,0.08)",
    borderColor: "rgba(245,158,11,0.25)",
    dotClass: "bg-amber-400 animate-pulse",
    glowColor: "rgba(245,158,11,0.12)",
  },
  IN_DEVELOPMENT: {
    label: "In Development",
    shortLabel: "Dev",
    textColor: "#60a5fa",
    bgColor: "rgba(59,130,246,0.08)",
    borderColor: "rgba(59,130,246,0.25)",
    dotClass: "bg-blue-400 animate-pulse",
    glowColor: "rgba(59,130,246,0.1)",
  },
  COMING_SOON: {
    label: "Coming Soon",
    shortLabel: "Soon",
    textColor: "#9ca3af",
    bgColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.1)",
    dotClass: "bg-gray-500",
    glowColor: "transparent",
  },
};

// ─── APPS ─────────────────────────────────────────────────────────────────────

export const APPS: App[] = [
  // ── OKPAH ─────────────────────────────────────────────────────────────────
  {
    id: "okadwuma",
    slug: "okadwuma",
    name: "oKadwuma",
    tagline: "West Africa's professional jobs platform",
    description:
      "Smart job matching, verified employer listings, and a talent network built on trust — connecting skilled professionals with great companies across Ghana and West Africa.",
    fullDescription:
      "oKadwuma (meaning 'work' in Twi) exists because professional hiring in West Africa is still dominated by personal networks and word-of-mouth. If you don't know the right person, you don't get the opportunity. We're fixing that.\n\nThe platform is mobile-first and optimised for the reality of how West Africans use the internet. Every employer is verified. Salary ranges are visible by default. Job seekers can track applications in real time, and our AI matching engine learns from behaviour to surface increasingly relevant opportunities over time.\n\nFor employers, oKadwuma provides a full applicant tracking system, WhatsApp integration for candidate messaging, and access to a verified talent pool that grows every week.",
    company: "okpah",
    category: "Jobs & Recruitment",
    status: "LIVE",
    icon: "💼",
    primaryColor: "#10b981",
    accentColor: "#34d399",
    liveUrl: "https://okpah.com",
    isFeatured: true,
    launchedYear: 2022,
    techStack: [
      { name: "Next.js 14", category: "frontend" },
      { name: "TypeScript", category: "frontend" },
      { name: "Tailwind CSS", category: "frontend" },
      { name: "Framer Motion", category: "frontend" },
      { name: "Node.js", category: "backend" },
      { name: "Prisma ORM", category: "backend" },
      { name: "PostgreSQL", category: "database" },
      { name: "Redis", category: "database" },
      { name: "Elasticsearch", category: "database" },
      { name: "Vercel", category: "infra" },
      { name: "Clerk Auth", category: "auth" },
      { name: "Resend", category: "api" },
      { name: "Paystack", category: "api" },
    ],
    metrics: [
      { label: "Active Listings", value: "2,400+", trend: "up", trendValue: "+18% MoM" },
      { label: "Registered Users", value: "8,500+", trend: "up", trendValue: "+24% MoM" },
      { label: "Employer Accounts", value: "320+", trend: "up" },
      { label: "Successful Placements", value: "890+", trend: "up", trendValue: "All time" },
    ],
    features: [
      { icon: "🎯", title: "AI Job Matching", description: "Learns your skills, preferences and career trajectory to surface the most relevant opportunities — not just keyword matches." },
      { icon: "✅", title: "Verified Employers", description: "Every company is manually verified. No ghost listings, no scams. A job ad means a real job." },
      { icon: "💰", title: "Salary Transparency", description: "Salary ranges visible by default on every listing. Candidates know what they're applying for before they apply." },
      { icon: "📱", title: "WhatsApp Integration", description: "Employers can message shortlisted candidates directly via WhatsApp. Candidates get alerts via WhatsApp or SMS." },
      { icon: "📊", title: "Applicant Tracking", description: "Full ATS for employers — pipeline views, collaborative notes, interview scheduling, and offer management." },
      { icon: "🌍", title: "Pan-West Africa", description: "Jobs across Ghana, Nigeria, Senegal, Ivory Coast, and expanding. One profile, every market." },
    ],
    screens: [
      { id: "s1", label: "Job Feed", emoji: "📋", description: "Smart job feed with AI-ranked listings, salary bands, and company verification badges", accentColor: "#10b981" },
      { id: "s2", label: "Candidate Profile", emoji: "👤", description: "Rich candidate profile with verified skills, portfolio, and application history", accentColor: "#10b981" },
      { id: "s3", label: "Employer ATS", emoji: "🏢", description: "Drag-and-drop applicant pipeline with collaborative notes and interview scheduling", accentColor: "#10b981" },
      { id: "s4", label: "AI Matching", emoji: "🤖", description: "Real-time match scores and personalised job recommendations powered by ML", accentColor: "#10b981" },
    ],
    changelog: [
      {
        version: "2.5.0", date: "2026-03-01", type: "feature", title: "WhatsApp Alerts & Messaging",
        notes: ["Real-time WhatsApp job alerts for candidates", "Employer-to-candidate WhatsApp messaging", "SMS fallback for users without WhatsApp"]
      },
      {
        version: "2.4.0", date: "2026-01-15", type: "improvement", title: "Search & Performance",
        notes: ["Elasticsearch migration — 3x faster search", "Salary filter and remote filter added", "Employer verification badge system live"]
      },
      {
        version: "2.0.0", date: "2025-09-01", type: "launch", title: "Platform v2 Public Launch",
        notes: ["AI matching engine v1 launched", "Employer ATS dashboard released", "Mobile app (PWA) launched"]
      },
      {
        version: "1.0.0", date: "2022-06-01", type: "launch", title: "oKadwuma Launches",
        notes: ["Initial launch in Ghana", "500 job listings at launch", "First 200 employer accounts"]
      },
    ],
    problemStatement: "Professional hiring in West Africa relies on personal networks. Talented candidates without the right connections are invisible to employers — and vice versa.",
    targetUsers: "Job-seeking professionals and employers across Ghana and West Africa",
    businessModel: "Freemium — free for candidates, subscription tiers for employers (Starter / Growth / Enterprise)",
    nextMilestone: "Expand to Nigeria — target Q2 2026",
  },
  {
    id: "okddwa",
    slug: "okddwa",
    name: "okDdwa",
    tagline: "E-commerce built for West African sellers",
    description:
      "A full-featured online selling platform with Mobile Money payments, local delivery integrations, and storefronts that work on slow connections — built for the way West Africa actually shops.",
    fullDescription:
      "okDdwa (meaning 'shop' in Twi) is e-commerce infrastructure rebuilt from first principles for the West African context.\n\nWestern platforms like Shopify were built for markets with credit cards, reliable broadband, and established logistics networks. None of that describes Ghana in 2026. okDdwa supports Mobile Money as a first-class payment method, is optimised for 2G/3G connections, and integrates natively with local courier services.\n\nSellers can launch a fully branded storefront in under 10 minutes. The admin dashboard is simple enough for market traders and powerful enough for established retailers. We handle payments, delivery coordination, inventory management, and customer communication.",
    company: "okpah",
    category: "E-Commerce",
    status: "LIVE",
    icon: "🛒",
    primaryColor: "#f59e0b",
    accentColor: "#fbbf24",
    liveUrl: "https://okpah.com",
    launchedYear: 2022,
    techStack: [
      { name: "Next.js 14", category: "frontend" },
      { name: "TypeScript", category: "frontend" },
      { name: "Tailwind CSS", category: "frontend" },
      { name: "Prisma ORM", category: "backend" },
      { name: "MySQL", category: "database" },
      { name: "Redis", category: "database" },
      { name: "Vercel", category: "infra" },
      { name: "Cloudinary", category: "infra" },
      { name: "Paystack", category: "api" },
      { name: "Stripe", category: "api" },
      { name: "Clerk Auth", category: "auth" },
    ],
    metrics: [
      { label: "Active Stores", value: "640+", trend: "up", trendValue: "+12% MoM" },
      { label: "Products Listed", value: "18,000+", trend: "up" },
      { label: "Orders Processed", value: "24,000+", trend: "up", trendValue: "All time" },
      { label: "Monthly GMV", value: "₵280k+", trend: "up", trendValue: "+9% MoM" },
    ],
    features: [
      { icon: "📱", title: "Mobile Money Native", description: "MTN MoMo, Vodafone Cash, and AirtelTigo Money supported as first-class checkout options. No workarounds." },
      { icon: "⚡", title: "Works on 2G", description: "Sub-100kb pages, progressive loading, and offline-capable checkout. Every customer can shop, everywhere." },
      { icon: "🏪", title: "10-Minute Storefront", description: "Go from signup to selling in under 10 minutes. No technical skills needed, no code, no complexity." },
      { icon: "🚚", title: "Local Delivery Network", description: "Built-in integrations with Ghanaian courier services — Courier Plus, Gecko Logistics, and more." },
      { icon: "🌐", title: "Multi-Language", description: "Storefronts available in English, Twi, Hausa, and French for pan-West African reach." },
      { icon: "📊", title: "Seller Analytics", description: "Real-time revenue dashboard, inventory alerts, top products, and customer geography maps." },
    ],
    screens: [
      { id: "s1", label: "Seller Dashboard", emoji: "📊", description: "Real-time sales, orders, revenue and inventory at a glance", accentColor: "#f59e0b" },
      { id: "s2", label: "Product Manager", emoji: "📦", description: "Bulk product upload, variant management, and smart pricing suggestions", accentColor: "#f59e0b" },
      { id: "s3", label: "Mobile Checkout", emoji: "📱", description: "One-tap Mobile Money checkout optimised for the smallest screens and slowest connections", accentColor: "#f59e0b" },
      { id: "s4", label: "Delivery Tracking", emoji: "🚚", description: "Live order tracking for buyers, integrated with local courier networks", accentColor: "#f59e0b" },
    ],
    changelog: [
      {
        version: "3.2.0", date: "2026-02-15", type: "feature", title: "Multi-Language Storefronts",
        notes: ["Twi, Hausa, and French language support", "Auto-translate product descriptions (AI)", "Currency localisation for Francophone markets"]
      },
      {
        version: "3.0.0", date: "2025-10-01", type: "launch", title: "Platform v3",
        notes: ["Rebuilt storefront builder from scratch", "New seller analytics dashboard", "Courier Plus and Gecko Logistics integrations"]
      },
      {
        version: "2.0.0", date: "2022-11-01", type: "launch", title: "okDdwa Launches",
        notes: ["Mobile Money integration live", "First 100 stores onboarded", "SMS order notifications"]
      },
    ],
    problemStatement: "Western e-commerce platforms don't support Mobile Money, aren't optimised for slow connections, and don't integrate with local logistics — leaving West African sellers underserved.",
    targetUsers: "Small to medium-sized businesses and individual sellers in Ghana and West Africa",
    businessModel: "Transaction fee (1.5%) + optional monthly subscription for premium features",
    nextMilestone: "Integrate USSD checkout for feature phone users — Q3 2026",
  },
  {
    id: "oksika",
    slug: "oksika",
    name: "okSika",
    tagline: "Financial tools for the underbanked",
    description:
      "Digital savings, micro-lending, and budgeting tools for people who have a mobile phone but limited access to traditional banking — starting in Ghana, built for the world.",
    fullDescription:
      "okSika (meaning 'money' or 'gold' in Twi) is a financial technology platform for the 500 million West Africans who have mobile phones but no meaningful relationship with formal financial institutions.\n\nWe start with three products: a digital savings wallet that earns real interest, micro-loans assessed on Mobile Money transaction history rather than credit scores, and a budgeting tool designed for the reality of variable, informal-sector income.\n\nThe digital Susu product — a group savings mechanism — is a particularly important innovation. It digitises the traditional West African rotating savings group (called Susu in Ghana, Tontine elsewhere), making them reliable, transparent, and automatic.",
    company: "okpah",
    category: "Fintech",
    status: "BETA",
    icon: "💰",
    primaryColor: "#f97316",
    accentColor: "#fb923c",
    liveUrl: "https://okpah.com",
    isNew: true,
    launchedYear: 2025,
    techStack: [
      { name: "Next.js 14", category: "frontend" },
      { name: "TypeScript", category: "frontend" },
      { name: "React Native", category: "frontend" },
      { name: "Node.js", category: "backend" },
      { name: "PostgreSQL", category: "database" },
      { name: "Prisma ORM", category: "backend" },
      { name: "Redis", category: "database" },
      { name: "Paystack", category: "api" },
      { name: "AWS", category: "infra" },
    ],
    metrics: [
      { label: "Beta Users", value: "3,400+", trend: "up", trendValue: "+31% MoM" },
      { label: "Active Savings Wallets", value: "2,800+", trend: "up" },
      { label: "Loans Disbursed", value: "420+", trend: "up", trendValue: "All time" },
      { label: "Total Savings Volume", value: "₵480k+", trend: "up" },
    ],
    features: [
      { icon: "🏦", title: "Interest-Bearing Savings", description: "Earn 8% APR on savings balances. Open in 90 seconds with just your phone number and Mobile Money." },
      { icon: "💳", title: "Score-Free Micro-Loans", description: "Loans from ₵50–₵2,000 assessed against your Mobile Money transaction history, not a bank credit score." },
      { icon: "🤝", title: "Digital Susu Groups", description: "Digitise your rotating savings group. Automatic collections, transparent tracking, zero disputes." },
      { icon: "📊", title: "Variable Income Budgeting", description: "Budget tools designed for traders, drivers, and market vendors — people with irregular monthly income." },
      { icon: "📱", title: "USSD Access (*711#)", description: "Every feature accessible via USSD for users without smartphones or data connections." },
      { icon: "🔒", title: "Bank-Grade Security", description: "256-bit encryption, biometric login, real-time fraud monitoring, and regulatory compliance." },
    ],
    screens: [
      { id: "s1", label: "Savings Wallet", emoji: "💰", description: "Clean savings dashboard showing balance, interest earned, and savings goals progress", accentColor: "#f97316" },
      { id: "s2", label: "Loan Application", emoji: "📝", description: "90-second loan application with instant eligibility based on Mobile Money history", accentColor: "#f97316" },
      { id: "s3", label: "Susu Groups", emoji: "🤝", description: "Digital group savings with automated collections and transparent contribution tracking", accentColor: "#f97316" },
      { id: "s4", label: "Budget Tracker", emoji: "📊", description: "Income and expense tracking with irregular income support and smart categorisation", accentColor: "#f97316" },
    ],
    changelog: [
      {
        version: "1.4.0", date: "2026-02-01", type: "feature", title: "Digital Susu Groups",
        notes: ["Group savings product launched", "Automated WhatsApp collection reminders", "Group admin dashboard with contribution tracking"]
      },
      {
        version: "1.2.0", date: "2025-12-01", type: "feature", title: "USSD Access Live",
        notes: ["Full feature access via *711#", "USSD loan applications enabled", "Feature phone savings deposits"]
      },
      {
        version: "1.0.0", date: "2025-08-01", type: "launch", title: "okSika Beta Launch",
        notes: ["Savings wallet and micro-lending live", "1,000 early users onboarded", "Paystack integration complete"]
      },
    ],
    problemStatement: "500 million West Africans lack access to formal financial services despite having mobile phones. Mobile Money exists but has no savings, credit, or budgeting layer.",
    targetUsers: "Underbanked individuals, market traders, and informal sector workers in Ghana and West Africa",
    businessModel: "Interest spread on savings products + 3% origination fee on micro-loans",
    nextMilestone: "Launch mobile app (iOS/Android) — Q2 2026",
  },
  {
    id: "oksumame",
    slug: "oksumame",
    name: "okSumame",
    tagline: "Last-mile delivery infrastructure for West Africa",
    description:
      "A delivery aggregation platform connecting businesses with a verified network of local couriers — single integration, live tracking, price comparison, and intelligent routing.",
    fullDescription:
      "okSumame (meaning 'send' in Twi) solves one of the hardest problems in West African commerce: reliable, affordable last-mile delivery.\n\nThe courier landscape in Ghana is fragmented. Sellers have to manage multiple courier relationships, compare prices manually, and have no visibility once a package is collected. We aggregate the entire network into a single API and a single dashboard.\n\nFrom a business's perspective: one integration, every courier option, live tracking, automated customer notifications via WhatsApp, and data on which couriers are actually performing.",
    company: "okpah",
    category: "Logistics",
    status: "IN_DEVELOPMENT",
    icon: "🚀",
    primaryColor: "#6366f1",
    accentColor: "#818cf8",
    isNew: true,
    techStack: [
      { name: "Next.js 14", category: "frontend" },
      { name: "TypeScript", category: "frontend" },
      { name: "Node.js", category: "backend" },
      { name: "PostgreSQL", category: "database" },
      { name: "Redis", category: "database" },
      { name: "WebSockets", category: "backend" },
      { name: "Google Maps API", category: "api" },
      { name: "AWS", category: "infra" },
    ],
    metrics: [
      { label: "Courier Partners", value: "14", trend: "up" },
      { label: "Cities Covered", value: "8", trend: "up" },
      { label: "Alpha Merchants", value: "60", trend: "up" },
      { label: "Target Launch", value: "Q3 2026", trend: "flat" },
    ],
    features: [
      { icon: "🔗", title: "Single API", description: "One integration gives access to the full courier network. Plug in once, choose from all options every time." },
      { icon: "📍", title: "Live GPS Tracking", description: "Real-time courier location with automated WhatsApp and SMS updates to customers at every stage." },
      { icon: "💰", title: "Instant Price Comparison", description: "Compare all courier rates and ETAs in under 200ms. Choose by price, speed, or reliability rating." },
      { icon: "🤖", title: "Smart Routing", description: "AI selects the optimal courier based on package type, route history, and real-time courier availability." },
      { icon: "🔄", title: "Returns Management", description: "Automated return workflows with courier pickup requests and instant refund triggers." },
      { icon: "📊", title: "Delivery Analytics", description: "Per-courier success rates, average delivery times, cost breakdowns, and SLA performance tracking." },
    ],
    screens: [
      { id: "s1", label: "Operations Hub", emoji: "📦", description: "Live delivery operations dashboard with courier positions, status updates, and exception alerts", accentColor: "#6366f1" },
      { id: "s2", label: "Price Comparison", emoji: "💰", description: "Real-time courier price and ETA comparison across all network partners", accentColor: "#6366f1" },
      { id: "s3", label: "Live Tracking Map", emoji: "🗺️", description: "Full-screen live map with courier positions, route visualisation, and ETA countdowns", accentColor: "#6366f1" },
    ],
    changelog: [
      {
        version: "0.4.0", date: "2026-03-01", type: "milestone", title: "14 Courier Partners Signed",
        notes: ["14 courier APIs integrated", "Alpha expanded to 60 merchants", "Real-time tracking map complete"]
      },
      {
        version: "0.2.0", date: "2025-12-01", type: "feature", title: "Core Routing Engine",
        notes: ["Smart courier selection algorithm v1", "Price comparison API live", "6 initial courier integrations"]
      },
      {
        version: "0.1.0", date: "2025-10-01", type: "launch", title: "Private Alpha",
        notes: ["Architecture complete", "First 3 courier partner agreements", "10 alpha merchants"]
      },
    ],
    problemStatement: "West African sellers manage fragmented courier relationships with no pricing transparency, no unified tracking, and no performance data.",
    targetUsers: "E-commerce businesses and logistics teams in Ghana and West Africa",
    businessModel: "Per-delivery fee (5–8% of delivery cost) + enterprise API subscription",
    nextMilestone: "Public beta — Q3 2026",
  },
  {
    id: "okedukation",
    slug: "okedukation",
    name: "okEdukation",
    tagline: "Digital infrastructure for African schools",
    description:
      "School management, e-learning, and parent communication — offline-first, built for cheap Android devices, and designed around the Ghana Education Service curriculum.",
    fullDescription:
      "okEdukation is EdTech built for the real constraints of Ghanaian schools: intermittent power, slow internet, inexpensive devices, and an administration system that still runs mostly on paper.\n\nThe platform is offline-first — it works without internet and syncs automatically when connectivity is available. It runs smoothly on ₵300 Android devices. And it's designed for the actual Ghana Education Service curriculum, not a generic Western syllabus.\n\nSchool admins get enrollment, attendance, fees, and reporting in one place. Teachers get a digital grade book and curriculum-aligned resources. Parents get attendance and grade updates via WhatsApp.",
    company: "okpah",
    category: "Education",
    status: "COMING_SOON",
    icon: "📚",
    primaryColor: "#ec4899",
    accentColor: "#f472b6",
    techStack: [
      { name: "Next.js 14", category: "frontend" },
      { name: "React Native", category: "frontend" },
      { name: "TypeScript", category: "frontend" },
      { name: "Prisma ORM", category: "backend" },
      { name: "PostgreSQL", category: "database" },
      { name: "PouchDB", category: "database" },
      { name: "Tailwind CSS", category: "frontend" },
      { name: "Expo", category: "infra" },
    ],
    metrics: [
      { label: "Schools Waitlisted", value: "200+", trend: "up" },
      { label: "Target Students Y1", value: "50,000+", trend: "flat" },
      { label: "NGO Partners", value: "5", trend: "up" },
      { label: "Target Launch", value: "Q4 2026", trend: "flat" },
    ],
    features: [
      { icon: "📴", title: "Offline First", description: "Full functionality without internet. Syncs silently when connectivity appears. No data loss, ever." },
      { icon: "📊", title: "School Administration", description: "Enrollment, attendance registers, grade management, fee collection, and regulatory reporting — all digital." },
      { icon: "👨‍👩‍👧", title: "Parent Portal", description: "Attendance, grades, and school notices pushed to parents via WhatsApp automatically." },
      { icon: "📱", title: "Runs on ₵300 Devices", description: "Optimised for entry-level Android. A working school OS for the most resource-constrained environments." },
      { icon: "📝", title: "GES-Aligned Curriculum", description: "Lesson resources, assessments, and digital textbooks mapped directly to the Ghana Education Service syllabus." },
      { icon: "💰", title: "Mobile Money Fees", description: "School fee collection via Mobile Money with automated receipts, reminders, and reconciliation." },
    ],
    screens: [
      { id: "s1", label: "Admin Dashboard", emoji: "🏫", description: "School administration overview with enrollment, attendance, fee status, and key alerts", accentColor: "#ec4899" },
      { id: "s2", label: "Teacher Grade Book", emoji: "👩‍🏫", description: "Digital grade book with class register, assessment builder, and report card generator", accentColor: "#ec4899" },
      { id: "s3", label: "Parent App", emoji: "👨‍👩‍👧", description: "Parent-facing mobile app showing child attendance, grades, and school announcements", accentColor: "#ec4899" },
    ],
    changelog: [
      {
        version: "0.1.0", date: "2026-01-01", type: "milestone", title: "Pre-Build Milestone",
        notes: ["Architecture and database schema complete", "200+ schools on waitlist", "5 NGO partnerships confirmed", "GES curriculum mapping done"]
      },
    ],
    problemStatement: "Ghana's schools lack affordable, offline-capable digital infrastructure. Most EdTech is designed for Western schools with reliable internet — useless in most Ghanaian classrooms.",
    targetUsers: "Primary and secondary schools, teachers, parents, and students in Ghana",
    businessModel: "Per-student annual subscription (₵12/student/year) + NGO grant funding",
    nextMilestone: "Development begins Q2 2026 — pilot with 5 schools",
  },

  // ── IPAHA ──────────────────────────────────────────────────────────────────
  {
    id: "paralel-me",
    slug: "paralel-me",
    name: "Paralel Me",
    tagline: "Your AI-powered productivity operating system",
    description:
      "An intelligent assistant that learns how you work, protects your deep work time, manages your task list, and helps you get more done with less friction.",
    fullDescription:
      "Paralel Me is built on a simple but radical insight: the most productive people are not doing more — they are doing the right things at the right time.\n\nMost productivity tools ask you to manage them. Paralel Me manages itself around you. It connects to your calendar, learns your work patterns, identifies when you are most focused, and builds a daily plan that protects your deep work time from being fragmented by meetings and context-switching.\n\nThe AI assistant layer understands natural language — capture tasks by typing or dictating naturally, and the system extracts deadlines, priorities, and context automatically. It integrates with your existing stack (Notion, Linear, Gmail, Slack) so you don't have to change how your team works.",
    company: "ipaha",
    category: "AI & Productivity",
    status: "BETA",
    icon: "⚡",
    primaryColor: "#8b5cf6",
    accentColor: "#a78bfa",
    liveUrl: "https://ipahait.com",
    isFeatured: true,
    isNew: true,
    launchedYear: 2025,
    techStack: [
      { name: "Next.js 14", category: "frontend" },
      { name: "TypeScript", category: "frontend" },
      { name: "Tailwind CSS", category: "frontend" },
      { name: "Framer Motion", category: "frontend" },
      { name: "Claude API", category: "api" },
      { name: "Prisma ORM", category: "backend" },
      { name: "PostgreSQL", category: "database" },
      { name: "Redis", category: "database" },
      { name: "Vercel", category: "infra" },
      { name: "Clerk Auth", category: "auth" },
      { name: "Google Calendar API", category: "api" },
      { name: "OpenAI Whisper", category: "api" },
    ],
    metrics: [
      { label: "Beta Users", value: "1,200+", trend: "up", trendValue: "+42% MoM" },
      { label: "Tasks Completed", value: "48,000+", trend: "up", trendValue: "All time" },
      { label: "Avg Rating", value: "4.8 / 5", trend: "up" },
      { label: "Hours Saved (Est.)", value: "3,200+", trend: "up" },
    ],
    features: [
      { icon: "🧠", title: "Learns Your Rhythms", description: "Observes when you do your best work over time and automatically protects those windows in your calendar." },
      { icon: "💬", title: "Natural Language Tasks", description: "Add tasks by talking or typing naturally. AI extracts the date, priority, project, and context automatically." },
      { icon: "📅", title: "Intelligent Scheduling", description: "Connects to Google Calendar and intelligently blocks focused work time around your meetings." },
      { icon: "✍️", title: "AI Writing Layer", description: "Draft emails, summarise documents, write briefs — context-aware within your workspace." },
      { icon: "📈", title: "Weekly Reviews", description: "Automated weekly review showing completion rates, focus time, productivity trends, and what to do differently." },
      { icon: "🔌", title: "Stack Integrations", description: "Native integrations with Notion, Linear, Gmail, Slack, GitHub, and more. Works inside your existing workflow." },
    ],
    screens: [
      { id: "s1", label: "Morning Dashboard", emoji: "🌅", description: "Clean morning view — today's priorities, protected focus blocks, and AI-curated task list", accentColor: "#8b5cf6" },
      { id: "s2", label: "AI Assistant", emoji: "💬", description: "Conversational AI for natural language task capture, planning, and writing assistance", accentColor: "#8b5cf6" },
      { id: "s3", label: "Focus Calendar", emoji: "📅", description: "Smart calendar with AI-protected focus blocks and colour-coded energy levels", accentColor: "#8b5cf6" },
      { id: "s4", label: "Weekly Review", emoji: "📊", description: "Auto-generated weekly review with productivity analytics and personalised recommendations", accentColor: "#8b5cf6" },
    ],
    changelog: [
      {
        version: "0.9.0", date: "2026-03-01", type: "feature", title: "Gmail Integration & Meeting Summaries",
        notes: ["Gmail read/send integration", "Automated meeting summary generation via Whisper + Claude", "Weekly review v2 with trend charts"]
      },
      {
        version: "0.8.0", date: "2026-01-15", type: "improvement", title: "Speed & Mobile",
        notes: ["AI response latency reduced by 60%", "PWA (Progressive Web App) launched", "Notion two-way sync fixed"]
      },
      {
        version: "0.5.0", date: "2025-11-01", type: "launch", title: "Closed Beta Launch",
        notes: ["Core task management live", "Google Calendar integration", "Natural language task entry", "500 invite-only beta users"]
      },
    ],
    problemStatement: "Productivity tools have become a source of distraction themselves. Most require constant tending and management rather than enabling focused, intentional work.",
    targetUsers: "Knowledge workers, founders, and professionals who want to be deliberate with their time",
    businessModel: "Subscription — Free / Pro (£12/mo) / Team (£8/user/mo)",
    nextMilestone: "Public launch — Q2 2026",
  },

  // ── IPAHASTORE ─────────────────────────────────────────────────────────────
  {
    id: "ipahastore-platform",
    slug: "ipahastore-platform",
    name: "iPahaStore",
    tagline: "Multi-vendor marketplace platform for UK retailers",
    description:
      "Full-featured marketplace infrastructure enabling UK retailers to sell across a shared platform — with AI product optimisation, automated vendor payouts, and an enterprise-grade admin layer.",
    fullDescription:
      "The iPahaStore Platform is white-label multi-vendor marketplace infrastructure built for the UK retail market.\n\nBuilding a marketplace from scratch takes six months of engineering. Our platform enables launch in weeks. Vendor onboarding, product catalogue management, order routing, payment processing, payout automation, and dispute resolution — all built and maintained, so marketplace operators can focus on growth.\n\nThe AI layer adds real commercial value: automatic product title and description optimisation, pricing recommendations based on market comparables, and demand forecasting for inventory planning.",
    company: "ipahaStores",
    category: "Marketplace",
    status: "LIVE",
    icon: "🏬",
    primaryColor: "#3b82f6",
    accentColor: "#60a5fa",
    liveUrl: "https://ipahastore.com",
    launchedYear: 2021,
    techStack: [
      { name: "Next.js 14", category: "frontend" },
      { name: "TypeScript", category: "frontend" },
      { name: "Tailwind CSS", category: "frontend" },
      { name: "Node.js", category: "backend" },
      { name: "Prisma ORM", category: "backend" },
      { name: "PostgreSQL", category: "database" },
      { name: "Elasticsearch", category: "database" },
      { name: "Redis", category: "database" },
      { name: "Stripe", category: "api" },
      { name: "AWS S3", category: "infra" },
      { name: "Vercel", category: "infra" },
      { name: "Clerk Auth", category: "auth" },
    ],
    metrics: [
      { label: "Active Vendors", value: "340+", trend: "up", trendValue: "+8% MoM" },
      { label: "Products Listed", value: "42,000+", trend: "up" },
      { label: "Monthly Orders", value: "8,200+", trend: "up", trendValue: "+14% MoM" },
      { label: "Monthly GMV", value: "£180k+", trend: "up", trendValue: "+11% MoM" },
    ],
    features: [
      { icon: "🏪", title: "Vendor Lifecycle Management", description: "Application, verification, onboarding, catalogue approval, performance monitoring, and automated payouts." },
      { icon: "🤖", title: "AI Product Optimisation", description: "Automatically improves product titles and descriptions, suggests pricing, and flags catalogue issues." },
      { icon: "🔍", title: "Enterprise Search", description: "Elasticsearch with faceted filtering, synonym handling, typo tolerance, and personalised result ranking." },
      { icon: "💳", title: "Automated Payouts", description: "Stripe-powered vendor payouts on configurable schedules with full reconciliation and tax reporting." },
      { icon: "⚖️", title: "Dispute Resolution", description: "Built-in workflow for buyer/seller disputes with mediation tools and automatic resolution paths." },
      { icon: "📊", title: "Marketplace Intelligence", description: "Platform-wide and per-vendor analytics — sales, traffic, conversion, returns, and customer LTV." },
    ],
    screens: [
      { id: "s1", label: "Marketplace Front", emoji: "🏬", description: "Customer-facing marketplace with personalised product feeds and vendor spotlight sections", accentColor: "#3b82f6" },
      { id: "s2", label: "Vendor Dashboard", emoji: "📊", description: "Vendor management dashboard with orders, inventory, earnings, and performance metrics", accentColor: "#3b82f6" },
      { id: "s3", label: "Platform Admin", emoji: "⚙️", description: "Operator admin panel with vendor management, dispute resolution, and financial reconciliation", accentColor: "#3b82f6" },
      { id: "s4", label: "AI Optimiser", emoji: "🤖", description: "AI-powered product content optimisation with before/after comparison and bulk application", accentColor: "#3b82f6" },
    ],
    changelog: [
      {
        version: "4.3.0", date: "2026-02-20", type: "feature", title: "AI Product Optimiser",
        notes: ["AI title and description optimisation for all vendor products", "Pricing recommendation engine", "Bulk optimisation tool for vendors with 100+ products"]
      },
      {
        version: "4.0.0", date: "2025-11-01", type: "launch", title: "Platform v4",
        notes: ["Full Elasticsearch migration", "Vendor payout automation v2", "New storefront builder for operators"]
      },
      {
        version: "3.0.0", date: "2024-05-01", type: "launch", title: "Platform v3",
        notes: ["Multi-currency support", "Dispute resolution system", "Advanced analytics dashboard"]
      },
      {
        version: "1.0.0", date: "2021-03-01", type: "launch", title: "iPahaStore Launches",
        notes: ["Initial marketplace launch", "First 50 vendors onboarded", "Stripe integration live"]
      },
    ],
    problemStatement: "Building a multi-vendor marketplace from scratch takes 6+ months of engineering. Operators need a platform that lets them focus on vendor growth, not infrastructure.",
    targetUsers: "UK-based e-commerce businesses and marketplace operators",
    businessModel: "Platform commission (8–12% per transaction) + monthly operator subscription",
    nextMilestone: "Launch self-serve operator onboarding — Q2 2026",
  },
];