"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Loader2, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

interface StartupIdea {
  name: string;
  tagline: string;
  problem: string;
  solution: string;
  targetMarket: string;
  marketSize: string;
  competitors: string[];
  uniqueAdvantage: string;
  validationQuestions: string[];
  firstSteps: string[];
  riskLevel: "Low" | "Medium" | "High";
}

export const StartupIdeaGenerator = () => {
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [ideas, setIdeas] = useState<StartupIdea[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeIdea, setActiveIdea] = useState(0);

  const generate = async () => {
    if (!skills.trim() || !interests.trim()) {
      setError("Please fill in both your skills and interests.");
      return;
    }
    setError("");
    setLoading(true);
    setIdeas([]);

    try {
      const response = await fetch("/api/anthropic/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          messages: [
            {
              role: "user",
              content: `Generate 3 startup ideas for someone with these skills: "${skills}" and interests: "${interests}".

Return ONLY valid JSON (no markdown):
[
  {
    "name": "<startup name>",
    "tagline": "<one line pitch>",
    "problem": "<the core problem>",
    "solution": "<the solution>",
    "targetMarket": "<specific target customer>",
    "marketSize": "<realistic market size estimate>",
    "competitors": ["<competitor 1>", "<competitor 2>"],
    "uniqueAdvantage": "<what makes this different>",
    "validationQuestions": ["<question 1>", "<question 2>", "<question 3>"],
    "firstSteps": ["<step 1>", "<step 2>", "<step 3>"],
    "riskLevel": "Low|Medium|High"
  }
]`,
            },
          ],
        }),
      });
      const data = await response.json();
      const text = data.content?.[0]?.text ?? "";
      const clean = text.replace(/```json|```/g, "").trim();
      setIdeas(JSON.parse(clean));
      setActiveIdea(0);
    } catch {
      setError("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const riskColor = { Low: "text-green-600 bg-green-50 border-green-200", Medium: "text-amber-600 bg-amber-50 border-amber-200", High: "text-red-600 bg-red-50 border-red-200" };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your skills & experience
          </label>
          <textarea
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="e.g. Full-stack development, Next.js, Python, 5 years backend experience..."
            rows={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-xs px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-all duration-200 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Your interests & passions
          </label>
          <textarea
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="e.g. African fintech, education, helping job seekers, sustainability, health..."
            rows={4}
            className="w-full bg-gray-50 border border-gray-200 rounded-xs px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-amber-400 focus:bg-white transition-all duration-200 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white font-semibold text-sm py-3.5 rounded-xs transition-all duration-200"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Generating ideas...</>
        ) : (
          <><Sparkles className="w-4 h-4" />Generate 3 Startup Ideas</>
        )}
      </button>

      <AnimatePresence>
        {ideas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Idea tabs */}
            <div className="flex gap-2">
              {ideas.map((idea, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdea(i)}
                  className={`flex-1 text-xs font-semibold py-2.5 px-3 rounded-xs border transition-all duration-200 text-left truncate ${
                    activeIdea === i
                      ? "bg-gray-900 border-gray-900 text-white"
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
                  }`}
                >
                  {i + 1}. {idea.name}
                </button>
              ))}
              <button
                onClick={generate}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 border border-gray-200 hover:border-gray-400 px-3 py-2 rounded-xs transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Active idea */}
            {ideas[activeIdea] && (
              <motion.div
                key={activeIdea}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white border border-gray-100 rounded-xs overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gray-900 text-white p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Rocket className="w-5 h-5 text-green-400" />
                        <h3 className="text-xl font-black">{ideas[activeIdea].name}</h3>
                      </div>
                      <p className="text-white/60 text-sm italic">
                        &quot;{ideas[activeIdea].tagline}&quot;
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1.5 rounded-xs border ${riskColor[ideas[activeIdea].riskLevel]}`}>
                      {ideas[activeIdea].riskLevel} Risk
                    </span>
                  </div>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  {[
                    { label: "The Problem", value: ideas[activeIdea].problem, icon: "⚡" },
                    { label: "The Solution", value: ideas[activeIdea].solution, icon: "💡" },
                    { label: "Target Market", value: ideas[activeIdea].targetMarket, icon: "🎯" },
                    { label: "Market Size", value: ideas[activeIdea].marketSize, icon: "📊" },
                    { label: "Unique Advantage", value: ideas[activeIdea].uniqueAdvantage, icon: "🏆" },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="col-span-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                        {icon} {label}
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">{value}</p>
                    </div>
                  ))}

                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      ⚔️ Competitors
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {ideas[activeIdea].competitors.map((c) => (
                        <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-xs border border-gray-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      🔍 Validation Questions
                    </p>
                    <ul className="space-y-2">
                      {ideas[activeIdea].validationQuestions.map((q, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="text-amber-500 font-bold shrink-0">{i + 1}.</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      🚀 First Steps
                    </p>
                    <ul className="space-y-2">
                      {ideas[activeIdea].firstSteps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                            {i + 1}
                          </span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};