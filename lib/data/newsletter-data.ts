// =============================================================================
// isaacpaha.com — Newsletter Page Data
// "The Signal" — Isaac Paha's fortnightly dispatch
// =============================================================================

export interface NewsletterEdition {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  date: string;
  readTime: string;
  topics: string[];
  openRate: string;
  emoji: string;
  previewSnippet: string;
}

export interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  location: string;
  initials: string;
  accentColor: string;
}

export interface TopicPillar {
  id: string;
  emoji: string;
  label: string;
  description: string;
  color: string;
  frequency: string;
}

export interface FAQ {
  q: string;
  a: string;
}

// ─── NEWSLETTER META ──────────────────────────────────────────────────────────

export const NEWSLETTER_META = {
  name: "The Signal",
  tagline: "Ideas worth thinking about.",
  description:
    "A fortnightly dispatch on building companies, African technology, AI, and the ideas that don't fit neatly into any category. Written by a founder, for people who build things.",
  frequency: "Every two weeks",
  readTime: "6–10 min",
  subscriberCount: 4847,
  openRate: "52%",
  issueCount: 48,
  senderEmail: "isaac@isaacpaha.com",
  accentColor: "#e8ff47",
};

// ─── TOPIC PILLARS ────────────────────────────────────────────────────────────

export const TOPIC_PILLARS: TopicPillar[] = [
  {
    id: "building",
    emoji: "🏗️",
    label: "Building",
    description:
      "The honest account of what building products actually looks like — the decisions, the mistakes, the things nobody puts in blog posts. Not inspiration porn. Real operational thinking.",
    color: "#f59e0b",
    frequency: "Every issue",
  },
  {
    id: "africa",
    emoji: "🌍",
    label: "Africa & Emerging Markets",
    description:
      "Why Africa is where the most interesting technology problems are being solved right now, and what building for emerging markets teaches you about building for anyone.",
    color: "#10b981",
    frequency: "Most issues",
  },
  {
    id: "ai",
    emoji: "🤖",
    label: "AI — Applied",
    description:
      "Not AI hype. The practical question: what does this actually change for founders, products, and people who build things? Concrete applications, honest limitations.",
    color: "#8b5cf6",
    frequency: "Frequent",
  },
  {
    id: "ideas",
    emoji: "💡",
    label: "Ideas & Frameworks",
    description:
      "Mental models, observations, and contrarian takes that accumulate from reading slowly, building fast, and connecting things that seem unconnected.",
    color: "#3b82f6",
    frequency: "Every issue",
  },
  {
    id: "reading",
    emoji: "📚",
    label: "What I'm Reading",
    description:
      "Books and essays that shifted how I think. With honest reactions — not summaries — and why it matters for what you're building. Sometimes uncomfortable.",
    color: "#f97316",
    frequency: "Every issue",
  },
];

// ─── PAST EDITIONS ────────────────────────────────────────────────────────────

export const PAST_EDITIONS: NewsletterEdition[] = [
  {
    id: "ed48",
    number: 48,
    title: "The Trust Problem",
    subtitle: "Why the real bottleneck in African e-commerce isn't payments — it's trust between strangers",
    date: "2026-02-25",
    readTime: "8 min",
    topics: ["Africa", "Building", "Product"],
    openRate: "58%",
    emoji: "🤝",
    previewSnippet:
      "Mobile Money solved the payment problem. Nobody has fully solved the trust problem. Here's what I mean and why it matters for every product in the space...",
  },
  {
    id: "ed47",
    number: 47,
    title: "The Wrong Variable",
    subtitle: "Most AI productivity tools optimise for the wrong thing — and why that matters for what you build",
    date: "2026-02-11",
    readTime: "7 min",
    topics: ["AI", "Building", "Ideas"],
    openRate: "55%",
    emoji: "🎯",
    previewSnippet:
      "Task throughput is rarely the constraint. Knowing which tasks are worth doing is. These are completely different problems...",
  },
  {
    id: "ed46",
    number: 46,
    title: "What the Market Actually Wants",
    subtitle: "On the gap between what users say they want and what the data shows they'll pay for",
    date: "2026-01-28",
    readTime: "9 min",
    topics: ["Product", "Building", "Africa"],
    openRate: "51%",
    emoji: "💰",
    previewSnippet:
      "Three conversations with users who all said they'd pay for X. Zero of them did when we built it. Here's what I learned...",
  },
  {
    id: "ed45",
    number: 45,
    title: "The Leapfrog Pattern",
    subtitle: "Africa skipped landlines. It skipped desktops. What comes next, and why it matters",
    date: "2026-01-14",
    readTime: "10 min",
    topics: ["Africa", "Ideas", "Technology"],
    openRate: "61%",
    emoji: "🚀",
    previewSnippet:
      "The leapfrog pattern — skipping generations of infrastructure — has happened twice. Here's where it happens next...",
  },
  {
    id: "ed44",
    number: 44,
    title: "Craft Over Grind",
    subtitle: "The grind narrative is performative and counterproductive. A better framing for building sustainable companies",
    date: "2025-12-17",
    readTime: "6 min",
    topics: ["Building", "Ideas"],
    openRate: "62%",
    emoji: "🔨",
    previewSnippet:
      "Solo founding is sustainable if you treat it as a craft rather than a grind. These are fundamentally different relationships with the work...",
  },
  {
    id: "ed43",
    number: 43,
    title: "Reading the Room",
    subtitle: "What three months of user research for Paralel Me taught me about the difference between listening and hearing",
    date: "2025-12-03",
    readTime: "8 min",
    topics: ["Building", "Product", "AI"],
    openRate: "49%",
    emoji: "👁️",
    previewSnippet:
      "The best product decisions I made came from watching actual users try to do the thing — not from interviews, not surveys...",
  },
];

// ─── EMAIL PREVIEW CONTENT ────────────────────────────────────────────────────
// Rendered inside the mock email client in the hero

export const EMAIL_PREVIEW = {
  number: 48,
  date: "Tuesday, 25 February 2026",
  subject: "The Trust Problem",
  preheader: "Why payments aren't the hard part of African e-commerce",
  sections: [
    {
      type: "opener" as const,
      content:
        "Happy Tuesday. This week I want to talk about something that's been nagging at me since we launched okDdwa three years ago — and became undeniable when we were building okSika.",
    },
    {
      type: "heading" as const,
      content: "Payments weren't the hard part.",
    },
    {
      type: "body" as const,
      content:
        "Everyone in African tech talked about the payment problem for years. The story was: if only we had mobile payments, e-commerce would take off. Mobile Money arrived. E-commerce has grown. But not the way people expected. Why?",
    },
    {
      type: "body" as const,
      content:
        "Because payments were never the hard part. The hard part is trust. Specifically: how do you build trust between strangers when institutions are weak and scams are common?",
    },
    {
      type: "callout" as const,
      content:
        "The question isn't 'can I pay for this?' It's 'will I actually receive what I paid for, and is this seller who they say they are?'",
    },
    {
      type: "body" as const,
      content:
        "eBay solved this with feedback scores. Amazon solved it with first-party inventory. Each solution relies on accumulated institutional trust. In West Africa, that backstop often doesn't exist the same way. This isn't a payments problem — it's a social contract problem.",
    },
    {
      type: "reading" as const,
      content:
        "📚 Reading: The Anatomy of Fascism — Paxton's methodology of studying fascism as a practice rather than ideology is surprisingly applicable to how I think about product behaviour vs. stated intent. 67% through. Recommended.",
    },
    {
      type: "footer" as const,
      content:
        "Until next time. If this made you think, forward it to one person who builds things. — Isaac",
    },
  ],
};

// ─── TESTIMONIALS ─────────────────────────────────────────────────────────────

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    quote:
      "The Signal is the only newsletter I read the same day it arrives. Isaac writes the way good founders think — specific, direct, without the motivational poster energy.",
    name: "Abena Mensah",
    role: "Product Manager",
    location: "Accra, Ghana",
    initials: "AM",
    accentColor: "#10b981",
  },
  {
    id: "t2",
    quote:
      "I've read hundreds of startup newsletters. Most are either too abstract or too self-promotional. This is neither. It's the honest account of what building actually looks like.",
    name: "James Okafor",
    role: "Founder",
    location: "Lagos, Nigeria",
    initials: "JO",
    accentColor: "#f97316",
  },
  {
    id: "t3",
    quote:
      "The Africa and emerging markets writing is genuinely rare. You can tell it's from someone in the market, not observing from a distance.",
    name: "Priya Nair",
    role: "VC Associate",
    location: "London, UK",
    initials: "PN",
    accentColor: "#8b5cf6",
  },
  {
    id: "t4",
    quote:
      "I forwarded issue #45 on the leapfrog pattern to our entire investment team. That doesn't happen often. The thinking is genuinely original.",
    name: "Kwame Asante",
    role: "Angel Investor",
    location: "Kumasi, Ghana",
    initials: "KA",
    accentColor: "#3b82f6",
  },
];

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export const FAQS: FAQ[] = [
  {
    q: "How often does it arrive?",
    a: "Every two weeks, on Tuesday mornings. 48 issues published so far — I've only missed two, both for good reasons.",
  },
  {
    q: "How long is each issue?",
    a: "6–10 minutes. I write to respect your time: one main piece of thinking, a few shorter observations, and one book note. Not a content dump.",
  },
  {
    q: "Is it free?",
    a: "Yes, completely free. No paid tier, no premium content. If you find it valuable, forward it to one person who builds things.",
  },
  {
    q: "Can I read past issues before subscribing?",
    a: "Yes — there's a full archive above. Issue #45 (The Leapfrog Pattern) and #47 (The Wrong Variable) are good entry points.",
  },
  {
    q: "What if I don't like it?",
    a: "Unsubscribe in one click from any email. No re-subscribe prompts, no guilt-trip goodbye sequence. I respect your inbox.",
  },
  {
    q: "Do you share email addresses?",
    a: "Never. Your email goes to Resend to deliver the newsletter. That's it. No third-party lists, no data selling, ever.",
  },
];

// ─── WHAT YOU WON'T GET ───────────────────────────────────────────────────────

export const ANTI_PITCH = [
  "A content marketing funnel for my products",
  "A weekly recap of startup Twitter",
  "Motivational quotes dressed up as insight",
  "AI-generated summaries of things you already know",
  "Sponsored content disguised as editorial",
];