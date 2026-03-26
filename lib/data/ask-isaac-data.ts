// =============================================================================
// isaacpaha.com — Ask Isaac Data
// =============================================================================

export type TopicId =
  | "all"
  | "startups"
  | "africa"
  | "technology"
  | "career"
  | "ai"
  | "life"
  | "education"
  | "building";

export interface Topic {
  id: TopicId;
  label: string;
  icon: string;
  color: string;
}

export interface SuggestedQuestion {
  id: string;
  text: string;
  topic: TopicId;
  difficulty: "quick" | "deep";
}

export interface PopularQuestion {
  text: string;
  asks: number;
  topic: TopicId;
}

export const TOPICS: Topic[] = [
  { id: "all",        label: "Everything",   icon: "✦",  color: "#f59e0b" },
  { id: "startups",   label: "Startups",     icon: "🚀",  color: "#10b981" },
  { id: "africa",     label: "Africa",       icon: "🌍",  color: "#f97316" },
  { id: "technology", label: "Technology",   icon: "💻",  color: "#3b82f6" },
  { id: "career",     label: "Career",       icon: "🎯",  color: "#8b5cf6" },
  { id: "ai",         label: "AI",           icon: "🤖",  color: "#ec4899" },
  { id: "life",       label: "Life",         icon: "✨",  color: "#14b8a6" },
  { id: "education",  label: "Education",    icon: "📚",  color: "#6366f1" },
  { id: "building",   label: "Building",     icon: "🏗️",  color: "#f59e0b" },
];

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  // Startups
  { id: "sq1",  text: "What's the most important lesson you've learned from building Okpah?",                            topic: "startups",   difficulty: "deep"  },
  { id: "sq2",  text: "How do you validate a startup idea before writing a single line of code?",                        topic: "startups",   difficulty: "quick" },
  { id: "sq3",  text: "What should a first-time founder prioritise in their first 90 days?",                             topic: "startups",   difficulty: "deep"  },
  { id: "sq4",  text: "When should a solo founder consider raising their first round?",                                  topic: "startups",   difficulty: "quick" },
  // Africa
  { id: "sq5",  text: "Why do you believe Africa will produce the next great technology companies?",                      topic: "africa",     difficulty: "deep"  },
  { id: "sq6",  text: "What are the biggest misconceptions Westerners have about African tech markets?",                 topic: "africa",     difficulty: "deep"  },
  { id: "sq7",  text: "What makes building for Ghana different from building for the UK?",                               topic: "africa",     difficulty: "quick" },
  { id: "sq8",  text: "How do you approach product-market fit in an emerging market?",                                   topic: "africa",     difficulty: "quick" },
  // Technology
  { id: "sq9",  text: "What does your current tech stack look like and why did you choose it?",                          topic: "technology", difficulty: "quick" },
  { id: "sq10", text: "How do you think about technical debt when you're building fast?",                                topic: "technology", difficulty: "quick" },
  { id: "sq11", text: "What's your approach to building software that works on slow internet connections?",              topic: "technology", difficulty: "deep"  },
  // Career
  { id: "sq12", text: "What advice would you give to someone starting their first job in tech?",                         topic: "career",     difficulty: "quick" },
  { id: "sq13", text: "How has your Open University degree shaped how you think?",                                       topic: "career",     difficulty: "deep"  },
  { id: "sq14", text: "What's the career path you'd recommend for someone who wants to eventually found a company?",     topic: "career",     difficulty: "deep"  },
  // AI
  { id: "sq15", text: "How are you using AI in your products right now?",                                                topic: "ai",         difficulty: "quick" },
  { id: "sq16", text: "What do you think people are getting wrong about AI and employment?",                             topic: "ai",         difficulty: "deep"  },
  { id: "sq17", text: "How do you think about AI's role in emerging markets specifically?",                              topic: "ai",         difficulty: "deep"  },
  // Life
  { id: "sq18", text: "How do you stay focused when you're building multiple things at once?",                           topic: "life",       difficulty: "quick" },
  { id: "sq19", text: "What does your weekly routine look like as a founder?",                                           topic: "life",       difficulty: "quick" },
  { id: "sq20", text: "What book has most changed how you think in the last year?",                                      topic: "life",       difficulty: "quick" },
  // Building
  { id: "sq21", text: "Walk me through how you go from an idea to a shipped product.",                                   topic: "building",   difficulty: "deep"  },
  { id: "sq22", text: "What does your product development process look like day-to-day?",                                topic: "building",   difficulty: "quick" },
  { id: "sq23", text: "How do you make decisions when you have limited time and resources?",                             topic: "building",   difficulty: "quick" },
  // Education
  { id: "sq24", text: "What's the most valuable thing you learned studying Computing at the Open University?",           topic: "education",  difficulty: "quick" },
  { id: "sq25", text: "How do you keep learning when you're busy building companies?",                                   topic: "education",  difficulty: "quick" },
];

export const POPULAR_QUESTIONS: PopularQuestion[] = [
  { text: "What's the biggest lesson from building Okpah?",           asks: 342,  topic: "startups"  },
  { text: "Why Africa for tech?",                                      asks: 287,  topic: "africa"    },
  { text: "How do you validate startup ideas?",                       asks: 241,  topic: "startups"  },
  { text: "How are you using AI in your products?",                   asks: 198,  topic: "ai"        },
  { text: "Your morning routine as a founder?",                       asks: 176,  topic: "life"      },
  { text: "How to get a first job in tech?",                          asks: 154,  topic: "career"    },
  { text: "Mobile Money vs traditional banking in Ghana?",            asks: 143,  topic: "africa"    },
  { text: "Best book you've read this year?",                         asks: 128,  topic: "life"      },
];

// Isaac's persona / knowledge base injected as system prompt
export const ISAAC_SYSTEM_PROMPT = `You are Isaac Paha — a First-Class Computing & IT graduate from The Open University, and the founder of three technology companies: iPaha Ltd (UK), iPahaStores Ltd (UK), and Okpah Ltd (Ghana).

## Your Companies & Products
- **Okpah Ltd** (okpah.com, Ghana): Building technology for West Africa
  - oKadwuma: Jobs platform for Ghana/West Africa — 8,500+ users, 2,400+ listings, 890+ placements
  - okDdwa: E-commerce with Mobile Money payments — 640+ stores, ₵280k+ monthly GMV
  - okSika: Fintech/savings/micro-lending for the underbanked — 3,400+ beta users
  - okSumame: Last-mile delivery aggregation (in development, 14 courier partners)
  - okEdukation: Schools platform for Ghana (coming soon, 200+ schools waitlisted)
- **iPaha Ltd** (ipahait.com, UK): AI and SaaS products
  - Paralel Me: AI productivity assistant — 1,200+ beta users, 4.8/5 rating
- **iPahaStores Ltd** (ipahastore.com, UK): E-commerce marketplace
  - iPahaStore Platform: Multi-vendor marketplace — 340+ vendors, £180k+ monthly GMV

## Your Voice & Personality
- Direct, honest, intellectually curious. No fluff.
- You speak from lived experience — everything you say about startups and Africa is grounded in what you've actually built and seen.
- You're optimistic about Africa's tech future but clear-eyed about the challenges.
- You believe in building things that solve real problems in underserved markets.
- You value depth over breadth. You read slowly and think carefully.
- You're comfortable with ambiguity and uncertainty — it's part of the job.
- You have a dry sense of humour. You don't take yourself too seriously.
- You're encouraging but honest — you'll tell people what they need to hear, not just what they want to hear.

## Your Strong Views
- Africa will produce the next great technology companies within 15 years.
- The leapfrog pattern (mobile money, etc.) will repeat in fintech, education, and logistics.
- Most productivity advice is performative. Real productivity is about protecting your deep work time.
- Slow reading beats fast skimming for knowledge retention.
- The best career advice is to find problems worth solving, not companies worth joining.
- Open University was as good or better than traditional university for the skills that matter in tech.
- Building for emerging markets requires completely rethinking assumptions from the ground up.
- AI will not take your job but someone using AI effectively will outcompete you if you don't adapt.

## Your Background
- First-Class Computing & IT degree, The Open University
- Based between UK and Ghana
- Started building in 2019
- Solo founder turned multi-company builder
- Deep interest in: African development, education technology, financial inclusion, AI productivity

## How to Respond
- Speak in first person as Isaac. Be warm but not sycophantic.
- Give concrete, specific answers drawn from your actual experience.
- If asked about something you don't know, say so honestly.
- Keep answers focused. Long when depth is needed, short when a direct answer suffices.
- Occasionally refer visitors to relevant blog posts, apps, or your ideas lab for deeper reading.
- Don't use bullet points for everything — sometimes a well-constructed paragraph is better.
- Maximum response length: ~400 words unless the question genuinely demands more depth.
- End with a follow-up question or invitation to go deeper only when it feels natural, not formulaic.`;