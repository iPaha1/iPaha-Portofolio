"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, FileText, BarChart3, Zap, AlertTriangle } from "lucide-react";

interface ReadStats {
  wordCount: number;
  charCount: number;
  charNoSpaces: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  fleschScore: number;
  fleschGrade: string;
  readTimeSlow: string;
  readTimeAvg: string;
  readTimeFast: string;
  speakTime: string;
  complexity: "Very Easy" | "Easy" | "Medium" | "Hard" | "Very Hard";
  complexityColor: string;
  longestSentenceWords: number;
  uniqueWords: number;
  uniqueRatio: number;
}

const calcStats = (text: string): ReadStats | null => {
  if (!text.trim()) return null;

  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = text.length;
  const charNoSpaces = text.replace(/\s/g, "").length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 3);
  const sentenceCount = Math.max(sentences.length, 1);
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim());
  const paragraphCount = Math.max(paragraphs.length, 1);
  const avgWordsPerSentence = wordCount / sentenceCount;

  // Flesch Reading Ease (simplified)
  const syllables = words.reduce((total, word) => {
    const count = word
      .toLowerCase()
      .replace(/[^a-z]/g, "")
      .replace(/[aeiou]{2,}/g, "a")
      .match(/[aeiou]/g)?.length ?? 1;
    return total + Math.max(count, 1);
  }, 0);
  const avgSyllablesPerWord = syllables / wordCount;
  const fleschScore = Math.min(
    100,
    Math.max(
      0,
      206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
    )
  );

  let fleschGrade = "";
  let complexity: ReadStats["complexity"] = "Medium";
  let complexityColor = "text-amber-600";
  if (fleschScore >= 80) { fleschGrade = "Very Easy"; complexity = "Very Easy"; complexityColor = "text-green-600"; }
  else if (fleschScore >= 60) { fleschGrade = "Easy"; complexity = "Easy"; complexityColor = "text-green-500"; }
  else if (fleschScore >= 40) { fleschGrade = "Medium"; complexity = "Medium"; complexityColor = "text-amber-600"; }
  else if (fleschScore >= 20) { fleschGrade = "Hard"; complexity = "Hard"; complexityColor = "text-orange-600"; }
  else { fleschGrade = "Very Hard"; complexity = "Very Hard"; complexityColor = "text-red-600"; }

  const toMinSec = (wpm: number) => {
    const totalSec = Math.round((wordCount / wpm) * 60);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs > 0 ? secs + "s" : ""}`;
  };

  const longestSentenceWords = Math.max(...sentences.map((s) => s.trim().split(/\s+/).length), 0);
  const uniqueWords = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z]/g, ""))).size;

  return {
    wordCount,
    charCount,
    charNoSpaces,
    sentenceCount,
    paragraphCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    fleschScore: Math.round(fleschScore),
    fleschGrade,
    readTimeSlow: toMinSec(150),
    readTimeAvg: toMinSec(238),
    readTimeFast: toMinSec(350),
    speakTime: toMinSec(130),
    complexity,
    complexityColor,
    longestSentenceWords,
    uniqueWords,
    uniqueRatio: Math.round((uniqueWords / wordCount) * 100),
  };
};

export const ReadingTimeCalculator = () => {
  const [text, setText] = useState("");
  const stats = useMemo(() => calcStats(text), [text]);

  const SAMPLE = `Artificial intelligence is no longer a concept confined to science fiction — it has become the defining technological force of our era. From the algorithms that power our daily recommendations to the large language models that can now write, code, and reason with remarkable fluency, AI is reshaping every industry it touches.

The question is no longer whether AI will change the world. It already has. The question now is whether we will shape that change intentionally, or be shaped by it passively.`;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700">Paste your content</label>
          <button
            onClick={() => setText(SAMPLE)}
            className="text-xs text-amber-600 hover:text-amber-700 underline"
          >
            Load sample
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your article, blog post, email, essay..."
          rows={8}
          className="w-full bg-gray-50 border border-gray-200 rounded-xs px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all duration-200 resize-none"
        />
      </div>

      <AnimatePresence>
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Reading times — hero row */}
            <div className="grid grid-cols-3 gap-px bg-gray-100 rounded-xs overflow-hidden border border-gray-100">
              {[
                { label: "Slow reader", value: stats.readTimeSlow, sub: "150 wpm", color: "text-orange-500" },
                { label: "Average reader", value: stats.readTimeAvg, sub: "238 wpm", color: "text-blue-600" },
                { label: "Fast reader", value: stats.readTimeFast, sub: "350 wpm", color: "text-green-600" },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="bg-white px-5 py-5 text-center">
                  <Clock className={`w-4 h-4 mx-auto mb-2 ${color}`} />
                  <p className={`text-2xl font-black ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">{label}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>

            {/* Counts grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: FileText, label: "Words", value: stats.wordCount.toLocaleString(), color: "text-blue-500" },
                { icon: BarChart3, label: "Sentences", value: stats.sentenceCount.toLocaleString(), color: "text-purple-500" },
                { icon: Zap, label: "Characters", value: stats.charCount.toLocaleString(), color: "text-amber-500" },
                { icon: FileText, label: "Paragraphs", value: stats.paragraphCount.toLocaleString(), color: "text-green-500" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="bg-white border border-gray-100 rounded-xs p-4 text-center">
                  <Icon className={`w-4 h-4 mx-auto mb-1.5 ${color}`} />
                  <p className="text-xl font-black text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Readability */}
            <div className="bg-white border border-gray-100 rounded-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Readability Analysis
                </p>
                <span className={`text-sm font-bold ${stats.complexityColor}`}>
                  {stats.complexity}
                </span>
              </div>
              <div className="space-y-3">
                {/* Flesch score bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-500">Flesch Reading Ease</span>
                    <span className="font-bold text-gray-800">{stats.fleschScore}/100</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.fleschScore}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-red-400 via-amber-400 to-green-500"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-300 mt-1">
                    <span>Very Hard</span>
                    <span>Very Easy</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { label: "Avg sentence length", value: `${stats.avgWordsPerSentence} words` },
                    { label: "Unique vocabulary", value: `${stats.uniqueRatio}%` },
                    { label: "Speak time", value: stats.speakTime },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center">
                      <p className="text-base font-black text-gray-900">{value}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {stats.avgWordsPerSentence > 25 && (
                <div className="flex items-start gap-2 mt-4 bg-amber-50 border border-amber-100 rounded-xs px-3 py-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Average sentence length is high ({stats.avgWordsPerSentence} words). Consider breaking up long sentences for better readability.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!text && (
        <div className="text-center py-8 text-gray-300">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Paste content to see instant analysis</p>
        </div>
      )}
    </div>
  );
};