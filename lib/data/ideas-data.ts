// =============================================================================
// isaacpaha.com — Ideas Lab Data
// =============================================================================

export type IdeaStatus = "CONCEPT" | "EXPLORING" | "DEVELOPING" | "LAUNCHED" | "SHELVED";
export type IdeaCategory =
  | "AI"
  | "Business"
  | "Society"
  | "Africa"
  | "Fintech"
  | "Education"
  | "Philosophy"
  | "Technology";

export interface Idea {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: IdeaCategory;
  status: IdeaStatus;
  tags: string[];
  isFeatured?: boolean;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readingTime: number;
}

export const IDEAS: Idea[] = [
  {
    id: "1",
    slug: "universal-ai-job-agent",
    title: "A Universal AI Job Agent for Everyone",
    summary:
      "What if your AI agent applied to jobs on your behalf, negotiated salary, and managed your entire career pipeline — autonomously?",
    body: "The job application process is broken. It is repetitive, demoralising, and inefficient for both candidates and employers. An AI agent that understands your skills, preferences, and career goals could handle the entire process end-to-end: discovering relevant opportunities, tailoring applications, scheduling interviews, and even negotiating offers. The technology exists today. What is missing is the will to build it at scale.",
    category: "AI",
    status: "DEVELOPING",
    tags: ["AI Agents", "Future of Work", "Automation", "Career"],
    isFeatured: true,
    publishedAt: "2026-03-01",
    viewCount: 2840,
    likeCount: 312,
    commentCount: 47,
    readingTime: 5,
  },
  {
    id: "2",
    slug: "governments-on-open-source-software",
    title: "What If Governments Ran on Open-Source Software?",
    summary:
      "Transparent governance, zero vendor lock-in, community-audited systems. The case for making public infrastructure truly public.",
    body: "Every taxpayer-funded government system should be open to inspection. The argument is not merely ideological — open-source government software would reduce corruption, enable civic participation, and cut billions in licensing costs. Estonia has shown what digital governance can look like. The question is why the rest of the world has not followed.",
    category: "Society",
    status: "EXPLORING",
    tags: ["Open Source", "Governance", "Democracy", "Tech Policy"],
    publishedAt: "2026-02-18",
    viewCount: 1920,
    likeCount: 228,
    commentCount: 63,
    readingTime: 6,
  },
  {
    id: "3",
    slug: "next-generation-african-fintech",
    title: "The Next Generation of African Fintech",
    summary:
      "Africa's fintech revolution is only in its first chapter. Cross-border payments, micro-lending, and savings infrastructure will reshape a continent.",
    body: "M-Pesa proved that mobile money works at scale in Africa. But we are still scratching the surface. The next wave will be infrastructure: interoperable payment rails, programmable money, and AI-driven credit scoring for the unbanked. The companies that build this layer will be among the most valuable on the continent within a decade.",
    category: "Africa",
    status: "EXPLORING",
    tags: ["Fintech", "Africa", "Payments", "Financial Inclusion"],
    publishedAt: "2026-02-10",
    viewCount: 3100,
    likeCount: 445,
    commentCount: 89,
    readingTime: 7,
  },
  {
    id: "4",
    slug: "ai-will-change-education-forever",
    title: "How AI Will Change Education Forever",
    summary:
      "Personalised learning paths, AI tutors available 24/7, and assessments that measure real understanding. The classroom as we know it is ending.",
    body: "The industrial-era classroom — one teacher, thirty students, a fixed curriculum — is a terrible fit for the diversity of human minds. AI enables something different: a tutor for every student that knows exactly where they struggle, adapts in real time, and never loses patience. The question is not whether this will happen, but whether we will design it equitably.",
    category: "Education",
    status: "CONCEPT",
    tags: ["AI", "EdTech", "Future of Education", "Personalised Learning"],
    publishedAt: "2026-01-28",
    viewCount: 2210,
    likeCount: 287,
    commentCount: 52,
    readingTime: 8,
  },
  {
    id: "5",
    slug: "programmable-money-africa",
    title: "Programmable Money and the Unbanked Billions",
    summary:
      "Smart contracts could deliver conditional cash transfers, savings locks, and micro-insurance to people who have never had a bank account.",
    body: "Over one billion people globally lack access to basic financial services. Programmable money — funds that execute automatically based on conditions — could deliver aid, savings products, and insurance directly to mobile phones. The technology is ready. The challenge is regulatory frameworks and last-mile infrastructure.",
    category: "Fintech",
    status: "CONCEPT",
    tags: ["Smart Contracts", "Financial Inclusion", "Blockchain", "Africa"],
    publishedAt: "2026-01-15",
    viewCount: 1450,
    likeCount: 198,
    commentCount: 34,
    readingTime: 6,
  },
  {
    id: "6",
    slug: "philosophy-of-building-on-the-internet",
    title: "The Philosophy of Building Things on the Internet",
    summary:
      "Every product you ship is a bet on a future that does not yet exist. What does it mean to build with intention in a world of infinite distraction?",
    body: "Building on the internet is a philosophical act. You are asserting that your vision of the world is worth creating. You are betting that the problem you see is real, that your solution will matter, and that people will choose your work over the noise. Most bets lose. But the ones that win change everything. The question every builder must answer is: what am I actually trying to say?",
    category: "Philosophy",
    status: "CONCEPT",
    tags: ["Philosophy", "Entrepreneurship", "Meaning", "Building"],
    publishedAt: "2026-01-05",
    viewCount: 1780,
    likeCount: 321,
    commentCount: 71,
    readingTime: 5,
  },
  {
    id: "7",
    slug: "ai-powered-city-infrastructure",
    title: "AI-Optimised City Infrastructure for African Cities",
    summary:
      "Accra, Lagos, Nairobi — rapidly growing cities with infrastructure deficits. AI can help them leapfrog decades of urban planning mistakes.",
    body: "African cities are growing faster than their infrastructure. But this is also an opportunity. Unlike cities in the West, they are not constrained by legacy systems. AI-optimised traffic management, predictive maintenance for utilities, and data-driven urban planning could allow African cities to build smarter from the start.",
    category: "Africa",
    status: "CONCEPT",
    tags: ["Smart Cities", "AI", "Urban Planning", "Africa"],
    publishedAt: "2025-12-20",
    viewCount: 980,
    likeCount: 143,
    commentCount: 28,
    readingTime: 7,
  },
  {
    id: "8",
    slug: "saas-for-the-global-south",
    title: "SaaS Pricing Models Are Broken for the Global South",
    summary:
      "A $99/month tool is affordable in San Francisco. It is a month's salary in Accra. We need fundamentally different pricing architectures.",
    body: "The software industry has a globalisation problem. Most SaaS products are priced for Western markets and simply unavailable to the billions of people who could benefit from them. Purchasing power parity pricing, community licences, and freemium models designed for emerging markets could unlock an entirely new wave of global productivity.",
    category: "Business",
    status: "EXPLORING",
    tags: ["SaaS", "Global South", "Pricing", "Accessibility"],
    publishedAt: "2025-12-08",
    viewCount: 2340,
    likeCount: 376,
    commentCount: 94,
    readingTime: 6,
  },
  {
    id: "9",
    slug: "decentralised-identity-africa",
    title: "Decentralised Identity for the 1 Billion Without IDs",
    summary:
      "Over a billion people cannot prove who they are. Blockchain-based self-sovereign identity could be the most important application of the technology.",
    body: "Identity is the foundation of participation in modern society. Without it, you cannot open a bank account, access government services, or prove your qualifications. Decentralised identity systems — where individuals own and control their credentials — could give legal identity to the billion people currently excluded. This is not a nice-to-have. It is a human rights imperative.",
    category: "Society",
    status: "DEVELOPING",
    tags: ["Identity", "Blockchain", "Human Rights", "Africa"],
    publishedAt: "2025-11-25",
    viewCount: 1670,
    likeCount: 234,
    commentCount: 41,
    readingTime: 8,
  },
  {
    id: "10",
    slug: "ai-mental-health-companion",
    title: "AI Mental Health Companions — Opportunity or Risk?",
    summary:
      "Millions lack access to mental health support. AI companions could fill the gap — but the ethical questions are enormous.",
    body: "The mental health crisis is global and the shortage of qualified professionals is acute. AI companions trained on therapeutic frameworks could provide immediate, affordable, and stigma-free support. But there are profound risks: dependency, misdiagnosis, and the replacement of genuine human connection. We need to build this carefully, or not at all.",
    category: "AI",
    status: "EXPLORING",
    tags: ["AI", "Mental Health", "Ethics", "Healthcare"],
    publishedAt: "2025-11-10",
    viewCount: 3420,
    likeCount: 521,
    commentCount: 112,
    readingTime: 7,
  },
  {
    id: "11",
    slug: "open-source-african-language-models",
    title: "We Need Open-Source AI Models for African Languages",
    summary:
      "GPT speaks English fluently. It barely speaks Twi, Yoruba, or Amharic. African language models are a matter of cultural survival.",
    body: "AI systems trained primarily on English and European languages will entrench existing power imbalances. African languages represent thousands of distinct ways of understanding the world. If we do not build AI systems that understand and generate these languages, we risk a future where AI is simply inaccessible to the majority of Africans — in their own tongue.",
    category: "Africa",
    status: "CONCEPT",
    tags: ["AI", "African Languages", "Open Source", "Inclusion"],
    publishedAt: "2025-10-28",
    viewCount: 2780,
    likeCount: 489,
    commentCount: 78,
    readingTime: 6,
  },
  {
    id: "12",
    slug: "building-in-public-as-marketing",
    title: "Building in Public Is the Most Underrated Marketing Strategy",
    summary:
      "Transparency about your journey creates deeper trust than any ad campaign. The build-in-public movement is rewriting how companies grow.",
    body: "The most followed founders on the internet are not the ones with the biggest ad budgets. They are the ones sharing their failures, their revenue numbers, their product decisions in real time. Building in public transforms customers into participants. It turns your product development into a story people want to follow. And it costs nothing except honesty.",
    category: "Business",
    status: "LAUNCHED",
    tags: ["Marketing", "Build in Public", "Entrepreneurship", "Community"],
    publishedAt: "2025-10-15",
    viewCount: 4120,
    likeCount: 634,
    commentCount: 143,
    readingTime: 5,
  },
];

export const IDEA_CATEGORIES: { name: IdeaCategory; icon: string; color: string; description: string }[] = [
  { name: "AI", icon: "🤖", color: "#f59e0b", description: "Artificial intelligence, agents, and machine learning" },
  { name: "Business", icon: "🚀", color: "#10b981", description: "Startups, strategy, and entrepreneurship" },
  { name: "Society", icon: "🌍", color: "#3b82f6", description: "Global issues and social systems" },
  { name: "Africa", icon: "🌅", color: "#f97316", description: "Technology and development on the continent" },
  { name: "Fintech", icon: "💳", color: "#8b5cf6", description: "Financial technology and inclusion" },
  { name: "Education", icon: "📚", color: "#ec4899", description: "Learning, teaching, and knowledge" },
  { name: "Philosophy", icon: "💭", color: "#6366f1", description: "Ideas about ideas — meta-thinking" },
  { name: "Technology", icon: "💻", color: "#14b8a6", description: "Software, systems, and infrastructure" },
];

export const STATUS_CONFIG: Record<IdeaStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  CONCEPT: {
    label: "Concept",
    color: "text-gray-400",
    bg: "bg-gray-800/50",
    border: "border-gray-700",
    dot: "bg-gray-500",
  },
  EXPLORING: {
    label: "Exploring",
    color: "text-amber-400",
    bg: "bg-amber-900/20",
    border: "border-amber-700/50",
    dot: "bg-amber-400",
  },
  DEVELOPING: {
    label: "Developing",
    color: "text-blue-400",
    bg: "bg-blue-900/20",
    border: "border-blue-700/50",
    dot: "bg-blue-400 animate-pulse",
  },
  LAUNCHED: {
    label: "Launched",
    color: "text-green-400",
    bg: "bg-green-900/20",
    border: "border-green-700/50",
    dot: "bg-green-400",
  },
  SHELVED: {
    label: "Shelved",
    color: "text-red-400/70",
    bg: "bg-red-900/10",
    border: "border-red-900/30",
    dot: "bg-red-500/50",
  },
};