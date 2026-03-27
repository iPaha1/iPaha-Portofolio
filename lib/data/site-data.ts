// =============================================================================
// isaacpaha.com — Site Data
// Central data store for all homepage content
// =============================================================================

export const PERSONAL = {
  name: "Isaac Paha",
  title: "Technologist · Entrepreneur · Thinker",
  tagline: "Exploring AI, software, and the future of society.",
  bio: "Building companies, products, and ideas that matter — impacting the world around me.",
  location: "United Kingdom",
  email: "pahaisaac@gmail.com",
  photo: "/images/photo1.png",
  social: {
    github: "https://github.com/iPaha1",
    linkedin: "https://www.linkedin.com/in/isaac-paha-578911a9/",
    twitter: "https://twitter.com/iPaha3",
  },
};

export const COMPANIES = [
  {
    id: "ipaha-ltd",
    name: "iPaha Ltd",
    flag: "🇬🇧",
    location: "United Kingdom",
    description:
      "IT consultancy delivering custom software, digital transformation, and bespoke solutions for businesses globally.",
    website: "ipahait.com",
    href: "https://ipahait.com",
    year: "2019",
  },
  {
    id: "ipahaStores-ltd",
    name: "iPahaStores Ltd",
    flag: "🇬🇧",
    location: "United Kingdom",
    description:
      "SaaS and e-commerce platform company powering next-generation online retail experiences.",
    website: "ipahastore.com",
    href: "https://ipahastore.com",
    year: "2021",
  },
  {
    id: "okPah-ltd",
    name: "OkPah Ltd",
    flag: "🇬🇭",
    location: "Ghana",
    description:
      "Innovation-driven startup building homegrown digital platforms for the Ghanaian market.",
    website: "okpah.com",
    href: "https://okpah.com",
    year: "2022",
  },
];

export const PRODUCTS = [
//   {
//     id: "okadwuma",
//     name: "oKadwuma",
//     domain: "okadwuma.com",
//     category: "Employment",
//     description:
//       "Job search platform connecting Ghanaian jobseekers with employers. Bridging the employment gap with technology.",
//     href: "https://www.okadwuma.com",
//     status: "live" as const,
//     tags: ["Jobs", "Ghana", "Platform"],
//   },
  {
    id: "parallelme",
    name: "Paralel Me",
    domain: "paralelme.com",
    category: "AI",
    description:
      "Your AI-powered personal assistant and life coach. Think smarter, work better, live intentionally.",
    href: "https://www.paralelme.com",
    status: "live" as const,
    tags: ["AI", "Productivity", "SaaS"],
  },
  // Add KConest - A Coparenting platform for parents and seperated couples around the world
    {
        id: "kconest",
        name: "KConest",
        domain: "kconest.com",
        category: "Family Tech",
        description:
          "A coparenting platform for parents and separated couples around the world. Simplifying shared parenting with technology.",
        href: "https://www.kconest.com",
        status: "live" as const,
        tags: ["Family Tech", "Coparenting", "SaaS"],
      },
      // Add Zzapp - A privicy-focused messaging platform for secure communication
      {
        id: "zzapp",
        name: "Zzapp",
        domain: "zzapp.com",
        category: "Communication",
        description:
          "A privacy-focused messaging platform for secure communication. Connect with confidence, communicate with care.",
        href: "https://www.zzapp.com",
        status: "coming-soon" as const,
        tags: ["Messaging", "Privacy", "SaaS"],
      },
    ];
//   {
//     id: "okddwa",
//     name: "okDdwa",
//     domain: "okddwa.com",
//     category: "Commerce",
//     description:
//       "Multi-tenant e-commerce marketplace for local traders. Empowering African commerce at scale.",
//     href: "https://www.okddwa.com",
//     status: "live" as const,
//     tags: ["E-commerce", "Marketplace", "Africa"],
//   },
//   {
//     id: "oksika",
//     name: "okSika",
//     domain: "oksika.com",
//     category: "Fintech",
//     description:
//       "Payment gateway solution built for African online transactions. Fast, secure, local.",
//     href: "https://www.oksika.com",
//     status: "live" as const,
//     tags: ["Fintech", "Payments", "Ghana"],
//   },
//   {
//     id: "oksumame",
//     name: "okSumame",
//     domain: "oksumame.com",
//     category: "Logistics",
//     description:
//       "Parcel delivery service connecting local couriers with customers — last-mile delivery, solved.",
//     href: "/",
//     status: "coming-soon" as const,
//     tags: ["Delivery", "Logistics", "Local"],
//   },
//   {
//     id: "okedukation",
//     name: "okEdukation",
//     domain: "okedukation.com",
//     category: "Education",
//     description:
//       "School management system for educational institutions. Administration, attendance, results — unified.",
//     href: "https://www.okedukation.com",
//     status: "live" as const,
//     tags: ["EdTech", "Schools", "SaaS"],
//   },
// ];

export const TECH_STACK = [
  { name: "React.js", category: "Frontend" },
  { name: "Next.js", category: "Frontend" },
  { name: "TypeScript", category: "Language" },
  { name: "Tailwind CSS", category: "Frontend" },
  { name: "Node.js", category: "Backend" },
  { name: "Express.js", category: "Backend" },
  { name: "Python", category: "Backend" },
  { name: "Django", category: "Backend" },
  { name: "Prisma ORM", category: "Database" },
  { name: "MySQL", category: "Database" },
  { name: "GraphQL", category: "API" },
  { name: "OpenAI API & Claude API", category: "AI" },
  { name: "Stripe", category: "Payments" },
  { name: "Clerk", category: "Auth" },
  { name: "AWS", category: "Cloud" },
  { name: "Docker", category: "DevOps" },
];

export const BLOG_CATEGORIES = [
  { name: "Technology", slug: "technology", icon: "💻", color: "#f59e0b" },
  { name: "Business", slug: "business", icon: "🚀", color: "#10b981" },
  { name: "Ideas Lab", slug: "ideas", icon: "💡", color: "#8b5cf6" },
  { name: "Society", slug: "society", icon: "🌍", color: "#3b82f6" },
  { name: "Life", slug: "life", icon: "✨", color: "#ec4899" },
  { name: "Education", slug: "education", icon: "📚", color: "#f97316" },
];

export const STATS = [
  { label: "Companies Founded", value: "3", suffix: "" },
  { label: "Products Launched", value: "6", suffix: "+" },
  { label: "Years Building", value: "5", suffix: "+" },
  { label: "Countries Reached", value: "2", suffix: "" },
];

export const FEATURED_POSTS = [
  {
    slug: "why-most-people-will-have-an-ai-agent",
    title: "Why Most People Will Have an AI Agent in 10 Years",
    excerpt:
      "The shift from tools to agents is the most significant technological transition of our lifetime. Here's why it's inevitable.",
    category: "Technology",
    readingTime: 6,
    publishedAt: "2026-03-01",
  },
  {
    slug: "the-future-of-work-in-an-ai-world",
    title: "The Future of Work in an AI World",
    excerpt:
      "Work as we know it is changing. Not disappearing — transforming. The question is whether we are ready.",
    category: "Business",
    readingTime: 8,
    publishedAt: "2026-02-20",
  },
  {
    slug: "why-africa-tech-future-is-just-beginning",
    title: "Why Africa's Technology Future Is Just Beginning",
    excerpt:
      "The continent has every ingredient for a tech revolution. What's missing is narrative — and that's changing fast.",
    category: "Society",
    readingTime: 7,
    publishedAt: "2026-02-10",
  },
];