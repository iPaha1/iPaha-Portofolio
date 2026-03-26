"use client";

// =============================================================================
// isaacpaha.com — Blog Brainstorm Tab
// components/admin/blog/brainstorm-tab.tsx
//
// Full-session AI blog brainstorming:
//   - 7 modes: ideas, title battle, outline, angle, series plan, seasonal, question-driven
//   - Session history (last 10)
//   - "Use this" → prefills the Post Editor
// =============================================================================

import React, { useState, useRef } from "react";
import {
  Sparkles, Loader2, AlertCircle, X, Copy, Check,
  Lightbulb, FileText, AlignLeft, Telescope, ListOrdered,
  Calendar, HelpCircle, Brain, Pencil, RefreshCw,
} from "lucide-react";

type AIMode = {
  id:      string;
  label:   string;
  icon:    React.ElementType;
  color:   string;
  desc:    string;
  prompts: string[];
};

const MODES: AIMode[] = [
  {
    id: "ideas", label: "Generate Post Ideas", icon: Lightbulb, color: "#f59e0b",
    desc: "Brainstorm 5-7 concrete, specific post ideas from a theme or topic area",
    prompts: [
      "The future of African fintech infrastructure",
      "Lessons from building okSumame courier integrations",
      "What solo founding teaches you that teams don't",
    ],
  },
  {
    id: "titles", label: "Title Battle", icon: FileText, color: "#8b5cf6",
    desc: "Generate 8 competing title options for the same post — pick the strongest",
    prompts: [
      "Why I chose The Open University over a traditional degree",
      "How mobile money is reshaping African e-commerce",
      "Building AI tools that actually make people better at thinking",
    ],
  },
  {
    id: "outline", label: "Deep Outline", icon: AlignLeft, color: "#3b82f6",
    desc: "Full detailed outline: thesis, section breakdown, research hooks, opening hook",
    prompts: [
      "The trust problem in West African e-commerce",
      "AI productivity tools optimise the wrong variable",
      "Why emerging market founders need to rethink Silicon Valley playbooks",
    ],
  },
  {
    id: "angle", label: "Fresh Angle Finder", icon: Telescope, color: "#10b981",
    desc: "Take a common topic and find 5 unexpected, contrarian, or underexplored angles",
    prompts: [
      "Artificial intelligence and jobs",
      "Building a startup as a solo founder",
      "Education technology in Africa",
    ],
  },
  {
    id: "series", label: "Series Planner", icon: ListOrdered, color: "#ec4899",
    desc: "Plan a 4-6 part blog series — arc, titles, individual post focuses",
    prompts: [
      "Building Okpah: lessons from 5 years building African tech",
      "The AI Productivity Stack: tools that actually work",
      "West Africa Founder Playbook",
    ],
  },
  {
    id: "seasonal", label: "Timely Topics", icon: Calendar, color: "#f97316",
    desc: "Suggest 5 posts that connect Isaac's expertise to current tech/world events",
    prompts: [
      "What's happening in AI right now that Isaac should be writing about",
      "Africa tech news and trends this quarter",
      "Startup ecosystem signals worth writing about",
    ],
  },
  {
    id: "question", label: "Question-Driven", icon: HelpCircle, color: "#6366f1",
    desc: "Turn a question or frustration into a compelling post concept",
    prompts: [
      "Why do so many AI productivity tools fail the people who need them most?",
      "What does it actually take to build a company across two countries?",
      "Is the African tech narrative too focused on fintech?",
    ],
  },
];

const PROMPTS: Record<string, string> = {
  ideas:    "Brainstorm 5-7 concrete, specific blog post ideas on this theme. For each: a punchy working title, one sentence on the core argument, and why Isaac is uniquely positioned to write it.\n\nTheme: ",
  titles:   "Generate 8 competing title options for this post. Mix styles: declarative statement, question, numbered, contrarian, first-person confession, unexpected metaphor, short punchy, and long specific. All must feel authentic to Isaac — not clickbait.\n\nPost topic: ",
  outline:  "Create a detailed blog post outline for Isaac to write from. Include: sharpened title, one-sentence thesis, opening hook, 4-5 H2 sections each with 2-3 bullet points of what to cover, key data/examples to include, and suggested tags.\n\nTopic: ",
  angle:    "This topic has been written to death. Give Isaac 5 fresh, contrarian, or genuinely underexplored angles that nobody else has covered well. For each: the angle, what makes it fresh, and the core argument.\n\nTopic: ",
  series:   "Plan a 4-6 part blog series. Provide: series title, one-sentence series premise, and for each post: working title, what it specifically covers, why it belongs in the series. Include a note on what makes this series valuable to complete (not just individual posts).\n\nSeries concept: ",
  seasonal: "Suggest 5 timely blog post ideas for Isaac based on what's happening in tech/business/Africa right now. For each: why it's timely, Isaac's specific angle, and a working title. Connect to his expertise and companies.\n\nContext: ",
  question: "Turn this question/frustration into a compelling blog post concept. Provide: the post's central argument, 3-4 key points to cover, the 'aha moment' Isaac can give the reader, a working title, and who specifically should read this.\n\nQuestion/frustration: ",
};

function buildApiPrompt(mode: string, input: string): string {
  return (PROMPTS[mode] ?? "") + input;
}

interface BrainstormTabProps {
  onUsePost: (data: { title: string; content?: string; tags?: string[] }) => void;
}

export function BrainstormTab({ onUsePost }: BrainstormTabProps) {
  const [selectedMode,  setSelectedMode]  = useState<string>("ideas");
  const [prompt,        setPrompt]        = useState("");
  const [loading,       setLoading]       = useState(false);
  const [result,        setResult]        = useState("");
  const [error,         setError]         = useState("");
  const [copied,        setCopied]        = useState(false);
  const [history,       setHistory]       = useState<{ mode: string; prompt: string; result: string }[]>([]);
  const resultRef = useRef<HTMLDivElement>(null);

  const currentMode = MODES.find((m) => m.id === selectedMode)!;

  const run = async () => {
    if (!prompt.trim()) return;
    setLoading(true); setResult(""); setError("");

    const fullPrompt = buildApiPrompt(selectedMode, prompt.trim());

    try {
      const res  = await fetch("/api/admin/blog/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "draft", prompt: fullPrompt }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Generation failed");
      } else {
        setResult(data.content ?? "");
        setHistory((h) => [{ mode: selectedMode, prompt: prompt.trim(), result: data.content }, ...h.slice(0, 9)]);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract first post title from result for "Use this" button
  const extractFirstTitle = (): string | null => {
    const patterns = [
      /^#+\s+(.+)$/m,
      /^1\.\s+\*\*(.+?)\*\*/m,
      /^1\.\s+(.+)$/m,
      /\*\*Title:\*\*\s*(.+)/i,
      /Title:\s*(.+)/i,
    ];
    for (const p of patterns) {
      const m = result.match(p);
      if (m?.[1]) return m[1].trim().replace(/[*_]/g, "");
    }
    return null;
  };

  const firstTitle = result ? extractFirstTitle() : null;

  return (
    <div className="flex h-full overflow-hidden">

      {/* Left sidebar: mode selector */}
      <div className="w-72 flex-shrink-0 border-r border-stone-100 overflow-y-auto p-4 space-y-5">
        <div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Brainstorm Mode</p>
          <div className="space-y-1.5">
            {MODES.map((m) => (
              <button key={m.id} onClick={() => setSelectedMode(m.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-sm text-left border transition-colors ${
                  selectedMode === m.id
                    ? "bg-amber-50 border-amber-200"
                    : "bg-white border-stone-100 hover:bg-stone-50 hover:border-stone-200"
                }`}>
                <m.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: selectedMode === m.id ? m.color : "#9ca3af" }} />
                <div>
                  <p className={`text-xs font-bold leading-tight ${selectedMode === m.id ? "text-amber-700" : "text-stone-700"}`}>{m.label}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5 leading-snug">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Session history */}
        {history.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Session History</p>
            <div className="space-y-1">
              {history.slice(0, 6).map((h, i) => (
                <button key={i} onClick={() => { setPrompt(h.prompt); setSelectedMode(h.mode); setResult(h.result); }}
                  className="w-full text-left px-2.5 py-2 rounded-sm text-[11px] text-stone-500 hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-colors">
                  <span className="text-stone-400 font-semibold">{MODES.find((m) => m.id === h.mode)?.label}: </span>
                  {h.prompt.slice(0, 45)}{h.prompt.length > 45 ? "…" : ""}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: prompt + result */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Prompt area */}
        <div className="p-5 border-b border-stone-100 bg-stone-50/30 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <currentMode.icon className="w-4 h-4" style={{ color: currentMode.color }} />
            <span className="text-sm font-black text-stone-700">{currentMode.label}</span>
          </div>
          <p className="text-xs text-stone-500 mb-3">{currentMode.desc}</p>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run(); }}
            rows={4}
            placeholder={
              selectedMode === "ideas"    ? "Enter a theme, topic area, or question to brainstorm post ideas around…" :
              selectedMode === "titles"   ? "Enter the post's core topic or a rough working title…" :
              selectedMode === "outline"  ? "Enter the post topic or thesis to outline in detail…" :
              selectedMode === "angle"    ? "Enter a common or well-covered topic to find fresh angles for…" :
              selectedMode === "series"   ? "Enter your series concept or overarching theme…" :
              selectedMode === "seasonal" ? "Describe what's happening in your world right now (or leave blank)…" :
              "Enter the question, frustration, or observation to turn into a post…"
            }
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-none bg-white"
          />

          {/* Example prompts */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] text-stone-400 flex-shrink-0">Try:</span>
            {currentMode.prompts.map((ex) => (
              <button key={ex} onClick={() => setPrompt(ex)}
                className="text-[10px] text-stone-500 border border-stone-200 px-2 py-0.5 rounded-sm hover:border-amber-400 hover:text-amber-600 transition-colors truncate max-w-[220px]">
                {ex}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-stone-400">⌘↵ to run</span>
            <button onClick={run} disabled={!prompt.trim() || loading}
              className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-5 py-2.5 rounded-sm transition-colors disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
              {loading ? "Generating…" : "Brainstorm"}
            </button>
          </div>
        </div>

        {/* Result area */}
        <div className="flex-1 overflow-y-auto p-5">
          {!result && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-amber-400" />
              </div>
              <p className="text-sm font-semibold text-stone-500">Ready to brainstorm</p>
              <p className="text-xs text-stone-300 mt-1 max-w-xs leading-relaxed">
                Choose a mode, enter your prompt, and generate blog post ideas, outlines, title options and more — all in Isaac&apos;s voice.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-amber-200 border-t-amber-500 animate-spin" />
                <Sparkles className="w-5 h-5 text-amber-500 absolute inset-0 m-auto" />
              </div>
              <p className="text-sm text-stone-500 animate-pulse">Brainstorming in Isaac&apos;s voice…</p>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          {result && !loading && (
            <div ref={resultRef}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <currentMode.icon className="w-4 h-4" style={{ color: currentMode.color }} />
                  <span className="text-xs font-bold text-stone-600">{currentMode.label} result</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => run()}
                    className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors">
                    <RefreshCw className="w-3 h-3" />Regenerate
                  </button>
                  <button onClick={copy}
                    className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors">
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied!" : "Copy all"}
                  </button>
                  <button onClick={() => setResult("")} className="text-stone-300 hover:text-stone-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-white border border-stone-100 rounded-sm p-5">
                <pre className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed font-sans">{result}</pre>
              </div>

              {/* Use this post buttons */}
              <div className="mt-4 space-y-2">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Use in editor:</p>
                <div className="flex flex-wrap gap-2">
                  {firstTitle && (
                    <button onClick={() => onUsePost({ title: firstTitle })}
                      className="flex items-center gap-2 text-xs font-bold text-amber-700 border border-amber-200 hover:bg-amber-50 px-3 py-2 rounded-sm transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                      Write post: &#34;{firstTitle.slice(0, 50)}{firstTitle.length > 50 ? "…" : ""}&#34;
                    </button>
                  )}
                  {selectedMode === "outline" && firstTitle && (
                    <button onClick={() => onUsePost({ title: firstTitle, content: result })}
                      className="flex items-center gap-2 text-xs font-bold text-purple-700 border border-purple-200 hover:bg-purple-50 px-3 py-2 rounded-sm transition-colors">
                      <AlignLeft className="w-3.5 h-3.5" />Use this outline as content
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}