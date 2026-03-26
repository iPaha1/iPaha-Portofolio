"use client";

// =============================================================================
// isaacpaha.com — Comparative Scripture Explorer
// app/tools/scripture-explorer/_components/scripture-explorer-tool.tsx
//
// Full-featured comparative scripture exploration:
//   - Smart query input (topics, questions, figures, verses)
//   - Mode selector: Compare | Deep Dive | Explore a Figure
//   - Guided topic suggestions (Creation, Forgiveness, Justice, etc.)
//   - 3-tradition side-by-side comparison with passage references
//   - Connection mapping (shared figures, themes)
//   - Differences explained neutrally
//   - AI Study Companion (follow-up questions)
//   - Save & bookmark for signed-in users
//
// NEUTRALITY: Enforced at the API level via immutable system prompt.
//              No ranking, no judgment, no "this is correct/incorrect".
// =============================================================================

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence }               from "framer-motion";
import {
  Search, Sparkles, Loader2, AlertCircle, Check, Copy,
  BookOpen, ChevronDown, ChevronUp, ArrowRight, Download,
  Bookmark, BookmarkCheck, MessageSquare, Globe, Link2,
  Info, Scale, History, Lightbulb, ChevronRight, X,
  Star, RefreshCw, Share2, Layers, Users, Heart,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Passage {
  reference:   string;
  text:        string;
  explanation: string;
}

interface TraditionResult {
  tradition:        string;
  text:             string;
  emoji:            string;
  accentColor:      string;
  summary:          string;
  passages:         Passage[];
  context:          string;
  internalDiversity?: string;
}

interface SharedConnection {
  type:        string;
  title:       string;
  description: string;
}

interface KeyDifference {
  aspect:      string;
  description: string;
}

interface ComparisonResult {
  topic:              string;
  introduction:       string;
  traditions:         TraditionResult[];
  sharedConnections:  SharedConnection[];
  keyDifferences:     KeyDifference[];
  historicalContext:  string;
  guidedQuestions:    string[];
  disclaimer:         string;
}

interface StudyResponse {
  answer:            string;
  references:        { tradition: string; reference: string; relevance: string }[];
  followUpQuestions: string[];
  disclaimer:        string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const MODES = [
  { id: "compare",    label: "Compare Traditions", icon: Layers,       desc: "Side-by-side comparison across traditions"      },
  { id: "figure",     label: "Explore a Figure",   icon: Users,        desc: "Understand a prophet, patriarch, or key person" },
  { id: "deep-dive",  label: "Deep Dive",          icon: BookOpen,     desc: "Detailed scholarly analysis of one topic"       },
] as const;

const SUGGESTED_TOPICS = [
  { label: "Creation",           emoji: "🌍", category: "Theology"  },
  { label: "Abraham / Ibrahim",  emoji: "🕌", category: "Figures"   },
  { label: "Forgiveness",        emoji: "🤝", category: "Ethics"    },
  { label: "Moses / Musa",       emoji: "✡️", category: "Figures"   },
  { label: "Day of Judgement",   emoji: "⚖️", category: "Theology"  },
  { label: "Prayer",             emoji: "🙏", category: "Practice"  },
  { label: "Mary / Maryam",      emoji: "✝️", category: "Figures"   },
  { label: "Concept of God",     emoji: "☀️", category: "Theology"  },
  { label: "Justice & Mercy",    emoji: "⚖️", category: "Ethics"    },
  { label: "The Afterlife",      emoji: "🌟", category: "Theology"  },
  { label: "Prophets & Prophecy",emoji: "📜", category: "Theology"  },
  { label: "Covenant",           emoji: "📿", category: "Theology"  },
];

const LEARNING_PATHS = [
  { title: "Introduction to Abrahamic Traditions", steps: ["What are the Abrahamic religions?", "Creation stories compared", "Abraham across traditions", "The concept of God in each tradition"] },
  { title: "Prophets Across Traditions",           steps: ["Moses / Musa", "Jesus in the Bible and Qur'an", "Muhammad and the prophetic tradition", "Shared prophetic themes"] },
  { title: "Ethics & Values",                       steps: ["Justice & Mercy", "Forgiveness across traditions", "Care for the poor and vulnerable", "Concepts of sin and repentance"] },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function PassageCard({ passage, accentColor }: { passage: Passage; accentColor: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-stone-100 rounded-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50/40">
        <span className="text-xs font-black tracking-wide" style={{ color: accentColor }}>{passage.reference}</span>
        <button onClick={() => setExpanded(p => !p)}
          className="text-stone-400 hover:text-stone-700 transition-colors">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm text-stone-700 italic leading-relaxed">"{passage.text}"</p>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <p className="text-xs text-stone-500 mt-2 leading-relaxed pt-2 border-t border-stone-100">{passage.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TraditionCard({ tradition }: { tradition: TraditionResult }) {
  const [showContext, setShowContext] = useState(false);
  return (
    <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-3"
        style={{ borderTopWidth: 3, borderTopColor: tradition.accentColor }}>
        <span className="text-2xl">{tradition.emoji}</span>
        <div>
          <p className="text-sm font-black text-stone-900">{tradition.tradition}</p>
          <p className="text-[11px] text-stone-400 font-medium">{tradition.text}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 py-4">
        <p className="text-sm text-stone-700 leading-relaxed">{tradition.summary}</p>
      </div>

      {/* Passages */}
      {tradition.passages?.length > 0 && (
        <div className="px-5 pb-4 space-y-2">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Scripture References</p>
          {tradition.passages.map((p, i) => (
            <PassageCard key={i} passage={p} accentColor={tradition.accentColor} />
          ))}
        </div>
      )}

      {/* Context toggle */}
      <div className="px-5 pb-4">
        <button onClick={() => setShowContext(p => !p)}
          className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-700 transition-colors">
          <History className="w-3.5 h-3.5" />
          {showContext ? "Hide context" : "Show historical & cultural context"}
          {showContext ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <AnimatePresence>
          {showContext && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
              <div className="mt-3 bg-stone-50 border border-stone-100 rounded-sm px-4 py-3">
                <p className="text-xs text-stone-600 leading-relaxed">{tradition.context}</p>
                {tradition.internalDiversity && (
                  <div className="mt-2 pt-2 border-t border-stone-100">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Diversity within this tradition</p>
                    <p className="text-xs text-stone-500 leading-relaxed">{tradition.internalDiversity}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Input Stage ──────────────────────────────────────────────────────────────

function InputStage({ onExplore, onLearningPath }: {
  onExplore:      (query: string, mode: string) => void;
  onLearningPath: (topic: string) => void;
}) {
  const [query,      setQuery]      = useState("");
  const [mode,       setMode]       = useState<"compare" | "figure" | "deep-dive">("compare");
  const [activeCategory, setActiveCategory] = useState("All");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const categories = ["All", ...Array.from(new Set(SUGGESTED_TOPICS.map(t => t.category)))];
  const filtered   = activeCategory === "All" ? SUGGESTED_TOPICS : SUGGESTED_TOPICS.filter(t => t.category === activeCategory);

  const handleExplore = () => {
    if (!query.trim()) return;
    onExplore(query.trim(), mode);
  };

  return (
    <div className="space-y-7">
      {/* Disclaimer banner */}
      <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-sm px-4 py-3.5">
        <Scale className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-700 leading-relaxed">
          <span className="font-bold">Educational principle:</span> This tool presents all traditions with equal respect. No tradition is ranked, judged, or presented as more correct than another. Differences are explored neutrally as distinct perspectives.
        </p>
      </div>

      {/* Mode selector */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Exploration Mode</label>
        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              title={m.desc}
              className={`flex flex-col items-center gap-1.5 p-3.5 rounded-sm border text-center transition-colors ${
                mode === m.id ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
              }`}>
              <m.icon className="w-5 h-5" style={{ color: mode === m.id ? "#6366f1" : "#9ca3af" }} />
              <span className="text-xs font-bold leading-tight">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main query input */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
          {mode === "compare"   ? "What topic or question would you like to explore?" :
           mode === "figure"    ? "Which figure would you like to understand?" :
                                  "What topic would you like to deep dive into?"}
        </label>
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-300 pointer-events-none" />
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && query.trim()) { e.preventDefault(); handleExplore(); } }}
            placeholder={
              mode === "compare"  ? "e.g. 'What do these traditions say about forgiveness?' or 'Creation story' or 'Genesis 1'" :
              mode === "figure"   ? "e.g. 'Abraham', 'Moses', 'Mary', 'Elijah'" :
                                    "e.g. 'The concept of God in each tradition' or 'How each tradition views the afterlife'"
            }
            rows={3}
            className="w-full pl-10 pr-4 py-3 text-sm text-stone-900 border border-stone-200 rounded-sm placeholder:text-stone-300 focus:outline-none focus:border-indigo-400 focus:bg-white bg-stone-50 transition-all resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Explore button */}
      <button onClick={handleExplore} disabled={!query.trim()}
        className="w-full flex items-center justify-center gap-2 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed py-4 rounded-sm transition-colors shadow-sm">
        <Sparkles className="w-5 h-5" />
        Explore {mode === "compare" ? "Across Traditions" : mode === "figure" ? "This Figure" : "in Depth"}
      </button>

      {/* Suggested topics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Suggested topics</label>
          <div className="flex gap-1 flex-wrap">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`text-[10px] font-bold px-2 py-1 rounded-sm border transition-colors ${
                  activeCategory === cat ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "bg-white text-stone-400 border-stone-200"
                }`}>{cat}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {filtered.map((topic) => (
            <button key={topic.label}
              onClick={() => { setQuery(topic.label); setTimeout(() => inputRef.current?.focus(), 100); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 bg-white border border-stone-200 hover:border-indigo-400 hover:text-indigo-700 px-3 py-2 rounded-sm transition-colors">
              <span>{topic.emoji}</span>{topic.label}
            </button>
          ))}
        </div>
      </div>

      {/* Guided learning paths */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Guided Learning Paths</label>
        <div className="space-y-2">
          {LEARNING_PATHS.map((path) => (
            <div key={path.title} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-stone-50/60 transition-colors"
                onClick={() => onLearningPath(path.steps[0])}>
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <p className="text-sm font-semibold text-stone-700">{path.title}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-400">{path.steps.length} topics</span>
                  <ChevronRight className="w-4 h-4 text-stone-300" />
                </div>
              </div>
              <div className="px-4 pb-3 flex flex-wrap gap-1.5 border-t border-stone-50">
                {path.steps.map((step) => (
                  <button key={step} onClick={() => onLearningPath(step)}
                    className="text-[11px] text-stone-500 bg-stone-50 border border-stone-100 hover:border-indigo-300 hover:text-indigo-600 px-2 py-1 rounded-sm transition-colors">
                    {step}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Study Companion ──────────────────────────────────────────────────────────

function StudyCompanion({ context }: { context: { topic: string } | null }) {
  const [question, setQuestion]   = useState("");
  const [loading,  setLoading]    = useState(false);
  const [response, setResponse]   = useState<StudyResponse | null>(null);
  const [history,  setHistory]    = useState<{ q: string; r: StudyResponse }[]>([]);

  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    const q = question.trim();
    setQuestion("");
    try {
      const res  = await fetch("/api/tools/scripture-explorer/study-companion", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, context }),
      });
      const data = await res.json();
      if (data.result) {
        setHistory(h => [...h, { q, r: data.result }]);
        setResponse(data.result);
      }
    } catch {}
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-sm px-4 py-3">
        <MessageSquare className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-indigo-700 leading-relaxed">
          Ask any follow-up question{context ? ` about "${context.topic}"` : ""}. The Study Companion gives educational, neutral answers with references.
        </p>
      </div>

      {/* Q&A history */}
      {history.length > 0 && (
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {history.map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xs text-stone-400 flex-shrink-0 mt-0.5">You</span>
                <p className="text-sm font-semibold text-stone-700 bg-stone-50 border border-stone-100 rounded-sm px-3 py-2 flex-1">{item.q}</p>
              </div>
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-1" />
                <div className="flex-1 bg-indigo-50 border border-indigo-100 rounded-sm px-4 py-3">
                  <p className="text-sm text-stone-700 leading-relaxed">{item.r.answer}</p>
                  {item.r.references?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-indigo-100">
                      {item.r.references.map((ref, j) => (
                        <span key={j} className="text-[10px] font-bold text-indigo-600 bg-white border border-indigo-200 px-2 py-0.5 rounded-sm">{ref.reference}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Follow-up suggestions */}
      {response?.followUpQuestions && response.followUpQuestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {response.followUpQuestions.map((fq) => (
            <button key={fq} onClick={() => { setQuestion(fq); }}
              className="text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 px-3 py-1.5 rounded-sm transition-colors text-left">
              {fq}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input value={question} onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && question.trim()) ask(); }}
          placeholder="Ask a follow-up question…"
          className="flex-1 text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-indigo-400"
        />
        <button onClick={ask} disabled={loading || !question.trim()}
          className="flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-sm transition-colors disabled:opacity-60">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Results Stage ────────────────────────────────────────────────────────────

function ResultsStage({
  result, onReset, onSave, isSaved, isSignedIn,
}: {
  result:      ComparisonResult;
  onReset:     () => void;
  onSave:      () => void;
  isSaved:     boolean;
  isSignedIn:  boolean;
}) {
  const [activeTab,   setActiveTab]   = useState<"comparison" | "connections" | "context" | "study">("comparison");
  const [copied,      setCopied]      = useState(false);

  const copyText = () => {
    const text = [
      `📖 ${result.topic}`,
      ``,
      result.introduction,
      ``,
      ...(result.traditions ?? []).flatMap(t => [
        `── ${t.tradition} (${t.text}) ──`,
        t.summary,
        ...(t.passages ?? []).map(p => `  ${p.reference}: "${p.text}"`),
        ``,
      ]),
      `Shared connections:`,
      ...(result.sharedConnections ?? []).map(c => `• ${c.title}: ${c.description}`),
      ``,
      `⚠️ ${result.disclaimer}`,
    ].join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const TABS = [
    { id: "comparison",  label: "Comparison",    icon: Layers     },
    { id: "connections", label: "Connections",   icon: Link2      },
    { id: "context",     label: "Context",       icon: History    },
    { id: "study",       label: "Study with AI", icon: MessageSquare },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Result header */}
      <div className="bg-stone-900 text-white rounded-sm p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Exploring</p>
            <h2 className="text-xl font-black text-white leading-tight">{result.topic}</h2>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={copyText}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all">
              {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied</> : <><Copy className="w-3.5 h-3.5" />Copy</>}
            </button>
            {isSignedIn && (
              <button onClick={onSave}
                className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-sm transition-all ${
                  isSaved ? "text-amber-400 border-amber-400/40 bg-amber-400/10" : "text-white/40 hover:text-white border-white/10 hover:border-white/30"
                }`}>
                {isSaved ? <><BookmarkCheck className="w-3.5 h-3.5" />Saved</> : <><Bookmark className="w-3.5 h-3.5" />Save</>}
              </button>
            )}
            <button onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all">
              <RefreshCw className="w-3.5 h-3.5" />New
            </button>
          </div>
        </div>
        <p className="text-sm text-white/70 leading-relaxed">{result.introduction}</p>

        {/* Tradition pills */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {(result.traditions ?? []).map(t => (
            <span key={t.tradition} className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-sm"
              style={{ color: t.accentColor, backgroundColor: `${t.accentColor}20`, border: `1px solid ${t.accentColor}40` }}>
              {t.emoji} {t.tradition}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-stone-100 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? "border-indigo-500 text-indigo-600" : "border-transparent text-stone-400 hover:text-stone-700"
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── COMPARISON tab ─────────────────────────────────────────────── */}
      {activeTab === "comparison" && (
        <div className="space-y-4">
          {(result.traditions ?? []).map(tradition => (
            <TraditionCard key={tradition.tradition} tradition={tradition} />
          ))}

          {/* Key differences */}
          {result.keyDifferences?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-stone-100">
                <Scale className="w-4 h-4 text-amber-500" />
                <p className="text-sm font-black text-stone-800">Key Differences — Explained Neutrally</p>
              </div>
              <div className="px-5 py-4 space-y-3">
                <p className="text-xs text-stone-400 leading-relaxed italic mb-3">
                  Differences between traditions are presented as distinct perspectives, not errors or contradictions.
                </p>
                {result.keyDifferences.map((diff, i) => (
                  <div key={i} className="flex items-start gap-3 bg-stone-50 border border-stone-100 rounded-sm px-4 py-3">
                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <div>
                      <p className="text-xs font-black text-stone-700 mb-1">{diff.aspect}</p>
                      <p className="text-xs text-stone-600 leading-relaxed">{diff.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested next questions */}
          {result.guidedQuestions?.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-3">Keep Exploring</p>
              <div className="space-y-2">
                {result.guidedQuestions.map((q) => (
                  <button key={q} onClick={() => setActiveTab("study")}
                    className="flex items-center gap-2 text-sm text-indigo-700 hover:text-indigo-900 transition-colors text-left w-full">
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-indigo-400" />{q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CONNECTIONS tab ────────────────────────────────────────────── */}
      {activeTab === "connections" && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3.5">
            <Link2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-700 leading-relaxed">
              All three Abrahamic traditions share deep historical and theological roots. These connections are areas of shared heritage — they do not diminish the distinct identity of each tradition.
            </p>
          </div>

          {result.sharedConnections?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.sharedConnections.map((conn, i) => (
                <div key={i} className="bg-white border border-stone-100 rounded-sm p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-sm uppercase tracking-wider">{conn.type}</span>
                  </div>
                  <p className="text-sm font-bold text-stone-900 mb-2">{conn.title}</p>
                  <p className="text-xs text-stone-600 leading-relaxed">{conn.description}</p>
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {(result.traditions ?? []).map(t => (
                      <span key={t.tradition} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm"
                        style={{ color: t.accentColor, backgroundColor: `${t.accentColor}15` }}>
                        {t.emoji} {t.tradition}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 text-center py-8">No specific shared connections identified for this topic.</p>
          )}
        </div>
      )}

      {/* ── CONTEXT tab ────────────────────────────────────────────────── */}
      {activeTab === "context" && (
        <div className="space-y-4">
          <div className="bg-white border border-stone-100 rounded-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-indigo-500" />
              <p className="text-sm font-black text-stone-800">Historical & Scholarly Context</p>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">{result.historicalContext}</p>
          </div>

          {/* Per-tradition context cards */}
          {(result.traditions ?? []).map(t => (
            <div key={t.tradition} className="bg-white border border-stone-100 rounded-sm p-5"
              style={{ borderLeftWidth: 3, borderLeftColor: t.accentColor }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{t.emoji}</span>
                <p className="text-sm font-bold text-stone-800">{t.tradition} — Context</p>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">{t.context}</p>
              {t.internalDiversity && (
                <div className="mt-3 pt-3 border-t border-stone-100">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Diversity within this tradition</p>
                  <p className="text-xs text-stone-500 leading-relaxed">{t.internalDiversity}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── STUDY tab ──────────────────────────────────────────────────── */}
      {activeTab === "study" && (
        <StudyCompanion context={{ topic: result.topic }} />
      )}

      {/* Disclaimer — always visible */}
      <div className="flex items-start gap-3 bg-stone-50 border border-stone-200 rounded-sm px-4 py-4">
        <Info className="w-4 h-4 text-stone-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-stone-500 leading-relaxed italic">{result.disclaimer}</p>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function ScriptureExplorerTool({ isSignedIn = false }: { isSignedIn?: boolean }) {
  const [stage,   setStage]   = useState<"input" | "loading" | "results">("input");
  const [result,  setResult]  = useState<ComparisonResult | null>(null);
  const [error,   setError]   = useState("");
  const [loadStep,setLoadStep]= useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [query,   setQuery]   = useState("");
  const [mode,    setMode]    = useState("compare");

  const LOAD_STEPS = [
    "Searching the scriptures…",
    "Gathering passages from each tradition…",
    "Building the comparison…",
    "Mapping shared connections…",
    "Adding historical context…",
    "Preparing your exploration…",
  ];

  const handleExplore = async (q: string, m: string) => {
    setQuery(q); setMode(m);
    setStage("loading"); setError(""); setLoadStep(0); setIsSaved(false);

    const interval = setInterval(() => setLoadStep(p => Math.min(p + 1, LOAD_STEPS.length - 1)), 1200);

    try {
      const res  = await fetch("/api/tools/scripture-explorer/explore", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, mode: m }),
      });
      const data = await res.json();
      clearInterval(interval);

      if (!res.ok || !data.result) {
        setError(data.error ?? "Exploration failed — please try again.");
        setStage("input");
        return;
      }
      setResult(data.result);
      setStage("results");
    } catch {
      clearInterval(interval);
      setError("Network error — please check your connection and try again.");
      setStage("input");
    }
  };

  const handleSave = async () => {
    if (!result || !isSignedIn) return;
    try {
      const res = await fetch("/api/tools/scripture-explorer/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: result.topic, query, mode, result }),
      });
      if (res.ok) setIsSaved(true);
    } catch {}
  };

  return (
    <div className="space-y-0" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* Loading state */}
      {stage === "loading" && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center text-3xl">📖</div>
          </div>
          <div>
            <AnimatePresence mode="wait">
              <motion.p key={loadStep} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }} className="text-sm font-semibold text-stone-600">
                {LOAD_STEPS[loadStep]}
              </motion.p>
            </AnimatePresence>
            <p className="text-xs text-stone-400 mt-1">Consulting all three traditions with care…</p>
          </div>
          <div className="flex gap-1.5">
            {LOAD_STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= loadStep ? "bg-indigo-400" : "bg-stone-200"}`} />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && stage === "input" && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm mb-4">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
        </div>
      )}

      {stage === "input"   && <InputStage onExplore={handleExplore} onLearningPath={(t) => handleExplore(t, "compare")} />}
      {stage === "results" && result && (
        <ResultsStage result={result} onReset={() => { setStage("input"); setResult(null); setIsSaved(false); }}
          onSave={handleSave} isSaved={isSaved} isSignedIn={isSignedIn} />
      )}
    </div>
  );
}