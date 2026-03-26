"use client";

// =============================================================================
// isaacpaha.com — Message Rewriter: Page Shell
// app/tools/message-rewriter/_components/message-rewriter-page.tsx
//
// Full page with hero, tabs (Tool / How It Works / Reviews), sidebar,
// and the MessageRewriterTool embedded.
// =============================================================================

import React, { useState }          from "react";
import Link                          from "next/link";
import { motion, AnimatePresence }   from "framer-motion";
import {
  ArrowLeft, Star, Users, Clock, Share2, Check, BookOpen,
  Zap, MessageSquare, ChevronRight, Info, Sparkles,
  Edit3, Lightbulb, Volume2, Repeat, Target, Shield,
  Heart, Briefcase, CornerDownLeft,
} from "lucide-react";
import { TOOLS }                   from "@/lib/data/tools-data";
import { MessageRewriterTool } from "./message-rewriter-tool";


const TOOL = TOOLS.find(t => t.slug === "message-rewriter")!;

// ─── How It Works ─────────────────────────────────────────────────────────────

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Paste your message",
    desc:  "It doesn't matter how rough it is. Paste the email you're not sure about, the text you've been overthinking, or the feedback you don't know how to phrase.",
  },
  {
    step: "02",
    title: "Choose your tone and platform",
    desc:  "Pick from 12 tones — Professional, Confident, Empathetic, Diplomatic, and more. Add a platform preset so the style fits where it's being sent.",
  },
  {
    step: "03",
    title: "Add a special mode (optional)",
    desc:  "Want it shorter? More persuasive? Less aggressive? Turn on a Special Mode to layer an extra intent on top of your chosen tone.",
  },
  {
    step: "04",
    title: "Get 2-3 variations instantly",
    desc:  "AI rewrites your message 2-3 ways, each with a slightly different angle. Pick the one that sounds like the best version of you.",
  },
];

const USE_CASES = [
  {
    icon: Briefcase,
    title: "Work & professional",
    desc:  "Emails to managers, client messages, performance reviews, project updates, feedback to colleagues.",
    color: "#3b82f6",
  },
  {
    icon: MessageSquare,
    title: "Digital platforms",
    desc:  "LinkedIn outreach, Slack messages, Twitter/X replies, community posts that need the right tone.",
    color: "#e11d48",
  },
  {
    icon: Heart,
    title: "Personal & relationships",
    desc:  "Apologies, difficult conversations, giving sensitive feedback, rejections that need to land gently.",
    color: "#8b5cf6",
  },
  {
    icon: Shield,
    title: "Assertive situations",
    desc:  "Setting boundaries, pushing back without sounding aggressive, saying no without burning bridges.",
    color: "#f59e0b",
  },
];

const FAQS = [
  {
    q: "Does it change what I'm trying to say?",
    a: "Never. The AI's job is to change how you say it, not what you say. Your intent, information, and meaning are always preserved — only the tone and phrasing improve.",
  },
  {
    q: "What are the 'Special Modes' for?",
    a: "They let you layer an extra instruction on top of your tone. 'Shorten' trims 30-50% of the words without losing meaning. 'Less Aggressive' removes any passive-aggression. 'Soften' is for genuinely difficult messages — feedback, rejections, hard truths.",
  },
  {
    q: "Which tone should I use?",
    a: "The AI detects the context of your message and suggests the best tone after it rewrites. But as a rule: Professional for work, Empathetic for personal difficulty, Direct for busy recipients, Diplomatic for conflict, Assertive for boundaries.",
  },
  {
    q: "What's the Before/After toggle on each rewrite?",
    a: "It shows a split view of your original message vs the rewritten version side by side — so you can see exactly what changed and why the new version is stronger.",
  },
  {
    q: "Can I use it for different platforms?",
    a: "Yes — the platform preset adjusts the style. Email is slightly more formal and uses paragraphs. Slack is shorter and thread-friendly. LinkedIn is polished but human. WhatsApp/Text is conversational and brief.",
  },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export function MessageRewriterPage() {
  const [activeTab, setActiveTab] = useState<"tool" | "guide" | "reviews">("tool");
  const [copied,    setCopied]    = useState(false);
  const [openFAQ,   setOpenFAQ]   = useState<number | null>(null);

  const handleShare = () => {
    navigator.clipboard.writeText("https://isaacpaha.com/tools/message-rewriter");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const related = TOOLS.filter(t => t.slug !== "message-rewriter" && t.status === "LIVE").slice(0, 3);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* ── Hero header ────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-stone-400 mb-6">
            <Link href="/tools" className="hover:text-stone-700 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />Tools
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-stone-600 font-semibold">Message Rewriter</span>
          </div>

          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-0">

              {/* Tag + heading */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-xs text-white"
                  style={{ backgroundColor: "#e11d48" }}>
                  Communication
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-xs">
                  Free · No login required
                </span>
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-stone-900 leading-tight mb-2">
                Message Rewriter
              </h1>
              <p className="text-lg font-semibold text-stone-400 mb-4">
                Say it better, instantly.
              </p>
              <p className="text-sm text-stone-500 leading-relaxed max-w-lg">
                Paste any message. Pick a tone. Get 2–3 rewritten versions in seconds — for work emails, LinkedIn messages, apologies, feedback, and anything else you struggle to phrase just right.
              </p>

              {/* Stats row */}
              <div className="flex items-center gap-5 mt-5 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                  <span className="text-xs font-bold text-stone-600 ml-1">4.9</span>
                  <span className="text-xs text-stone-400 ml-0.5">(2.1k)</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-stone-400">
                  <Users className="w-3.5 h-3.5" />23k uses this month
                </div>
                <div className="flex items-center gap-1.5 text-xs text-stone-400">
                  <Clock className="w-3.5 h-3.5" />~3 seconds
                </div>
              </div>

              {/* CTAs */}
              <div className="flex items-center gap-3 mt-6 flex-wrap">
                <button onClick={() => setActiveTab("tool")}
                  className="flex items-center gap-2 text-sm font-bold text-white px-6 py-3 rounded-xs transition-colors shadow-sm"
                  style={{ backgroundColor: "#e11d48" }}>
                  <Edit3 className="w-4 h-4" />Start Rewriting
                </button>
                <button onClick={handleShare}
                  className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 border border-stone-200 hover:border-stone-400 px-5 py-3 rounded-xs transition-colors">
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                  {copied ? "Copied!" : "Share"}
                </button>
              </div>
            </div>

            {/* Right: use cases preview */}
            <div className="hidden lg:block">
              <div className="border border-stone-100 rounded-xs p-5 w-64 bg-stone-50">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-4">12 tones available</p>
                <div className="space-y-2">
                  {[
                    { emoji: "💼", label: "Professional", example: "I'm following up on our discussion regarding…" },
                    { emoji: "⚡", label: "Confident",    example: "I need a response on this by end of day." },
                    { emoji: "❤️", label: "Empathetic",   example: "I can see this has been difficult, and I…" },
                    { emoji: "🎯", label: "Direct",       example: "What's the status? Need it by Thursday." },
                  ].map((t) => (
                    <div key={t.label} className="bg-white border border-stone-100 rounded-xs p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">{t.emoji}</span>
                        <span className="text-[10px] font-black text-stone-600">{t.label}</span>
                      </div>
                      <p className="text-[11px] text-stone-400 leading-snug italic">"{t.example}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto">
            {[
              { id: "tool",    label: "Rewrite Tool",  icon: Edit3        },
              { id: "guide",   label: "How It Works",  icon: BookOpen     },
              { id: "reviews", label: "Reviews",       icon: MessageSquare},
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 text-xs font-bold px-5 py-4 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === id
                    ? "border-rose-500 text-rose-600"
                    : "border-transparent text-stone-400 hover:text-stone-700"
                }`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">

              {/* TOOL TAB */}
              {activeTab === "tool" && (
                <motion.div key="tool" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}>
                  <MessageRewriterTool />
                </motion.div>
              )}

              {/* HOW IT WORKS TAB */}
              {activeTab === "guide" && (
                <motion.div key="guide" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }} className="space-y-10">

                  {/* Steps */}
                  <div>
                    <h2 className="text-xl font-black text-stone-900 mb-6">How it works</h2>
                    <div className="space-y-4">
                      {HOW_IT_WORKS.map((step) => (
                        <div key={step.step} className="flex items-start gap-5">
                          <div className="w-10 h-10 rounded-xs flex items-center justify-center flex-shrink-0 font-black text-sm text-white"
                            style={{ backgroundColor: "#e11d48" }}>
                            {step.step}
                          </div>
                          <div>
                            <p className="text-sm font-black text-stone-900 mb-1">{step.title}</p>
                            <p className="text-sm text-stone-500 leading-relaxed">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Use cases */}
                  <div>
                    <h2 className="text-xl font-black text-stone-900 mb-6">What it's used for</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {USE_CASES.map((uc) => (
                        <div key={uc.title} className="bg-white border border-stone-100 rounded-xs p-5">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xs flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${uc.color}15` }}>
                              <uc.icon className="w-4.5 h-4.5" style={{ color: uc.color }} />
                            </div>
                            <div>
                              <p className="text-sm font-black text-stone-900 mb-1">{uc.title}</p>
                              <p className="text-xs text-stone-500 leading-relaxed">{uc.desc}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FAQ */}
                  <div>
                    <h2 className="text-xl font-black text-stone-900 mb-6">FAQ</h2>
                    <div className="space-y-2">
                      {FAQS.map((faq, i) => (
                        <div key={i} className="border border-stone-100 rounded-xs overflow-hidden">
                          <button onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-50 transition-colors">
                            <p className="text-sm font-bold text-stone-800 pr-4">{faq.q}</p>
                            {openFAQ === i ? <ChevronRight className="w-4 h-4 text-stone-400 rotate-90 transition-transform flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-stone-300 flex-shrink-0" />}
                          </button>
                          <AnimatePresence>
                            {openFAQ === i && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                                <div className="border-t border-stone-50 px-5 py-4">
                                  <p className="text-sm text-stone-500 leading-relaxed">{faq.a}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* REVIEWS TAB */}
              {activeTab === "reviews" && (
                <motion.div key="reviews" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}>
                  <div className="bg-stone-50 border border-stone-100 rounded-xs p-8 text-center">
                    <p className="text-stone-400 text-sm">Reviews coming soon.</p>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="hidden xl:block w-72 flex-shrink-0 space-y-5">

            {/* Quick jump */}
            <div className="bg-stone-50 border border-stone-100 rounded-xs p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Quick start</p>
              <div className="space-y-2">
                {[
                  { label: "Rewrite an email",     hint: "Professional tone + Email preset"      },
                  { label: "Soften a rejection",    hint: "Softer tone + 'Soften' mode"           },
                  { label: "Less aggressive DM",    hint: "Diplomatic + 'Less Aggressive' mode"   },
                  { label: "Confident follow-up",   hint: "Confident tone + remove hedging"       },
                  { label: "Apologise properly",    hint: "Empathetic tone"                       },
                  { label: "LinkedIn outreach",     hint: "Professional + LinkedIn preset"        },
                ].map((tip) => (
                  <div key={tip.label} className="bg-white border border-stone-100 rounded-xs px-3 py-2.5">
                    <p className="text-xs font-semibold text-stone-700">{tip.label}</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">{tip.hint}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Insight card */}
            <div className="bg-rose-50 border border-rose-100 rounded-xs p-5">
              <div className="flex items-start gap-2.5 mb-3">
                <Lightbulb className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-black text-rose-800">The real problem with most messages</p>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                Most people know what they want to say. They just struggle with how to say it without sounding rude, weak, needy, or unclear.
              </p>
              <p className="text-xs text-rose-600 font-semibold mt-2 leading-relaxed">
                That's exactly what this tool fixes.
              </p>
            </div>

            {/* Related tools */}
            {related.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Related tools</p>
                <div className="space-y-2">
                  {related.map(t => (
                    <Link key={t.id} href={`/tools/${t.slug}`}
                      className="flex items-center gap-3 bg-white border border-stone-100 hover:border-stone-300 rounded-xs p-3 transition-all group">
                      <div className="w-7 h-7 rounded-xs flex items-center justify-center flex-shrink-0 text-sm"
                        style={{ backgroundColor: `${t.accentColor}15` }}>
                        {(t as any).emoji || "🔧"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-stone-700 truncate group-hover:text-stone-900">{t.name}</p>
                        <p className="text-[10px] text-stone-400 truncate">{t.tagline}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}