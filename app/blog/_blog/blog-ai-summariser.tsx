"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Zap,
  ListChecks,
  Quote,
  Target,
} from "lucide-react";

interface AISummary {
  oneLiner: string;
  keyPoints: string[];
  mainArgument: string;
  actionableInsight: string;
  tone: string;
  readWorthy: string;
}

interface AISummariserProps {
  title: string;
  content: string;
}

export const AISummariser = ({ title, content }: AISummariserProps) => {
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const summarise = async () => {
    if (summary) {
      setIsExpanded((e) => !e);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/anthropic/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Summarise this essay and return ONLY valid JSON (no markdown, no backticks):

{
  "oneLiner": "<single sentence summary under 25 words>",
  "keyPoints": ["<key point 1>", "<key point 2>", "<key point 3>", "<key point 4>"],
  "mainArgument": "<2-3 sentences capturing the central thesis>",
  "actionableInsight": "<the one thing the reader should think or do differently after reading>",
  "tone": "<e.g. Analytical, Personal, Provocative, Reflective, Technical>",
  "readWorthy": "<one sentence on who should read this and why>"
}

Essay title: "${title}"
Essay content: ${content.slice(0, 4000)}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text ?? "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed: AISummary = JSON.parse(clean);
      setSummary(parsed);
      setIsExpanded(true);
    } catch {
      setError("Summary generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copySummary = () => {
    if (!summary) return;
    const text = `AI Summary of "${title}"\n\n${summary.oneLiner}\n\nKey Points:\n${summary.keyPoints.map((p) => `• ${p}`).join("\n")}\n\nMain Argument: ${summary.mainArgument}\n\nTake Away: ${summary.actionableInsight}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-10">
      {/* Trigger button */}
      <motion.button
        onClick={summarise}
        disabled={loading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full flex items-center justify-between gap-3 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 hover:border-violet-300 rounded-xs px-5 py-4 transition-all duration-200 group disabled:opacity-60"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xs bg-violet-500 flex items-center justify-center shrink-0">
            {loading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-white" />
            )}
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-violet-900">
              {loading ? "Generating AI summary…" : summary ? "AI Summary" : "Summarise with AI"}
            </p>
            <p className="text-xs text-violet-500">
              {loading
                ? "Reading and analysing the essay…"
                : summary
                ? "Key points, main argument, and actionable insight"
                : "Get key points, main argument, and takeaway in seconds"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="text-[10px] font-black tracking-widest uppercase text-violet-400 bg-violet-100 px-2 py-1 rounded-xs">
              AI
            </span>
          )}
          {summary && !loading && (
            isExpanded
              ? <ChevronUp className="w-4 h-4 text-violet-400" />
              : <ChevronDown className="w-4 h-4 text-violet-400" />
          )}
        </div>
      </motion.button>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 mt-2 px-2">{error}</p>
      )}

      {/* Summary panel */}
      <AnimatePresence>
        {summary && isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-violet-200 border-t-0 rounded-b-xs p-5 space-y-5">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-500" />
                  <span className="text-xs font-semibold text-violet-600 uppercase tracking-wider">
                    AI-Generated Summary
                  </span>
                  <span className="text-[10px] text-violet-400 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-xs">
                    Tone: {summary.tone}
                  </span>
                </div>
                <button
                  onClick={copySummary}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-xs transition-all"
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-green-500" /><span className="text-green-600">Copied</span></>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" />Copy</>
                  )}
                </button>
              </div>

              {/* One-liner */}
              <div className="bg-violet-50 border border-violet-100 rounded-xs px-4 py-3">
                <p className="text-sm font-semibold text-violet-900 leading-relaxed">
                  &ldquo;{summary.oneLiner}&rdquo;
                </p>
              </div>

              {/* Key points */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ListChecks className="w-4 h-4 text-violet-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Key Points
                  </p>
                </div>
                <ul className="space-y-2">
                  {summary.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Divider */}
              <div className="h-px bg-gray-100" />

              {/* Main argument */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Quote className="w-4 h-4 text-violet-500" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Main Argument
                  </p>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed pl-6">
                  {summary.mainArgument}
                </p>
              </div>

              {/* Actionable insight */}
              <div className="bg-amber-50 border border-amber-200 rounded-xs px-4 py-3.5 flex gap-3">
                <Target className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
                    Key Takeaway
                  </p>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {summary.actionableInsight}
                  </p>
                </div>
              </div>

              {/* Read-worthy */}
              <div className="flex items-center gap-2.5 pt-1 text-xs text-gray-400 border-t border-gray-100">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <p>{summary.readWorthy}</p>
              </div>

              {/* Disclaimer */}
              <p className="text-[10px] text-gray-300 italic">
                AI-generated summary. May not capture all nuances — always read the full essay for complete context.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};