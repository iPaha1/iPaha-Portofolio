// =============================================================================
// isaacpaha.com — /now Page Data
// Living snapshot of what Isaac is doing, reading, thinking, building right now
// Last updated: March 2026
// =============================================================================

export interface NowBook {
  id: string;
  title: string;
  author: string;
  genre: string;
  emoji: string;
  coverColor: string;
  progress: number;
  thought: string;
  rating: number;
  status: "reading" | "finished" | "paused";
}

export interface NowBuild {
  id: string;
  name: string;
  icon: string;
  appSlug: string;
  company: string;
  statusLabel: string;
  statusColor: string;
  completionPct: number;
  focus: string;
  detail: string;
}

export interface NowThought {
  id: string;
  text: string;
  tag: string;
  tagColor: string;
}

export interface NowTrack {
  title: string;
  artist: string;
  emoji: string;
  context: string;
}

export interface NowWatch {
  title: string;
  format: "Series" | "Documentary" | "Film";
  emoji: string;
  thought: string;
  accentColor: string;
}

export interface NowLearn {
  topic: string;
  emoji: string;
  why: string;
  depth: "Beginner" | "Intermediate" | "Applied" | "Deep Dive";
  depthColor: string;
}

export interface NowNextItem {
  icon: string;
  horizon: string;
  horizonColor: string;
  text: string;
}

export interface NowArchiveEntry {
  version: string;
  label: string;
  date: string;
  location: string;
  summary: string;
}

// ─── META ─────────────────────────────────────────────────────────────────────

export const NOW_META = {
  lastUpdated: "2026-03-10",
  version: "v9",
  location: "London, United Kingdom",
  locationFlag: "🇬🇧",
  mode: "Building",
  modeEmoji: "🔨",
  moodLabel: "Focused & energised",
  moodEmoji: "⚡",
  energyPct: 84,
  modeColor: "#10b981",
};

// ─── BUILDING ─────────────────────────────────────────────────────────────────

export const NOW_BUILDING: NowBuild[] = [
  {
    id: "oksumame",
    name: "okSumame",
    icon: "🚀",
    appSlug: "oksumame",
    company: "Okpah Ltd",
    statusLabel: "Active Development",
    statusColor: "#6366f1",
    completionPct: 48,
    focus: "Live tracking map + courier API integrations",
    detail:
      "Rebuilding the real-time delivery tracking map using WebSockets and Redis pub/sub. 14 courier APIs are now integrated — the challenge is reconciling wildly inconsistent data formats from each partner. Hardest engineering problem I've worked on.",
  },
  {
    id: "paralel-me",
    name: "Paralel Me",
    icon: "⚡",
    appSlug: "paralel-me",
    company: "iPaha Ltd",
    statusLabel: "Beta · Iterating",
    statusColor: "#8b5cf6",
    completionPct: 72,
    focus: "AI writing layer + user research",
    detail:
      "Running user interviews with 20 beta users this week. The core scheduling feature works. The AI assistant isn't yet earning trust — the responses are helpful but not distinctly personal. Rewriting the system prompt architecture.",
  },
  {
    id: "okadwuma",
    name: "oKadwuma",
    icon: "💼",
    appSlug: "okadwuma",
    company: "Okpah Ltd",
    statusLabel: "Live · Expanding",
    statusColor: "#10b981",
    completionPct: 89,
    focus: "Nigeria expansion research",
    detail:
      "oKadwuma Ghana is healthy. Now deciding: expand to Nigeria as a direct port, or build something locally distinct? Mapping the Lagos job market and talking to employers there. The hiring context is meaningfully different.",
  },
];

// ─── READING ──────────────────────────────────────────────────────────────────

export const NOW_READING: NowBook[] = [
  {
    id: "anatomy-fascism",
    title: "The Anatomy of Fascism",
    author: "Robert O. Paxton",
    genre: "History & Politics",
    emoji: "📕",
    coverColor: "#7f1d1d",
    progress: 67,
    thought:
      "Paxton's argument that fascism is better understood as a practice than an ideology — a set of behaviours rather than a coherent doctrine — is the most clarifying historical lens I've encountered this year. The chapter on fascism in power is uncomfortable precisely because it's so specific.",
    rating: 5,
    status: "reading",
  },
  {
    id: "poor-charlies",
    title: "Poor Charlie's Almanack",
    author: "Charles T. Munger",
    genre: "Thinking & Mental Models",
    emoji: "📗",
    coverColor: "#14532d",
    progress: 44,
    thought:
      "Reading one talk at a time. The inversion principle and the latticework mental models idea have already changed how I think about product decisions. Munger's core insight — that wisdom comes from knowing what to avoid — is underrated in startup culture.",
    rating: 5,
    status: "reading",
  },
  {
    id: "entrepreneurial-state",
    title: "The Entrepreneurial State",
    author: "Mariana Mazzucato",
    genre: "Economics & Innovation",
    emoji: "📘",
    coverColor: "#1e3a8a",
    progress: 29,
    thought:
      "The argument that the state has been the primary risk-taker behind most transformative technology is both convincing and inconvenient for Silicon Valley mythology. Processing what it means for how I think about public-private dynamics in African tech.",
    rating: 4,
    status: "reading",
  },
];

export const NOW_FINISHED: NowBook[] = [
  {
    id: "zero-to-one",
    title: "Zero to One",
    author: "Peter Thiel",
    genre: "Startups",
    emoji: "📙",
    coverColor: "#92400e",
    progress: 100,
    thought:
      "Third re-read. Still the clearest thinking on why you'd build something genuinely new versus optimising what exists. The monopoly argument applies to African markets more than people realise.",
    rating: 5,
    status: "finished",
  },
  {
    id: "power-of-now",
    title: "The Power of Now",
    author: "Eckhart Tolle",
    genre: "Philosophy",
    emoji: "✨",
    coverColor: "#78350f",
    progress: 100,
    thought:
      "More rigorous than expected. The distinction between pain (inevitable) and suffering (self-created) is genuinely useful — less so under real deadline pressure.",
    rating: 4,
    status: "finished",
  },
  {
    id: "meditations",
    title: "Meditations",
    author: "Marcus Aurelius",
    genre: "Philosophy",
    emoji: "📖",
    coverColor: "#1e293b",
    progress: 100,
    thought:
      "A timeless guide to Stoic living. Marcus Aurelius' reflections on duty, virtue, and the impermanence of life are both humbling and empowering.",
    rating: 5,
    status: "finished",

  },
  {
    id: "obstacle-is-the-way",
    title: "The Obstacle is the Way",
    author: "Ryan Holiday",
    genre: "Philosophy",
    emoji: "⛰️",
    coverColor: "#374151",
    progress: 100,
    thought:
      "A practical guide to Stoic philosophy in action. Ryan Holiday's take on turning obstacles into opportunities is both inspiring and actionable.",
    rating: 5,
    status: "finished",

  }
];

// ─── THOUGHTS ─────────────────────────────────────────────────────────────────

export const NOW_THOUGHTS: NowThought[] = [
  {
    id: "t1",
    text: "The real bottleneck in African e-commerce isn't payments — it's trust. Mobile Money solved the payment problem. Nobody has fully solved the trust problem: how do you transact with strangers in a low-institutional-trust environment? That's a product problem, not a payment one.",
    tag: "Africa & Commerce",
    tagColor: "#f97316",
  },
  {
    id: "t2",
    text: "Most AI productivity tools optimise for the wrong variable. They help you do more tasks faster. But task throughput is rarely the actual constraint — knowing which tasks are worth doing is. These are completely different problems, and the second one is much harder.",
    tag: "AI & Building",
    tagColor: "#8b5cf6",
  },
  {
    id: "t3",
    text: "Education in Ghana might be the highest-leverage thing I could work on. One generation that learns to think clearly and use digital tools compounds for 50 years. Nothing I'm building in logistics or fintech comes close to that return on effort. I keep circling back to this.",
    tag: "Education",
    tagColor: "#ec4899",
  },
  {
    id: "t4",
    text: "Solo founding is sustainable if you treat it as a craft rather than a grind. The grind framing is performative and counterproductive. The craft framing asks: am I getting better? Is what I'm building worth building? Those questions lead somewhere.",
    tag: "Building",
    tagColor: "#10b981",
  },
  {
    id: "t5",
    text: "The best product decisions I've made came from watching actual users try to do the thing — not from interviews, not from surveys, not from analytics. There's something irreplaceable about being in the room when someone is confused by what you thought was obvious.",
    tag: "Product Design",
    tagColor: "#3b82f6",
  },
];

// ─── LEARNING ─────────────────────────────────────────────────────────────────

export const NOW_LEARNING: NowLearn[] = [
  {
    topic: "Real-Time Systems & WebSockets",
    emoji: "🔌",
    why: "Building the live tracking layer for okSumame. Going deep on Socket.IO, Redis pub/sub, and connection state management at scale. The gap between theory and wiring up 14 different courier data formats is wide.",
    depth: "Applied",
    depthColor: "#10b981",
  },
  {
    topic: "Twi (Ghanaian Language)",
    emoji: "🗣️",
    why: "Most of our Ghanaian users speak Twi as their first language. Even basic conversational Twi changes the relationship with the team and shapes how I think about the products. It's slow going.",
    depth: "Beginner",
    depthColor: "#f97316",
  },
  {
    topic: "LLM Fine-Tuning vs. Prompting",
    emoji: "🧠",
    why: "Investigating whether fine-tuning makes sense for Paralel Me's AI writing assistant, versus better system prompt engineering. Currently leaning toward prompts — the gap is smaller than the ML research suggests with good context injection.",
    depth: "Deep Dive",
    depthColor: "#8b5cf6",
  },
];

// ─── LISTENING ────────────────────────────────────────────────────────────────

export const NOW_LISTENING: NowTrack[] = [
  { title: "Afrobeats Deep Work Mix", artist: "Various Artists",  emoji: "🎵", context: "Morning focus blocks" },
  { title: "I Told Them",             artist: "Burna Boy",        emoji: "🎤", context: "Commutes & walks" },
  { title: "Head Hunters",            artist: "Herbie Hancock",   emoji: "🎹", context: "Late-night engineering" },
  { title: "Calm Down",              artist: "Rema",             emoji: "🌙", context: "Winding down" },
];

// ─── WATCHING ─────────────────────────────────────────────────────────────────

export const NOW_WATCHING: NowWatch[] = [
  {
    title: "The Bear (Season 3)",
    format: "Series",
    emoji: "🍽️",
    thought: "Still the best piece of media about what it actually feels like to build something under relentless pressure. Every founder should watch it. The thing they get right that most startup content doesn't: the exhaustion is real.",
    accentColor: "#dc2626",
  },
  {
    title: "Abstract: The Art of Design",
    format: "Documentary",
    emoji: "🎨",
    thought: "Re-watching specific episodes. The Ilse Crawford episode changed how I think about intentionality in product design — the argument that space should serve human wellbeing, not the other way around, applies to software as cleanly as it does to rooms.",
    accentColor: "#7c3aed",
  },
  {
    title: "Bad Monkey",
    format: "Series",
    emoji: "🐒",
    thought: "Genuinely funny. Vince Vaughn is unexpectedly excellent. Good Friday-evening watching when the brain is full.",
    accentColor: "#d97706",
  },
];

// ─── NEXT ─────────────────────────────────────────────────────────────────────

export const NOW_NEXT: NowNextItem[] = [
  {
    icon: "✈️",
    horizon: "April 2026",
    horizonColor: "#3b82f6",
    text: "Accra for a week of user research, okSumame courier partner meetings, and team catch-ups. Two investor introduction calls while I'm there — nothing formal, but worth exploring.",
  },
  {
    icon: "🚀",
    horizon: "Q3 2026",
    horizonColor: "#6366f1",
    text: "okSumame public beta. Courier integrations nearly complete. The merchant dashboard UX needs one more round of iteration and a proper closed alpha with 20 real merchants first.",
  },
  {
    icon: "⚡",
    horizon: "Q2 2026",
    horizonColor: "#8b5cf6",
    text: "Paralel Me public launch from beta. Hardest decision: pricing. The freemium model feels structurally right but the conversion threshold needs more thought. Running experiments over the next 6 weeks.",
  },
  {
    icon: "📝",
    horizon: "This month",
    horizonColor: "#f59e0b",
    text: "Long-form essay on trust dynamics in West African e-commerce. It's been sitting in my notes for months. Most important thing I know that hasn't been written clearly anywhere. Making time.",
  },
];

// ─── ARCHIVE ──────────────────────────────────────────────────────────────────

export const NOW_ARCHIVE: NowArchiveEntry[] = [
  { version: "v8", label: "January 2026",   date: "2026-01-08", location: "London", summary: "Paralel Me beta launched. Deep in AI productivity research. Thinking seriously about African education tech for the first time." },
  { version: "v7", label: "November 2025",  date: "2025-11-03", location: "Accra",  summary: "okSika beta with first 1,000 users. Working through okSumame architecture. Reading Mazzucato." },
  { version: "v6", label: "September 2025", date: "2025-09-01", location: "London", summary: "oKadwuma v2 launched after summer of rebuilding. Hiring two engineers for Okpah. Writing more consistently." },
  { version: "v5", label: "June 2025",      date: "2025-06-15", location: "Accra",  summary: "oKadwuma hit 5,000 users. Starting to think about okSika seriously. Hot season. Reading fintech case studies." },
  { version: "v4", label: "March 2025",     date: "2025-03-10", location: "London", summary: "Focused on iPahaStore v4. Planning the AI product optimiser. Re-reading Zero to One for the second time." },
  { version: "v3", label: "November 2024",  date: "2024-11-01", location: "Accra",  summary: "First extended period in Ghana. Listening to users for oKadwuma and okDdwa. Understanding the market by being in it." },
];