"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Users,
  Clock,
  ArrowRight,
  Share2,
  Check,
  ChevronRight,
  MessageSquare,
  BookOpen,
  Zap,
  Lock,
  Info,
} from "lucide-react";
import { CVAnalyzerTool } from "./cv-analyzer";
import { StartupIdeaGenerator } from "./startup-ideas-generator";
import { LearningRoadmapGenerator } from "./learning-roadmap";
import { ReadingTimeCalculator } from "./reading-time-calculator";
import { JobApplicationTrackerTool } from "../job-application-tracker/_application-tracker/job-application-tracker";
import { STATUS_CONFIG, Tool, TOOL_CATEGORIES, TOOLS } from "@/lib/data/tools-data";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { StarRating } from "./star-rating";
import { ToolCard } from "./tools-card";



const TOOL_COMPONENTS: Record<string, React.ReactNode> = {
  "cv-analyzer": <CVAnalyzerTool />,
  "startup-idea-generator": <StartupIdeaGenerator />,
  "learning-roadmap": <LearningRoadmapGenerator />,
  "reading-time-calculator": <ReadingTimeCalculator />,
  "job-application-tracker": <JobApplicationTrackerTool />,
  "ai-cover-letter": <CVAnalyzerTool />, // fallback — cover letter uses same base
};

// ─── Fake reviews for UI completeness ─────────────────────────────────────────
const FAKE_REVIEWS = [
  {
    name: "Aisha T.",
    role: "Graduate Job Seeker",
    avatar: "AT",
    rating: 5,
    date: "2 weeks ago",
    body: "This absolutely transformed my CV. Got three interview invitations within a week of making the suggested changes. The keyword gap analysis was eye-opening.",
  },
  {
    name: "James K.",
    role: "Software Engineer",
    avatar: "JK",
    rating: 5,
    date: "1 month ago",
    body: "Clear, specific, actionable feedback. Not vague AI waffle. It told me exactly which sentences to rewrite and why. Landed my current role partly thanks to this.",
  },
  {
    name: "Priya M.",
    role: "Career Changer",
    avatar: "PM",
    rating: 4,
    date: "3 weeks ago",
    body: "Very useful for identifying where my CV was weak. The ATS score was lower than I expected — the recommendations to fix it were spot on. Takes 30 seconds and it's free.",
  },
];

// ─── How it works steps ───────────────────────────────────────────────────────
const HOW_IT_WORKS: Record<string, { step: string; title: string; desc: string }[]> = {
  "cv-analyzer": [
    { step: "01", title: "Paste your CV", desc: "Copy the full text of your CV into the text area. Include all sections — summary, experience, education, and skills." },
    { step: "02", title: "Click Analyse", desc: "The AI reads your CV against proven frameworks: ATS compatibility, language strength, structural clarity, and keyword density." },
    { step: "03", title: "Review your score", desc: "Get an overall score out of 100 plus sub-scores for ATS, language, and structure. See exactly what's pulling you down." },
    { step: "04", title: "Apply the improvements", desc: "Follow the specific rewrite suggestions and keyword recommendations. Re-run as many times as you like — it's free." },
  ],
  "startup-idea-generator": [
    { step: "01", title: "Describe your skills", desc: "Tell the generator what you're good at — programming, design, marketing, a specific industry, years of experience." },
    { step: "02", title: "Add your interests", desc: "What problems do you care about? What sectors excite you? The more specific you are, the better the ideas." },
    { step: "03", title: "Get 3 startup concepts", desc: "Receive three AI-generated startup ideas with market sizing, target customers, competitors, and your unique advantage." },
    { step: "04", title: "Validate with the questions", desc: "Each idea comes with validation questions. Use these to test assumptions before investing time or money." },
  ],
  "learning-roadmap": [
    { step: "01", title: "Name your topic", desc: "Be specific — not just 'programming' but 'React.js for building dashboards'. Specificity produces better roadmaps." },
    { step: "02", title: "Set your level and time", desc: "Choose your current knowledge level and how many hours per week you can commit. The roadmap adapts to your reality." },
    { step: "03", title: "Get your roadmap", desc: "Receive a week-by-week plan with themes, learning goals, resource recommendations, and a milestone for each week." },
    { step: "04", title: "Track your progress", desc: "Tick off goals as you complete them. The progress bar keeps you honest. Regenerate anytime to refresh the plan." },
  ],
  "reading-time-calculator": [
    { step: "01", title: "Paste your content", desc: "Copy any piece of writing — blog post, article, email, essay, or script — into the text area." },
    { step: "02", title: "Results appear instantly", desc: "Reading time (slow, average, fast), word count, sentence count, and speaking time update in real time as you type." },
    { step: "03", title: "Check readability", desc: "See your Flesch Reading Ease score, average sentence length, and vocabulary richness. Understand if your writing is appropriately complex." },
    { step: "04", title: "Edit and re-check", desc: "Make changes directly in the text area and watch all metrics update instantly. No button needed — it's live." },
  ],
};

const DEFAULT_HOW_IT_WORKS = [
  { step: "01", title: "Open the tool", desc: "The tool loads directly on this page with no sign-up or setup required." },
  { step: "02", title: "Enter your input", desc: "Follow the prompts to provide the information the tool needs to work." },
  { step: "03", title: "Get your results", desc: "Results are generated in seconds, tailored to exactly what you entered." },
  { step: "04", title: "Take action", desc: "Use the output to make better decisions, create better work, or move faster." },
];

// ─── Reading progress bar ─────────────────────────────────────────────────────
const ReadingProgress = () => {
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    const update = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
    };
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <div className="fixed top-16 left-0 right-0 z-40 h-0.5 bg-gray-100">
      <motion.div
        className="h-full bg-amber-500"
        style={{ width: `${progress}%` }}
        transition={{ duration: 0 }}
      />
    </div>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────
interface Props {
  tool: Tool;
  related: Tool[];
}

export const ToolDetailClient = ({ tool, related }: Props) => {
  const [copied, setCopied] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<"tool" | "guide" | "reviews">("tool");

  const status = STATUS_CONFIG[tool.status];
  const category = TOOL_CATEGORIES.find((c) => c.name === tool.category);
  const ToolComponent = TOOL_COMPONENTS[tool.slug] ?? null;
  const howItWorks = HOW_IT_WORKS[tool.slug] ?? DEFAULT_HOW_IT_WORKS;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitRating = (r: number) => {
    setUserRating(r);
    setRatingSubmitted(true);
  };

  // Breadcrumb path
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Tools", href: "/tools" },
    { label: tool.name, href: "#" },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ReadingProgress />

      {/* Subtle background grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Accent orb behind hero */}
      <div
        className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.04] pointer-events-none"
        style={{ backgroundColor: tool.accentColor }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20">

        {/* ── Breadcrumbs ────────────────────────── */}
        <motion.nav
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1.5 text-xs text-gray-400 mb-8"
          aria-label="Breadcrumb"
        >
          {breadcrumbs.map((bc, i) => (
            <React.Fragment key={bc.label}>
              {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
              {bc.href === "#" ? (
                <span className="text-gray-600 font-medium truncate max-w-[200px]">
                  {bc.label}
                </span>
              ) : (
                <Link
                  href={bc.href}
                  className="hover:text-gray-700 transition-colors truncate max-w-[120px]"
                >
                  {bc.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </motion.nav>

        {/* ── Hero header ────────────────────────── */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mb-10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Left: title block */}
            <div className="lg:col-span-2">
              <motion.div
                variants={staggerItem}
                className="flex items-center gap-3 mb-5"
              >
                {/* Large icon */}
                <div
                  className="w-16 h-16 rounded-xs border-2 flex items-center justify-center text-4xl shrink-0"
                  style={{
                    backgroundColor: `${tool.accentColor}10`,
                    borderColor: `${tool.accentColor}30`,
                  }}
                >
                  {tool.icon}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {/* Category */}
                    <span
                      className="text-xs font-semibold"
                      style={{ color: category?.color }}
                    >
                      {category?.icon} {tool.category}
                    </span>

                    {/* Status */}
                    <span
                      className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border ${status.bg} ${status.border} ${status.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>

                    {tool.isNew && (
                      <span className="text-[9px] font-black tracking-widest uppercase bg-amber-500 text-white px-2 py-0.5 rounded-xs">
                        NEW
                      </span>
                    )}
                    {tool.isPremium && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-xs">
                        <Lock className="w-3 h-3" /> Premium
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
                    {tool.name}
                  </h1>
                </div>
              </motion.div>

              {/* Tagline */}
              <motion.p
                variants={staggerItem}
                className="text-xl font-medium text-gray-600 mb-4 leading-relaxed"
              >
                {tool.tagline}
              </motion.p>

              {/* Description */}
              <motion.p
                variants={staggerItem}
                className="text-base text-gray-500 leading-relaxed mb-6"
              >
                {tool.description}
              </motion.p>

              {/* Feature pills */}
              <motion.div
                variants={staggerItem}
                className="flex flex-wrap gap-2 mb-6"
              >
                {tool.features.map((f) => (
                  <span
                    key={f}
                    className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xs"
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: tool.accentColor }}
                    />
                    {f}
                  </span>
                ))}
              </motion.div>

              {/* Tags */}
              <motion.div
                variants={staggerItem}
                className="flex flex-wrap gap-1.5"
              >
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-xs"
                  >
                    {tag}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Right: stats card */}
            <motion.div
              variants={staggerItem}
              className="bg-white border border-gray-100 rounded-xs shadow-sm p-5"
            >
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5">
                Tool Stats
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: Users,
                    label: "Total uses",
                    value: tool.usageCount > 0 ? tool.usageCount.toLocaleString() : "—",
                    color: "text-blue-500",
                  },
                  {
                    icon: Star,
                    label: "Rating",
                    value:
                      tool.ratingCount > 0
                        ? `${tool.ratingAvg}/5 (${tool.ratingCount} reviews)`
                        : "No reviews yet",
                    color: "text-amber-500",
                  },
                  {
                    icon: Zap,
                    label: "Speed",
                    value: tool.buildTime ?? "Instant",
                    color: "text-green-500",
                  },
                  {
                    icon: BookOpen,
                    label: "Category",
                    value: tool.category,
                    color: "text-purple-500",
                  },
                  {
                    icon: Lock,
                    label: "Access",
                    value: tool.isPremium ? "Premium" : "Free",
                    color: tool.isPremium ? "text-amber-500" : "text-green-500",
                  },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 text-sm"
                  >
                    <div className="flex items-center gap-2.5 text-gray-500">
                      <Icon className={`w-4 h-4 ${color}`} />
                      {label}
                    </div>
                    <span className="font-semibold text-gray-800 text-right max-w-[140px] truncate">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="mt-5 space-y-2.5">
                <button
                  onClick={() => setActiveTab("tool")}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xs transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: tool.accentColor }}
                >
                  <Zap className="w-4 h-4" />
                  Use this tool
                </button>
                <button
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 border border-gray-200 hover:border-gray-400 py-2.5 rounded-xs transition-all duration-200"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span className="text-green-600">Link copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      Share tool
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Top accent line ──────────────────── */}
        <div
          className="h-px mb-0"
          style={{
            background: `linear-gradient(to right, ${tool.accentColor}, ${tool.accentColor}30, transparent)`,
          }}
        />

        {/* ── Tabs ─────────────────────────────── */}
        <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 mb-8">
          <div className="flex items-center gap-0">
            {(
              [
                { id: "tool", label: "Use the Tool", icon: Zap },
                { id: "guide", label: "How It Works", icon: BookOpen },
                { id: "reviews", label: `Reviews (${tool.ratingCount})`, icon: MessageSquare },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all duration-200 ${
                  activeTab === id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">

            {/* TOOL TAB */}
            {activeTab === "tool" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {ToolComponent ? (
                  <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
                    {/* Tool header */}
                    <div
                      className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
                      style={{ backgroundColor: `${tool.accentColor}06` }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{tool.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {tool.name}
                          </p>
                          <p className="text-xs text-gray-400">{tool.tagline}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Live
                      </div>
                    </div>
                    <div className="p-6 md:p-8">{ToolComponent}</div>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xs p-12 text-center">
                    <div className="text-5xl mb-4">{tool.icon}</div>
                    <p className="text-gray-500 text-lg font-semibold mb-2">
                      Full interactive tool
                    </p>
                    <p className="text-gray-400 text-sm max-w-sm mx-auto">
                      This tool's full interface is available when connected to a live backend.
                    </p>
                  </div>
                )}

                {/* Info callout */}
                <div className="flex items-start gap-3 mt-5 bg-amber-50 border border-amber-100 rounded-xs px-4 py-3.5">
                  <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    This tool is powered by Claude AI. Results are generated in real time and
                    may vary between runs. Always apply your own judgment to AI-generated output.
                    Core usage is free — no account required.
                  </p>
                </div>
              </motion.div>
            )}

            {/* GUIDE TAB */}
            {activeTab === "guide" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-black text-gray-900 mb-2">
                    How to use {tool.name}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Follow these steps to get the best results from this tool.
                  </p>
                </div>

                {/* Steps */}
                <div className="space-y-6">
                  {howItWorks.map((step, i) => (
                    <motion.div
                      key={step.step}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-5"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div
                          className="w-10 h-10 rounded-xs flex items-center justify-center text-sm font-black text-white shrink-0"
                          style={{ backgroundColor: tool.accentColor }}
                        >
                          {step.step}
                        </div>
                        {i < howItWorks.length - 1 && (
                          <div className="w-px flex-1 bg-gray-100 min-h-[40px]" />
                        )}
                      </div>
                      <div className="pb-6">
                        <h3 className="text-base font-bold text-gray-900 mb-1.5">
                          {step.title}
                        </h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Tips */}
                <div className="bg-gray-50 border border-gray-200 rounded-xs p-6">
                  <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-lg">💡</span> Pro tips
                  </h3>
                  <ul className="space-y-2.5">
                    {[
                      "Be as specific as possible in your inputs — vague input produces vague output.",
                      "Run the tool multiple times with different inputs to explore different angles.",
                      "Use the output as a starting point, not a final answer. Your judgment matters.",
                      "Share useful outputs with colleagues — the tool is free for everyone.",
                    ].map((tip, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                        <Check
                          className="w-4 h-4 mt-0.5 shrink-0"
                          style={{ color: tool.accentColor }}
                        />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* FAQ */}
                <div>
                  <h3 className="text-lg font-black text-gray-900 mb-4">FAQ</h3>
                  <div className="space-y-4">
                    {[
                      {
                        q: "Is this tool free to use?",
                        a: "Yes — the core experience is completely free with no account required. Some advanced features may become premium in the future.",
                      },
                      {
                        q: "How accurate are the results?",
                        a: "Results are powered by Claude, one of the most capable AI models available. However, AI is not infallible — always apply your own critical thinking.",
                      },
                      {
                        q: "Is my data stored or used for training?",
                        a: "Your inputs are used only to generate your results in real time. We do not store CV text, personal data, or use your inputs for AI training.",
                      },
                      {
                        q: "Can I use the output commercially?",
                        a: "Yes. You own the output. Use it however you like — for job applications, business plans, learning, or anything else.",
                      },
                    ].map(({ q, a }) => (
                      <div
                        key={q}
                        className="bg-white border border-gray-100 rounded-xs p-5"
                      >
                        <p className="text-sm font-bold text-gray-900 mb-2">{q}</p>
                        <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === "reviews" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Aggregate rating */}
                <div className="bg-white border border-gray-100 rounded-xs p-6 shadow-sm">
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <p className="text-6xl font-black text-gray-900">
                        {tool.ratingAvg > 0 ? tool.ratingAvg.toFixed(1) : "—"}
                      </p>
                      <StarRating rating={tool.ratingAvg} size="md" />
                      <p className="text-xs text-gray-400 mt-1.5">
                        {tool.ratingCount} reviews
                      </p>
                    </div>
                    <div className="flex-1 space-y-2">
                      {[5, 4, 3, 2, 1].map((n) => {
                        const pct =
                          n >= 4
                            ? n === 5
                              ? 72
                              : 18
                            : n === 3
                            ? 7
                            : n === 2
                            ? 2
                            : 1;
                        return (
                          <div key={n} className="flex items-center gap-2.5">
                            <span className="text-xs text-gray-500 w-3">{n}</span>
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.8, delay: 0.1 * (5 - n) }}
                                className="h-full bg-amber-400 rounded-full"
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-6">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Rate this tool */}
                {!ratingSubmitted ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-xs p-5">
                    <p className="text-sm font-bold text-gray-900 mb-3">
                      Rate this tool
                    </p>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          onMouseEnter={() => setHoverRating(n)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => submitRating(n)}
                          className="transition-transform duration-100 hover:scale-110"
                        >
                          <Star
                            className={`w-7 h-7 transition-all duration-100 ${
                              n <= (hoverRating || userRating)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-gray-100 text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                      {hoverRating > 0 && (
                        <span className="text-xs text-amber-700 font-semibold ml-2">
                          {["", "Poor", "Fair", "Good", "Great", "Excellent"][hoverRating]}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xs p-4"
                  >
                    <Check className="w-5 h-5 text-green-500" />
                    <p className="text-sm text-green-800 font-medium">
                      Thanks for your {userRating}-star rating! Your feedback helps improve this tool.
                    </p>
                  </motion.div>
                )}

                {/* Review list */}
                <div className="space-y-4">
                  {FAKE_REVIEWS.map((review) => (
                    <div
                      key={review.name}
                      className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-600">
                            {review.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {review.name}
                            </p>
                            <p className="text-xs text-gray-400">{review.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <StarRating rating={review.rating} />
                          <p className="text-xs text-gray-400 mt-1">{review.date}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {review.body}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* ── Right sidebar ──────────────────── */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-36 space-y-5">
              {/* Quick actions */}
              <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
                  Quick Jump
                </p>
                {(
                  [
                    { id: "tool", label: "Use the Tool", icon: Zap },
                    { id: "guide", label: "How It Works", icon: BookOpen },
                    { id: "reviews", label: "Reviews", icon: MessageSquare },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all duration-200 mb-1 ${
                      activeTab === id
                        ? "bg-gray-900 text-white font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>

              {/* All tools in this category */}
              {TOOLS.filter(
                (t) =>
                  t.category === tool.category &&
                  t.id !== tool.id &&
                  t.status !== "COMING_SOON"
              ).length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
                    More {tool.category} Tools
                  </p>
                  <div className="space-y-3">
                    {TOOLS.filter(
                      (t) =>
                        t.category === tool.category &&
                        t.id !== tool.id &&
                        t.status !== "COMING_SOON"
                    ).map((t) => (
                      <Link
                        key={t.id}
                        href={`/tools/${t.slug}`}
                        className="group flex items-center gap-3 py-1.5"
                      >
                        <span className="text-xl shrink-0">{t.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors truncate">
                            {t.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{t.tagline}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Back to all tools */}
              <Link
                href="/tools"
                className="group w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 py-3 rounded-xs transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                All Tools
              </Link>
            </div>
          </aside>
        </div>

        {/* ── Related tools ──────────────────── */}
        {related.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">
                More{" "}
                <span style={{ color: category?.color }}>{tool.category}</span>{" "}
                tools
              </h2>
              <Link
                href="/tools"
                className="group text-sm text-amber-600 hover:text-amber-700 inline-flex items-center gap-1.5 transition-colors"
              >
                View all
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((t) => (
                <ToolCard key={t.id} tool={t} />
              ))}
            </div>
          </div>
        )}

        {/* ── Bottom CTA ─────────────────────── */}
        <div className="mt-16 bg-gray-900 rounded-xs p-8 md:p-10 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative z-10">
            <p className="text-2xl font-black text-white mb-3">
              Found this useful?
            </p>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              Share it with someone who could use it. All tools are free and built for the community.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm px-6 py-3 rounded-xs transition-all duration-200"
              >
                <Share2 className="w-4 h-4" />
                {copied ? "Copied!" : "Share this tool"}
              </button>
              <Link
                href="/tools"
                className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-semibold text-sm px-6 py-3 rounded-xs transition-all duration-200"
              >
                Explore all tools
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};




// "use client";

// import React, { useState } from "react";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import {
//   ArrowLeft,
//   Star,
//   Users,
//   ArrowRight,
//   Share2,
//   Check,
//   ChevronRight,
//   MessageSquare,
//   BookOpen,
//   Zap,
//   Lock,
//   Info,
// } from "lucide-react";
// import {
//   type Tool,
//   TOOLS,
//   STATUS_CONFIG,
//   TOOL_CATEGORIES,
// } from "@/lib/data/tools-data";
// import { staggerContainer, staggerItem } from "@/lib/animations";
// import { CVAnalyzerTool } from "./cv-analyzer";
// import { StartupIdeaGenerator } from "./startup-ideas-generator";
// import { LearningRoadmapGenerator } from "./learning-roadmap";
// import { ReadingTimeCalculator } from "./reading-time-calculator";
// import { StarRating } from "./star-rating";
// import { ToolCard } from "./tools-card";

// // ─── Map slug → interactive component ────────────────────────────────────────
// // Dynamic import kept simple — we import all and pick by slug

// const TOOL_COMPONENTS: Record<string, React.ReactNode> = {
//   "cv-analyzer": <CVAnalyzerTool />,
//   "startup-idea-generator": <StartupIdeaGenerator />,
//   "learning-roadmap": <LearningRoadmapGenerator />,
//   "reading-time-calculator": <ReadingTimeCalculator />,
//   "job-application-tracker": <CVAnalyzerTool />, // fallback — tracker is beta
//   "ai-cover-letter": <CVAnalyzerTool />, // fallback — cover letter uses same base
// };

// // ─── Fake reviews for UI completeness ─────────────────────────────────────────
// const FAKE_REVIEWS = [
//   {
//     name: "Aisha T.",
//     role: "Graduate Job Seeker",
//     avatar: "AT",
//     rating: 5,
//     date: "2 weeks ago",
//     body: "This absolutely transformed my CV. Got three interview invitations within a week of making the suggested changes. The keyword gap analysis was eye-opening.",
//   },
//   {
//     name: "James K.",
//     role: "Software Engineer",
//     avatar: "JK",
//     rating: 5,
//     date: "1 month ago",
//     body: "Clear, specific, actionable feedback. Not vague AI waffle. It told me exactly which sentences to rewrite and why. Landed my current role partly thanks to this.",
//   },
//   {
//     name: "Priya M.",
//     role: "Career Changer",
//     avatar: "PM",
//     rating: 4,
//     date: "3 weeks ago",
//     body: "Very useful for identifying where my CV was weak. The ATS score was lower than I expected — the recommendations to fix it were spot on. Takes 30 seconds and it's free.",
//   },
// ];

// // ─── How it works steps ───────────────────────────────────────────────────────
// const HOW_IT_WORKS: Record<string, { step: string; title: string; desc: string }[]> = {
//   "cv-analyzer": [
//     { step: "01", title: "Paste your CV", desc: "Copy the full text of your CV into the text area. Include all sections — summary, experience, education, and skills." },
//     { step: "02", title: "Click Analyse", desc: "The AI reads your CV against proven frameworks: ATS compatibility, language strength, structural clarity, and keyword density." },
//     { step: "03", title: "Review your score", desc: "Get an overall score out of 100 plus sub-scores for ATS, language, and structure. See exactly what's pulling you down." },
//     { step: "04", title: "Apply the improvements", desc: "Follow the specific rewrite suggestions and keyword recommendations. Re-run as many times as you like — it's free." },
//   ],
//   "startup-idea-generator": [
//     { step: "01", title: "Describe your skills", desc: "Tell the generator what you're good at — programming, design, marketing, a specific industry, years of experience." },
//     { step: "02", title: "Add your interests", desc: "What problems do you care about? What sectors excite you? The more specific you are, the better the ideas." },
//     { step: "03", title: "Get 3 startup concepts", desc: "Receive three AI-generated startup ideas with market sizing, target customers, competitors, and your unique advantage." },
//     { step: "04", title: "Validate with the questions", desc: "Each idea comes with validation questions. Use these to test assumptions before investing time or money." },
//   ],
//   "learning-roadmap": [
//     { step: "01", title: "Name your topic", desc: "Be specific — not just 'programming' but 'React.js for building dashboards'. Specificity produces better roadmaps." },
//     { step: "02", title: "Set your level and time", desc: "Choose your current knowledge level and how many hours per week you can commit. The roadmap adapts to your reality." },
//     { step: "03", title: "Get your roadmap", desc: "Receive a week-by-week plan with themes, learning goals, resource recommendations, and a milestone for each week." },
//     { step: "04", title: "Track your progress", desc: "Tick off goals as you complete them. The progress bar keeps you honest. Regenerate anytime to refresh the plan." },
//   ],
//   "reading-time-calculator": [
//     { step: "01", title: "Paste your content", desc: "Copy any piece of writing — blog post, article, email, essay, or script — into the text area." },
//     { step: "02", title: "Results appear instantly", desc: "Reading time (slow, average, fast), word count, sentence count, and speaking time update in real time as you type." },
//     { step: "03", title: "Check readability", desc: "See your Flesch Reading Ease score, average sentence length, and vocabulary richness. Understand if your writing is appropriately complex." },
//     { step: "04", title: "Edit and re-check", desc: "Make changes directly in the text area and watch all metrics update instantly. No button needed — it's live." },
//   ],
// };

// const DEFAULT_HOW_IT_WORKS = [
//   { step: "01", title: "Open the tool", desc: "The tool loads directly on this page with no sign-up or setup required." },
//   { step: "02", title: "Enter your input", desc: "Follow the prompts to provide the information the tool needs to work." },
//   { step: "03", title: "Get your results", desc: "Results are generated in seconds, tailored to exactly what you entered." },
//   { step: "04", title: "Take action", desc: "Use the output to make better decisions, create better work, or move faster." },
// ];

// // ─── Reading progress bar ─────────────────────────────────────────────────────
// const ReadingProgress = () => {
//   const [progress, setProgress] = React.useState(0);
//   React.useEffect(() => {
//     const update = () => {
//       const el = document.documentElement;
//       const scrollTop = el.scrollTop || document.body.scrollTop;
//       const scrollHeight = el.scrollHeight - el.clientHeight;
//       setProgress(scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0);
//     };
//     window.addEventListener("scroll", update, { passive: true });
//     return () => window.removeEventListener("scroll", update);
//   }, []);
//   return (
//     <div className="fixed top-16 left-0 right-0 z-40 h-0.5 bg-gray-100">
//       <motion.div
//         className="h-full bg-amber-500"
//         style={{ width: `${progress}%` }}
//         transition={{ duration: 0 }}
//       />
//     </div>
//   );
// };

// // ─── Main component ──────────────────────────────────────────────────────────
// interface Props {
//   tool: Tool;
//   related: Tool[];
// }

// export const ToolDetailClient = ({ tool, related }: Props) => {
//   const [copied, setCopied] = useState(false);
//   const [userRating, setUserRating] = useState(0);
//   const [hoverRating, setHoverRating] = useState(0);
//   const [ratingSubmitted, setRatingSubmitted] = useState(false);
//   const [activeTab, setActiveTab] = useState<"tool" | "guide" | "reviews">("tool");

//   const status = STATUS_CONFIG[tool.status];
//   const category = TOOL_CATEGORIES.find((c) => c.name === tool.category);
//   const ToolComponent = TOOL_COMPONENTS[tool.slug] ?? null;
//   const howItWorks = HOW_IT_WORKS[tool.slug] ?? DEFAULT_HOW_IT_WORKS;

//   const handleShare = () => {
//     navigator.clipboard.writeText(window.location.href);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const submitRating = (r: number) => {
//     setUserRating(r);
//     setRatingSubmitted(true);
//   };

//   // Breadcrumb path
//   const breadcrumbs = [
//     { label: "Home", href: "/" },
//     { label: "Tools", href: "/tools" },
//     { label: tool.name, href: "#" },
//   ];

//   return (
//     <div className="min-h-screen bg-white text-gray-900">
//       <ReadingProgress />

//       {/* Subtle background grid */}
//       <div
//         className="fixed inset-0 pointer-events-none opacity-[0.025]"
//         style={{
//           backgroundImage:
//             "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
//           backgroundSize: "48px 48px",
//         }}
//       />

//       {/* Accent orb behind hero */}
//       <div
//         className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.04] pointer-events-none"
//         style={{ backgroundColor: tool.accentColor }}
//       />

//       <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20">

//         {/* ── Breadcrumbs ────────────────────────── */}
//         <motion.nav
//           initial={{ opacity: 0, y: -8 }}
//           animate={{ opacity: 1, y: 0 }}
//           className="flex items-center gap-1.5 text-xs text-gray-400 mb-8"
//           aria-label="Breadcrumb"
//         >
//           {breadcrumbs.map((bc, i) => (
//             <React.Fragment key={bc.label}>
//               {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
//               {bc.href === "#" ? (
//                 <span className="text-gray-600 font-medium truncate max-w-[200px]">
//                   {bc.label}
//                 </span>
//               ) : (
//                 <Link
//                   href={bc.href}
//                   className="hover:text-gray-700 transition-colors truncate max-w-[120px]"
//                 >
//                   {bc.label}
//                 </Link>
//               )}
//             </React.Fragment>
//           ))}
//         </motion.nav>

//         {/* ── Hero header ────────────────────────── */}
//         <motion.div
//           variants={staggerContainer}
//           initial="hidden"
//           animate="visible"
//           className="mb-10"
//         >
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
//             {/* Left: title block */}
//             <div className="lg:col-span-2">
//               <motion.div
//                 variants={staggerItem}
//                 className="flex items-center gap-3 mb-5"
//               >
//                 {/* Large icon */}
//                 <div
//                   className="w-16 h-16 rounded-xs border-2 flex items-center justify-center text-4xl shrink-0"
//                   style={{
//                     backgroundColor: `${tool.accentColor}10`,
//                     borderColor: `${tool.accentColor}30`,
//                   }}
//                 >
//                   {tool.icon}
//                 </div>

//                 <div>
//                   <div className="flex flex-wrap items-center gap-2 mb-1">
//                     {/* Category */}
//                     <span
//                       className="text-xs font-semibold"
//                       style={{ color: category?.color }}
//                     >
//                       {category?.icon} {tool.category}
//                     </span>

//                     {/* Status */}
//                     <span
//                       className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border ${status.bg} ${status.border} ${status.color}`}
//                     >
//                       <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
//                       {status.label}
//                     </span>

//                     {tool.isNew && (
//                       <span className="text-[9px] font-black tracking-widest uppercase bg-amber-500 text-white px-2 py-0.5 rounded-xs">
//                         NEW
//                       </span>
//                     )}
//                     {tool.isPremium && (
//                       <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-xs">
//                         <Lock className="w-3 h-3" /> Premium
//                       </span>
//                     )}
//                   </div>
//                   <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">
//                     {tool.name}
//                   </h1>
//                 </div>
//               </motion.div>

//               {/* Tagline */}
//               <motion.p
//                 variants={staggerItem}
//                 className="text-xl font-medium text-gray-600 mb-4 leading-relaxed"
//               >
//                 {tool.tagline}
//               </motion.p>

//               {/* Description */}
//               <motion.p
//                 variants={staggerItem}
//                 className="text-base text-gray-500 leading-relaxed mb-6"
//               >
//                 {tool.description}
//               </motion.p>

//               {/* Feature pills */}
//               <motion.div
//                 variants={staggerItem}
//                 className="flex flex-wrap gap-2 mb-6"
//               >
//                 {tool.features.map((f) => (
//                   <span
//                     key={f}
//                     className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xs"
//                   >
//                     <span
//                       className="w-1.5 h-1.5 rounded-full shrink-0"
//                       style={{ backgroundColor: tool.accentColor }}
//                     />
//                     {f}
//                   </span>
//                 ))}
//               </motion.div>

//               {/* Tags */}
//               <motion.div
//                 variants={staggerItem}
//                 className="flex flex-wrap gap-1.5"
//               >
//                 {tool.tags.map((tag) => (
//                   <span
//                     key={tag}
//                     className="text-xs text-gray-400 bg-gray-50 border border-gray-100 px-3 py-1 rounded-xs"
//                   >
//                     {tag}
//                   </span>
//                 ))}
//               </motion.div>
//             </div>

//             {/* Right: stats card */}
//             <motion.div
//               variants={staggerItem}
//               className="bg-white border border-gray-100 rounded-xs shadow-sm p-5"
//             >
//               <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-5">
//                 Tool Stats
//               </p>

//               <div className="space-y-4">
//                 {[
//                   {
//                     icon: Users,
//                     label: "Total uses",
//                     value: tool.usageCount > 0 ? tool.usageCount.toLocaleString() : "—",
//                     color: "text-blue-500",
//                   },
//                   {
//                     icon: Star,
//                     label: "Rating",
//                     value:
//                       tool.ratingCount > 0
//                         ? `${tool.ratingAvg}/5 (${tool.ratingCount} reviews)`
//                         : "No reviews yet",
//                     color: "text-amber-500",
//                   },
//                   {
//                     icon: Zap,
//                     label: "Speed",
//                     value: tool.buildTime ?? "Instant",
//                     color: "text-green-500",
//                   },
//                   {
//                     icon: BookOpen,
//                     label: "Category",
//                     value: tool.category,
//                     color: "text-purple-500",
//                   },
//                   {
//                     icon: Lock,
//                     label: "Access",
//                     value: tool.isPremium ? "Premium" : "Free",
//                     color: tool.isPremium ? "text-amber-500" : "text-green-500",
//                   },
//                 ].map(({ icon: Icon, label, value, color }) => (
//                   <div
//                     key={label}
//                     className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 text-sm"
//                   >
//                     <div className="flex items-center gap-2.5 text-gray-500">
//                       <Icon className={`w-4 h-4 ${color}`} />
//                       {label}
//                     </div>
//                     <span className="font-semibold text-gray-800 text-right max-w-[140px] truncate">
//                       {value}
//                     </span>
//                   </div>
//                 ))}
//               </div>

//               {/* Action buttons */}
//               <div className="mt-5 space-y-2.5">
//                 <button
//                   onClick={() => setActiveTab("tool")}
//                   className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xs transition-all duration-200 hover:opacity-90"
//                   style={{ backgroundColor: tool.accentColor }}
//                 >
//                   <Zap className="w-4 h-4" />
//                   Use this tool
//                 </button>
//                 <button
//                   onClick={handleShare}
//                   className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-600 border border-gray-200 hover:border-gray-400 py-2.5 rounded-xs transition-all duration-200"
//                 >
//                   {copied ? (
//                     <>
//                       <Check className="w-4 h-4 text-green-500" />
//                       <span className="text-green-600">Link copied!</span>
//                     </>
//                   ) : (
//                     <>
//                       <Share2 className="w-4 h-4" />
//                       Share tool
//                     </>
//                   )}
//                 </button>
//               </div>
//             </motion.div>
//           </div>
//         </motion.div>

//         {/* ── Top accent line ──────────────────── */}
//         <div
//           className="h-px mb-0"
//           style={{
//             background: `linear-gradient(to right, ${tool.accentColor}, ${tool.accentColor}30, transparent)`,
//           }}
//         />

//         {/* ── Tabs ─────────────────────────────── */}
//         <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-md border-b border-gray-100 mb-8">
//           <div className="flex items-center gap-0">
//             {(
//               [
//                 { id: "tool", label: "Use the Tool", icon: Zap },
//                 { id: "guide", label: "How It Works", icon: BookOpen },
//                 { id: "reviews", label: `Reviews (${tool.ratingCount})`, icon: MessageSquare },
//               ] as const
//             ).map(({ id, label, icon: Icon }) => (
//               <button
//                 key={id}
//                 onClick={() => setActiveTab(id)}
//                 className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all duration-200 ${
//                   activeTab === id
//                     ? "border-gray-900 text-gray-900"
//                     : "border-transparent text-gray-400 hover:text-gray-700"
//                 }`}
//               >
//                 <Icon className="w-4 h-4" />
//                 {label}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* ── Tab content ──────────────────────── */}
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
//           <div className="lg:col-span-2">

//             {/* TOOL TAB */}
//             {activeTab === "tool" && (
//               <motion.div
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//               >
//                 {ToolComponent ? (
//                   <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
//                     {/* Tool header */}
//                     <div
//                       className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
//                       style={{ backgroundColor: `${tool.accentColor}06` }}
//                     >
//                       <div className="flex items-center gap-3">
//                         <span className="text-xl">{tool.icon}</span>
//                         <div>
//                           <p className="text-sm font-bold text-gray-900">
//                             {tool.name}
//                           </p>
//                           <p className="text-xs text-gray-400">{tool.tagline}</p>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-xs">
//                         <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
//                         Live
//                       </div>
//                     </div>
//                     <div className="p-6 md:p-8">{ToolComponent}</div>
//                   </div>
//                 ) : (
//                   <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xs p-12 text-center">
//                     <div className="text-5xl mb-4">{tool.icon}</div>
//                     <p className="text-gray-500 text-lg font-semibold mb-2">
//                       Full interactive tool
//                     </p>
//                     <p className="text-gray-400 text-sm max-w-sm mx-auto">
//                       This tool&apos;s full interface is available when connected to a live backend.
//                     </p>
//                   </div>
//                 )}

//                 {/* Info callout */}
//                 <div className="flex items-start gap-3 mt-5 bg-amber-50 border border-amber-100 rounded-xs px-4 py-3.5">
//                   <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
//                   <p className="text-xs text-amber-800 leading-relaxed">
//                     This tool is powered by Claude AI. Results are generated in real time and
//                     may vary between runs. Always apply your own judgment to AI-generated output.
//                     Core usage is free — no account required.
//                   </p>
//                 </div>
//               </motion.div>
//             )}

//             {/* GUIDE TAB */}
//             {activeTab === "guide" && (
//               <motion.div
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="space-y-8"
//               >
//                 <div>
//                   <h2 className="text-2xl font-black text-gray-900 mb-2">
//                     How to use {tool.name}
//                   </h2>
//                   <p className="text-gray-500 text-sm">
//                     Follow these steps to get the best results from this tool.
//                   </p>
//                 </div>

//                 {/* Steps */}
//                 <div className="space-y-6">
//                   {howItWorks.map((step, i) => (
//                     <motion.div
//                       key={step.step}
//                       initial={{ opacity: 0, x: -20 }}
//                       animate={{ opacity: 1, x: 0 }}
//                       transition={{ delay: i * 0.1 }}
//                       className="flex gap-5"
//                     >
//                       <div className="flex flex-col items-center gap-2">
//                         <div
//                           className="w-10 h-10 rounded-xs flex items-center justify-center text-sm font-black text-white shrink-0"
//                           style={{ backgroundColor: tool.accentColor }}
//                         >
//                           {step.step}
//                         </div>
//                         {i < howItWorks.length - 1 && (
//                           <div className="w-px flex-1 bg-gray-100 min-h-[40px]" />
//                         )}
//                       </div>
//                       <div className="pb-6">
//                         <h3 className="text-base font-bold text-gray-900 mb-1.5">
//                           {step.title}
//                         </h3>
//                         <p className="text-sm text-gray-500 leading-relaxed">
//                           {step.desc}
//                         </p>
//                       </div>
//                     </motion.div>
//                   ))}
//                 </div>

//                 {/* Tips */}
//                 <div className="bg-gray-50 border border-gray-200 rounded-xs p-6">
//                   <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
//                     <span className="text-lg">💡</span> Pro tips
//                   </h3>
//                   <ul className="space-y-2.5">
//                     {[
//                       "Be as specific as possible in your inputs — vague input produces vague output.",
//                       "Run the tool multiple times with different inputs to explore different angles.",
//                       "Use the output as a starting point, not a final answer. Your judgment matters.",
//                       "Share useful outputs with colleagues — the tool is free for everyone.",
//                     ].map((tip, i) => (
//                       <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
//                         <Check
//                           className="w-4 h-4 mt-0.5 shrink-0"
//                           style={{ color: tool.accentColor }}
//                         />
//                         {tip}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>

//                 {/* FAQ */}
//                 <div>
//                   <h3 className="text-lg font-black text-gray-900 mb-4">FAQ</h3>
//                   <div className="space-y-4">
//                     {[
//                       {
//                         q: "Is this tool free to use?",
//                         a: "Yes — the core experience is completely free with no account required. Some advanced features may become premium in the future.",
//                       },
//                       {
//                         q: "How accurate are the results?",
//                         a: "Results are powered by Claude, one of the most capable AI models available. However, AI is not infallible — always apply your own critical thinking.",
//                       },
//                       {
//                         q: "Is my data stored or used for training?",
//                         a: "Your inputs are used only to generate your results in real time. We do not store CV text, personal data, or use your inputs for AI training.",
//                       },
//                       {
//                         q: "Can I use the output commercially?",
//                         a: "Yes. You own the output. Use it however you like — for job applications, business plans, learning, or anything else.",
//                       },
//                     ].map(({ q, a }) => (
//                       <div
//                         key={q}
//                         className="bg-white border border-gray-100 rounded-xs p-5"
//                       >
//                         <p className="text-sm font-bold text-gray-900 mb-2">{q}</p>
//                         <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </motion.div>
//             )}

//             {/* REVIEWS TAB */}
//             {activeTab === "reviews" && (
//               <motion.div
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 className="space-y-6"
//               >
//                 {/* Aggregate rating */}
//                 <div className="bg-white border border-gray-100 rounded-xs p-6 shadow-sm">
//                   <div className="flex items-center gap-8">
//                     <div className="text-center">
//                       <p className="text-6xl font-black text-gray-900">
//                         {tool.ratingAvg > 0 ? tool.ratingAvg.toFixed(1) : "—"}
//                       </p>
//                       <StarRating rating={tool.ratingAvg} size="md" />
//                       <p className="text-xs text-gray-400 mt-1.5">
//                         {tool.ratingCount} reviews
//                       </p>
//                     </div>
//                     <div className="flex-1 space-y-2">
//                       {[5, 4, 3, 2, 1].map((n) => {
//                         const pct =
//                           n >= 4
//                             ? n === 5
//                               ? 72
//                               : 18
//                             : n === 3
//                             ? 7
//                             : n === 2
//                             ? 2
//                             : 1;
//                         return (
//                           <div key={n} className="flex items-center gap-2.5">
//                             <span className="text-xs text-gray-500 w-3">{n}</span>
//                             <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
//                             <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
//                               <motion.div
//                                 initial={{ width: 0 }}
//                                 animate={{ width: `${pct}%` }}
//                                 transition={{ duration: 0.8, delay: 0.1 * (5 - n) }}
//                                 className="h-full bg-amber-400 rounded-full"
//                               />
//                             </div>
//                             <span className="text-xs text-gray-400 w-6">{pct}%</span>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 </div>

//                 {/* Rate this tool */}
//                 {!ratingSubmitted ? (
//                   <div className="bg-amber-50 border border-amber-200 rounded-xs p-5">
//                     <p className="text-sm font-bold text-gray-900 mb-3">
//                       Rate this tool
//                     </p>
//                     <div className="flex items-center gap-2">
//                       {[1, 2, 3, 4, 5].map((n) => (
//                         <button
//                           key={n}
//                           onMouseEnter={() => setHoverRating(n)}
//                           onMouseLeave={() => setHoverRating(0)}
//                           onClick={() => submitRating(n)}
//                           className="transition-transform duration-100 hover:scale-110"
//                         >
//                           <Star
//                             className={`w-7 h-7 transition-all duration-100 ${
//                               n <= (hoverRating || userRating)
//                                 ? "fill-amber-400 text-amber-400"
//                                 : "fill-gray-100 text-gray-300"
//                             }`}
//                           />
//                         </button>
//                       ))}
//                       {hoverRating > 0 && (
//                         <span className="text-xs text-amber-700 font-semibold ml-2">
//                           {["", "Poor", "Fair", "Good", "Great", "Excellent"][hoverRating]}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 ) : (
//                   <motion.div
//                     initial={{ opacity: 0, scale: 0.95 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xs p-4"
//                   >
//                     <Check className="w-5 h-5 text-green-500" />
//                     <p className="text-sm text-green-800 font-medium">
//                       Thanks for your {userRating}-star rating! Your feedback helps improve this tool.
//                     </p>
//                   </motion.div>
//                 )}

//                 {/* Review list */}
//                 <div className="space-y-4">
//                   {FAKE_REVIEWS.map((review) => (
//                     <div
//                       key={review.name}
//                       className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm"
//                     >
//                       <div className="flex items-start justify-between mb-3">
//                         <div className="flex items-center gap-3">
//                           <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-600">
//                             {review.avatar}
//                           </div>
//                           <div>
//                             <p className="text-sm font-semibold text-gray-900">
//                               {review.name}
//                             </p>
//                             <p className="text-xs text-gray-400">{review.role}</p>
//                           </div>
//                         </div>
//                         <div className="text-right">
//                           <StarRating rating={review.rating} />
//                           <p className="text-xs text-gray-400 mt-1">{review.date}</p>
//                         </div>
//                       </div>
//                       <p className="text-sm text-gray-600 leading-relaxed">
//                         {review.body}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               </motion.div>
//             )}
//           </div>

//           {/* ── Right sidebar ──────────────────── */}
//           <aside className="lg:col-span-1">
//             <div className="lg:sticky lg:top-36 space-y-5">
//               {/* Quick actions */}
//               <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                 <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
//                   Quick Jump
//                 </p>
//                 {(
//                   [
//                     { id: "tool", label: "Use the Tool", icon: Zap },
//                     { id: "guide", label: "How It Works", icon: BookOpen },
//                     { id: "reviews", label: "Reviews", icon: MessageSquare },
//                   ] as const
//                 ).map(({ id, label, icon: Icon }) => (
//                   <button
//                     key={id}
//                     onClick={() => setActiveTab(id)}
//                     className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all duration-200 mb-1 ${
//                       activeTab === id
//                         ? "bg-gray-900 text-white font-semibold"
//                         : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
//                     }`}
//                   >
//                     <Icon className="w-4 h-4" />
//                     {label}
//                   </button>
//                 ))}
//               </div>

//               {/* All tools in this category */}
//               {TOOLS.filter(
//                 (t) =>
//                   t.category === tool.category &&
//                   t.id !== tool.id &&
//                   t.status !== "COMING_SOON"
//               ).length > 0 && (
//                 <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
//                   <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
//                     More {tool.category} Tools
//                   </p>
//                   <div className="space-y-3">
//                     {TOOLS.filter(
//                       (t) =>
//                         t.category === tool.category &&
//                         t.id !== tool.id &&
//                         t.status !== "COMING_SOON"
//                     ).map((t) => (
//                       <Link
//                         key={t.id}
//                         href={`/tools/${t.slug}`}
//                         className="group flex items-center gap-3 py-1.5"
//                       >
//                         <span className="text-xl shrink-0">{t.icon}</span>
//                         <div className="min-w-0">
//                           <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors truncate">
//                             {t.name}
//                           </p>
//                           <p className="text-xs text-gray-400 truncate">{t.tagline}</p>
//                         </div>
//                         <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
//                       </Link>
//                     ))}
//                   </div>
//                 </div>
//               )}

//               {/* Back to all tools */}
//               <Link
//                 href="/tools"
//                 className="group w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 py-3 rounded-xs transition-all duration-200"
//               >
//                 <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
//                 All Tools
//               </Link>
//             </div>
//           </aside>
//         </div>

//         {/* ── Related tools ──────────────────── */}
//         {related.length > 0 && (
//           <div className="mt-20 pt-12 border-t border-gray-100">
//             <div className="flex items-center justify-between mb-8">
//               <h2 className="text-2xl font-black text-gray-900">
//                 More{" "}
//                 <span style={{ color: category?.color }}>{tool.category}</span>{" "}
//                 tools
//               </h2>
//               <Link
//                 href="/tools"
//                 className="group text-sm text-amber-600 hover:text-amber-700 inline-flex items-center gap-1.5 transition-colors"
//               >
//                 View all
//                 <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
//               </Link>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
//               {related.map((t) => (
//                 <ToolCard key={t.id} tool={t} />
//               ))}
//             </div>
//           </div>
//         )}

//         {/* ── Bottom CTA ─────────────────────── */}
//         <div className="mt-16 bg-gray-900 rounded-xs p-8 md:p-10 text-center relative overflow-hidden">
//           <div
//             className="absolute inset-0 opacity-5"
//             style={{
//               backgroundImage:
//                 "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
//               backgroundSize: "24px 24px",
//             }}
//           />
//           <div className="relative z-10">
//             <p className="text-2xl font-black text-white mb-3">
//               Found this useful?
//             </p>
//             <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
//               Share it with someone who could use it. All tools are free and built for the community.
//             </p>
//             <div className="flex flex-wrap items-center justify-center gap-3">
//               <button
//                 onClick={handleShare}
//                 className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm px-6 py-3 rounded-xs transition-all duration-200"
//               >
//                 <Share2 className="w-4 h-4" />
//                 {copied ? "Copied!" : "Share this tool"}
//               </button>
//               <Link
//                 href="/tools"
//                 className="flex items-center gap-2 border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-semibold text-sm px-6 py-3 rounded-xs transition-all duration-200"
//               >
//                 Explore all tools
//                 <ArrowRight className="w-4 h-4" />
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };