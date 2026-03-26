"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, Sparkles, AlertCircle, CheckSquare, Square} from "lucide-react";

interface Week {
  week: number;
  theme: string;
  goals: string[];
  resources: { title: string; type: string; url?: string }[];
  milestone: string;
}

interface Roadmap {
  title: string;
  overview: string;
  totalWeeks: number;
  hoursPerWeek: number;
  weeks: Week[];
  finalProject: string;
  nextSteps: string[];
}

const LEVELS = ["Complete Beginner", "Some Knowledge", "Intermediate", "Advanced"];
const HOURS = ["2–4 hrs/week", "5–8 hrs/week", "10–15 hrs/week", "20+ hrs/week"];

export const LearningRoadmapGenerator = () => {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState(LEVELS[0]);
  const [hours, setHours] = useState(HOURS[1]);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const generate = async () => {
    if (!topic.trim()) {
      setError("Please enter what you want to learn.");
      return;
    }
    setError("");
    setLoading(true);
    setRoadmap(null);
    setChecked({});

    try {
      const response = await fetch("/api/anthropic/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2500,
          messages: [
            {
              role: "user",
              content: `Create a learning roadmap for: "${topic}". Level: ${level}. Available time: ${hours}.

Return ONLY valid JSON:
{
  "title": "<roadmap title>",
  "overview": "<2-3 sentence overview>",
  "totalWeeks": <4-12>,
  "hoursPerWeek": <number>,
  "weeks": [
    {
      "week": 1,
      "theme": "<week theme>",
      "goals": ["<goal 1>", "<goal 2>", "<goal 3>"],
      "resources": [
        {"title": "<resource name>", "type": "Book|Video|Course|Article|Tool", "url": "<url if well known>"}
      ],
      "milestone": "<what you can do by end of week>"
    }
  ],
  "finalProject": "<suggested final project>",
  "nextSteps": ["<next step 1>", "<next step 2>", "<next step 3>"]
}`,
            },
          ],
        }),
      });
      const data = await response.json();
      const text = data.content?.[0]?.text ?? "";
      const clean = text.replace(/```json|```/g, "").trim();
      setRoadmap(JSON.parse(clean));
    } catch {
      setError("Generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (key: string) =>
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  const completedGoals = Object.values(checked).filter(Boolean).length;
  const totalGoals = roadmap?.weeks.reduce((s, w) => s + w.goals.length, 0) ?? 0;
  const progress = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  const resourceTypeColor: Record<string, string> = {
    Book: "bg-purple-50 text-purple-600 border-purple-200",
    Video: "bg-red-50 text-red-600 border-red-200",
    Course: "bg-blue-50 text-blue-600 border-blue-200",
    Article: "bg-green-50 text-green-600 border-green-200",
    Tool: "bg-amber-50 text-amber-600 border-amber-200",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-3">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            What do you want to learn?
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Machine Learning, React.js, Public Speaking, Chess..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xs px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 focus:bg-white transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Current Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xs px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-purple-400 transition-all"
          >
            {LEVELS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Time Available</label>
          <select
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xs px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-purple-400 transition-all"
          >
            {HOURS.map((h) => <option key={h}>{h}</option>)}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={generate}
            disabled={loading || !topic.trim()}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-semibold text-sm py-3 rounded-xs transition-all duration-200"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Building...</>
            ) : (
              <><Sparkles className="w-4 h-4" />Build Roadmap</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xs">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <AnimatePresence>
        {roadmap && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="bg-purple-600 text-white rounded-xs p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-purple-200" />
                    <h3 className="text-xl font-black">{roadmap.title}</h3>
                  </div>
                  <p className="text-purple-200 text-sm leading-relaxed max-w-xl">
                    {roadmap.overview}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-purple-200">
                    <span>📅 {roadmap.totalWeeks} weeks</span>
                    <span>⏰ ~{roadmap.hoursPerWeek} hrs/week</span>
                    <span>✅ {completedGoals}/{totalGoals} goals done</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {totalGoals > 0 && (
                <div className="mt-5">
                  <div className="h-1.5 bg-purple-800/50 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-white rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-purple-300 mt-1.5">
                    {progress.toFixed(0)}% complete
                  </p>
                </div>
              )}
            </div>

            {/* Week cards */}
            <div className="space-y-3">
              {roadmap.weeks.map((week) => (
                <div key={week.week} className="bg-white border border-gray-100 rounded-xs overflow-hidden">
                  <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-50">
                    <div className="w-10 h-10 rounded-xs bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-purple-600">{week.week}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{week.theme}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        Milestone: {week.milestone}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Goals */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Goals</p>
                      <ul className="space-y-2">
                        {week.goals.map((goal, gi) => {
                          const key = `w${week.week}-g${gi}`;
                          return (
                            <li key={key} className="flex items-start gap-2">
                              <button onClick={() => toggleCheck(key)} className="shrink-0 mt-0.5">
                                {checked[key] ? (
                                  <CheckSquare className="w-4 h-4 text-purple-500" />
                                ) : (
                                  <Square className="w-4 h-4 text-gray-300" />
                                )}
                              </button>
                              <span className={`text-sm leading-snug ${checked[key] ? "line-through text-gray-300" : "text-gray-700"}`}>
                                {goal}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Resources */}
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Resources</p>
                      <ul className="space-y-2">
                        {week.resources.map((r, ri) => (
                          <li key={ri} className="flex items-center gap-2">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-xs border shrink-0 ${resourceTypeColor[r.type] ?? "bg-gray-50 text-gray-600 border-gray-200"}`}>
                              {r.type}
                            </span>
                            <span className="text-xs text-gray-600 leading-snug">{r.title}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Final project + next steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xs p-5">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">🏆 Final Project</p>
                <p className="text-sm text-amber-900 font-medium">{roadmap.finalProject}</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xs p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">🚀 Next Steps After</p>
                <ul className="space-y-2">
                  {roadmap.nextSteps.map((s, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-gray-400 font-bold shrink-0">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};