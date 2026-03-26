// =============================================================================
// isaacpaha.com — Tools Lab Data
// =============================================================================

export type ToolCategory =
  | "AI"
  | "Career"
  | "Finance"
  | "Startup"
  | "Education"
  | "Productivity"
  | "Writing";

export type ToolStatus = "LIVE" | "BETA" | "COMING_SOON";

export interface Tool {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: ToolCategory;
  status: ToolStatus;
  icon: string;
  accentColor: string;
  tags: string[];
  usageCount: number;
  tokenCost?: number;
  ratingAvg: number;
  ratingCount: number;
  isFeatured?: boolean;
  isNew?: boolean;
  isPremium?: boolean;
  features: string[];
  buildTime?: string;
}

export const TOOLS: Tool[] = [

  // ─── Career ──────────────────────────────────────────────────────────────
 
  {
    id: "1",
    slug: "ai-cv-analyser",
    name: "AI CV Analyser Pro",
    tagline: "Your career optimisation engine. Not just a CV checker.",
    description:
      "Paste your CV and a job description to get a comprehensive AI analysis: ATS compatibility score, keyword gap analysis, section-by-section feedback, bullet point rewrites, job match score, and interview question preparation. The complete toolkit to land more interviews.",
    category: "Career",
    status: "LIVE",
    icon: "🎯",
    accentColor: "#10b981",
    tags: ["CV", "ATS", "Keyword Analysis", "Interview Prep", "Career"],
    usageCount: 8920,
    tokenCost: 500,
    ratingAvg: 4.9,
    ratingCount: 217,
    isFeatured: false,
    isNew: true,
    isPremium: false,
    features: [
      "ATS compatibility score",
      "Keyword gap analysis vs job description",
      "Section-by-section AI feedback",
      "Bullet point rewriter",
      "Job match score (0–100)",
      "Interview question generator",
    ],
    buildTime: "~8 seconds",
  },
  {
    id: "5",
    slug: "job-application-tracker",
    name: "Job Application Tracker",
    tagline: "Never lose track of where you've applied again.",
    description:
      "A clean, fast job application management system. Track applications by status, add notes, set follow-up reminders, and see your conversion rates at a glance. Built for serious job seekers.",
    category: "Career",
    status: "BETA",
    icon: "📋",
    accentColor: "#f97316",
    tags: ["Jobs", "Tracking", "Career", "Productivity"],
    usageCount: 4560,
    tokenCost: 10,
    ratingAvg: 4.4,
    ratingCount: 89,
    isFeatured: false,
    isNew: true,
    isPremium: false,
    features: [
      "Kanban status board",
      "Follow-up reminders",
      "Application notes",
      "Response rate analytics",
      "Export to CSV",
    ],
    buildTime: "Instant",
  },

  // ─── Startup ─────────────────────────────────────────────────────────────
  {
    id: "2",
    slug: "startup-idea-generator",
    name: "Startup Idea Generator",
    tagline: "Describe your skills — get validated startup concepts.",
    description:
      "Input your background, skills, and interests and get AI-generated startup ideas with market sizing, pain points, and initial validation questions. Built for builders who want to find their next project.",
    category: "Startup",
    status: "LIVE",
    icon: "🚀",
    accentColor: "#10b981",
    tags: ["Startups", "Ideas", "AI", "Entrepreneurship"],
    usageCount: 12340,
    tokenCost: 200,
    ratingAvg: 4.6,
    ratingCount: 218,
    isFeatured: false,
    isNew: false,
    isPremium: false,
    features: [
      "Personalised to your background",
      "Market size estimates",
      "Pain point identification",
      "Competition landscape",
      "Validation framework",
    ],
    buildTime: "~4 seconds",
  },
  {
    id: "8",
    slug: "africa-market-explorer",
    name: "Africa Market Explorer",
    tagline: "Research African markets with AI-powered data synthesis.",
    description:
      "Explore market opportunities across African countries. Input a sector and target country, and get an AI-synthesised market overview: size, growth, key players, regulatory landscape, and entry strategies.",
    category: "Startup",
    status: "COMING_SOON",
    icon: "🌍",
    accentColor: "#f59e0b",
    tags: ["Africa", "Market Research", "Business", "AI"],
    usageCount: 0,
    tokenCost: 300,
    ratingAvg: 0,
    ratingCount: 0,
    isFeatured: false,
    isNew: false,
    isPremium: true,
    features: [
      "Country-level market data",
      "Regulatory overview",
      "Key player mapping",
      "Entry strategy suggestions",
      "Risk assessment",
    ],
    buildTime: "~8 seconds",
  },

  // ─── Education ───────────────────────────────────────────────────────────
  {
    id: "3",
    slug: "learning-roadmap",
    name: "Learning Roadmap Generator",
    tagline: "Build a personalised curriculum for any skill or subject.",
    description:
      "Tell the AI what you want to learn, your current level, and how much time you have. Get a structured, week-by-week roadmap with resources, milestones, and checkpoints. Used by students and career-changers.",
    category: "Education",
    status: "LIVE",
    icon: "🗺️",
    accentColor: "#8b5cf6",
    tags: ["Learning", "Education", "Roadmap", "Skills"],
    usageCount: 9870,
    tokenCost: 50,
    ratingAvg: 4.7,
    ratingCount: 187,
    isFeatured: false,
    isNew: true,
    isPremium: false,
    features: [
      "Week-by-week structure",
      "Resource recommendations",
      "Progress milestones",
      "Adaptive difficulty",
      "Downloadable plan",
    ],
    buildTime: "~5 seconds",
  },

  // ─── Productivity ─────────────────────────────────────────────────────────
  {
    id: "7",
    slug: "productivity-score",
    name: "Productivity Score",
    tagline: "Find what's slowing you down — and fix it today.",
    description:
      "Take a fast 20-question audit of your work habits, focus, and daily systems. Get a personalised productivity score, uncover hidden bottlenecks, and receive a clear, actionable plan to improve how you work — instantly.",
    category: "Productivity",
    status: "LIVE",
    icon: "📊",
    accentColor: "#14b8a6",
    tags: ["Productivity", "Self-improvement", "Focus", "Habits", "Performance"],
    usageCount: 0,
    tokenCost: 100,
    ratingAvg: 0,
    ratingCount: 0,
    isFeatured: false,
    isNew: true,
    isPremium: false,
    features: [
      "20-question smart audit",
      "Instant productivity score (0–100)",
      "Detailed score breakdown (focus, habits, systems, energy, mindset)",
      "Bottleneck detection — what's actually slowing you down",
      "Personalised 3-step action plan (no generic advice)",
      "Shareable score card",
      "Weekly re-check system",
    ],
    buildTime: "~90 seconds",
  },
  {
    id: "9",
    slug: "qr-code-generator",
    name: "Custom QR Code Generator",
    tagline: "Beautiful, branded QR codes. Instant. Free.",
    description:
      "Create stunning, fully customised QR codes for any purpose — URLs, social profiles, contact cards, payment links, CVs, and more. Customise colours, dot shapes, frames, and embed your logo. Download as PNG or SVG. Completely free.",
    category: "Productivity",
    status: "LIVE",
    icon: "⬛",
    accentColor: "#6366f1",
    tags: ["QR Code", "Branding", "Design", "Marketing", "Free Tool"],
    usageCount: 0,
    tokenCost: 100,
    ratingAvg: 0,
    ratingCount: 0,
    isFeatured: false,
    isNew: true,
    isPremium: false,
    features: [
      "10 QR types (URL, vCard, LinkedIn, payment, email, SMS, WiFi…)",
      "Full colour & gradient customisation",
      "5 dot shape styles",
      "Logo embedding",
      "Frame + CTA text",
      "PNG & SVG download",
      "AI design suggestions",
    ],
    buildTime: "Instant",
  },
  {
    id: "10",
    slug: "random-toolkit",
    name: "Random Generator Toolkit",
    tagline: "Every random thing you need. One place. Instant.",
    description:
      "10 generators in one toolkit: secure passwords, random strings, UUID v4, numbers, fake test data, random pickers, colours, dates, words, and hashes. Built for developers. Useful for everyone. Zero data stored.",
    category: "Productivity",
    status: "LIVE",
    icon: "🎲",
    accentColor: "#8b5cf6",
    tags: ["Developer Tools", "Password", "UUID", "Random", "Testing", "Utilities"],
    usageCount: 0,
    tokenCost: 100,
    ratingAvg: 0,
    ratingCount: 0,
    isFeatured: true,
    isNew: true,
    isPremium: false,
    features: [
      "Secure password generator with strength meter",
      "Random string / API key generator",
      "UUID v4 bulk generator",
      "Fake data generator (names, emails, addresses)",
      "Random colour (HEX/RGB/HSL) + CSS variables",
      "Hash generator (SHA-256/512, MD5)",
      "Developer code snippets per generator",
    ],
    buildTime: "Instant",
  },
  {
    id: "13",
    slug: "smart-shopping-list",
    name: "Smart Shared Shopping List",
    tagline: "Create, share, and shop together in real-time.",
    description:
      "A real-time collaborative shopping list you can share with anyone via a single link. Add items, tick things off as you shop, set a budget, and generate complete lists from your meal plan using AI. No app download. Works on any device.",
    category: "Productivity",
    status: "LIVE",
    icon: "🛒",
    accentColor: "#10b981",
    tags: ["Shopping", "Family", "Collaboration", "AI", "Real-time"],
    usageCount: 3240,
    tokenCost: 100,
    ratingAvg: 4.9,
    ratingCount: 87,
    isFeatured: false,
    isNew: true,
    isPremium: false,
    features: [
      "Real-time shared lists via one link",
      "AI meal planner → shopping list",
      "15 category organisation (store-aisle order)",
      "Budget tracker + receipt mode",
      "3 quick-start templates",
      "Works offline (browser-saved)",
    ],
    buildTime: "Instant",
  },

  // ─── Writing ─────────────────────────────────────────────────────────────
  {
    id: "4",
    slug: "reading-time-calculator",
    name: "Reading Time Calculator",
    tagline: "Paste any text. Know exactly how long it takes to read.",
    description:
      "A sharp, precise tool for writers, editors, and content creators. Paste your content and instantly see reading time, word count, sentence complexity, and readability scores.",
    category: "Writing",
    status: "LIVE",
    icon: "⏱️",
    accentColor: "#3b82f6",
    tags: ["Writing", "Content", "Readability", "Tools"],
    usageCount: 7230,
    tokenCost: 10,
    ratingAvg: 4.9,
    ratingCount: 156,
    isFeatured: false,
    isNew: false,
    isPremium: false,
    features: [
      "Reading time (slow/avg/fast)",
      "Word & character count",
      "Sentence complexity score",
      "Flesch readability index",
      "Paragraph breakdown",
    ],
    buildTime: "Instant",
  },
  {
    id: "18",
    slug: "message-rewriter",
    name: "Message Rewriter",
    tagline: "Say it better, instantly.",
    description:
      "Paste any message — email, Slack, WhatsApp, LinkedIn — and rewrite it in the perfect tone. Professional, polite, confident, friendly, direct, or empathetic. Get 3 versions instantly. One-click copy. Free.",
    category: "Writing",
    status: "LIVE",
    icon: "✍️",
    accentColor: "#6366f1",
    tags: ["Writing", "Communication", "Email", "Productivity", "AI"],
    usageCount: 0,
    tokenCost: 100,
    ratingAvg: 0,
    ratingCount: 0,
    isFeatured: false,
    isNew: true,
    isPremium: false,
    features: [
      "6 tones: Professional, Polite, Confident, Friendly, Direct, Empathetic",
      "3 versions per rewrite — pick the perfect one",
      "Intent modes: Persuasive, Less Aggressive, Clearer",
      "Shorten / Expand / Soften (say it kindly)",
      "Platform presets: Email, Slack, LinkedIn, Text",
      "One-click copy",
      "Shareable before/after",
    ],
    buildTime: "~3 seconds",
  },

  // ─── Finance ─────────────────────────────────────────────────────────────
  {
    id: "11",
    slug: "debt-recovery-planner",
    name: "AI Debt Recovery Planner",
    tagline: "Turn financial stress into a clear, step-by-step plan.",
    description:
      "Enter your debts, income, and expenses to get a personalised, AI-generated debt repayment roadmap. Snowball or avalanche strategy, month-by-month timeline, weekly action plan, scenario simulation, and a built-in AI financial coach — all free.",
    category: "Finance",
    status: "LIVE",
    icon: "💰",
    accentColor: "#14b8a6",
    tags: ["Debt", "Finance", "Budgeting", "Planning", "Money"],
    usageCount: 3280,
    tokenCost: 150,
    ratingAvg: 4.9,
    ratingCount: 94,
    isFeatured: false,
    isNew: true,
    isPremium: false,
    features: [
      "Debt repayment roadmap",
      "Snowball & avalanche strategies",
      "Month-by-month timeline",
      "Scenario simulation",
      "AI financial coach",
      "Progress tracking",
    ],
    buildTime: "~10 seconds",
  },
  {
    id: "12",
    slug: "smart-budget-planner",
    name: "Smart Budget Survival Planner",
    tagline: "Can you survive on this? Find out in seconds.",
    description:
      "Enter your total budget and timeframe, add your fixed costs and flexible spending, and get a realistic day-by-day survival plan with daily limits, category breakdowns, risk assessment, AI-powered cut suggestions, scenario testing, and an AI budget coach. Built for real life, not spreadsheets.",
    category: "Finance",
    status: "LIVE",
    icon: "💸",
    accentColor: "#6366f1",
    tags: ["Budget", "Survival", "Finance", "Planning", "Money"],
    usageCount: 3140,
    tokenCost: 150,
    ratingAvg: 4.7,
    ratingCount: 94,
    isFeatured: false,
    isNew: true,
    isPremium: false,
    features: [
      "Daily survival budget calculator",
      "Risk indicator (Safe / Tight / Unsustainable)",
      "Category-by-category allocation",
      "AI cut suggestions & scenarios",
      "Survival Mode guidance",
      "AI Budget Coach",
    ],
    buildTime: "Instant",
  },
  {
    id: "13b",
    slug: "first-home-planner",
    name: "First Home Planner",
    tagline: "Go from your first payslip to owning a home. With a real plan.",
    description:
      "The AI-powered planner that maps out exactly how you get from where you are today to owning your first home. Enter your income, savings, and target property — get a personalised deposit plan, mortgage readiness roadmap, credit-building strategy, and a month-by-month action plan.",
    category: "Finance",
    status: "LIVE",
    icon: "🏡",
    accentColor: "#6366f1",
    tags: ["Home Buying", "Mortgage", "Savings", "Finance", "First-Time Buyer"],
    usageCount: 2140,
    tokenCost: 200,
    ratingAvg: 4.9,
    ratingCount: 67,
    isFeatured: false,
    isNew: true,
    isPremium: false,
    features: [
      "Personalised deposit savings plan",
      "Mortgage readiness roadmap",
      "Phase-by-phase action plan",
      "Credit profile builder guide",
      "UK first-time buyer schemes",
      "AI Home Coach",
    ],
    buildTime: "~8 seconds",
  },

  // ─── Education ───────────────────────────────────────────────────────────
  {
    id:          "14",
    slug:        "scripture-explorer",
    name:        "Comparative Scripture Explorer",
    tagline:     "A respectful, educational bridge across the Abrahamic traditions.",
    description:
      "Explore themes, stories, and teachings across the Bible, Qur'an, and Hebrew Bible / Tanakh side by side. Ask any question and receive a structured, neutral comparison — with relevant passages, historical context, and scholarly insight. Built for understanding, not debate.",
    category:    "Education",
    status:      "LIVE",
    icon:        "📖",
    accentColor: "#6366f1",
    tags:        ["Religion", "Scripture", "Bible", "Quran", "Tanakh", "Education", "Theology"],
    usageCount:  1840,
    tokenCost:  150,
    ratingAvg:   4.9,
    ratingCount: 94,
    isFeatured:  false,
    isNew:       true,
    isPremium:   false,
    features: [
      "3-tradition side-by-side comparison",
      "Relevant passage references",
      "Historical & cultural context",
      "Shared figures & connection mapping",
      "AI Study Companion",
      "Save & bookmark explorations",
    ],
    buildTime: "~6 seconds",
  },
  {
    id:          "15",
    slug:        "math-engine",
    name:        "Math Understanding Engine",
    tagline:     "Not just the answer. The why, the history, and the real world.",
    description:
      "Paste any maths problem and get a complete breakdown: step-by-step solution, why the method works, the history behind the concept, real-world applications, and interactive visualisations. Adapts to GCSE, A-Level, or University. Built for real understanding, not just answers.",
    category:    "Education",
    status:      "LIVE",
    icon:        "🧠",
    accentColor: "#6366f1",
    tags:        ["Maths", "Education", "GCSE", "A-Level", "AI Tutor", "Visualisation"],
    usageCount:  0,
    tokenCost:   100,
    ratingAvg:   0,
    ratingCount: 0,
    isFeatured:  false,
    isNew:       true,
    isPremium:   false,
    features: [
      "Step-by-step solution with explanations",
      "Why this method works",
      "History & origin of the concept",
      "Real-world applications",
      "Interactive visualisation (graphs, charts)",
      "Practice question generator",
      "Level selector: GCSE / A-Level / University",
    ],
    buildTime: "~6 seconds",
  },
  {
    id:          "16",
    slug:        "physics-engine",
    name:        "Physics Understanding Engine",
    tagline:     "From concept to reality — physics explained the way it should be.",
    description:
      "Type any physics topic or question and receive a complete structured understanding: plain-English definition, the governing law, why scientists needed this idea, who discovered it, real-world applications, mental model analogies, common misconceptions corrected, and interactive visualisations. GCSE, A-Level, University.",
    category:    "Education",
    status:      "LIVE",
    icon:        "⚛️",
    accentColor: "#0ea5e9",
    tags:        ["Physics", "GCSE", "A-Level", "Education", "Science", "AI Tutor"],
    usageCount:  0,
    tokenCost:   100,
    ratingAvg:   0,
    ratingCount: 0,
    isFeatured:  false,
    isNew:       true,
    isPremium:   false,
    features: [
      "Full Concept Breakdown (8 structured layers)",
      "Why It Exists — the motivation behind every law",
      "History & discovery with key scientists",
      "Mental model intuition builders",
      "Common misconceptions corrected",
      "Try It Yourself experiments",
      "Theory Explorer Mode for broad topics",
      "GCSE · A-Level · University depth levels",
    ],
    buildTime: "~7 seconds",
  },
  {
    id:          "17",
    slug:        "chemistry-engine",
    name:        "Chemistry Understanding Engine",
    tagline:     "From particles to reality — chemistry explained at the deepest level.",
    description:
      "Enter any chemistry topic or question and receive a 10-layer structured breakdown: plain definition, particle-level explanation, core principle/law, why scientists needed this idea, history of discovery, theory breakdown, real-world applications, intuition builders, misconceptions corrected, and experiments to try. GCSE, A-Level, University.",
    category:    "Education",
    status:      "LIVE",
    icon:        "🧪",
    accentColor: "#10b981",
    tags:        ["Chemistry", "GCSE", "A-Level", "Education", "Science", "AI Tutor"],
    usageCount:  0,
    tokenCost:   50,
    ratingAvg:   0,
    ratingCount: 0,
    isFeatured:  false,
    isNew:       true,
    isPremium:   false,
    features: [
      "10-Layer Concept Breakdown",
      "Particle-level explanation (atoms, electrons, bonds)",
      "Core law/equation with term-by-term breakdown",
      "Why this concept was needed",
      "History & key chemists",
      "Theory deep dive",
      "Common misconceptions corrected",
      "Try It Yourself experiments",
      "GCSE · A-Level · University depth levels",
    ],
    buildTime: "~7 seconds",
  },

  // ─── Productivity (Family & Life) ────────────────────────────────────────
  {
    id:          "19",
    slug:        "kids-birthday-planner",
    name:        "AI Kids Birthday Planner",
    tagline:     "Plan your child's perfect party in minutes — no stress, no guesswork.",
    description:
      "The complete AI-powered kids party planning system. Generate a full party plan in seconds, share smart invite links that evolve from invitation → guest dashboard → check-in system on party day, track RSVPs live, manage a smart checklist, track budget, and run party day mode with activity timers.",
    category:    "Productivity",
    status:      "LIVE",
    icon:        "🎂",
    accentColor: "#f43f5e",
    tags:        ["Kids", "Party", "Birthday", "Planning", "RSVP", "AI"],
    usageCount:  0,
    tokenCost:   150,
    ratingAvg:   0,
    ratingCount: 0,
    isFeatured:  false,
    isNew:       true,
    isPremium:   false,
    features: [
      "AI party plan in seconds",
      "Smart invite links (invite → RSVP → check-in)",
      "Live RSVP tracking",
      "Activity timeline with timers",
      "Budget tracker",
      "Auto-generated checklist",
      "Song request system",
      "Party Day Mode",
      "Safe check-in / check-out",
    ],
    buildTime: "~8 seconds",
  },
];

// ─── Categories ───────────────────────────────────────────────────────────────

export const TOOL_CATEGORIES: {
  name: ToolCategory;
  icon: string;
  color: string;
  description: string;
}[] = [
  { name: "AI",           icon: "🤖", color: "#f59e0b", description: "AI-powered tools"    },
  { name: "Career",       icon: "💼", color: "#ec4899", description: "Job search & career"  },
  { name: "Finance",      icon: "💰", color: "#14b8a6", description: "Money & finance"       },
  { name: "Startup",      icon: "🚀", color: "#10b981", description: "Business & startups"  },
  { name: "Education",    icon: "📚", color: "#8b5cf6", description: "Learning & growth"    },
  { name: "Productivity", icon: "⚡", color: "#14b8a6", description: "Work smarter"         },
  { name: "Writing",      icon: "✍️", color: "#3b82f6", description: "Content & writing"   },
  // { name: "Life",         icon: "📚", color: "" , description: "Life matters"}
];

// ─── Status config ────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
  ToolStatus,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  LIVE: {
    label:  "Live",
    color:  "text-green-400",
    bg:     "bg-green-900/20",
    border: "border-green-700/40",
    dot:    "bg-green-400",
  },
  BETA: {
    label:  "Beta",
    color:  "text-amber-400",
    bg:     "bg-amber-900/20",
    border: "border-amber-700/40",
    dot:    "bg-amber-400 animate-pulse",
  },
  COMING_SOON: {
    label:  "Coming Soon",
    color:  "text-gray-400",
    bg:     "bg-gray-800/50",
    border: "border-gray-700",
    dot:    "bg-gray-500",
  },
};





// // =============================================================================
// // isaacpaha.com — Tools Lab Data
// // =============================================================================

// export type ToolCategory =
//   | "AI"
//   | "Career"
//   | "Finance"
//   | "Startup"
//   | "Education"
//   | "Productivity"
//   | "Writing";

// export type ToolStatus = "LIVE" | "BETA" | "COMING_SOON";

// export interface Tool {
//   id: string;
//   slug: string;
//   name: string;
//   tagline: string;
//   description: string;
//   category: ToolCategory;
//   status: ToolStatus;
//   icon: string;
//   accentColor: string;
//   tags: string[];
//   usageCount: number;
//   ratingAvg: number;
//   ratingCount: number;
//   isFeatured?: boolean;
//   isNew?: boolean;
//   isPremium?: boolean;
//   features: string[];
//   buildTime?: string;
// }

// export const TOOLS: Tool[] = [

//   // ─── Career ──────────────────────────────────────────────────────────────
 
//   {
//     id: "1",
//     slug: "ai-cv-analyser",
//     name: "AI CV Analyser Pro",
//     tagline: "Your career optimisation engine. Not just a CV checker.",
//     description:
//       "Paste your CV and a job description to get a comprehensive AI analysis: ATS compatibility score, keyword gap analysis, section-by-section feedback, bullet point rewrites, job match score, and interview question preparation. The complete toolkit to land more interviews.",
//     category: "Career",
//     status: "LIVE",
//     icon: "🎯",
//     accentColor: "#10b981",
//     tags: ["CV", "ATS", "Keyword Analysis", "Interview Prep", "Career"],
//     usageCount: 8920,
//     ratingAvg: 4.9,
//     ratingCount: 217,
//     isFeatured: false,
//     isNew: true,
//     isPremium: false,
//     features: [
//       "ATS compatibility score",
//       "Keyword gap analysis vs job description",
//       "Section-by-section AI feedback",
//       "Bullet point rewriter",
//       "Job match score (0–100)",
//       "Interview question generator",
//     ],
//     buildTime: "~8 seconds",
//   },
//   {
//     id: "5",
//     slug: "job-application-tracker",
//     name: "Job Application Tracker",
//     tagline: "Never lose track of where you've applied again.",
//     description:
//       "A clean, fast job application management system. Track applications by status, add notes, set follow-up reminders, and see your conversion rates at a glance. Built for serious job seekers.",
//     category: "Career",
//     status: "BETA",
//     icon: "📋",
//     accentColor: "#f97316",
//     tags: ["Jobs", "Tracking", "Career", "Productivity"],
//     usageCount: 4560,
//     ratingAvg: 4.4,
//     ratingCount: 89,
//     isFeatured: false,
//     isNew: true,
//     isPremium: false,
//     features: [
//       "Kanban status board",
//       "Follow-up reminders",
//       "Application notes",
//       "Response rate analytics",
//       "Export to CSV",
//     ],
//     buildTime: "Instant",
//   },

//   // ─── Startup ─────────────────────────────────────────────────────────────
//   {
//     id: "2",
//     slug: "startup-idea-generator",
//     name: "Startup Idea Generator",
//     tagline: "Describe your skills — get validated startup concepts.",
//     description:
//       "Input your background, skills, and interests and get AI-generated startup ideas with market sizing, pain points, and initial validation questions. Built for builders who want to find their next project.",
//     category: "Startup",
//     status: "LIVE",
//     icon: "🚀",
//     accentColor: "#10b981",
//     tags: ["Startups", "Ideas", "AI", "Entrepreneurship"],
//     usageCount: 12340,
//     ratingAvg: 4.6,
//     ratingCount: 218,
//     isFeatured: false,
//     isNew: false,
//     isPremium: false,
//     features: [
//       "Personalised to your background",
//       "Market size estimates",
//       "Pain point identification",
//       "Competition landscape",
//       "Validation framework",
//     ],
//     buildTime: "~4 seconds",
//   },
//   {
//     id: "8",
//     slug: "africa-market-explorer",
//     name: "Africa Market Explorer",
//     tagline: "Research African markets with AI-powered data synthesis.",
//     description:
//       "Explore market opportunities across African countries. Input a sector and target country, and get an AI-synthesised market overview: size, growth, key players, regulatory landscape, and entry strategies.",
//     category: "Startup",
//     status: "COMING_SOON",
//     icon: "🌍",
//     accentColor: "#f59e0b",
//     tags: ["Africa", "Market Research", "Business", "AI"],
//     usageCount: 0,
//     ratingAvg: 0,
//     ratingCount: 0,
//     isFeatured: false,
//     isNew: false,
//     isPremium: true,
//     features: [
//       "Country-level market data",
//       "Regulatory overview",
//       "Key player mapping",
//       "Entry strategy suggestions",
//       "Risk assessment",
//     ],
//     buildTime: "~8 seconds",
//   },

//   // ─── Education ───────────────────────────────────────────────────────────
//   {
//     id: "3",
//     slug: "learning-roadmap",
//     name: "Learning Roadmap Generator",
//     tagline: "Build a personalised curriculum for any skill or subject.",
//     description:
//       "Tell the AI what you want to learn, your current level, and how much time you have. Get a structured, week-by-week roadmap with resources, milestones, and checkpoints. Used by students and career-changers.",
//     category: "Education",
//     status: "LIVE",
//     icon: "🗺️",
//     accentColor: "#8b5cf6",
//     tags: ["Learning", "Education", "Roadmap", "Skills"],
//     usageCount: 9870,
//     ratingAvg: 4.7,
//     ratingCount: 187,
//     isFeatured: false,
//     isNew: true,
//     isPremium: false,
//     features: [
//       "Week-by-week structure",
//       "Resource recommendations",
//       "Progress milestones",
//       "Adaptive difficulty",
//       "Downloadable plan",
//     ],
//     buildTime: "~5 seconds",
//   },

//   // ─── Productivity ─────────────────────────────────────────────────────────
//    {
//     id: "7",
//     slug: "productivity-score",
//     name: "Productivity Score",
//     tagline: "Find what's slowing you down — and fix it today.",
//     description:
//       "Take a fast 20-question audit of your work habits, focus, and daily systems. Get a personalised productivity score, uncover hidden bottlenecks, and receive a clear, actionable plan to improve how you work — instantly.",
//     category: "Productivity",
//     status: "LIVE", // Changed from COMING_SOON
//     icon: "📊",
//     accentColor: "#14b8a6",
//     tags: ["Productivity", "Self-improvement", "Focus", "Habits", "Performance"],
//     usageCount: 0,
//     ratingAvg: 0,
//     ratingCount: 0,
//     isFeatured: false,
//     isNew: true,
//     isPremium: false,
//     features: [
//       "20-question smart audit",
//       "Instant productivity score (0–100)",
//       "Detailed score breakdown (focus, habits, systems, energy, mindset)",
//       "Bottleneck detection — what's actually slowing you down",
//       "Personalised 3-step action plan (no generic advice)",
//       "Shareable score card",
//       "Weekly re-check system",
//     ],
//     buildTime: "~90 seconds",
//   },
//   {
//     id: "9",
//     slug: "qr-code-generator",
//     name: "Custom QR Code Generator",
//     tagline: "Beautiful, branded QR codes. Instant. Free.",
//     description:
//       "Create stunning, fully customised QR codes for any purpose — URLs, social profiles, contact cards, payment links, CVs, and more. Customise colours, dot shapes, frames, and embed your logo. Download as PNG or SVG. Completely free.",
//     category: "Productivity",
//     status: "LIVE",
//     icon: "⬛",
//     accentColor: "#6366f1",
//     tags: ["QR Code", "Branding", "Design", "Marketing", "Free Tool"],
//     usageCount: 0,
//     ratingAvg: 0,
//     ratingCount: 0,
//     isFeatured: false,
//     isNew: true,
//     isPremium: false,
//     features: [
//       "10 QR types (URL, vCard, LinkedIn, payment, email, SMS, WiFi…)",
//       "Full colour & gradient customisation",
//       "5 dot shape styles",
//       "Logo embedding",
//       "Frame + CTA text",
//       "PNG & SVG download",
//       "AI design suggestions",
//     ],
//     buildTime: "Instant",
//   },
//   {
//     id: "10",
//     slug: "random-toolkit",
//     name: "Random Generator Toolkit",
//     tagline: "Every random thing you need. One place. Instant.",
//     description:
//       "10 generators in one toolkit: secure passwords, random strings, UUID v4, numbers, fake test data, random pickers, colours, dates, words, and hashes. Built for developers. Useful for everyone. Zero data stored.",
//     category: "Productivity",
//     status: "LIVE",
//     icon: "🎲",
//     accentColor: "#8b5cf6",
//     tags: ["Developer Tools", "Password", "UUID", "Random", "Testing", "Utilities"],
//     usageCount: 0,
//     ratingAvg: 0,
//     ratingCount: 0,
//     isFeatured: true,
//     isNew: true,
//     isPremium: false,
//     features: [
//       "Secure password generator with strength meter",
//       "Random string / API key generator",
//       "UUID v4 bulk generator",
//       "Fake data generator (names, emails, addresses)",
//       "Random colour (HEX/RGB/HSL) + CSS variables",
//       "Hash generator (SHA-256/512, MD5)",
//       "Developer code snippets per generator",
//     ],
//     buildTime: "Instant",
//   },

//   // ─── Writing ─────────────────────────────────────────────────────────────
//   {
//     id: "4",
//     slug: "reading-time-calculator",
//     name: "Reading Time Calculator",
//     tagline: "Paste any text. Know exactly how long it takes to read.",
//     description:
//       "A sharp, precise tool for writers, editors, and content creators. Paste your content and instantly see reading time, word count, sentence complexity, and readability scores.",
//     category: "Writing",
//     status: "LIVE",
//     icon: "⏱️",
//     accentColor: "#3b82f6",
//     tags: ["Writing", "Content", "Readability", "Tools"],
//     usageCount: 7230,
//     ratingAvg: 4.9,
//     ratingCount: 156,
//     isFeatured: false,
//     isNew: false,
//     isPremium: false,
//     features: [
//       "Reading time (slow/avg/fast)",
//       "Word & character count",
//       "Sentence complexity score",
//       "Flesch readability index",
//       "Paragraph breakdown",
//     ],
//     buildTime: "Instant",
//   },
//   {
//     id: "9",
//     slug: "debt-recovery-planner",
//     name: "AI Debt Recovery Planner",
//     tagline: "Turn financial stress into a clear, step-by-step plan.",
//     description:
//       "Enter your debts, income, and expenses to get a personalised, AI-generated debt repayment roadmap. Snowball or avalanche strategy, month-by-month timeline, weekly action plan, scenario simulation, and a built-in AI financial coach — all free.",
//     category: "Finance",
//     status: "LIVE",
//     icon: "💰",
//     accentColor: "#14b8a6",
//     tags: ["Debt", "Finance", "Budgeting", "Planning", "Money"],
//     usageCount: 3280,
//     ratingAvg: 4.9,
//     ratingCount: 94,
//     isFeatured: false,
//     isNew: true,
//     isPremium: false,
//     features: [
//       "Debt repayment roadmap",
//       "Snowball & avalanche strategies",
//       "Month-by-month timeline",
//       "Scenario simulation",
//       "AI financial coach",
//       "Progress tracking",
//     ],
//     buildTime: "~10 seconds",
//   },
//   {
//     id: "10",
//     slug: "smart-budget-planner",
//     name: "Smart Budget Survival Planner",
//     tagline: "Can you survive on this? Find out in seconds.",
//     description:
//       "Enter your total budget and timeframe, add your fixed costs and flexible spending, and get a realistic day-by-day survival plan with daily limits, category breakdowns, risk assessment, AI-powered cut suggestions, scenario testing, and an AI budget coach. Built for real life, not spreadsheets.",
//     category: "Finance",
//     status: "LIVE",
//     icon: "💸",
//     accentColor: "#6366f1",
//     tags: ["Budget", "Survival", "Finance", "Planning", "Money"],
//     usageCount: 3140,
//     ratingAvg: 4.7,
//     ratingCount: 94,
//     isFeatured: false,
//     isNew: true,
//     isPremium: false,
//     features: [
//       "Daily survival budget calculator",
//       "Risk indicator (Safe / Tight / Unsustainable)",
//       "Category-by-category allocation",
//       "AI cut suggestions & scenarios",
//       "Survival Mode guidance",
//       "AI Budget Coach",
//     ],
//     buildTime: "Instant",
//   },
//   {
//     id: "12",
//     slug: "first-home-planner",
//     name: "First Home Planner",
//     tagline: "Go from your first payslip to owning a home. With a real plan.",
//     description:
//       "The AI-powered planner that maps out exactly how you get from where you are today to owning your first home. Enter your income, savings, and target property — get a personalised deposit plan, mortgage readiness roadmap, credit-building strategy, and a month-by-month action plan.",
//     category: "Finance",
//     status: "LIVE",
//     icon: "🏡",
//     accentColor: "#6366f1",
//     tags: ["Home Buying", "Mortgage", "Savings", "Finance", "First-Time Buyer"],
//     usageCount: 2140,
//     ratingAvg: 4.9,
//     ratingCount: 67,
//     isFeatured: false,
//     isNew: true,
//     isPremium: false,
//     features: [
//       "Personalised deposit savings plan",
//       "Mortgage readiness roadmap",
//       "Phase-by-phase action plan",
//       "Credit profile builder guide",
//       "UK first-time buyer schemes",
//       "AI Home Coach",
//     ],
//     buildTime: "~8 seconds",
//   },
//   {
//     id: "13",
//     slug: "smart-shopping-list",
//     name: "Smart Shared Shopping List",
//     tagline: "Create, share, and shop together in real-time.",
//     description:
//       "A real-time collaborative shopping list you can share with anyone via a single link. Add items, tick things off as you shop, set a budget, and generate complete lists from your meal plan using AI. No app download. Works on any device.",
//     category: "Productivity",
//     status: "LIVE",
//     icon: "🛒",
//     accentColor: "#10b981",
//     tags: ["Shopping", "Family", "Collaboration", "AI", "Real-time"],
//     usageCount: 3240,
//     ratingAvg: 4.9,
//     ratingCount: 87,
//     isFeatured: false,
//     isNew: true,
//     isPremium: false,
//     features: [
//       "Real-time shared lists via one link",
//       "AI meal planner → shopping list",
//       "15 category organisation (store-aisle order)",
//       "Budget tracker + receipt mode",
//       "3 quick-start templates",
//       "Works offline (browser-saved)",
//     ],
//     buildTime: "Instant",
//   },
//   {
//     id:          "14",
//     slug:        "scripture-explorer",
//     name:        "Comparative Scripture Explorer",
//     tagline:     "A respectful, educational bridge across the Abrahamic traditions.",
//     description:
//       "Explore themes, stories, and teachings across the Bible, Qur'an, and Hebrew Bible / Tanakh side by side. Ask any question and receive a structured, neutral comparison — with relevant passages, historical context, and scholarly insight. Built for understanding, not debate.",
//     category:    "Education",
//     status:      "LIVE",
//     icon:        "📖",
//     accentColor: "#6366f1",
//     tags:        ["Religion", "Scripture", "Bible", "Quran", "Tanakh", "Education", "Theology"],
//     usageCount:  1840,
//     ratingAvg:   4.9,
//     ratingCount: 94,
//     isFeatured:  false,
//     isNew:       true,
//     isPremium:   false,
//     features: [
//       "3-tradition side-by-side comparison",
//       "Relevant passage references",
//       "Historical & cultural context",
//       "Shared figures & connection mapping",
//       "AI Study Companion",
//       "Save & bookmark explorations",
//     ],
//     buildTime: "~6 seconds",
//   },
//   {
//     id:          "15",
//     slug:        "math-engine",
//     name:        "Math Understanding Engine",
//     tagline:     "Not just the answer. The why, the history, and the real world.",
//     description:
//       "Paste any maths problem and get a complete breakdown: step-by-step solution, why the method works, the history behind the concept, real-world applications, and interactive visualisations. Adapts to GCSE, A-Level, or University. Built for real understanding, not just answers.",
//     category:    "Education",
//     status:      "LIVE",
//     icon:        "🧠",
//     accentColor: "#6366f1",
//     tags:        ["Maths", "Education", "GCSE", "A-Level", "AI Tutor", "Visualisation"],
//     usageCount:  0,
//     ratingAvg:   0,
//     ratingCount: 0,
//     isFeatured:  false,
//     isNew:       true,
//     isPremium:   false,
//     features: [
//       "Step-by-step solution with explanations",
//       "Why this method works",
//       "History & origin of the concept",
//       "Real-world applications",
//       "Interactive visualisation (graphs, charts)",
//       "Practice question generator",
//       "Level selector: GCSE / A-Level / University",
//     ],
//     buildTime: "~6 seconds",
//   },
//   {
//     id:          "16",
//     slug:        "physics-engine",
//     name:        "Physics Understanding Engine",
//     tagline:     "From concept to reality — physics explained the way it should be.",
//     description:
//       "Type any physics topic or question and receive a complete structured understanding: plain-English definition, the governing law, why scientists needed this idea, who discovered it, real-world applications, mental model analogies, common misconceptions corrected, and interactive visualisations. GCSE, A-Level, University.",
//     category:    "Education",
//     status:      "LIVE",
//     icon:        "⚛️",
//     accentColor: "#0ea5e9",
//     tags:        ["Physics", "GCSE", "A-Level", "Education", "Science", "AI Tutor"],
//     usageCount:  0,
//     ratingAvg:   0,
//     ratingCount: 0,
//     isFeatured:  false,
//     isNew:       true,
//     isPremium:   false,
//     features: [
//       "Full Concept Breakdown (8 structured layers)",
//       "Why It Exists — the motivation behind every law",
//       "History & discovery with key scientists",
//       "Mental model intuition builders",
//       "Common misconceptions corrected",
//       "Try It Yourself experiments",
//       "Theory Explorer Mode for broad topics",
//       "GCSE · A-Level · University depth levels",
//     ],
//     buildTime: "~7 seconds",
//   },

//    {
//     id:          "17",
//     slug:        "chemistry-engine",
//     name:        "Chemistry Understanding Engine",
//     tagline:     "From particles to reality — chemistry explained at the deepest level.",
//     description:
//       "Enter any chemistry topic or question and receive a 10-layer structured breakdown: plain definition, particle-level explanation, core principle/law, why scientists needed this idea, history of discovery, theory breakdown, real-world applications, intuition builders, misconceptions corrected, and experiments to try. GCSE, A-Level, University.",
//     category:    "Education",
//     status:      "LIVE",
//     icon:        "🧪",
//     accentColor: "#10b981",
//     tags:        ["Chemistry", "GCSE", "A-Level", "Education", "Science", "AI Tutor"],
//     usageCount:  0,
//     ratingAvg:   0,
//     ratingCount: 0,
//     isFeatured:  false,
//     isNew:       true,
//     isPremium:   false,
//     features: [
//       "10-Layer Concept Breakdown",
//       "Particle-level explanation (atoms, electrons, bonds)",
//       "Core law/equation with term-by-term breakdown",
//       "Why this concept was needed",
//       "History & key chemists",
//       "Theory deep dive",
//       "Common misconceptions corrected",
//       "Try It Yourself experiments",
//       "GCSE · A-Level · University depth levels",
//     ],
//     buildTime: "~7 seconds",
//   },
//   {
//     id:          "18",
//     slug:        "message-rewriter",
//     name:        "Message Rewriter",
//     tagline:     "Say it better, instantly.",
//     description:
//       "Paste any message — email, Slack, WhatsApp, LinkedIn — and rewrite it in the perfect tone. Professional, polite, confident, friendly, direct, or empathetic. Get 3 versions instantly. One-click copy. Free.",
//     category:    "Writing",
//     status:      "LIVE",
//     icon:        "✍️",
//     accentColor: "#6366f1",
//     tags:        ["Writing", "Communication", "Email", "Productivity", "AI"],
//     usageCount:  0,
//     ratingAvg:   0,
//     ratingCount: 0,
//     isFeatured:  false,
//     isNew:       true,
//     isPremium:   false,
//     features: [
//       "6 tones: Professional, Polite, Confident, Friendly, Direct, Empathetic",
//       "3 versions per rewrite — pick the perfect one",
//       "Intent modes: Persuasive, Less Aggressive, Clearer",
//       "Shorten / Expand / Soften (say it kindly)",
//       "Platform presets: Email, Slack, LinkedIn, Text",
//       "One-click copy",
//       "Shareable before/after",
//     ],
//     buildTime: "~3 seconds",
//   },
// ];

// // ─── Categories ───────────────────────────────────────────────────────────────

// export const TOOL_CATEGORIES: {
//   name: ToolCategory;
//   icon: string;
//   color: string;
//   description: string;
// }[] = [
//   { name: "AI",           icon: "🤖", color: "#f59e0b", description: "AI-powered tools"    },
//   { name: "Career",       icon: "💼", color: "#ec4899", description: "Job search & career"  },
//   { name: "Finance",      icon: "💰", color: "#14b8a6", description: "Money & finance"       },
//   { name: "Startup",      icon: "🚀", color: "#10b981", description: "Business & startups"  },
//   { name: "Education",    icon: "📚", color: "#8b5cf6", description: "Learning & growth"    },
//   { name: "Productivity", icon: "⚡", color: "#14b8a6", description: "Work smarter"         },
//   { name: "Writing",      icon: "✍️", color: "#3b82f6", description: "Content & writing"   },
// ];

// // ─── Status config ────────────────────────────────────────────────────────────

// export const STATUS_CONFIG: Record<
//   ToolStatus,
//   { label: string; color: string; bg: string; border: string; dot: string }
// > = {
//   LIVE: {
//     label:  "Live",
//     color:  "text-green-400",
//     bg:     "bg-green-900/20",
//     border: "border-green-700/40",
//     dot:    "bg-green-400",
//   },
//   BETA: {
//     label:  "Beta",
//     color:  "text-amber-400",
//     bg:     "bg-amber-900/20",
//     border: "border-amber-700/40",
//     dot:    "bg-amber-400 animate-pulse",
//   },
//   COMING_SOON: {
//     label:  "Coming Soon",
//     color:  "text-gray-400",
//     bg:     "bg-gray-800/50",
//     border: "border-gray-700",
//     dot:    "bg-gray-500",
//   },
// };

