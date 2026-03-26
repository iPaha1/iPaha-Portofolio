// =============================================================================
// isaacpaha.com — Blog Data
// =============================================================================

export type BlogCategory =
  | "Technology"
  | "Business"
  | "Ideas Lab"
  | "Society"
  | "Life"
  | "Education"
  | "Africa"
  | "AI";

export type PostStatus = "PUBLISHED" | "DRAFT" | "ARCHIVED";

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string; // Full markdown-like content
  category: BlogCategory;
  status: PostStatus;
  tags: string[];
  coverColor: string; // gradient/accent color
  coverEmoji: string;
  publishedAt: string;
  updatedAt?: string;
  readingTime: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isFeatured?: boolean;
  isEditorsPick?: boolean;
  seriesName?: string;
  seriesPart?: number;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    slug: "why-africa-will-lead-the-next-tech-revolution",
    title: "Why Africa Will Lead the Next Technology Revolution",
    excerpt:
      "The continent that built mobile money, skipped landlines, and is growing faster than anywhere else on earth is positioned to define the next chapter of global technology — if we let it.",
    content: `Africa is not the future. Africa is the present.

While Silicon Valley debates which billion-dollar company will become the next trillion-dollar one, something more fundamental is happening on the African continent: a civilisational upgrade in real time.

## The Leapfrog Pattern Is Not New

In the 2000s, Africa skipped landline infrastructure entirely. While Europe and America spent decades building copper wire networks into homes, African nations went straight to mobile. The result? M-Pesa launched in Kenya in 2007 and within five years became the most sophisticated mobile payment network on earth — handling more transactions than Western Union globally.

This pattern — leapfrogging legacy infrastructure — is not an accident. It is the structural advantage of late development. When you have no legacy systems to protect, you are free to adopt the best available technology.

## The Numbers That Should Stop You in Your Tracks

Here is what the data says about where growth is happening:

Africa has **1.4 billion people**, of which more than **600 million are under 25**. The median age on the continent is 19. Compare that with Europe (44) or Japan (48). This is not a demographic statistic — it is a signal about who will be building the future.

By 2050, **1 in 4 people on earth will be African**. By that point, Africa's working-age population will be larger than China and India combined.

And crucially: **smartphone penetration is accelerating**, mobile data costs are collapsing, and a generation of developers, designers, and founders is emerging who have grown up digital-native in environments where problems are acute and resources are scarce — the perfect conditions for innovation.

## What This Looks Like in Practice

The venture ecosystem is responding. African startups raised **$5.4 billion in 2021**, up from $1.4 billion in 2019. Flutterwave, Paystack, Andela, Chipper Cash — these are not charity projects. They are companies solving hard problems at scale.

But the more interesting story is what comes next. The fintech layer is being built. Payment rails, digital identity, mobile banking — the infrastructure exists or is rapidly being constructed. What gets built on top of that infrastructure over the next decade is where the real value is.

## The Risk

The risk is not that African technology fails. The risk is that it succeeds but the value is extracted elsewhere — by venture funds that take the returns offshore, by platforms that use African data without reinvesting, by regulation that stifles local development in favour of incumbent Western firms.

The question for African founders, policymakers, and investors is: how do we build in a way that keeps value local?

## What I Think Happens

I think Africa produces the world's next great technology companies within the next fifteen years. I think the $100 billion African tech company exists — it just hasn't been built yet. And I think the founders who build it are alive right now, probably learning to code on a smartphone with intermittent internet.

That is not optimism. That is pattern recognition.`,
    category: "Africa",
    status: "PUBLISHED",
    tags: ["Africa", "Technology", "Startups", "Future"],
    coverColor: "#f59e0b",
    coverEmoji: "🌍",
    publishedAt: "2026-03-01",
    readingTime: 8,
    viewCount: 12400,
    likeCount: 892,
    commentCount: 134,
    isFeatured: true,
    isEditorsPick: false,
  },
  {
    id: "2",
    slug: "the-honest-truth-about-building-a-startup-alone",
    title: "The Honest Truth About Building a Startup Alone",
    excerpt:
      "Everyone talks about the glamour of solo founding. Nobody talks about the 3am panic attacks, the imposter syndrome, or what it does to your social life.",
    content: `I have been building alone for five years. Here is what nobody tells you.

## The Silence Is the Hardest Part

The romanticised version of solo founding involves late nights, brilliant insights, and a dramatic product launch that changes everything. The reality involves a lot of silence.

No one to bounce ideas off. No one to tell you that your homepage copy is bad. No one to notice when you are not okay. The loneliness of solo founding is not a minor inconvenience — it is a genuine psychological challenge that founders rarely talk about honestly.

## The Decision Fatigue Is Real

As a solo founder, every decision is yours. Should we pivot? Should we raise? Should we fire this contractor? Should we change the pricing model? There is no one to share the cognitive load with. Over time, this accumulates into a kind of decision fatigue that affects your judgment in ways that are hard to detect from the inside.

The best thing I ever did was establish a small advisory group — three people I trusted who I could run decisions by. Not a board. Not formal advisors. Just smart people who had my best interests at heart and would tell me the truth.

## What You Learn That You Can't Learn Any Other Way

Here is the thing though: building alone teaches you things that are impossible to learn in any other context.

You learn to do everything. Not well — but enough. You learn to make peace with imperfection. You learn to prioritise brutally, because there is no one else to pick up the slack. You develop a tolerance for ambiguity that becomes one of your greatest professional assets.

And you learn yourself. Who you are under pressure. What you actually value. Where your limits are.

## My Honest Advice

If you are considering going solo: do it. But do it with clear eyes.

Build in public. Find a community. Get a therapist. Schedule social time like you would a product meeting. And remember that the goal is not to suffer — it is to build something that matters.

The best version of solo founding is not heroic isolation. It is disciplined, supported, self-aware work.`,
    category: "Business",
    status: "PUBLISHED",
    tags: ["Startups", "Solo Founder", "Mental Health", "Entrepreneurship"],
    coverColor: "#10b981",
    coverEmoji: "🏗️",
    publishedAt: "2026-02-20",
    readingTime: 6,
    viewCount: 9800,
    likeCount: 1240,
    commentCount: 213,
    isEditorsPick: true,
  },
  {
    id: "3",
    slug: "ai-is-not-going-to-take-your-job-but",
    title: "AI Is Not Going to Take Your Job. But.",
    excerpt:
      "The nuanced truth about AI and employment that gets lost between the techno-optimists and the doomsayers.",
    content: `Let me tell you the thing no one in the AI debate says clearly.

## The Statement Everyone Gets Wrong

"AI will take your job." "AI won't take your job — it will change it." Both of these framings miss the point.

The truth is more specific and more useful: **AI will take the tasks within your job that can be codified**. The tasks that remain — the ones that require judgment, creativity, empathy, or domain expertise applied to genuinely novel situations — will not only survive but become more valuable.

## What Actually Gets Automated

Think about any knowledge work role. The tasks within that role fall into a spectrum. At one end: information retrieval, formatting, summarisation, first-draft generation, data entry. At the other end: strategic judgment, client relationship management, creative direction, novel problem solving.

The first category is already being automated. The second category is not — and will not be for longer than people realise.

The mistake is thinking about jobs as monoliths. "Will AI replace lawyers?" is the wrong question. "Which parts of legal work will AI handle, and what does that mean for how lawyers spend their time?" is the right one.

## The But

Here is the "but" in the title.

While AI will not take your job in the apocalyptic sense, it will absolutely reshape how competitive you are within your profession. The lawyer who knows how to use AI to accelerate research and draft work will outcompete the one who does not. The software engineer who can direct AI agents effectively will achieve more than the one writing every line manually.

The risk is not replacement. The risk is irrelevance through non-adaptation.

## What To Do About It

Learn the tools in your field. Not performatively — actually learn them. Experiment with what gets handed off to AI and what stays with you. Develop the judgment about where AI output is trustworthy and where it is not.

The people who will thrive in the AI transition are not the ones most worried about it. They are the ones treating it as the productivity amplifier it actually is.`,
    category: "AI",
    status: "PUBLISHED",
    tags: ["AI", "Future of Work", "Technology", "Career"],
    coverColor: "#8b5cf6",
    coverEmoji: "🤖",
    publishedAt: "2026-02-10",
    readingTime: 7,
    viewCount: 18600,
    likeCount: 2100,
    commentCount: 342,
    isEditorsPick: false,
  },
  {
    id: "4",
    slug: "what-computing-taught-me-about-thinking",
    title: "What Studying Computing Taught Me About Thinking",
    excerpt:
      "A First-Class Computing degree is not really about computers. It is about logic, abstraction, and the discipline of solving problems you have never seen before.",
    content: `I studied Computing and IT at The Open University. I finished with a First. And the most important thing I learned had nothing to do with code.

## Abstraction Is a Superpower

The central skill of computing is abstraction — the ability to take a complex, messy reality and model it at the right level of simplicity to reason about it. A good data structure is not just a technical construct; it is an argument about what matters in a system and what can be safely ignored.

I use this constantly outside of software. When I am thinking through a business problem, I find myself asking: what is the simplest model that captures the essential dynamics here? What can I safely abstract away?

## Algorithms Are Just Recipes for Thinking

An algorithm is a precise, finite, unambiguous set of instructions for solving a class of problem. The discipline of writing algorithms — truly precise, edge-case-considered, failure-mode-anticipated — trained me to think about problems in a way I never had before.

Now when I approach any complex situation, I find myself decomposing it. What is the input? What is the desired output? What are the steps? Where can this fail? What are the edge cases?

This is not a computer science thing. It is a clear thinking thing.

## What I Wish I Had Known

The Open University route is not the traditional path, and when I started, I had doubts. Was this real? Would employers respect it?

The answer is yes — unambiguously. But more than that: the self-directed nature of distance learning taught me something that campus students often miss. No one is going to make you learn. Learning is a choice you make every day.

That lesson turned out to be more valuable than anything in the curriculum.`,
    category: "Education",
    status: "PUBLISHED",
    tags: ["Computing", "Education", "Learning", "Open University"],
    coverColor: "#3b82f6",
    coverEmoji: "💻",
    publishedAt: "2026-01-28",
    readingTime: 6,
    viewCount: 5400,
    likeCount: 687,
    commentCount: 89,
  },
  {
    id: "5",
    slug: "building-okpah-what-i-learned",
    title: "Building Okpah: What Two Years Taught Me",
    excerpt:
      "A transparent look at the wins, failures, pivots, and lessons from two years building a technology company focused on Ghana and West Africa.",
    content: `Okpah Ltd is two years old. Here is what I know now that I wish I had known then.

## The Market Is the Teacher

The most important thing I learned about building for the Ghanaian market specifically — and African markets broadly — is that your assumptions are almost certainly wrong. Not because you are bad at research, but because context is everything, and context is only available from the ground.

The ways people use mobile money in Ghana are not the same as the ways they use mobile money in Kenya. The trust dynamics are different. The competitive landscape is different. The regulatory environment is different. You cannot pattern-match from M-Pesa to everything else.

## What Worked

Listening more than talking. Building in public — Ghanaian tech Twitter is small but highly engaged, and being transparent about what we were building created early advocates who became early users.

Also: not raising too early. We stayed lean, which forced us to be creative and meant we were not beholden to investors whose incentives were not perfectly aligned with ours.

## What Did Not Work

Moving too slowly on partnerships. In markets where trust is built through relationships, the time you invest in partnerships — with telcos, with existing businesses, with community institutions — pays compounding returns. I underestimated this.

Also: hiring before I had clear enough processes. When you hire people into ambiguity without strong systems, you waste their potential and your time.

## Where We Are Going

Okpah is now focused on oKadwuma — a jobs platform for the West African market. The problem we are solving: connecting skilled workers with employers in an environment where most hiring still happens through personal networks and informal word-of-mouth.

The opportunity is significant. The challenge is trust and behaviour change. Both are solvable.`,
    category: "Business",
    status: "PUBLISHED",
    tags: ["Okpah", "Ghana", "Startups", "Africa", "Building in Public"],
    coverColor: "#f97316",
    coverEmoji: "🚀",
    publishedAt: "2026-01-15",
    readingTime: 8,
    viewCount: 7200,
    likeCount: 934,
    commentCount: 156,
    seriesName: "Building Okpah",
    seriesPart: 1,
  },
  {
    id: "6",
    slug: "the-case-for-slow-reading",
    title: "The Case for Slow Reading in a Fast World",
    excerpt:
      "In a world optimised for content consumption, the most countercultural thing you can do is read slowly, deeply, and with attention.",
    content: `I read about forty books a year. Not because I am fast — because I am slow.

## What We Lost When We Optimised for Speed

The culture of speed-reading, 2x podcast listening, and tweet-sized summaries represents a particular theory of knowledge: that information is the product, and more information means more knowledge.

This theory is wrong.

Knowledge — real, usable, integrated knowledge — requires time. It requires sitting with an idea long enough to notice where it conflicts with what you already believe. It requires the cognitive work of synthesis: taking two ideas and producing a third that is not in either source.

You cannot do that at 2x speed. You cannot do it by skimming. The friction is the point.

## What Slow Reading Actually Looks Like

Slow reading is not about reading few words per minute. It is about reading with intention. It means:

Finishing a chapter and sitting with it before starting the next. Writing in the margins (or in a notebook). Asking yourself: what does this change about how I see the world? Following the references — reading the books that the book cites.

It means treating a text as a conversation, not a broadcast.

## The ROI of Deep Reading

Here is the practical case, if you need one.

The person who has deeply read twenty books on a subject understands it differently from the person who has skimmed two hundred. Depth beats breadth in almost every domain where judgment is required. Surface familiarity with many things is the intellectual equivalent of being a mile wide and an inch deep.

The ideas that stay with you, that change how you think, that show up in your work years later — they come from the slow reads.`,
    category: "Life",
    status: "PUBLISHED",
    tags: ["Reading", "Knowledge", "Learning", "Life"],
    coverColor: "#ec4899",
    coverEmoji: "📚",
    publishedAt: "2025-12-20",
    readingTime: 5,
    viewCount: 4100,
    likeCount: 512,
    commentCount: 67,
  },
  {
    id: "7",
    slug: "open-source-has-a-sustainability-problem",
    title: "Open Source Has a Sustainability Problem and We Are All Responsible",
    excerpt:
      "The infrastructure of the modern internet runs on open-source software maintained by unpaid volunteers. This is both remarkable and unsustainable.",
    content: `Left-pad. Log4j. XZ Utils. Each of these incidents revealed the same uncomfortable truth about the modern software ecosystem.

## The Foundation Is Fragile

The software stack that powers the global internet — the frameworks, the utilities, the cryptographic libraries, the package managers — runs substantially on code written by volunteers who receive nothing for their work.

This is extraordinary. It is also a systemic risk.

When a single developer maintaining a critical package in their spare time burns out, makes a mistake, or gets compromised, the consequences ripple across millions of applications. The XZ Utils backdoor in 2024 came perilously close to compromising SSH authentication on a significant fraction of Linux servers globally.

## Why This Happens

The economic model of open source is broken in a specific way: the value created is enormous and diffuse; the costs are concentrated and private.

A startup uses an open-source library. The library saves the startup hundreds of engineering hours. The startup grows. The startup goes public. The maintainer of the library continues to work evenings and weekends for free.

The startup is not being malicious. They are being rational within a broken system.

## What Good Looks Like

GitHub Sponsors, Open Collective, and similar mechanisms represent early attempts at fixing this. Some companies — notably Tidelift and FOSSA — have built businesses around funding open-source sustainability.

But the real fix requires the largest consumers of open source — the big tech companies — to treat open-source funding as infrastructure investment rather than charity.

Some do. Most do not.

## What You Can Do

If your company uses open-source software — and it does — advocate for an open-source sustainability budget. Find the projects you depend on and fund them. The cost is trivial relative to the risk you are mitigating.`,
    category: "Technology",
    status: "PUBLISHED",
    tags: ["Open Source", "Software", "Technology", "Sustainability"],
    coverColor: "#14b8a6",
    coverEmoji: "🔓",
    publishedAt: "2025-12-05",
    readingTime: 7,
    viewCount: 8900,
    likeCount: 1100,
    commentCount: 198,
    isEditorsPick: true,
  },
  {
    id: "8",
    slug: "how-to-think-about-your-career-in-tech",
    title: "How to Think About Your Career in Tech (A Framework)",
    excerpt:
      "The conventional career ladder in tech is increasingly irrelevant. Here is a better way to think about building a career that is both successful and meaningful.",
    content: `The conventional tech career advice — get a computer science degree, join a big company, climb the ladder, accumulate stock options — was never good advice. In 2026, it is actively misleading.

## The Three Types of Tech Career

I think about tech careers in three categories, and most advice conflates them:

**The Craft Career**: You want to become excellent at something specific. You measure success by the quality of your work and your reputation among peers. Progression means mastery.

**The Leverage Career**: You want to build something at scale. You measure success by impact and ownership. Progression means scope.

**The Portfolio Career**: You want to do many things. You measure success by range, flexibility, and the ability to work on what interests you. Progression means optionality.

Most people default to a leverage career because that is what the industry talks about. But many people are actually built for craft or portfolio careers. The mismatch creates a lot of quiet unhappiness.

## The Questions Worth Asking

Before optimising your career, you need to know what you are optimising for. Some questions worth sitting with:

What does success look like to you in ten years — specifically, not abstractly? What are you willing to sacrifice? What are you not willing to sacrifice? What would you do if the financial return were equivalent across options?

The answers to these questions should drive your decisions far more than what is currently prestigious or well-compensated.

## A Note on Learning

The half-life of technical skills is shortening rapidly. The people who will have long, successful tech careers are not those with the deepest expertise in any particular technology — they are the ones who know how to learn quickly and transfer knowledge between domains.

Learning how to learn is the most valuable career investment available.`,
    category: "Education",
    status: "PUBLISHED",
    tags: ["Career", "Technology", "Advice", "Learning"],
    coverColor: "#6366f1",
    coverEmoji: "🎯",
    publishedAt: "2025-11-18",
    readingTime: 8,
    viewCount: 11200,
    likeCount: 1456,
    commentCount: 267,
  },
];

export const BLOG_CATEGORIES: {
  name: BlogCategory;
  icon: string;
  color: string;
  description: string;
}[] = [
  { name: "Technology", icon: "💻", color: "#14b8a6", description: "Software, systems, and the future of tech" },
  { name: "Business", icon: "🚀", color: "#10b981", description: "Startups, strategy, and entrepreneurship" },
  { name: "Ideas Lab", icon: "🧪", color: "#f59e0b", description: "Thought experiments and half-baked theories" },
  { name: "Society", icon: "🌍", color: "#3b82f6", description: "Culture, politics, and how we live together" },
  { name: "Life", icon: "✨", color: "#ec4899", description: "Reflection, habits, and the human experience" },
  { name: "Education", icon: "📚", color: "#8b5cf6", description: "Learning, teaching, and knowledge systems" },
  { name: "Africa", icon: "🌅", color: "#f97316", description: "Technology and development in Africa" },
  { name: "AI", icon: "🤖", color: "#6366f1", description: "Artificial intelligence and its implications" },
];

export const REACTIONS = [
  { emoji: "🔥", label: "Fire" },
  { emoji: "💡", label: "Insightful" },
  { emoji: "❤️", label: "Love" },
  { emoji: "🤔", label: "Thought-provoking" },
  { emoji: "👏", label: "Applause" },
];