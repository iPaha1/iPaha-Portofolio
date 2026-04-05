// =============================================================================
// isaacpaha.com — Tools Seed Script
// scripts/seed-tools.ts
//
// Run: npx tsx scripts/seed-tools.ts
// Or:  npm run seed:tools   (add to package.json scripts)
// =============================================================================

import "dotenv/config";
import { PrismaMariaDb }  from "@prisma/adapter-mariadb";
import { PrismaClient }   from "../lib/generated/prisma/client";

// ─── Build the same client as lib/db.ts ──────────────────────────────────────

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

// ─── Category + status mappers ────────────────────────────────────────────────

function mapCategory(cat: string): string {
  const map: Record<string, string> = {
    AI:           "AI",
    Career:       "CAREER",
    Finance:      "FINANCE",
    Startup:      "STARTUP",
    Education:    "EDUCATION",
    Productivity: "PRODUCTIVITY",
    Writing:      "WRITING",
  };
  return map[cat] ?? "OTHER";
}

// ─── Tool data ────────────────────────────────────────────────────────────────

const TOOLS = [
  // ── Career ──────────────────────────────────────────────────────────────────
  {
    slug: "ai-cv-analyser", name: "AI CV Analyser Pro",
    tagLine: "Your career optimisation engine. Not just a CV checker.",
    description: "Paste your CV and a job description to get a comprehensive AI analysis: ATS compatibility score, keyword gap analysis, section-by-section feedback, bullet point rewrites, job match score, and interview question preparation. The complete toolkit to land more interviews.",
    category: "Career", status: "LIVE", icon: "🎯", accentColor: "#10b981",
    tags: ["CV", "ATS", "Keyword Analysis", "Interview Prep", "Career"],
    tokenCost: 500, usageCount: 8920, ratingAvg: 4.9, ratingCount: 217,
    isFeatured: false, isNew: true, isPremium: false,
    features: ["ATS compatibility score", "Keyword gap analysis vs job description", "Section-by-section AI feedback", "Bullet point rewriter", "Job match score (0–100)", "Interview question generator"],
    metaTitle: "AI CV Analyser Pro — ATS Check, Keyword Gap & Rewrite Tool",
    metaDescription: "Free AI-powered CV analyser. Get your ATS score, keyword gap analysis, section-by-section feedback, bullet point rewrites, and interview questions in 8 seconds.",
  },
  {
    slug: "job-application-tracker", name: "Job Application Tracker",
    tagLine: "Never lose track of where you've applied again.",
    description: "A clean, fast job application management system. Track applications by status, add notes, set follow-up reminders, and see your conversion rates at a glance. Built for serious job seekers.",
    category: "Career", status: "BETA", icon: "📋", accentColor: "#f97316",
    tags: ["Jobs", "Tracking", "Career", "Productivity"],
    tokenCost: 10, usageCount: 4560, ratingAvg: 4.4, ratingCount: 89,
    isFeatured: false, isNew: true, isPremium: false,
    features: ["Kanban status board", "Follow-up reminders", "Application notes", "Response rate analytics", "Export to CSV"],
    metaTitle: "Job Application Tracker — Free Tool for Serious Job Seekers",
    metaDescription: "Track every job application, monitor your interview rate, and see where you rank on the global application ladder. Free.",
  },
  {
    slug: "career-discovery-engine",
    name: "Career Discovery Engine",
    tagLine: "Find hidden careers others don't see. High pay, low competition.",
    description: "Stop competing for the same 10 roles everyone knows. This AI-powered engine scans niche, specialised, and emerging career markets to find roles that match your exact skills, education, and goals — careers with high salary potential and surprisingly low competition. Each match includes salary ranges (entry to senior), competition level, time to break in, a complete step-by-step entry roadmap, required certifications, and an honest verdict. Compare up to 3 careers side-by-side, ask the career coach anything, and save your favourites to your personal workspace.",
    category: "Career",
    status: "LIVE",
    icon: "💎",
    accentColor: "#ec4899",
    tags: ["Career", "AI", "Job Search", "Salary", "Roadmap", "Certifications", "Career Coach", "Hidden Careers"],
    tokenCost: 150,
    usageCount: 0,
    ratingAvg: null,
    ratingCount: 0,
    isFeatured: true,
    isNew: true,
    isPremium: false,
    features: [
      "Personalised career matches based on your skills + goals",
      "Salary insights (entry → mid → senior ranges)",
      "Competition indicator (Low / Medium / High)",
      "Time-to-entry estimates",
      "Full entry roadmap with step-by-step actions",
      "Certification paths with costs + timeframes",
      "'Why No One Talks About This' — the hidden insight",
      "Compare up to 3 careers side-by-side (8 dimensions)",
      "Career Coach — ask anything about any career",
      "Save careers to your workspace + track progress",
    ],
    metaTitle: "Career Discovery Engine — Find Hidden Careers with High Pay & Low Competition",
    metaDescription: "AI-powered career discovery. Enter your skills and get personalised matches for niche, high-paying careers you never knew existed. Includes salary data, entry roadmaps, certifications, and a career coach.",
  },

  // ── Startup ─────────────────────────────────────────────────────────────────
  {
    slug: "startup-idea-generator", name: "Startup Idea Generator",
    tagLine: "Describe your skills — get validated startup concepts.",
    description: "Input your background, skills, and interests and get AI-generated startup ideas with market sizing, pain points, and initial validation questions. Built for builders who want to find their next project.",
    category: "Startup", status: "LIVE", icon: "🚀", accentColor: "#10b981",
    tags: ["Startups", "Ideas", "AI", "Entrepreneurship"],
    tokenCost: 200, usageCount: 12340, ratingAvg: 4.6, ratingCount: 218,
    isFeatured: false, isNew: false, isPremium: false,
    features: ["Personalised to your background", "Market size estimates", "Pain point identification", "Competition landscape", "Validation framework"],
  },
  {
    slug: "africa-market-explorer", name: "Africa Market Explorer",
    tagLine: "Research African markets with AI-powered data synthesis.",
    description: "Explore market opportunities across African countries. Input a sector and target country, and get an AI-synthesised market overview: size, growth, key players, regulatory landscape, and entry strategies.",
    category: "Startup", status: "COMING_SOON", icon: "🌍", accentColor: "#f59e0b",
    tags: ["Africa", "Market Research", "Business", "AI"],
    tokenCost: 300, usageCount: 0, ratingAvg: null, ratingCount: 0,
    isFeatured: false, isNew: false, isPremium: true,
    features: ["Country-level market data", "Regulatory overview", "Key player mapping", "Entry strategy suggestions", "Risk assessment"],
  },

  // ── Education ───────────────────────────────────────────────────────────────
  {
    slug: "learning-roadmap", name: "Learning Roadmap Generator",
    tagLine: "Build a personalised curriculum for any skill or subject.",
    description: "Tell the AI what you want to learn, your current level, and how much time you have. Get a structured, week-by-week roadmap with resources, milestones, and checkpoints. Used by students and career-changers.",
    category: "Education", status: "LIVE", icon: "🗺️", accentColor: "#8b5cf6",
    tags: ["Learning", "Education", "Roadmap", "Skills"],
    tokenCost: 50, usageCount: 9870, ratingAvg: 4.7, ratingCount: 187,
    isFeatured: false, isNew: true, isPremium: false,
    features: ["Week-by-week structure", "Resource recommendations", "Progress milestones", "Adaptive difficulty", "Downloadable plan"],
  },
  {
    slug: "scripture-explorer", name: "Comparative Scripture Explorer",
    tagLine: "A respectful, educational bridge across the Abrahamic traditions.",
    description: "Explore themes, stories, and teachings across the Bible, Qur'an, and Hebrew Bible / Tanakh side by side. Ask any question and receive a structured, neutral comparison — with relevant passages, historical context, and scholarly insight. Built for understanding, not debate.",
    category: "Education", status: "LIVE", icon: "📖", accentColor: "#6366f1",
    tags: ["Religion", "Scripture", "Bible", "Quran", "Tanakh", "Education", "Theology"],
    tokenCost: 150, usageCount: 1840, ratingAvg: 4.9, ratingCount: 94,
    isFeatured: false, isNew: true, isPremium: false,
    features: ["3-tradition side-by-side comparison", "Relevant passage references", "Historical & cultural context", "Shared figures & connection mapping", "AI Study Companion", "Save & bookmark explorations"],
  },
  {
    slug: "math-engine", name: "Math Understanding Engine",
    tagLine: "Not just the answer. The why, the history, and the real world.",
    description: "Paste any maths problem and get a complete breakdown: step-by-step solution, why the method works, the history behind the concept, real-world applications, and interactive visualisations. Adapts to GCSE, A-Level, or University. Built for real understanding, not just answers.",
    category: "Education", status: "LIVE", icon: "🧠", accentColor: "#6366f1",
    tags: ["Maths", "Education", "GCSE", "A-Level", "AI Tutor", "Visualisation"],
    tokenCost: 100, usageCount: 0, ratingAvg: null, ratingCount: 0,
    isFeatured: false, isNew: true, isPremium: false,
    features: ["Step-by-step solution with explanations", "Why this method works", "History & origin of the concept", "Real-world applications", "Interactive visualisation (graphs, charts)", "Practice question generator", "Level selector: GCSE / A-Level / University"],
  },
  {
    slug: "physics-engine", name: "Physics Understanding Engine",
    tagLine: "From concept to reality — physics explained the way it should be.",
    description: "Type any physics topic or question and receive a complete structured understanding: plain-English definition, the governing law, why scientists needed this idea, who discovered it, real-world applications, mental model analogies, common misconceptions corrected, and interactive visualisations. GCSE, A-Level, University.",
    category: "Education", status: "LIVE", icon: "⚛️", accentColor: "#0ea5e9",
    tags: ["Physics", "GCSE", "A-Level", "Education", "Science", "AI Tutor"],
    tokenCost: 100, usageCount: 0, ratingAvg: null, ratingCount: 0,
    isFeatured: false, isNew: true, isPremium: false,
    features: ["Full Concept Breakdown (8 structured layers)", "Why It Exists — the motivation behind every law", "History & discovery with key scientists", "Mental model intuition builders", "Common misconceptions corrected", "Try It Yourself experiments", "Theory Explorer Mode for broad topics", "GCSE · A-Level · University depth levels"],
  },
  {
    slug: "chemistry-engine", name: "Chemistry Understanding Engine",
    tagLine: "From particles to reality — chemistry explained at the deepest level.",
    description: "Enter any chemistry topic or question and receive a 10-layer structured breakdown: plain definition, particle-level explanation, core principle/law, why scientists needed this idea, history of discovery, theory breakdown, real-world applications, intuition builders, misconceptions corrected, and experiments to try. GCSE, A-Level, University.",
    category: "Education", status: "LIVE", icon: "🧪", accentColor: "#10b981",
    tags: ["Chemistry", "GCSE", "A-Level", "Education", "Science", "AI Tutor"],
    tokenCost: 50, usageCount: 0, ratingAvg: null, ratingCount: 0,
    isFeatured: false, isNew: true, isPremium: false,
    features: ["10-Layer Concept Breakdown", "Particle-level explanation (atoms, electrons, bonds)", "Core law/equation with term-by-term breakdown", "Why this concept was needed", "History & key chemists", "Theory deep dive", "Common misconceptions corrected", "Try It Yourself experiments", "GCSE · A-Level · University depth levels"],
  },

  // ── Productivity ────────────────────────────────────────────────────────────
  {
    slug: "productivity-score", name: "Productivity Score",
    tagLine: "Find what's slowing you down — and fix it today.",
    description: "Take a fast 20-question audit of your work habits, focus, and daily systems. Get a personalised productivity score, uncover hidden bottlenecks, and receive a clear, actionable plan to improve how you work — instantly.",
    category: "Productivity", status: "LIVE", icon: "📊", accentColor: "#14b8a6",
    tags: ["Productivity", "Self-improvement", "Focus", "Habits", "Performance"],
    tokenCost: 100, usageCount: 0, ratingAvg: null, ratingCount: 0,
    isFeatured: false, isNew: true, isPremium: false,
    features: ["20-question smart audit", "Instant productivity score (0–100)", "Detailed score breakdown (focus, habits, systems, energy, mindset)", "Bottleneck detection — what's actually slowing you down", "Personalised 3-step action plan (no generic advice)", "Shareable score card", "Weekly re-check system"],
  },
  {
    slug: "qr-code-generator", name: "Custom QR Code Generator",
    tagLine: "Beautiful, branded QR codes. Instant. Free.",
    description: "Create stunning, fully customised QR codes for any purpose — URLs, social profiles, contact cards, payment links, CVs, and more. Customise colours, dot shapes, frames, and embed your logo. Download as PNG or SVG. Completely free.",
    category: "Productivity", status: "LIVE", icon: "⬛", accentColor: "#6366f1",
    tags: ["QR Code", "Branding", "Design", "Marketing", "Free Tool"],
    tokenCost: 0, usageCount: 0, ratingAvg: null, ratingCount: 0,
    isFeatured: false, isNew: true, isPremium: false,
    features: ["10 QR types (URL, vCard, LinkedIn, payment, email, SMS, WiFi…)", "Full colour & gradient customisation", "5 dot shape styles", "Logo embedding", "Frame + CTA text", "PNG & SVG download", "AI design suggestions"],
  },
  {
    slug: "random-toolkit", name: "Random Generator Toolkit",
    tagLine: "Every random thing you need. One place. Instant.",
    description: "10 generators in one toolkit: secure passwords, random strings, UUID v4, numbers, fake test data, random pickers, colours, dates, words, and hashes. Built for developers. Useful for everyone. Zero data stored.",
    category: "Productivity", status: "LIVE", icon: "🎲", accentColor: "#8b5cf6",
    tags: ["Developer Tools", "Password", "UUID", "Random", "Testing", "Utilities"],
    tokenCost: 0, usageCount: 0, ratingAvg: null, ratingCount: 0,
    isFeatured: true, isNew: true, isPremium: false,
    features: ["Secure password generator with strength meter", "Random string / API key generator", "UUID v4 bulk generator", "Fake data generator (names, emails, addresses)", "Random colour (HEX/RGB/HSL) + CSS variables", "Hash generator (SHA-256/512, MD5)", "Developer code snippets per generator"],
  },
  {
    slug: "smart-shopping-list", name: "Smart Shared Shopping List",
    tagLine: "Create, share, and shop together in real-time.",
    description: "A real-time collaborative shopping list you can share with anyone via a single link. Add items, tick things off as you shop, set a budget, and generate complete lists from your meal plan using AI. No app download. Works on any device.",
    category: "Productivity", status: "LIVE", icon: "🛒", accentColor: "#10b981",
    tags: ["Shopping", "Family", "Collaboration", "AI", "Real-time"],
    tokenCost: 100, usageCount: 3240, ratingAvg: 4.9, ratingCount: 87,
    isFeatured: false, isNew: true, isPremium: false,
    features: ["Real-time shared lists via one link", "AI meal planner → shopping list", "15 category organisation (store-aisle order)", "Budget tracker + receipt mode", "3 quick-start templates", "Works offline (browser-saved)"],
    metaTitle: "Smart Shared Shopping List — Real-Time Collaborative Grocery Lists",
    metaDescription: "Create and share shopping lists instantly. One link — your family sees updates in real-time as you shop. Free.",
  },
  {
    slug: "kids-birthday-planner", name: "AI Kids Birthday Planner",
    tagLine: "Plan your child's perfect party in minutes — no stress, no guesswork.",
    description: "The complete AI-powered kids party planning system. Generate a full party plan in seconds, share smart invite links that evolve from invitation → guest dashboard → check-in system on party day, track RSVPs live, manage a smart checklist, track budget, and run party day mode with activity timers.",
    category: "Productivity", status: "LIVE", icon: "🎂", accentColor: "#f43f5e",
    tags: ["Kids", "Party", "Birthday", "Planning", "RSVP", "AI"],
    tokenCost: 150, usageCount: 0, ratingAvg: null, ratingCount: 0,
    isFeatured: false, isNew: true, isPremium: false,
    features: ["AI party plan in seconds", "Smart invite links (invite → RSVP → check-in)", "Live RSVP tracking", "Activity timeline with timers", "Budget tracker", "Auto-generated checklist", "Song request system", "Party Day Mode", "Safe check-in / check-out"],
  },
  {
    slug: "viral-hook-engine",
    name: "Viral Hook Engine",
    tagLine: "Turn your content idea into a viral machine. Hooks, thumbnails, script — everything.",
    description: "Stop guessing why some videos get millions of views while yours don't. Paste your content idea — the AI analyses it across 4 dimensions (Hook Strength, Emotional Pull, Shareability, Platform Fit) and gives you a complete viral package: 10 hook variations ranked by score (each with psychological trigger + why it works), 3 thumbnail concepts with text overlays and colour psychology, a word-for-word 30-second opening script, algorithm-optimised title/tags/description, competitor gap analysis, and follow-up video ideas. YouTube, TikTok, Reels, LinkedIn, Podcast, Newsletter — all platforms supported.",
    category: "Productivity",
    status: "LIVE",
    icon: "🔥",
    accentColor: "#f97316",
    tags: ["Viral", "Content", "YouTube", "TikTok", "Hooks", "Thumbnail", "Script", "AI", "Marketing", "Social Media"],
    tokenCost: 100,
    usageCount: 0,
    ratingAvg: null,
    ratingCount: 0,
    isFeatured: true,
    isNew: true,
    isPremium: false,
    features: [
      "Virality Score (0–100) across 4 dimensions",
      "10 hook variations — each with psychological trigger + score",
      "3 thumbnail concepts (text overlays, colours, emotion)",
      "Word-for-word 30-second opening script",
      "Algorithm package: best title, tags, description, posting time",
      "Competitor gap analysis — what everyone else does vs your angle",
      "Viral amplifiers (3 specific tactics)",
      "Follow-up video ideas + series potential",
      "Save hooks to your workspace",
      "Supports YouTube, TikTok, Reels, LinkedIn, Podcast, Newsletter",
    ],
    metaTitle: "Viral Hook Engine — AI Tool to Make Your Content Go Viral",
    metaDescription: "AI-powered viral content analysis. Get hook variations, thumbnail concepts, script, and algorithm optimisation for YouTube, TikTok, Reels, LinkedIn, and more.",
  },

  {
    slug: "content-studio",
    name: "Content Studio AI",
    tagLine: "From blank page to publish-ready script. In 60 seconds.",
    description: "Stop spending hours writing what should take minutes. Content Studio AI generates complete production-ready content for any format: YouTube scripts (long-form or Shorts), TikTok/Reels scripts, Twitter/X threads, blog posts, newsletters, and more. Choose from 8 creation modes — Full Package (script + hook + thumbnail brief + promotion tweets + repurpose ideas), Script Only, Short Form, Twitter Thread, Blog Post, Newsletter, Repurpose (turn existing content into 5 platforms), or Refine (improve existing content). Each output includes platform-native formatting, B-roll notes, director's notes, SEO optimisation, engagement strategy, and best time to post.",
    category: "Productivity",
    status: "LIVE",
    icon: "🎬",
    accentColor: "#8b5cf6",
    tags: ["Content Creation", "YouTube", "Script Writing", "AI Writing", "Blog", "Newsletter", "Twitter Thread", "TikTok", "Productivity"],
    tokenCost: 120,
    usageCount: 0,
    ratingAvg: null,
    ratingCount: 0,
    isFeatured: true,
    isNew: true,
    isPremium: false,
    features: [
      "8 creation modes: Full Package, Script Only, Short Form, Thread, Blog, Newsletter, Repurpose, Refine",
      "Hook with psychological breakdown + alternative titles",
      "Full script with B-roll notes and director's notes",
      "Download script as .txt file",
      "3 thumbnail concept briefs",
      "YouTube description with chapters",
      "8 optimised tags + hashtags",
      "Promotion tweets + LinkedIn caption",
      "5 repurpose ideas with hooks",
      "Engagement strategy: comment hook, poll idea, best post time",
      "Twitter/X thread (8–15 tweets, fully written)",
      "SEO blog post (1200+ words, meta description, slug)",
      "Newsletter with subject line + preview text + PS line",
      "Refine mode — diagnose weaknesses and rewrite",
    ],
    metaTitle: "Content Studio AI — Script Writer for YouTube, TikTok, Blogs & More",
    metaDescription: "AI content creation tool that writes YouTube scripts, TikTok scripts, Twitter threads, blog posts, and newsletters. Includes hooks, B-roll notes, promotion package, and repurpose ideas.",
  },


  // ── Writing ─────────────────────────────────────────────────────────────────
  {
    slug: "reading-time-calculator", name: "Reading Time Calculator",
    tagLine: "Paste any text. Know exactly how long it takes to read.",
    description: "A sharp, precise tool for writers, editors, and content creators. Paste your content and instantly see reading time, word count, sentence complexity, and readability scores.",
    category: "Writing", status: "LIVE", icon: "⏱️", accentColor: "#3b82f6",
    tags: ["Writing", "Content", "Readability", "Tools"],
    tokenCost: 10, usageCount: 7230, ratingAvg: 4.9, ratingCount: 156,
    isFeatured: false, isNew: false, isPremium: false,
    features: ["Reading time (slow/avg/fast)", "Word & character count", "Sentence complexity score", "Flesch readability index", "Paragraph breakdown"],
  },
  {
    slug: "message-rewriter", name: "Message Rewriter",
    tagLine: "Say it better, instantly.",
    description: "Paste any message — email, Slack, WhatsApp, LinkedIn — and rewrite it in the perfect tone. Professional, polite, confident, friendly, direct, or empathetic. Get 3 versions instantly. One-click copy. Free.",
    category: "Writing", status: "LIVE", icon: "✍️", accentColor: "#6366f1",
    tags: ["Writing", "Communication", "Email", "Productivity", "AI"],
    tokenCost: 100, usageCount: 0, ratingAvg: null, ratingCount: 0,
    isFeatured: false, isNew: true, isPremium: false,
    features: ["6 tones: Professional, Polite, Confident, Friendly, Direct, Empathetic", "3 versions per rewrite — pick the perfect one", "Intent modes: Persuasive, Less Aggressive, Clearer", "Shorten / Expand / Soften (say it kindly)", "Platform presets: Email, Slack, LinkedIn, Text", "One-click copy", "Shareable before/after"],
  },

  // ── Finance ─────────────────────────────────────────────────────────────────
  {
    slug: "debt-recovery-planner", name: "AI Debt Recovery Planner",
    tagLine: "Turn financial stress into a clear, step-by-step plan.",
    description: "Enter your debts, income, and expenses to get a personalised, AI-generated debt repayment roadmap. Snowball or avalanche strategy, month-by-month timeline, weekly action plan, scenario simulation, and a built-in AI financial coach — all free.",
    category: "Finance", status: "LIVE", icon: "💰", accentColor: "#14b8a6",
    tags: ["Debt", "Finance", "Budgeting", "Planning", "Money"],
    tokenCost: 150, usageCount: 3280, ratingAvg: 4.9, ratingCount: 94,
    isFeatured: false, isNew: true, isPremium: false,
    features: ["Debt repayment roadmap", "Snowball & avalanche strategies", "Month-by-month timeline", "Scenario simulation", "AI financial coach", "Progress tracking"],
  },
  {
    slug: "smart-budget-planner", name: "Smart Budget Survival Planner",
    tagLine: "Can you survive on this? Find out in seconds.",
    description: "Enter your total budget and timeframe, add your fixed costs and flexible spending, and get a realistic day-by-day survival plan with daily limits, category breakdowns, risk assessment, AI-powered cut suggestions, scenario testing, and an AI budget coach. Built for real life, not spreadsheets.",
    category: "Finance", status: "LIVE", icon: "💸", accentColor: "#6366f1",
    tags: ["Budget", "Survival", "Finance", "Planning", "Money"],
    tokenCost: 150, usageCount: 3140, ratingAvg: 4.7, ratingCount: 94,
    isFeatured: false, isNew: true, isPremium: false,
    features: ["Daily survival budget calculator", "Risk indicator (Safe / Tight / Unsustainable)", "Category-by-category allocation", "AI cut suggestions & scenarios", "Survival Mode guidance", "AI Budget Coach"],
  },
  {
    slug: "first-home-planner", name: "First Home Planner",
    tagLine: "Go from your first payslip to owning a home. With a real plan.",
    description: "The AI-powered planner that maps out exactly how you get from where you are today to owning your first home. Enter your income, savings, and target property — get a personalised deposit plan, mortgage readiness roadmap, credit-building strategy, and a month-by-month action plan.",
    category: "Finance", status: "LIVE", icon: "🏡", accentColor: "#6366f1",
    tags: ["Home Buying", "Mortgage", "Savings", "Finance", "First-Time Buyer"],
    tokenCost: 200, usageCount: 2140, ratingAvg: 4.9, ratingCount: 67,
    isFeatured: false, isNew: true, isPremium: false,
    features: ["Personalised deposit savings plan", "Mortgage readiness roadmap", "Phase-by-phase action plan", "Credit profile builder guide", "UK first-time buyer schemes", "AI Home Coach"],
  },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log(`\n🌱 Seeding ${TOOLS.length} tools...\n`);

  let created = 0;
  let updated = 0;
  let failed  = 0;

  for (const tool of TOOLS) {
    try {
      const category = mapCategory(tool.category);
      const tags     = JSON.stringify(tool.tags);
      const features = [...tool.features];

      const existing = await prisma.tool.findUnique({ where: { slug: tool.slug } });

      if (existing) {
        await prisma.tool.update({
          where: { slug: tool.slug },
          data: {
            name:            tool.name,
            tagLine:         tool.tagLine,
            description:     tool.description,
            category:        category as any,
            status:          tool.status as any,
            icon:            tool.icon,
            accentColor:     tool.accentColor,
            tags,
            features,
            tokenCost:       tool.tokenCost ?? null,
            usageCount:      tool.usageCount,
            ratingAvg:       tool.ratingAvg  ?? null,
            ratingCount:     tool.ratingCount,
            isFeatured:      tool.isFeatured  ?? false,
            isNew:           tool.isNew       ?? false,
            isPremium:       tool.isPremium   ?? false,
            isActive:        true,
            isPublic:        true,
            metaTitle:       (tool as any).metaTitle       ?? null,
            metaDescription: (tool as any).metaDescription ?? null,
          },
        });
        console.log(`  🔄 Updated  — ${tool.name}`);
        updated++;
      } else {
        await prisma.tool.create({
          data: {
            name:            tool.name,
            slug:            tool.slug,
            tagLine:         tool.tagLine,
            description:     tool.description,
            category:        category as any,
            status:          tool.status as any,
            icon:            tool.icon,
            accentColor:     tool.accentColor,
            tags,
            features,
            tokenCost:       tool.tokenCost ?? null,
            // usageCount:      tool.usageCount,
            // ratingAvg:       tool.ratingAvg  ?? null,
            // ratingCount:     tool.ratingCount,
            isFeatured:      tool.isFeatured  ?? false,
            isNew:           tool.isNew       ?? false,
            isPremium:       tool.isPremium   ?? false,
            isActive:        true,
            isPublic:        true,
            version:         "1.0.0",
            metaTitle:       (tool as any).metaTitle       ?? null,
            metaDescription: (tool as any).metaDescription ?? null,
          },
        });
        console.log(`  ✅ Created  — ${tool.name}`);
        created++;
      }
    } catch (err: unknown) {
      console.error(`  ❌ Failed   — ${tool.name} (${tool.slug}):`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`✅ Created : ${created}`);
  console.log(`🔄 Updated : ${updated}`);
  console.log(`❌ Failed  : ${failed}`);
  console.log(`📦 Total   : ${TOOLS.length}`);
  console.log(`─────────────────────────────────────\n`);
}

seed()
  .catch((err) => { console.error("Seed failed:", err); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });