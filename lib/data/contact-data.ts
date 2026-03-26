// =============================================================================
// isaacpaha.com — Contact Page Data
// =============================================================================

export interface ContactType {
  id: string;
  emoji: string;
  label: string;
  description: string;
  color: string;
  responseTime: string;
  placeholder: string;
  // Extra fields shown for this type
  extraFields: { id: string; label: string; placeholder: string; type: "text" | "url" | "textarea" }[];
}

export interface ContactChannel {
  id: string;
  label: string;
  handle: string;
  href: string;
  description: string;
  icon: string;
  color: string;
  preferred: boolean;
}

export interface ContactFAQ {
  q: string;
  a: string;
}

// ─── CONTACT TYPES ────────────────────────────────────────────────────────────

export const CONTACT_TYPES: ContactType[] = [
  {
    id: "collaboration",
    emoji: "🤝",
    label: "Collaboration",
    description: "Working together on something — product, writing, research, or a joint venture.",
    color: "#f59e0b",
    responseTime: "48 hours",
    placeholder: "What are you building? What would the collaboration look like? The more specific, the better.",
    extraFields: [
      {
        id: "project",
        label: "What's the project?",
        placeholder: "A brief description of what you're working on",
        type: "text",
      },
      {
        id: "url",
        label: "Project URL (if any)",
        placeholder: "https://...",
        type: "url",
      },
    ],
  },
  {
    id: "consulting",
    emoji: "💼",
    label: "Consulting",
    description: "Paid engagements — strategy, product, technology, or African market advice.",
    color: "#10b981",
    responseTime: "24 hours",
    placeholder: "What problem are you trying to solve? What does success look like? What's the timeline?",
    extraFields: [
      {
        id: "company",
        label: "Company / Organisation",
        placeholder: "Where are you based?",
        type: "text",
      },
      {
        id: "budget",
        label: "Budget range (optional)",
        placeholder: "Rough range helps set expectations",
        type: "text",
      },
    ],
  },
  {
    id: "speaking",
    emoji: "🎙️",
    label: "Speaking",
    description: "Conference talks, podcast appearances, panels, or recorded interviews.",
    color: "#8b5cf6",
    responseTime: "72 hours",
    placeholder: "Tell me about the event, the audience, the format, and the topic you have in mind.",
    extraFields: [
      {
        id: "event",
        label: "Event name",
        placeholder: "What's the event or show?",
        type: "text",
      },
      {
        id: "date",
        label: "Date / Timeframe",
        placeholder: "When is it?",
        type: "text",
      },
    ],
  },
  {
    id: "hello",
    emoji: "👋",
    label: "Just saying hi",
    description: "Sharing a thought, a reaction to something I wrote, or something you think I'd find interesting.",
    color: "#3b82f6",
    responseTime: "When I can",
    placeholder: "Whatever's on your mind. No structure required.",
    extraFields: [],
  },
];

// ─── CHANNELS ─────────────────────────────────────────────────────────────────

export const CONTACT_CHANNELS: ContactChannel[] = [
  {
    id: "email",
    label: "Email",
    handle: "pahaisaac@gmail.com",
    href: "mailto:pahaisaac@gmail.com",
    description: "Best for anything that needs detail or context.",
    icon: "✉️",
    color: "#f59e0b",
    preferred: true,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    handle: "isaac-paha-578911a9",
    href: "https://www.linkedin.com/in/isaac-paha-578911a9/",
    description: "Professional introductions and business conversations.",
    icon: "💼",
    color: "#0077b5",
    preferred: false,
  },
  {
    id: "twitter",
    label: "X / Twitter",
    handle: "@iPaha3",
    href: "https://twitter.com/iPaha3",
    description: "Quick reactions, ideas in progress, public thinking.",
    icon: "𝕏",
    color: "#fff",
    preferred: false,
  },
  {
    id: "github",
    label: "GitHub",
    handle: "iPaha1",
    href: "https://github.com/iPaha1",
    description: "Open source, code reviews, or technical contributions.",
    icon: "⌥",
    color: "#e5e7eb",
    preferred: false,
  },
];

// ─── AVAILABILITY ──────────────────────────────────────────────────────────────

export const AVAILABILITY = {
  status: "open" as "open" | "limited" | "closed",
  statusLabel: "Open to conversations",
  statusDescription: "Currently accepting new consulting inquiries and collaboration conversations.",
  timezone: "Europe/London",
  timezoneLabel: "London, UK",
  workingHours: "09:00 – 18:00 GMT",
};

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export const CONTACT_FAQS: ContactFAQ[] = [
  {
    q: "What's the best way to reach you?",
    a: "Email. It's the only channel where I can give a thoughtful reply. Social DMs are fine for quick things, but anything that needs context or back-and-forth should go to email.",
  },
  {
    q: "How quickly do you respond?",
    a: "Consulting and collaboration enquiries within 24–48 hours, usually. Speaking and media in 72 hours. 'Just saying hi' — whenever I can, honestly. I read everything.",
  },
  {
    q: "Do you take on freelance / consulting work?",
    a: "Selectively. I'm particularly interested in problems at the intersection of technology and African markets, AI product strategy, and early-stage product thinking. If it sounds like that, reach out.",
  },
  {
    q: "Can I pick your brain for free?",
    a: "I'm happy to have quick email exchanges on things I find interesting. If you're asking for something that would take more than 30 minutes of thinking, that's consulting and I charge for it. The form above is the right starting point.",
  },
  {
    q: "Are you available to speak at events?",
    a: "Yes, selectively. I prefer events where the audience builds things. Topics I speak well on: building in Africa, AI product development, the realities of solo founding, and technology as a force for economic inclusion.",
  },
];

// ─── WHAT I WON'T RESPOND TO ──────────────────────────────────────────────────

export const NO_GO_LIST = [
  "Mass-produced cold outreach with my name pasted in",
  "Requests to review or invest in unrelated projects with no prior relationship",
  "SEO link building requests",
  "Crypto / NFT / MLM opportunities",
  "'Quick 15-minute call' requests with no stated purpose",
  "Guest posts that are obviously AI-generated",
];