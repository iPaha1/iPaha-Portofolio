"use client";

// =============================================================================
// isaacpaha.com — Blog AI Writing Panel
// components/admin/blog/ai-panel.tsx
// Contextual AI assistant — reads current post fields, writes back to them
// =============================================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, X, Check, Copy,
  FileText, Layers, Wand2, RotateCcw, AlignLeft,
  Tag, Target, Search, MessageSquare, Edit2,
} from "lucide-react";

interface AIPanelProps {
  title:        string;
  content:      string;
  excerpt:      string;
  category:     string;
  tags:         string[];
  selectedText: string;
  onApplyToContent:  (text: string, replace?: boolean) => void;
  onApplyToTitle:    (text: string) => void;
  onApplyToExcerpt:  (text: string) => void;
  onApplyToTags:     (tags: string[]) => void;
  onApplyToMeta:     (field: string, value: string) => void;
}

type AIMode = {
  id:      string;
  label:   string;
  icon:    React.ElementType;
  desc:    string;
  color:   string;
  prompt?: string;
};

const AI_MODES: AIMode[] = [
  { id: "draft",      label: "Draft Full Post",     icon: FileText,     color: "#f59e0b", desc: "Write complete post from outline" },
  { id: "outline",    label: "Generate Outline",    icon: AlignLeft,    color: "#8b5cf6", desc: "Detailed outline with section breakdown" },
  { id: "intro",      label: "Write Intro",         icon: Edit2,        color: "#3b82f6", desc: "Arresting opening paragraph" },
  { id: "conclusion", label: "Write Closing",       icon: Layers,       color: "#10b981", desc: "Strong final section with implication" },
  { id: "expand",     label: "Expand Selection",    icon: Wand2,        color: "#6366f1", desc: "Expand selected text into more detail" },
  { id: "rewrite",    label: "Rewrite Selection",   icon: RotateCcw,    color: "#ec4899", desc: "Rewrite selected text — sharper voice" },
  { id: "titles",     label: "Alternative Titles",  icon: MessageSquare,color: "#f97316", desc: "6 different title options" },
  { id: "excerpt",    label: "Write Excerpt",       icon: AlignLeft,    color: "#14b8a6", desc: "Compelling 120-155 char description" },
  { id: "tags",       label: "Suggest Tags",        icon: Tag,          color: "#64748b", desc: "8-10 SEO-optimised tags" },
  { id: "critique",   label: "Editorial Critique",  icon: Target,       color: "#ef4444", desc: "Honest structural and voice feedback" },
  { id: "seo",        label: "SEO Analysis",        icon: Search,       color: "#059669", desc: "Keyword suggestions + meta copy" },
];

export function AIPanel({
  title, content, excerpt, category, tags, selectedText,
  onApplyToContent, onApplyToTitle, onApplyToExcerpt, onApplyToTags, onApplyToMeta,
}: AIPanelProps) {
  const [mode,     setMode]     = useState<string>("draft");
  const [prompt,   setPrompt]   = useState("");
  const [result,   setResult]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [copied,   setCopied]   = useState(false);
  const [history,  setHistory]  = useState<{ mode: string; result: string; prompt: string }[]>([]);

  const currentMode = AI_MODES.find((m) => m.id === mode)!;

  const run = async () => {
    setLoading(true); setResult(""); setError("");
    try {
      const res  = await fetch("/api/admin/blog/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          prompt:       prompt.trim() || title,
          title,
          content:      content.slice(0, 3000),
          excerpt,
          category,
          tags:         tags.join(", "),
          selectedText: selectedText || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error ?? "Generation failed");
      } else {
        setResult(data.content ?? "");
        setHistory((h) => [{ mode, result: data.content, prompt: prompt.trim() }, ...h.slice(0, 4)]);
      }
    } catch { setError("Network error"); }
    setLoading(false);
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Parse tags from comma-separated result
  const applyTags = () => {
    const parsed = result.split(/[,\n]/).map((t) => t.trim().toLowerCase()).filter(Boolean);
    onApplyToTags(parsed);
    setResult("");
  };

  // Determine apply options based on mode
  const applyOptions: { label: string; action: () => void }[] = [];
  if (["draft", "expand", "intro", "conclusion", "rewrite"].includes(mode)) {
    applyOptions.push({
      label: mode === "rewrite" ? "Replace selection" : "Add to content",
      action: () => { onApplyToContent(result, mode === "rewrite"); setResult(""); },
    });
  }
  if (mode === "outline" || mode === "draft") {
    applyOptions.push({ label: "Replace full content", action: () => { onApplyToContent(result, true); setResult(""); } });
  }
  if (mode === "titles") {
    // Extract first title from numbered list
    const firstTitle = result.match(/^1\. (.+)$/m)?.[1];
    if (firstTitle) applyOptions.push({ label: "Use first title", action: () => { onApplyToTitle(firstTitle.trim()); setResult(""); } });
  }
  if (mode === "excerpt") {
    applyOptions.push({ label: "Use as excerpt", action: () => { onApplyToExcerpt(result.trim()); setResult(""); } });
    applyOptions.push({ label: "Use as meta description", action: () => { onApplyToMeta("metaDescription", result.trim().slice(0, 165)); setResult(""); } });
  }
  if (mode === "tags") {
    applyOptions.push({ label: "Add all tags", action: applyTags });
  }
  if (mode === "seo") {
    const metaTitle = result.match(/\*\*Meta title\*\*[:\s]+(.+?)(?:\n|$)/i)?.[1];
    const metaDesc  = result.match(/\*\*Meta description\*\*[:\s]+(.+?)(?:\n|$)/i)?.[1];
    if (metaTitle) applyOptions.push({ label: "Apply meta title", action: () => { onApplyToMeta("metaTitle", metaTitle.trim()); } });
    if (metaDesc)  applyOptions.push({ label: "Apply meta desc",  action: () => { onApplyToMeta("metaDescription", metaDesc.trim()); } });
  }

  const wc = result.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Mode selector */}
      <div className="p-3 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-black text-stone-700">AI Writing Assistant</span>
          <span className="ml-auto text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-sm font-semibold">Isaac&apos;s voice</span>
        </div>

        {/* Mode grid */}
        <div className="grid grid-cols-2 gap-1">
          {AI_MODES.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex items-center gap-1.5 px-2 py-2 rounded-sm border text-left transition-colors ${
                mode === m.id ? "border-amber-200 bg-amber-50" : "border-stone-100 bg-white hover:border-stone-200"
              }`}>
              <m.icon className="w-3 h-3 flex-shrink-0" style={{ color: mode === m.id ? m.color : "#9ca3af" }} />
              <span className={`text-[10px] font-bold leading-tight ${mode === m.id ? "text-amber-700" : "text-stone-600"}`}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Prompt + run */}
      <div className="p-3 border-b border-stone-100 flex-shrink-0">
        <p className="text-[10px] text-stone-400 mb-1.5">{currentMode.desc}</p>
        <textarea
          value={prompt} onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          placeholder={
            mode === "draft"      ? "Outline, notes, or angle to write from…" :
            mode === "expand"     ? "Direction for the expansion…" :
            mode === "rewrite"    ? "What to improve (or leave blank to auto-improve)…" :
            mode === "outline"    ? "Topic / angle to outline…" :
            mode === "critique"   ? "Focus area (or leave blank for full critique)…" :
            "Additional context or direction…"
          }
          className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 resize-none"
        />
        {selectedText && (
          <div className="mt-1.5 px-2.5 py-1.5 bg-blue-50 border border-blue-100 rounded-sm">
            <p className="text-[10px] font-bold text-blue-600 mb-0.5">Selected text:</p>
            <p className="text-[10px] text-blue-700 line-clamp-2">{selectedText}</p>
          </div>
        )}
        <button onClick={run} disabled={loading}
          className="mt-2 w-full flex items-center justify-center gap-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-2.5 rounded-sm transition-colors disabled:opacity-50">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {loading ? "Generating…" : `Generate ${currentMode.label}`}
        </button>
      </div>

      {/* Result */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-sm">{error}</div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="border border-stone-200 rounded-sm overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-stone-50 border-b border-stone-100">
                  <span className="text-[10px] font-bold text-stone-500">{wc} words</span>
                  <div className="flex gap-1.5">
                    <button onClick={copy}
                      className="text-[10px] text-stone-400 hover:text-stone-700 flex items-center gap-1 transition-colors">
                      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                    <button onClick={() => setResult("")} className="text-stone-300 hover:text-stone-600 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-3 max-h-48 overflow-y-auto">
                  <pre className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed font-sans">{result}</pre>
                </div>
                {applyOptions.length > 0 && (
                  <div className="px-3 py-2 border-t border-stone-100 bg-stone-50/40 flex flex-wrap gap-1.5">
                    {applyOptions.map((opt) => (
                      <button key={opt.label} onClick={opt.action}
                        className="text-[10px] font-bold text-amber-700 border border-amber-200 hover:bg-amber-50 px-2.5 py-1 rounded-sm transition-colors">
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        {history.length > 0 && !result && (
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Recent results</p>
            {history.map((h, i) => (
              <button key={i} onClick={() => setResult(h.result)}
                className="w-full text-left px-2.5 py-2 border border-stone-100 rounded-sm hover:border-stone-200 hover:bg-stone-50 transition-colors mb-1.5">
                <p className="text-[10px] font-bold text-stone-500">{AI_MODES.find((m) => m.id === h.mode)?.label}</p>
                <p className="text-[10px] text-stone-400 line-clamp-1 mt-0.5">{h.prompt || h.result.slice(0, 60)}…</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}