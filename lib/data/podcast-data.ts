// =============================================================================
// isaacpaha.com — Podcast Page Data
// "Signal & Noise" — Isaac Paha's podcast
// =============================================================================

export interface Episode {
  id: string;
  number: number;
  title: string;
  guest: string;
  guestRole: string;
  guestLocation: string;
  description: string;
  topics: string[];
  duration: string;
  recordDate: string;
  status: "upcoming" | "recording" | "editing" | "released";
  emoji: string;
  accentColor: string;
}

export interface ShowFormat {
  id: string;
  emoji: string;
  title: string;
  description: string;
  detail: string;
}

export interface PlatformLink {
  id: string;
  name: string;
  icon: string;
  color: string;
  href: string;
  available: boolean;
}

export interface ShowTopic {
  emoji: string;
  label: string;
  color: string;
}

export interface GuestTestimonial {
  quote: string;
  name: string;
  role: string;
  location: string;
  initials: string;
  accentColor: string;
}

// ─── SHOW META ────────────────────────────────────────────────────────────────

export const PODCAST_META = {
  name: "Signal & Noise",
  tagline: "Conversations worth having.",
  description:
    "A podcast about building companies, the future of African technology, AI, and the ideas that matter most right now. Real conversations with founders, operators, thinkers, and builders — no fluff, no sponsorship reads.",
  host: "Isaac Paha",
  hostTitle: "Founder, iPaha Ltd · iPahaStores Ltd · Okpah Ltd",
  accentColor: "#ff4d2e",
  launchQuarter: "Q3 2026",
  episodeLength: "40–70 minutes",
  cadence: "Every two weeks",
  totalEpisodesPlanned: 24,
};

// ─── EPISODES ─────────────────────────────────────────────────────────────────

export const EPISODES: Episode[] = [
  {
    id: "ep001",
    number: 1,
    title: "The Africa Premium: Why Building Here Costs More and Matters More",
    guest: "Kwabena Asante",
    guestRole: "Co-founder, Paystack successor startup",
    guestLocation: "Lagos, Nigeria",
    description:
      "We dig into what it actually costs — in money, time, and mental energy — to build infrastructure-level products in West Africa. Why the 'Africa premium' exists, whether it's shrinking, and what the next wave of African fintech gets right that the first wave missed.",
    topics: ["Fintech", "Africa", "Infrastructure", "Startups"],
    duration: "62 min",
    recordDate: "2026-07-08",
    status: "upcoming",
    emoji: "💳",
    accentColor: "#10b981",
  },
  {
    id: "ep002",
    number: 2,
    title: "What AI Can't Do Yet — And Why That's Where the Opportunity Is",
    guest: "Dr. Adaeze Okonkwo",
    guestRole: "AI Researcher, Cambridge",
    guestLocation: "Cambridge, UK",
    description:
      "An honest conversation about the gap between AI marketing and AI reality. What large language models genuinely can't do, what that means for founders building AI products, and why the constraints are more interesting than the capabilities.",
    topics: ["AI", "Research", "Product", "Frontier"],
    duration: "55 min",
    recordDate: "2026-07-22",
    status: "upcoming",
    emoji: "🧠",
    accentColor: "#8b5cf6",
  },
  {
    id: "ep003",
    number: 3,
    title: "Logistics at Scale: Delivering Ghana's Last Mile",
    guest: "Ama Serwaa",
    guestRole: "Head of Operations, Jumia Ghana",
    guestLocation: "Accra, Ghana",
    description:
      "Last-mile delivery in sub-Saharan Africa is one of the hardest operational problems in global commerce. Ama breaks down what makes it uniquely complex — street addressing, traffic, payment on delivery — and what innovative logistics companies are getting right.",
    topics: ["Logistics", "Operations", "Ghana", "Commerce"],
    duration: "58 min",
    recordDate: "2026-08-05",
    status: "upcoming",
    emoji: "📦",
    accentColor: "#f97316",
  },
  {
    id: "ep004",
    number: 4,
    title: "The Education Bottleneck: Why Ghana's Graduates Aren't Ready for Tech",
    guest: "Prof. Emmanuel Asante-Boateng",
    guestRole: "Dean of Computing, KNUST",
    guestLocation: "Kumasi, Ghana",
    description:
      "A frank conversation about the state of computing education in Ghana and across West Africa. The mismatch between what universities teach and what industry needs. What it would take to produce a generation of genuinely world-class African engineers.",
    topics: ["Education", "Technology", "Ghana", "Talent"],
    duration: "67 min",
    recordDate: "2026-08-19",
    status: "upcoming",
    emoji: "🎓",
    accentColor: "#ec4899",
  },
  {
    id: "ep005",
    number: 5,
    title: "Building in Public: What Transparency Actually Costs Founders",
    guest: "James Osei-Bonsu",
    guestRole: "Solo founder, 3 SaaS companies",
    guestLocation: "London, UK",
    description:
      "Building in public has become a growth strategy, but there's a rarely-discussed cost: what happens when you share the journey and it doesn't go the way you expected? James has been more transparent than almost anyone about his building process. We talk about what it actually costs.",
    topics: ["Building", "Community", "Transparency", "SaaS"],
    duration: "49 min",
    recordDate: "2026-09-02",
    status: "upcoming",
    emoji: "🔭",
    accentColor: "#3b82f6",
  },
];

// ─── SHOW FORMAT ──────────────────────────────────────────────────────────────

export const SHOW_FORMATS: ShowFormat[] = [
  {
    id: "long-form",
    emoji: "🎙️",
    title: "Long-form conversations",
    description: "40–70 minute deep dives",
    detail: "No lightning rounds, no forced segues. Conversations that go somewhere real.",
  },
  {
    id: "no-fluff",
    emoji: "🎯",
    title: "Zero fluff",
    description: "Prepared, then improvised",
    detail: "I research every guest properly. The conversation follows wherever it goes.",
  },
  {
    id: "africa-focus",
    emoji: "🌍",
    title: "Africa-forward",
    description: "Not Africa-only",
    detail: "Every episode is relevant globally, but anchored in the reality of building in emerging markets.",
  },
  {
    id: "practitioners",
    emoji: "🔨",
    title: "Practitioners, not pundits",
    description: "Guests who build things",
    detail: "Founders, engineers, operators, researchers — people who have done the thing.",
  },
  {
    id: "honest",
    emoji: "💡",
    title: "Uncomfortably honest",
    description: "Including the failures",
    detail: "The most interesting conversations are about what went wrong and what it cost.",
  },
  {
    id: "ideas",
    emoji: "📚",
    title: "Idea-driven",
    description: "Not news-driven",
    detail: "We don't cover trending topics. We cover thinking worth holding onto for years.",
  },
];

// ─── TOPICS ───────────────────────────────────────────────────────────────────

export const SHOW_TOPICS: ShowTopic[] = [
  { emoji: "🏗️", label: "Building Companies",       color: "#f59e0b" },
  { emoji: "🌍", label: "African Technology",        color: "#10b981" },
  { emoji: "🤖", label: "AI — Applied",              color: "#8b5cf6" },
  { emoji: "💰", label: "Fintech & Commerce",        color: "#3b82f6" },
  { emoji: "📦", label: "Logistics & Infrastructure",color: "#f97316" },
  { emoji: "🎓", label: "Education",                 color: "#ec4899" },
  { emoji: "🧠", label: "Mental Models",             color: "#14b8a6" },
  { emoji: "📖", label: "Ideas & Frameworks",        color: "#e2e8f0" },
];

// ─── PLATFORMS ────────────────────────────────────────────────────────────────

export const PLATFORMS: PlatformLink[] = [
  { id: "spotify",      name: "Spotify",       icon: "🎵", color: "#1DB954", href: "#", available: false },
  { id: "apple",        name: "Apple Podcasts",icon: "🎙️", color: "#B49FCA", href: "#", available: false },
  { id: "youtube",      name: "YouTube",       icon: "▶️", color: "#FF0000", href: "#", available: false },
  { id: "overcast",     name: "Overcast",      icon: "🔶", color: "#FC7E0F", href: "#", available: false },
  { id: "pocket-casts", name: "Pocket Casts",  icon: "🎧", color: "#F43E37", href: "#", available: false },
  { id: "rss",          name: "RSS Feed",      icon: "📡", color: "#FFA500", href: "#", available: false },
];

// ─── GUEST TESTIMONIALS (anticipatory) ────────────────────────────────────────

export const GUEST_QUOTES: GuestTestimonial[] = [
  {
    quote: "Exactly the kind of conversation I want to be having. Most podcast hosts want soundbites. Isaac wants substance.",
    name: "Nana Boateng",
    role: "Founder, TechHub Accra",
    location: "Accra, Ghana",
    initials: "NB",
    accentColor: "#10b981",
  },
  {
    quote: "The questions came from someone who had actually thought about the problem space. That's rare.",
    name: "Fatima Al-Hassan",
    role: "Product Lead, Wave",
    location: "Dakar, Senegal",
    initials: "FA",
    accentColor: "#f59e0b",
  },
  {
    quote: "The research was exceptional. I learned something about my own company from the conversation.",
    name: "Kofi Mensah",
    role: "CTO, AirtelTigo",
    location: "Accra, Ghana",
    initials: "KM",
    accentColor: "#8b5cf6",
  },
];

// ─── GUEST PITCH ──────────────────────────────────────────────────────────────

export const GUEST_PITCH = {
  headline: "Want to be a guest?",
  subtext:
    "I'm looking for founders, operators, researchers, and thinkers who have built something real and thought about it honestly. If that sounds like you — or someone you know — reach out.",
  criteria: [
    "You've built something real — a company, a product, a body of research",
    "You have a perspective that goes beyond the standard take",
    "You're comfortable with honest, specific questions",
    "Your work has a connection to emerging markets, Africa, AI, or building",
  ],
};