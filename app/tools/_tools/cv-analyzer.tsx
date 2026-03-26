"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";

interface CVAnalysis {
  overallScore: number;
  atsScore: number;
  languageScore: number;
  structureScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  keywords: string[];
  rewriteSuggestions: { original: string; improved: string }[];
}

const ScoreBar = ({
  label,
  score,
  color,
}: {
  label: string;
  score: number;
  color: string;
}) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-xs">
      <span className="text-gray-600 font-medium">{label}</span>
      <span className="font-bold text-gray-900">{score}/100</span>
    </div>
    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  </div>
);

export const CVAnalyzerTool = () => {
  const [cvText, setCvText] = useState("");
  const [analysis, setAnalysis] = useState<CVAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>("improvements");
  const [copied, setCopied] = useState(false);

  const analyzeCV = async () => {
    if (!cvText.trim() || cvText.trim().length < 100) {
      setError("Please paste your full CV (at least 100 characters).");
      return;
    }
    setError("");
    setLoading(true);
    setAnalysis(null);

    try {
      const response = await fetch("/api/anthropic/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [
            {
              role: "user",
              content: `Analyze this CV and return ONLY valid JSON (no markdown, no backticks):

{
  "overallScore": <0-100>,
  "atsScore": <0-100>,
  "languageScore": <0-100>,
  "structureScore": <0-100>,
  "summary": "<2 sentence honest summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>", "<improvement 4>"],
  "keywords": ["<missing keyword 1>", "<missing keyword 2>", "<missing keyword 3>", "<missing keyword 4>", "<missing keyword 5>"],
  "rewriteSuggestions": [
    {"original": "<weak phrase from CV>", "improved": "<stronger version>"},
    {"original": "<weak phrase from CV>", "improved": "<stronger version>"}
  ]
}

CV to analyze:
${cvText.slice(0, 3000)}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text ?? "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed: CVAnalysis = JSON.parse(clean);
      setAnalysis(parsed);
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (s: string) =>
    setExpandedSection(expandedSection === s ? null : s);

  const copyAnalysis = () => {
    if (!analysis) return;
    const text = `CV Analysis Results\n\nOverall Score: ${analysis.overallScore}/100\n\nSummary: ${analysis.summary}\n\nStrengths:\n${analysis.strengths.map((s) => `• ${s}`).join("\n")}\n\nImprovements:\n${analysis.improvements.map((i) => `• ${i}`).join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Paste your CV
        </label>
        <textarea
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
          placeholder="Paste your full CV here — work experience, education, skills, summary..."
          rows={10}
          className="w-full bg-gray-50 border border-gray-200 rounded-xs px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-all duration-200 resize-none font-mono"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">
            {cvText.length} characters
            {cvText.length > 0 && cvText.length < 100 && (
              <span className="text-amber-500 ml-2">
                — need at least 100
              </span>
            )}
          </span>
          {cvText.length > 0 && (
            <button
              onClick={() => setCvText("")}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={analyzeCV}
        disabled={loading || cvText.length < 100}
        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm py-3.5 rounded-xs transition-all duration-200"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analysing your CV...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Analyse My CV
          </>
        )}
      </button>

      {/* Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="space-y-5"
          >
            {/* Overall score */}
            <div className="bg-gray-900 text-white rounded-xs p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-xs font-semibold tracking-widest uppercase text-white/40 mb-1">
                    Overall Score
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-5xl font-black text-amber-400">
                      {analysis.overallScore}
                    </span>
                    <span className="text-2xl text-white/30 mb-1">/100</span>
                  </div>
                </div>
                <button
                  onClick={copyAnalysis}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-xs transition-all"
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Copy results</>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <ScoreBar label="ATS" score={analysis.atsScore} color="#f59e0b" />
                <ScoreBar label="Language" score={analysis.languageScore} color="#10b981" />
                <ScoreBar label="Structure" score={analysis.structureScore} color="#8b5cf6" />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-amber-50 border border-amber-100 rounded-xs p-5">
              <p className="text-sm text-amber-900 leading-relaxed font-medium">
                {analysis.summary}
              </p>
            </div>

            {/* Accordion sections */}
            {[
              {
                key: "strengths",
                icon: CheckCircle,
                label: "Strengths",
                iconColor: "text-green-500",
                items: analysis.strengths,
                bullet: "✓",
                bulletColor: "text-green-500",
              },
              {
                key: "improvements",
                icon: AlertCircle,
                label: "Improvements",
                iconColor: "text-amber-500",
                items: analysis.improvements,
                bullet: "→",
                bulletColor: "text-amber-500",
              },
            ].map(({ key, icon: Icon, label, iconColor, items, bullet, bulletColor }) => (
              <div key={key} className="border border-gray-100 rounded-xs overflow-hidden">
                <button
                  onClick={() => toggle(key)}
                  className="w-full flex items-center justify-between px-5 py-4 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                    <span className="text-sm font-semibold text-gray-800">{label}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-xs">
                      {items.length}
                    </span>
                  </div>
                  {expandedSection === key ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                <AnimatePresence>
                  {expandedSection === key && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <ul className="px-5 pb-4 pt-2 space-y-2.5 bg-gray-50 border-t border-gray-100">
                        {items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className={`font-bold mt-0.5 shrink-0 ${bulletColor}`}>
                              {bullet}
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Missing keywords */}
            <div className="bg-white border border-gray-100 rounded-xs p-5">
              <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">
                Keywords to add
              </p>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-xs"
                  >
                    + {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Rewrite suggestions */}
            {analysis.rewriteSuggestions.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-xs p-5">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">
                  Rewrite Suggestions
                </p>
                <div className="space-y-4">
                  {analysis.rewriteSuggestions.map((s, i) => (
                    <div key={i} className="grid grid-cols-2 gap-3">
                      <div className="bg-red-50 border border-red-100 rounded-xs px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1">Before</p>
                        <p className="text-xs text-red-700 line-through">{s.original}</p>
                      </div>
                      <div className="bg-green-50 border border-green-100 rounded-xs px-3 py-2.5">
                        <p className="text-[10px] font-semibold text-green-500 uppercase tracking-wider mb-1">After</p>
                        <p className="text-xs text-green-800 font-medium">{s.improved}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};