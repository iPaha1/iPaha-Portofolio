"use client";

// =============================================================================
// isaacpaha.com — Prompt Architect — Core Tool
// app/tools/prompt-architect/_prompt-architect/prompt-architect-tool.tsx
// =============================================================================

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence }      from "framer-motion";
import {
  Sparkles, Loader2, AlertCircle, X, Copy, Check, RefreshCw,
  ChevronDown, ChevronUp, Save, Star, Zap, Target, BookOpen,
  Code, Image, BarChart2, Brain, Layers, AlertTriangle,
  CheckCircle2, ArrowRight, Play, FileText, Wand2, Scale,
  Hash, Terminal, Palette, PenTool, TrendingUp, Clock,
  MessageSquare, Plus, Trash2, Eye,
} from "lucide-react";
import { PromptProject } from "./prompt-architect-page";



// ─── Types ────────────────────────────────────────────────────────────────────

export interface TokenGateInfo { required: number; balance: number; toolName: string | null; }
export interface PromptArchitectToolProps {
  isSignedIn?:           boolean;
  onInsufficientTokens?: (info: TokenGateInfo) => void;
  reopenProject?:        PromptProject | null;  // Add this
  onReopened?:           () => void;            // Add this
}


// ─── Config ───────────────────────────────────────────────────────────────────

const ACCENT = "#f59e0b";

const QUALITY_CFG: Record<string, { color: string; bg: string; border: string; label: string; emoji: string }> = {
  POOR:   { color: "#ef4444", bg: "#fee2e2", border: "#fca5a5", label: "Poor",   emoji: "💀" },
  BASIC:  { color: "#f97316", bg: "#ffedd5", border: "#fdba74", label: "Basic",  emoji: "😐" },
  DECENT: { color: "#f59e0b", bg: "#fef3c7", border: "#fcd34d", label: "Decent", emoji: "👍" },
  STRONG: { color: "#10b981", bg: "#d1fae5", border: "#6ee7b7", label: "Strong", emoji: "💪" },
  EXPERT: { color: "#8b5cf6", bg: "#ede9fe", border: "#c4b5fd", label: "Expert", emoji: "🏆" },
};

const CATEGORIES = [
  { id: "CODING_APP",        label: "Code / App",        emoji: "💻", color: "#3b82f6" },
  { id: "WRITING_CONTENT",   label: "Writing",           emoji: "✍️",  color: "#10b981" },
  { id: "IMAGE_GENERATION",  label: "Image Gen",         emoji: "🎨",  color: "#ec4899" },
  { id: "BUSINESS_STRATEGY", label: "Business",          emoji: "📊",  color: "#f97316" },
  { id: "DATA_ANALYSIS",     label: "Data / Analysis",   emoji: "📈",  color: "#6366f1" },
  { id: "CREATIVE_FICTION",  label: "Creative / Fiction",emoji: "📖",  color: "#8b5cf6" },
  { id: "RESEARCH",          label: "Research",          emoji: "🔬",  color: "#14b8a6" },
  { id: "VIDEO_SCRIPT",      label: "Video Script",      emoji: "🎬",  color: "#ef4444" },
  { id: "EDUCATION_TEACHING",label: "Education",         emoji: "🎓",  color: "#f59e0b" },
  { id: "PRODUCTIVITY",      label: "Productivity",      emoji: "⚡",  color: "#10b981" },
  { id: "ROLEPLAY_PERSONA",  label: "Roleplay / Persona",emoji: "🎭",  color: "#ec4899" },
  { id: "GENERAL",           label: "General",           emoji: "✨",  color: "#6b7280" },
];

const AI_MODELS = [
  { id: "ANY",              label: "Any Model",          emoji: "🌐",  desc: "Works everywhere"        },
  { id: "CLAUDE",           label: "Claude",             emoji: "🔮",  desc: "Anthropic's Claude"      },
  { id: "CHATGPT_GPT4",     label: "ChatGPT / GPT-4",   emoji: "🤖",  desc: "OpenAI GPT-4"            },
  { id: "GEMINI",           label: "Gemini",             emoji: "♊",  desc: "Google Gemini"           },
  { id: "MIDJOURNEY",       label: "Midjourney",         emoji: "🎨",  desc: "Image generation"        },
  { id: "DALL_E",           label: "DALL-E",             emoji: "🖼️",  desc: "OpenAI images"           },
  { id: "STABLE_DIFFUSION", label: "Stable Diffusion",   emoji: "🌊",  desc: "Open source images"      },
  { id: "PERPLEXITY",       label: "Perplexity",         emoji: "🔍",  desc: "Research + web"          },
  { id: "LLAMA",            label: "Llama / Mistral",    emoji: "🦙",  desc: "Open source LLMs"       },
];

const TECHNIQUES = [
  { id: "CHAIN_OF_THOUGHT", label: "Chain of Thought",   desc: "Step-by-step reasoning"      },
  { id: "FEW_SHOT",         label: "Few-Shot Examples",  desc: "Show examples in prompt"      },
  { id: "ROLE_PROMPTING",   label: "Role / Persona",     desc: "'Act as a [role]'"            },
  { id: "STRUCTURED_OUTPUT",label: "Structured Output",  desc: "JSON / markdown / table"      },
  { id: "NEGATIVE_PROMPTING",label:"Negative Prompting", desc: "Exclude unwanted content"     },
  { id: "SELF_REFLECTION",  label: "Self-Reflection",    desc: "AI checks its own output"     },
  { id: "TREE_OF_THOUGHT",  label: "Tree of Thought",    desc: "Explore multiple paths"       },
  { id: "REACT",            label: "ReAct Pattern",      desc: "Reason then act"              },
];

const OUTPUT_FORMATS = [
  "Markdown", "JSON", "Plain text", "Numbered list", "Table",
  "HTML", "Code + explanation", "Bullet points", "Essay format",
];

const MODES = [
  { id: "full",     label: "Full Package",    emoji: "🏗️",  desc: "Complete prompt + 3 variants + techniques guide" },
  { id: "quick",    label: "Quick Prompt",    emoji: "⚡",   desc: "Best prompt in seconds"                          },
  { id: "image",    label: "Image Prompt",    emoji: "🎨",   desc: "Midjourney / DALL-E / SD optimised"              },
  { id: "code",     label: "Code Prompt",     emoji: "💻",   desc: "Build apps, scripts, features"                   },
  { id: "chain",    label: "Prompt Chain",    emoji: "🔗",   desc: "Multi-step chain for complex tasks"              },
  { id: "variants", label: "6 Variants",      emoji: "🎲",   desc: "6 techniques applied to your idea"               },
  { id: "explain",  label: "Explain a Prompt",emoji: "🔍",   desc: "Analyse and improve any existing prompt"         },
];

const EXAMPLE_IDEAS = [
  "Build me a React component for a product card with hover animations",
  "Write a LinkedIn post about my promotion that sounds authentic",
  "A photorealistic portrait of a woman in 1920s Paris, golden hour",
  "Help me analyse this month's sales data and find the key patterns",
  "Create a 10-minute YouTube script about AI productivity tools",
  "Write a short story opening with a detective in a futuristic city",
  "Build a Python script that scrapes job listings from LinkedIn",
  "Write an email newsletter for a SaaS product launch",
];

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, label }: { score: number; label: string }) {
  const size = 90;
  const r    = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const cfg  = QUALITY_CFG[label] ?? QUALITY_CFG.DECENT;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={7} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={cfg.color} strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black" style={{ color: cfg.color }}>{score}</span>
        <span className="text-[10px] font-black" style={{ color: cfg.color }}>{cfg.emoji} {cfg.label}</span>
      </div>
    </div>
  );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyBtn({ text, label = "Copy", className = "" }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`flex items-center gap-1.5 text-xs font-bold border transition-all rounded-sm px-3 py-1.5 ${
        copied ? "text-emerald-600 border-emerald-300 bg-emerald-50" : "text-stone-400 border-stone-200 hover:border-stone-400 hover:text-stone-700"
      } ${className}`}>
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? "Copied!" : label}
    </button>
  );
}

// ─── Prompt Display Block ─────────────────────────────────────────────────────

function PromptBlock({
  label, prompt, systemPrompt, negative, badge, onSave,
}: {
  label: string; prompt: string; systemPrompt?: string | null;
  negative?: string | null; badge?: string; onSave?: () => void;
}) {
  const [showSystem, setShowSystem] = useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">{label}</p>
          {badge && <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-sm" style={{ backgroundColor: ACCENT }}>{badge}</span>}
        </div>
        <div className="flex gap-2">
          {systemPrompt && (
            <button onClick={() => setShowSystem(p => !p)}
              className="text-xs text-stone-400 hover:text-stone-700 border border-stone-200 px-2 py-1 rounded-sm">
              {showSystem ? "Hide" : "System Prompt"}
            </button>
          )}
          <CopyBtn text={systemPrompt ? `SYSTEM:\n${systemPrompt}\n\nUSER:\n${prompt}` : prompt} />
          {onSave && (
            <button onClick={onSave} className="flex items-center gap-1 text-xs font-bold text-white px-2.5 py-1 rounded-sm" style={{ backgroundColor: ACCENT }}>
              <Save className="w-3 h-3" />Save
            </button>
          )}
        </div>
      </div>
      {showSystem && systemPrompt && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-sm p-3 mb-1">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wider mb-1">System Prompt</p>
          <pre className="text-xs text-indigo-800 leading-relaxed whitespace-pre-wrap font-mono">{systemPrompt}</pre>
          <CopyBtn text={systemPrompt} label="Copy System Prompt" className="mt-2" />
        </div>
      )}
      <div className="bg-stone-950 text-amber-300 rounded-sm p-5 font-mono text-sm leading-relaxed whitespace-pre-wrap">
        {prompt}
      </div>
      {negative && (
        <div className="bg-red-950 text-red-300 rounded-sm p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
          <p className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-1">Negative Prompt</p>
          {negative}
          <CopyBtn text={negative} label="Copy Negative" className="mt-2" />
        </div>
      )}
    </div>
  );
}

// ─── SCORE MODE ───────────────────────────────────────────────────────────────

function ScoreMode({ onInsufficientTokens }: { onInsufficientTokens?: (info: TokenGateInfo) => void }) {
  const [prompt,   setPrompt]   = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [model,    setModel]    = useState("ANY");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState<any>(null);
  const [showImproved, setShowImproved] = useState(false);

  const score = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/tools/prompt-architect/score", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, category, targetModel: model }),
      });
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: "Prompt Scorer" });
        setLoading(false); return;
      }
      const data = await res.json();
      setResult(data.result);
    } catch {}
    setLoading(false);
  };

  if (!result) return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-sm px-4 py-3.5" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
        <Scale className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
        <p className="text-xs leading-relaxed" style={{ color: "#78350f" }}>
          <span className="font-bold">Paste any AI prompt</span> — no matter how rough or polished. You'll get a score out of 100 with a breakdown across 6 dimensions, and a fully improved version ready to use.
        </p>
      </div>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={6}
        placeholder="Paste any prompt here — yours, something you found online, or a prompt you want to test…"
        className="w-full text-sm border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-amber-400 resize-none font-mono"
      />
      <div className="flex gap-3">
        <select value={category} onChange={e => setCategory(e.target.value)}
          className="text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white">
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
        </select>
        <select value={model} onChange={e => setModel(e.target.value)}
          className="text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white">
          {AI_MODELS.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.label}</option>)}
        </select>
        <button onClick={score} disabled={!prompt.trim() || loading}
          className="flex items-center gap-2 text-sm font-bold text-white px-5 py-2 rounded-sm transition-colors disabled:opacity-40 ml-auto"
          style={{ backgroundColor: ACCENT }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
          {loading ? "Scoring…" : "Score My Prompt"}
        </button>
      </div>
    </div>
  );

  const dimEntries = Object.entries(result.dimensions ?? {});

  return (
    <div className="space-y-5">
      {/* Score header */}
      <div className={`rounded-sm overflow-hidden border`} style={{ borderColor: QUALITY_CFG[result.qualityLabel]?.border ?? "#e5e7eb" }}>
        <div className="flex items-start gap-5 p-5" style={{ backgroundColor: QUALITY_CFG[result.qualityLabel]?.bg ?? "#f9fafb" }}>
          <ScoreRing score={result.overallScore ?? 0} label={result.qualityLabel ?? "DECENT"} />
          <div className="flex-1">
            <p className="text-sm font-black text-stone-900 mb-1">{result.oneLineVerdict}</p>
            <div className="grid grid-cols-2 gap-1.5 mt-3">
              {dimEntries.map(([key, val]: [string, any]) => (
                <div key={key} className="flex items-center justify-between bg-white/70 rounded-sm px-2.5 py-1.5">
                  <span className="text-[10px] font-semibold text-stone-600 capitalize">{key}</span>
                  <span className="text-[10px] font-black" style={{ color: val.score >= 13 ? "#10b981" : val.score >= 8 ? "#f59e0b" : "#ef4444" }}>
                    {val.score}/{key === "constraints" || key === "techniques" ? 16 : 17}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dimension feedback */}
        <div className="border-t divide-y" style={{ borderColor: QUALITY_CFG[result.qualityLabel]?.border ?? "#e5e7eb" }}>
          {dimEntries.map(([key, val]: [string, any]) => (
            <div key={key} className="px-5 py-3">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-stone-500 uppercase tracking-wider capitalize">{key}</p>
                  <p className="text-xs text-stone-700 mt-0.5">{val.feedback}</p>
                </div>
                {val.fix && (
                  <div className="flex-1 border-l border-stone-100 pl-3">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Fix</p>
                    <p className="text-xs text-stone-600 mt-0.5">{val.fix}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What works / fails */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {result.whatWorks?.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-sm p-4">
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-2">✅ What Works</p>
            {result.whatWorks.map((w: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs text-emerald-800 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />{w}
              </div>
            ))}
          </div>
        )}
        {result.whatFails?.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-sm p-4">
            <p className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-2">❌ What Fails</p>
            {result.whatFails.map((f: string, i: number) => (
              <div key={i} className="flex items-start gap-2 text-xs text-red-800 mb-1.5">
                <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />{f}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick fix */}
      {result.quickFix && (
        <div className="flex items-start gap-3 rounded-sm px-4 py-3.5" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
          <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Quickest Fix</p>
            <p className="text-sm font-semibold text-stone-800">{result.quickFix}</p>
          </div>
        </div>
      )}

      {/* Improved prompt */}
      {result.improvedPrompt && (
        <div>
          <button onClick={() => setShowImproved(p => !p)}
            className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-sm mb-3" style={{ backgroundColor: ACCENT }}>
            {showImproved ? <ChevronUp className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
            {showImproved ? "Hide" : "Show"} Improved Prompt
          </button>
          {showImproved && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
              <PromptBlock label="Improved Prompt" prompt={result.improvedPrompt} badge="Fixed" />
              {result.improvementDelta && (
                <p className="text-xs text-stone-500 mt-2 italic">{result.improvementDelta}</p>
              )}
            </motion.div>
          )}
        </div>
      )}

      <button onClick={() => setResult(null)} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700">
        <RefreshCw className="w-3.5 h-3.5" />Score Another Prompt
      </button>
    </div>
  );
}

// ─── Techniques Library ───────────────────────────────────────────────────────

function TechniquesLibrary() {
  const TECH_DETAILS = [
    {
      name: "Role Prompting",
      emoji: "🎭",
      when: "Any task",
      example: "You are a senior software engineer with 15 years of Python experience. You write clean, documented, production-ready code.",
      why: "Activates domain-specific knowledge and style patterns embedded in training data. Better than no role in nearly every case.",
      bonus: "The more specific the role, the better. 'Senior Python engineer at a FAANG company' beats 'developer'.",
    },
    {
      name: "Chain of Thought",
      emoji: "🔗",
      when: "Complex reasoning, maths, multi-step problems",
      example: "Think through this step by step, showing your reasoning at each stage before reaching a conclusion.",
      why: "Forces the model to externalise intermediate reasoning steps, dramatically reducing errors on complex tasks.",
      bonus: "Add 'Let's think step by step' or 'Show your work' to any reasoning prompt.",
    },
    {
      name: "Few-Shot Examples",
      emoji: "🎯",
      when: "Specific format required, tone matching, classification",
      example: "Example 1:\nInput: 'I love this product!'\nOutput: Positive (confidence: 95%)\n\nExample 2:\nInput: 'Waste of money'\nOutput: Negative (confidence: 88%)\n\nNow classify:",
      why: "Shows the model exactly what you want — format, tone, length, style. More effective than lengthy instructions.",
      bonus: "3-5 examples is usually the sweet spot. More can confuse. Match the format you need precisely.",
    },
    {
      name: "Structured Output",
      emoji: "📋",
      when: "Programmatic use, consistent format, data extraction",
      example: "Return your response as a JSON object with these exact fields: {\"title\": string, \"summary\": string, \"confidence\": number}",
      why: "Eliminates variability in output format. Essential for any downstream processing or API usage.",
      bonus: "Include a schema or example JSON. For Claude, use XML tags. For GPT-4, use JSON mode parameter.",
    },
    {
      name: "Negative Prompting",
      emoji: "🚫",
      when: "Image generation, avoiding common AI patterns",
      example: "Do not use bullet points, corporate jargon, or phrases like 'certainly!', 'absolutely!', or 'great question'. Write like a human expert, not an AI assistant.",
      why: "Explicitly excluding unwanted patterns is often more effective than trying to specify the positive version.",
      bonus: "Common things to exclude: hedging language, excessive caveats, AI-isms, irrelevant tangents.",
    },
    {
      name: "Self-Reflection",
      emoji: "🪞",
      when: "Quality-critical outputs, fact-checking, complex analysis",
      example: "After completing your response, review it critically: identify any assumptions you've made, any areas of uncertainty, and any ways the response could be improved. Then provide the improved version.",
      why: "Creates a second-pass review mechanism that catches errors, over-generalisations, and incomplete reasoning.",
      bonus: "Chain it: 'Write → Critique → Rewrite' for highest quality outputs.",
    },
    {
      name: "Constraints",
      emoji: "🎯",
      when: "Precise requirements, testing, consistency",
      example: "Requirements: exactly 150 words, third person only, no use of the words 'very' or 'really', must end with a question.",
      why: "Constraints force creativity and specificity. Without them, AI defaults to the average of its training data.",
      bonus: "Add word count, reading level, format, forbidden words, required elements. Each constraint tightens quality.",
    },
    {
      name: "Context Priming",
      emoji: "🧠",
      when: "Domain-specific tasks, personalisation, complex background",
      example: "Context: You're helping a startup CTO who has 3 engineers, £50k runway, and needs to ship an MVP in 6 weeks. Their tech stack is React, Node.js, PostgreSQL. Given this context:",
      why: "The more relevant context the model has, the less it has to guess — and AI hallucination often stems from filling in missing context incorrectly.",
      bonus: "Include: audience, constraints, goals, current situation, what good looks like.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-2">
      {TECH_DETAILS.map((t, i) => (
        <div key={i} className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 transition-all">
          <button onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-stone-50 transition-colors">
            <span className="text-lg flex-shrink-0">{t.emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-bold text-stone-900">{t.name}</p>
              <p className="text-[10px] text-stone-400">Best for: {t.when}</p>
            </div>
            {openIndex === i ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                <div className="border-t border-stone-100 px-4 py-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">Why It Works</p>
                    <p className="text-xs text-stone-700 leading-relaxed">{t.why}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Example</p>
                      <CopyBtn text={t.example} label="Copy Example" />
                    </div>
                    <div className="bg-stone-950 text-amber-300 rounded-sm px-4 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                      {t.example}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-sm px-3 py-2.5" style={{ backgroundColor: `${ACCENT}08` }}>
                    <Zap className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                    <p className="text-xs text-stone-700"><span className="font-bold" style={{ color: ACCENT }}>Pro tip:</span> {t.bonus}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function PromptArchitectTool({ 
  isSignedIn = false, 
  onInsufficientTokens,
  reopenProject,
  onReopened,
}: PromptArchitectToolProps) {
  const [stage,       setStage]       = useState<"input" | "loading" | "results">("input");
  const [result,      setResult]      = useState<any>(null);
  const [error,       setError]       = useState("");
  const [loadStep,    setLoadStep]    = useState(0);
  const [activeMode,  setActiveMode]  = useState("full");
  const [activeView,  setActiveView]  = useState<"generate" | "score" | "library">("generate");

  // Input state
  const [rawIdea,       setRawIdea]       = useState("");
  const [category,      setCategory]      = useState("GENERAL");
  const [targetModel,   setTargetModel]   = useState("ANY");
  const [techniques,    setTechniques]    = useState<string[]>([]);
  const [outputFormat,  setOutputFormat]  = useState("");
  const [tone,          setTone]          = useState("");
  const [complexity,    setComplexity]    = useState("intermediate");
  const [context,       setContext]       = useState("");
  const [showAdvanced,  setShowAdvanced]  = useState(false);
  const [promptToExplain, setPromptToExplain] = useState("");

  // Results UI
  const [activeTab,    setActiveTab]    = useState<"main" | "variants" | "advanced" | "techniques" | "iterate">("main");
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [projectId,    setProjectId]    = useState<string | null>(null);
  const [copiedKey,    setCopiedKey]    = useState("");

  // ── Reopen a saved project from dashboard ──────────────────────────────
  useEffect(() => {
    if (!reopenProject) return;
    
    try {
      // Populate the input fields from the saved project
      setRawIdea(reopenProject.rawIdea ?? "");
      setCategory(reopenProject.category ?? "GENERAL");
      setTargetModel(reopenProject.targetModel ?? "ANY");
      
      // If there's a generated prompt, we could also set the result
      if (reopenProject.generatedPrompt && reopenProject.qualityScore) {
        // Reconstruct the result object
        const reconstructedResult = {
          mainPrompt: reopenProject.generatedPrompt,
          title: reopenProject.title,
          // You might need to parse additional data if stored
        };
        setResult(reconstructedResult);
        setStage("results");
        setActiveTab("main");
      } else {
        // If no saved result, just go to input with pre-filled fields
        setStage("input");
      }
      
      onReopened?.();
    } catch (err) {
      console.error("Failed to reopen project:", err);
    }
  }, [reopenProject]);

  const LOAD_STEPS = [
    "Analysing your idea…",
    "Engineering the prompt structure…",
    "Applying prompt techniques…",
    "Optimising for your target model…",
    "Generating variants…",
    "Building your prompt package…",
  ];

  const toggleTechnique = (id: string) => {
    setTechniques(p => p.includes(id) ? p.filter(t => t !== id) : [...p, id]);
  };

  const handleGenerate = async () => {
    const idea = activeMode === "explain" ? promptToExplain : rawIdea;
    if (!idea.trim()) return;
    setStage("loading"); setError(""); setLoadStep(0); setResult(null); setProjectId(null);
    const interval = setInterval(() => setLoadStep(p => Math.min(p + 1, LOAD_STEPS.length - 1)), 1100);

    try {
      const res = await fetch("/api/tools/prompt-architect/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawIdea: idea, category, targetModel, techniques, outputFormat,
          tone, complexity, context, mode: activeMode,
          promptToExplain: activeMode === "explain" ? promptToExplain : undefined,
        }),
      });
      if (res.status === 402) {
        const data = await res.json();
        if (onInsufficientTokens) onInsufficientTokens({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: "Prompt Architect" });
        clearInterval(interval); setStage("input");
        setError("You're out of tokens. Play some games to earn more."); return;
      }
      clearInterval(interval);
      const data = await res.json();
      if (!res.ok || !data.result) { setError(data.error ?? "Generation failed."); setStage("input"); return; }
      setResult(data.result);
      setActiveTab("main");
      setStage("results");
    } catch { clearInterval(interval); setError("Network error — please try again."); setStage("input"); }
  };

  const handleSave = async () => {
    if (!isSignedIn || !result) return;
    setSaving(true);
    const res = await fetch("/api/tools/prompt-architect/save", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawIdea, category, targetModel, techniques, result }),
    });
    const data = await res.json();
    if (data.ok) { setSaved(true); setProjectId(data.projectId ?? null); setTimeout(() => setSaved(false), 3000); }
    setSaving(false);
  };

  // ── INPUT ──────────────────────────────────────────────────────────────────
  if (stage === "input") return (
    <div className="space-y-6" style={{ fontFamily: "Sora, sans-serif" }}>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          <button onClick={() => setError("")} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* View switcher */}
      <div className="flex gap-1 border-b border-stone-100 pb-4">
        {[
          { id: "generate", label: "Generate Prompt",     emoji: "⚡" },
          { id: "score",    label: "Score a Prompt",      emoji: "📊" },
          { id: "library",  label: "Techniques Library",  emoji: "📚" },
        ].map(v => (
          <button key={v.id} onClick={() => setActiveView(v.id as any)}
            className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-sm border transition-all ${
              activeView === v.id ? "text-white border-transparent" : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
            }`}
            style={activeView === v.id ? { backgroundColor: ACCENT } : {}}>
            <span>{v.emoji}</span>{v.label}
          </button>
        ))}
      </div>

      {activeView === "score" && <ScoreMode onInsufficientTokens={onInsufficientTokens} />}
      {activeView === "library" && <TechniquesLibrary />}

      {activeView === "generate" && (
        <>
          {/* Mode selector */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">What do you want?</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
              {MODES.map(m => (
                <button key={m.id} onClick={() => setActiveMode(m.id)}
                  className={`flex flex-col items-start gap-1 p-3 rounded-sm border text-left transition-all ${
                    activeMode === m.id ? "text-white border-transparent" : "bg-white border-stone-200 hover:border-stone-400"
                  }`}
                  style={activeMode === m.id ? { backgroundColor: ACCENT } : {}}>
                  <span className="text-xl">{m.emoji}</span>
                  <span className={`text-xs font-black leading-tight ${activeMode === m.id ? "text-white" : "text-stone-800"}`}>{m.label}</span>
                  <span className={`text-[10px] leading-tight ${activeMode === m.id ? "text-white/70" : "text-stone-400"}`}>{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main input */}
          {activeMode === "explain" ? (
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Paste the Prompt to Analyse</label>
              <textarea value={promptToExplain} onChange={e => setPromptToExplain(e.target.value)} rows={6}
                placeholder="Paste any AI prompt here. I'll score it, explain what works and what doesn't, then give you a fully improved version…"
                className="w-full text-sm border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-amber-400 resize-none font-mono"
              />
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">
                Describe what you want your prompt to do *
              </label>
              <textarea value={rawIdea} onChange={e => setRawIdea(e.target.value)} rows={4}
                placeholder={
                  activeMode === "image"   ? "Describe the image: style, subject, mood, setting…" :
                  activeMode === "code"    ? "Describe the code/app: language, features, requirements…" :
                  activeMode === "chain"   ? "Describe the complex task that needs multiple steps…" :
                  "What do you want the AI to do? Be as rough or as detailed as you like…"
                }
                className="w-full text-sm border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-amber-400 resize-none"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {EXAMPLE_IDEAS.slice(0, 4).map(ex => (
                  <button key={ex} onClick={() => setRawIdea(ex)}
                    className="text-xs text-stone-500 bg-stone-50 border border-stone-200 hover:border-amber-400 hover:text-amber-700 px-2.5 py-1 rounded-sm transition-colors truncate max-w-[200px]">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Category + Model */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Category</label>
              <div className="grid grid-cols-3 gap-1">
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setCategory(c.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-sm border text-xs transition-all ${
                      category === c.id ? "text-white border-transparent" : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
                    }`}
                    style={category === c.id ? { backgroundColor: c.color } : {}}>
                    <span>{c.emoji}</span><span className="font-bold truncate">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Target AI Model</label>
              <div className="grid grid-cols-1 gap-1">
                {AI_MODELS.map(m => (
                  <button key={m.id} onClick={() => setTargetModel(m.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-sm border text-xs transition-all ${
                      targetModel === m.id ? "text-white border-transparent" : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
                    }`}
                    style={targetModel === m.id ? { backgroundColor: ACCENT } : {}}>
                    <span>{m.emoji}</span>
                    <span className="font-bold">{m.label}</span>
                    <span className={`ml-auto ${targetModel === m.id ? "text-white/70" : "text-stone-400"} text-[10px]`}>{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Techniques */}
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Techniques to Apply</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
              {TECHNIQUES.map(t => (
                <button key={t.id} onClick={() => toggleTechnique(t.id)}
                  className={`flex flex-col items-start gap-0.5 p-2.5 rounded-sm border text-left text-xs transition-all ${
                    techniques.includes(t.id) ? "text-white border-transparent" : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
                  }`}
                  style={techniques.includes(t.id) ? { backgroundColor: ACCENT } : {}}>
                  <span className={`font-bold ${techniques.includes(t.id) ? "text-white" : "text-stone-800"}`}>{t.label}</span>
                  <span className={`text-[10px] ${techniques.includes(t.id) ? "text-white/70" : "text-stone-400"}`}>{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Advanced */}
          <div>
            <button onClick={() => setShowAdvanced(p => !p)}
              className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-700">
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Advanced options (output format, tone, context, complexity)
            </button>
            <AnimatePresence>
              {showAdvanced && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Output Format</label>
                      <select value={outputFormat} onChange={e => setOutputFormat(e.target.value)}
                        className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white">
                        <option value="">Auto-select</option>
                        {OUTPUT_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Complexity Level</label>
                      <select value={complexity} onChange={e => setComplexity(e.target.value)}
                        className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white">
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Tone</label>
                      <input value={tone} onChange={e => setTone(e.target.value)}
                        placeholder="e.g. professional, casual, technical, witty"
                        className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Additional Context</label>
                      <input value={context} onChange={e => setContext(e.target.value)}
                        placeholder="Any extra context for the prompt engineer…"
                        className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={handleGenerate}
            disabled={!((activeMode === "explain" ? promptToExplain : rawIdea).trim())}
            className="w-full flex items-center justify-center gap-2 text-base font-bold text-white py-4 rounded-sm transition-colors shadow-sm disabled:opacity-40"
            style={{ backgroundColor: ACCENT }}>
            <Wand2 className="w-5 h-5" />
            {activeMode === "full"     ? "Build My Prompt Package" :
             activeMode === "quick"    ? "Write My Prompt"         :
             activeMode === "image"    ? "Build Image Prompt"      :
             activeMode === "code"     ? "Build Code Prompt"       :
             activeMode === "chain"    ? "Build Prompt Chain"      :
             activeMode === "variants" ? "Generate 6 Variants"     :
             "Analyse & Improve Prompt"}
          </button>
        </>
      )}
    </div>
  );

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (stage === "loading") return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-amber-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">⚡</div>
      </div>
      <div>
        <AnimatePresence mode="wait">
          <motion.p key={loadStep} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="text-sm font-semibold text-stone-600">{LOAD_STEPS[loadStep]}</motion.p>
        </AnimatePresence>
        <p className="text-xs text-stone-400 mt-1">Engineering your expert-level prompt…</p>
      </div>
      <div className="flex gap-1.5">
        {LOAD_STEPS.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= loadStep ? "bg-amber-400" : "bg-stone-200"}`} />)}
      </div>
    </div>
  );

  // ── RESULTS ────────────────────────────────────────────────────────────────
  if (!result) return null;

  // Detect mode-specific result structures
  const isChainMode    = !!result.chain;
  const isVariantsMode = !!result.variants && Array.isArray(result.variants) && result.variants[0]?.technique;
  const isExplainMode  = !!result.anatomyBreakdown;
  const isImageMode    = !!result.keyElements;
  const isCodeMode     = !!result.specificationPrompt;
  const isQuickMode    = !result.mainPrompt?.userPrompt && !!result.prompt;

  const RESULT_TABS = isChainMode ? [
    { id: "main",       label: "The Chain",   icon: Layers   },
  ] : isVariantsMode ? [
    { id: "main",       label: "6 Variants",  icon: Layers   },
  ] : isExplainMode ? [
    { id: "main",       label: "Analysis",    icon: Eye      },
    { id: "advanced",   label: "Improved",    icon: Wand2    },
  ] : [
    { id: "main",       label: "Main Prompt", icon: Terminal },
    { id: "variants",   label: "Variants",    icon: Layers   },
    { id: "advanced",   label: "Advanced",    icon: Brain    },
    { id: "techniques", label: "Techniques",  icon: BookOpen },
    { id: "iterate",    label: "Iterate",     icon: RefreshCw},
  ] as const;

  const mainPromptText = result.mainPrompt?.userPrompt ?? result.prompt ?? result.mainPrompt ?? "";
  const sysPromptText  = result.mainPrompt?.systemPrompt ?? null;
  const negPromptText  = result.mainPrompt?.negativePrompt ?? result.negativePrompt ?? null;

  return (
    <div className="space-y-5" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* Results header */}
      <div className="bg-stone-900 text-white rounded-sm p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">
              {isChainMode ? "Prompt Chain" : isVariantsMode ? "Variant Set" : isExplainMode ? "Prompt Analysis" : "Prompt Package"}
            </p>
            <p className="text-xl font-black text-amber-300 leading-tight">
              {result.title ?? result.chainTitle ?? "Your Engineered Prompt"}
            </p>
            {result.promptAnalysis?.expectedOutput && (
              <p className="text-xs text-white/55 mt-1 leading-relaxed">{result.promptAnalysis.expectedOutput}</p>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {isSignedIn && (
              <button onClick={handleSave} disabled={saving || saved}
                className={`flex items-center gap-1.5 text-xs font-bold border px-3 py-2 rounded-sm transition-all ${
                  saved ? "text-emerald-400 border-emerald-400/40 bg-emerald-400/10"
                  : "text-white/50 hover:text-white border-white/15 hover:border-white/30"
                }`}>
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saved ? "Saved!" : "Save"}
              </button>
            )}
            <button onClick={() => { setStage("input"); setResult(null); }}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm">
              <RefreshCw className="w-3 h-3" />New
            </button>
          </div>
        </div>

        {/* Copy-paste ready */}
        {result.copyPasteReady && (
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-sm px-4 py-2.5">
            <p className="text-xs text-white/60 truncate flex-1 font-mono">{result.copyPasteReady.slice(0, 100)}…</p>
            <CopyBtn text={result.copyPasteReady} label="Copy Best" className="ml-3 flex-shrink-0 !text-white/60 !border-white/20 hover:!text-white hover:!border-white/40" />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-stone-100 overflow-x-auto">
        {RESULT_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id ? "border-amber-500 text-amber-600" : "border-transparent text-stone-400 hover:text-stone-700"
            }`}>
            <t.icon className="w-3.5 h-3.5" />{t.label}
          </button>
        ))}
      </div>

      {/* ── MAIN tab ──────────────────────────────────────────────────────── */}
      {activeTab === "main" && (
        <div className="space-y-5">
          {/* Standard main prompt */}
          {!isChainMode && !isVariantsMode && !isExplainMode && mainPromptText && (
            <PromptBlock label="Your Engineered Prompt" prompt={mainPromptText}
              systemPrompt={sysPromptText} negative={negPromptText} badge="Main"
              onSave={isSignedIn ? handleSave : undefined} />
          )}

          {/* Image mode */}
          {isImageMode && (
            <div className="space-y-4">
              <PromptBlock label="Main Image Prompt" prompt={result.mainPrompt ?? ""} negative={result.negativePrompt} badge="Main" />
              {result.variants?.map((v: any, i: number) => (
                <div key={i} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-100">
                    <div>
                      <p className="text-xs font-black text-stone-800">{v.style}</p>
                      {v.params && <p className="text-[10px] text-stone-400 font-mono mt-0.5">{v.params}</p>}
                    </div>
                    <CopyBtn text={`${v.prompt} ${v.params ?? ""}`} />
                  </div>
                  <div className="bg-stone-950 text-amber-300 px-5 py-4 font-mono text-sm leading-relaxed">{v.prompt}</div>
                </div>
              ))}
              {result.proTips?.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-sm p-4">
                  <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-2">Pro Tips</p>
                  {result.proTips.map((tip: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-800 mb-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />{tip}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Code mode */}
          {isCodeMode && (
            <div className="space-y-4">
              {result.systemPrompt && <PromptBlock label="System Prompt (Role)" prompt={result.systemPrompt} />}
              <PromptBlock label="Main Coding Prompt" prompt={result.mainPrompt ?? ""} badge="Main" />
              {result.specificationPrompt && (
                <div>
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Specification-First Approach</p>
                  <p className="text-xs text-stone-500 mb-2">Use this first to make the AI plan before coding — prevents hallucination.</p>
                  <PromptBlock label="Spec Prompt" prompt={result.specificationPrompt} />
                </div>
              )}
              {result.iterativeApproach && (
                <div className="bg-white border border-stone-100 rounded-sm p-5">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Iterative Build Approach</p>
                  {Object.entries(result.iterativeApproach).map(([k, v]: [string, any], i) => (
                    <div key={k} className="flex gap-3 mb-3 last:mb-0">
                      <div className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                        style={{ backgroundColor: ACCENT }}>{i + 1}</div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1">{k}</p>
                        <p className="text-xs text-stone-700 font-mono bg-stone-50 rounded-sm px-3 py-2">{v}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chain mode */}
          {isChainMode && (
            <div className="space-y-3">
              <div className="rounded-sm px-4 py-3.5" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
                <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Why a Chain?</p>
                <p className="text-sm text-stone-700">{result.overview}</p>
                {result.timeEstimate && <p className="text-xs text-stone-400 mt-1">⏱ {result.timeEstimate}</p>}
              </div>
              {result.chain?.map((step: any, i: number) => (
                <div key={i} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 bg-stone-50 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-sm flex items-center justify-center text-sm font-black text-white"
                        style={{ backgroundColor: ACCENT }}>S{step.step}</div>
                      <div>
                        <p className="text-sm font-bold text-stone-900">{step.title}</p>
                        <p className="text-[10px] text-stone-400">Expected: {step.expectedOutput}</p>
                      </div>
                    </div>
                    <CopyBtn text={step.prompt} />
                  </div>
                  <div className="bg-stone-950 text-amber-300 px-5 py-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">{step.prompt}</div>
                  {step.howToFeedToNextStep && (
                    <div className="px-5 py-3 border-t border-stone-100">
                      <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-0.5">Feed to next step</p>
                      <p className="text-xs text-stone-600">{step.howToFeedToNextStep}</p>
                    </div>
                  )}
                </div>
              ))}
              {result.finalSynthesisPrompt && (
                <PromptBlock label="Final Synthesis Prompt" prompt={result.finalSynthesisPrompt} badge="Last Step" />
              )}
            </div>
          )}

          {/* Variants mode (6 variants) */}
          {isVariantsMode && (
            <div className="space-y-3">
              {result.variants?.map((v: any, i: number) => (
                <div key={i} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
                  <div className="flex items-start justify-between px-5 py-3 bg-stone-50 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                          style={{ backgroundColor: ACCENT }}>{i + 1}</div>
                        <p className="text-xs font-black text-stone-600 uppercase tracking-wider">{v.technique} — {v.techniqueName}</p>
                      </div>
                      <p className="text-[10px] text-stone-400 ml-8">{v.bestFor}</p>
                    </div>
                    <CopyBtn text={v.prompt} />
                  </div>
                  <div className="bg-stone-950 text-amber-300 px-5 py-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">{v.prompt}</div>
                </div>
              ))}
              {result.recommendation && (
                <div className="rounded-sm px-4 py-3.5" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
                  <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Recommendation</p>
                  <p className="text-sm font-semibold text-stone-800">{result.recommendation}</p>
                </div>
              )}
            </div>
          )}

          {/* Explain mode — analysis */}
          {isExplainMode && (
            <div className="space-y-4">
              <div className="rounded-sm px-4 py-3.5" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
                <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Overall Assessment</p>
                <p className="text-sm font-semibold text-stone-800">{result.overallAssessment}</p>
              </div>
              {/* Anatomy */}
              {result.anatomyBreakdown?.length > 0 && (
                <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
                  <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider px-5 py-3 border-b border-stone-100">Prompt Anatomy</p>
                  <div className="divide-y divide-stone-50">
                    {result.anatomyBreakdown.map((a: any, i: number) => (
                      <div key={i} className="flex items-start gap-3 px-5 py-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm flex-shrink-0 mt-0.5 ${
                          a.quality === "STRONG" ? "bg-emerald-100 text-emerald-700" :
                          a.quality === "WEAK" ? "bg-red-100 text-red-600" :
                          a.quality === "MISSING" ? "bg-stone-100 text-stone-400" : "bg-amber-100 text-amber-700"
                        }`}>{a.quality}</span>
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">{a.type}</p>
                          <p className="text-xs text-stone-700 mt-0.5">{a.explanation}</p>
                          {a.element && <p className="text-[10px] text-stone-400 font-mono mt-1 bg-stone-50 px-2 py-1 rounded-sm">"{a.element}"</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Strengths + weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.strengths?.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-sm p-4">
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-2">✅ Strengths</p>
                    {result.strengths.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-emerald-800 mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />{s}
                      </div>
                    ))}
                  </div>
                )}
                {result.weaknesses?.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-sm p-4">
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-2">❌ Weaknesses</p>
                    {result.weaknesses.map((w: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-red-800 mb-1">
                        <X className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />{w}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {result.quickFix && (
                <div className="flex items-start gap-3 rounded-sm px-4 py-3.5" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
                  <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Quick Fix</p>
                    <p className="text-sm font-semibold text-stone-800">{result.quickFix}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Why it works (full mode) */}
          {result.promptAnalysis?.whyItWorks && (
            <div className="rounded-sm px-4 py-4" style={{ backgroundColor: `${ACCENT}06`, borderLeft: `3px solid ${ACCENT}` }}>
              <p className="text-[10px] font-black uppercase tracking-wider mb-1.5" style={{ color: ACCENT }}>Why This Works</p>
              <p className="text-sm text-stone-700 leading-relaxed">{result.promptAnalysis.whyItWorks}</p>
            </div>
          )}

          {/* Common mistakes */}
          {result.commonMistakes?.length > 0 && (
            <div className="bg-white border border-stone-100 rounded-sm p-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Common Mistakes People Make</p>
              {result.commonMistakes.map((m: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-xs text-stone-600 mb-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />{m}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── VARIANTS tab ──────────────────────────────────────────────────── */}
      {activeTab === "variants" && result.variants?.length > 0 && (
        <div className="space-y-3">
          {result.variants.map((v: any, i: number) => (
            <div key={i} className="bg-white border border-stone-100 rounded-sm overflow-hidden">
              <div className="flex items-start justify-between px-5 py-3 bg-stone-50 border-b border-stone-100">
                <div>
                  <p className="text-xs font-black text-stone-800">{v.name}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">{v.whenToUse}</p>
                </div>
                <CopyBtn text={v.prompt} />
              </div>
              <div className="bg-stone-950 text-amber-300 px-5 py-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">{v.prompt}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADVANCED tab ──────────────────────────────────────────────────── */}
      {activeTab === "advanced" && (
        <div className="space-y-4">
          {/* For explain mode: improved prompt */}
          {isExplainMode && result.improvedPrompt && (
            <div>
              <PromptBlock label="Improved Prompt" prompt={result.improvedPrompt} badge="Upgraded" />
              {result.improvementExplained && (
                <p className="text-xs text-stone-500 mt-2 leading-relaxed">{result.improvementExplained}</p>
              )}
            </div>
          )}
          {/* For full mode: advanced version */}
          {result.advancedVersion?.prompt && (
            <div>
              <PromptBlock label="Advanced Version" prompt={result.advancedVersion.prompt} badge="Advanced" />
              {result.advancedVersion.addedTechniques?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {result.advancedVersion.addedTechniques.map((t: string, i: number) => (
                    <span key={i} className="text-[11px] font-bold text-white px-2.5 py-1 rounded-sm" style={{ backgroundColor: ACCENT }}>{t}</span>
                  ))}
                </div>
              )}
              {result.advancedVersion.tradeOff && (
                <p className="text-xs text-stone-500 mt-2">{result.advancedVersion.tradeOff}</p>
              )}
            </div>
          )}
          {/* Prompt DNA */}
          {result.promptDNA && (
            <div className="bg-white border border-stone-100 rounded-sm p-5">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Prompt DNA Breakdown</p>
              <div className="space-y-2">
                {Object.entries(result.promptDNA).map(([k, v]: [string, any]) => v && (
                  <div key={k} className="flex items-start gap-3 py-2 border-b border-stone-50 last:border-0">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider w-20 flex-shrink-0 mt-0.5 capitalize">{k}</span>
                    <p className="text-xs text-stone-700 leading-relaxed">{v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TECHNIQUES tab ────────────────────────────────────────────────── */}
      {activeTab === "techniques" && result.techniques?.length > 0 && (
        <div className="space-y-3">
          {result.techniques.map((t: any, i: number) => (
            <div key={i} className="bg-white border border-stone-100 rounded-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-black text-white px-2.5 py-1 rounded-sm" style={{ backgroundColor: ACCENT }}>{t.name}</span>
              </div>
              <p className="text-sm font-semibold text-stone-800 mb-1">{t.applied}</p>
              <p className="text-xs text-stone-500 leading-relaxed">{t.whyEffective}</p>
            </div>
          ))}
          {result.promptAnalysis?.modelSpecificNotes && (
            <div className="rounded-sm px-4 py-3" style={{ backgroundColor: `${ACCENT}06`, borderLeft: `3px solid ${ACCENT}` }}>
              <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Model-Specific Notes</p>
              <p className="text-sm text-stone-700">{result.promptAnalysis.modelSpecificNotes}</p>
            </div>
          )}
        </div>
      )}

      {/* ── ITERATE tab ───────────────────────────────────────────────────── */}
      {activeTab === "iterate" && result.iterationGuide && (
        <div className="space-y-3">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">When the output isn't right, tweak this:</p>
          {[
            { label: "Output too long",  value: result.iterationGuide.ifOutputTooLong,  icon: "📏" },
            { label: "Output too short", value: result.iterationGuide.ifOutputTooShort, icon: "📌" },
            { label: "Too generic",      value: result.iterationGuide.ifTooGeneric,      icon: "🎯" },
            { label: "Wrong tone",       value: result.iterationGuide.ifWrongTone,       icon: "🎭" },
          ].map(s => s.value && (
            <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold text-stone-800">{s.icon} {s.label}</p>
              </div>
              <div className="bg-stone-50 rounded-sm px-3 py-2 font-mono text-xs text-stone-700">{s.value}</div>
            </div>
          ))}
          {result.iterationGuide.paramToTweak && (
            <div className="flex items-start gap-3 rounded-sm px-4 py-3.5" style={{ backgroundColor: `${ACCENT}08`, borderLeft: `3px solid ${ACCENT}` }}>
              <Target className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: ACCENT }} />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider mb-1" style={{ color: ACCENT }}>Highest Impact Tweak</p>
                <p className="text-sm font-semibold text-stone-800">{result.iterationGuide.paramToTweak}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}