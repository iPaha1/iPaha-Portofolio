"use client";

// =============================================================================
// isaacpaha.com — Productivity Score
// app/tools/productivity-score/_components/productivity-score-tool.tsx
//
// Flow: Questions → Loading → Results
// Features:
//   - 20-question audit across 5 categories
//   - Instant score calculation (0-100)
//   - Category breakdown with visualisation
//   - Bottleneck detection
//   - Personalised 3-step action plan
//   - Shareable score card
//   - Weekly re-check system
// =============================================================================

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, AlertCircle, Check, Copy,
  ChevronDown, ChevronUp, RefreshCw, ArrowRight,
  TrendingUp, TrendingDown, Award, Target, Clock,
  Brain, Zap, Calendar, BarChart2, Share2, Star,
  Flag, Lightbulb, AlertTriangle, CheckCircle,
  X, Info, Users, Heart, Repeat, Download,
  ChevronRight,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: number;
  text: string;
  category: "focus" | "habits" | "systems" | "energy" | "mindset";
  reverseScored?: boolean;
}

interface CategoryScore {
  name: string;
  key: "focus" | "habits" | "systems" | "energy" | "mindset";
  score: number;
  maxScore: number;
  percentage: number;
  description: string;
}

interface Bottleneck {
  category: string;
  issue: string;
  impact: string;
  severity: "high" | "medium" | "low";
}

interface ActionStep {
  step: number;
  title: string;
  action: string;
  timeframe: "today" | "this week" | "this month";
  effort: "easy" | "medium" | "significant";
}

interface ProductivityResult {
  totalScore: number;
  categoryScores: CategoryScore[];
  bottlenecks: Bottleneck[];
  actionPlan: ActionStep[];
  strengths: string[];
  insight: string;
  shareHeadline: string;
  shareStats: string;
}

// ─── Questions Data ───────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  // Focus (4 questions)
  { id: 1, text: "I can work for 60+ minutes without checking my phone or social media", category: "focus" },
  { id: 2, text: "I often lose track of what I was doing because I get distracted", category: "focus", reverseScored: true },
  { id: 3, text: "I have a clear priority for what I need to accomplish each day", category: "focus" },
  { id: 4, text: "I find it hard to get back on track after an interruption", category: "focus", reverseScored: true },
  
  // Habits (4 questions)
  { id: 5, text: "I have a consistent morning routine that sets me up for success", category: "habits" },
  { id: 6, text: "I often procrastinate on important tasks", category: "habits", reverseScored: true },
  { id: 7, text: "I batch similar tasks together to work more efficiently", category: "habits" },
  { id: 8, text: "I check email/messages first thing in the morning", category: "habits", reverseScored: true },
  
  // Systems (4 questions)
  { id: 9, text: "I use a task management system that I trust", category: "systems" },
  { id: 10, text: "I often feel overwhelmed by everything I need to do", category: "systems", reverseScored: true },
  { id: 11, text: "I have a clear system for prioritising my work", category: "systems" },
  { id: 12, text: "I lose important information or forget tasks", category: "systems", reverseScored: true },
  
  // Energy (4 questions)
  { id: 13, text: "I get 7-8 hours of quality sleep most nights", category: "energy" },
  { id: 14, text: "I feel mentally drained by midday", category: "energy", reverseScored: true },
  { id: 15, text: "I take breaks that actually recharge me", category: "energy" },
  { id: 16, text: "I work during my peak energy hours", category: "energy" },
  
  // Mindset (4 questions)
  { id: 17, text: "I believe I can improve my productivity habits", category: "mindset" },
  { id: 18, text: "I often feel guilty about not being productive enough", category: "mindset", reverseScored: true },
  { id: 19, text: "I celebrate small wins and progress", category: "mindset" },
  { id: 20, text: "I compare my productivity to others in a negative way", category: "mindset", reverseScored: true },
];

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; description: string }> = {
  focus: { label: "Focus", icon: Target, color: "#3b82f6", description: "Your ability to concentrate and avoid distraction" },
  habits: { label: "Habits", icon: Repeat, color: "#10b981", description: "Daily routines and consistency" },
  systems: { label: "Systems", icon: BarChart2, color: "#f59e0b", description: "Tools and processes for managing work" },
  energy: { label: "Energy", icon: Zap, color: "#ec4899", description: "Physical and mental energy management" },
  mindset: { label: "Mindset", icon: Brain, color: "#8b5cf6", description: "Beliefs and attitudes about work" },
};

// ─── Score Calculation ───────────────────────────────────────────────────────

function calculateScores(answers: number[]): ProductivityResult {
  const categoryScores: CategoryScore[] = [];
  const categoryTotals: Record<string, { total: number; max: number; count: number }> = {
    focus: { total: 0, max: 0, count: 0 },
    habits: { total: 0, max: 0, count: 0 },
    systems: { total: 0, max: 0, count: 0 },
    energy: { total: 0, max: 0, count: 0 },
    mindset: { total: 0, max: 0, count: 0 },
  };

  // Calculate scores per category
  QUESTIONS.forEach((q, idx) => {
    let score = answers[idx];
    if (q.reverseScored) {
      score = 6 - score; // Reverse 1→5, 2→4, 3→3, etc.
    }
    categoryTotals[q.category].total += score;
    categoryTotals[q.category].max += 5;
    categoryTotals[q.category].count++;
  });

  // Build category scores
  let totalScore = 0;
  let totalMax = 0;
  for (const [key, data] of Object.entries(categoryTotals)) {
    const percentage = (data.total / data.max) * 100;
    const categoryScore = Math.round(percentage);
    totalScore += data.total;
    totalMax += data.max;
    categoryScores.push({
      name: CATEGORY_CONFIG[key].label,
      key: key as any,
      score: categoryScore,
      maxScore: data.max,
      percentage,
      description: "",
    });
  }

  const overallPercentage = (totalScore / totalMax) * 100;
  const finalScore = Math.round(overallPercentage);

  // Identify bottlenecks (lowest categories)
  const sorted = [...categoryScores].sort((a, b) => a.score - b.score);
  const bottlenecks: Bottleneck[] = sorted.slice(0, 2).map(cat => {
    let issue = "";
    let impact = "";
    let severity: "high" | "medium" | "low" = "medium";
    
    if (cat.key === "focus") {
      issue = "Constant distractions breaking your flow";
      impact = "Tasks take 2-3x longer than they should";
      severity = cat.score < 40 ? "high" : cat.score < 60 ? "medium" : "low";
    } else if (cat.key === "habits") {
      issue = "Inconsistent routines and procrastination";
      impact = "You're reactive instead of proactive";
      severity = cat.score < 40 ? "high" : cat.score < 60 ? "medium" : "low";
    } else if (cat.key === "systems") {
      issue = "No reliable system to track tasks and priorities";
      impact = "Things fall through the cracks constantly";
      severity = cat.score < 40 ? "high" : cat.score < 60 ? "medium" : "low";
    } else if (cat.key === "energy") {
      issue = "Working when you're tired instead of peak hours";
      impact = "Lower quality output and burnout risk";
      severity = cat.score < 40 ? "high" : cat.score < 60 ? "medium" : "low";
    } else {
      issue = "Negative self-talk about productivity";
      impact = "Shame spiral that makes it harder to start";
      severity = cat.score < 40 ? "high" : cat.score < 60 ? "medium" : "low";
    }
    
    return {
      category: cat.name,
      issue,
      impact,
      severity,
    };
  });

  // Identify strengths (highest categories)
  const strengths = sorted.slice(-2).reverse().map(cat => {
    if (cat.key === "focus") return "Good at staying focused when it matters";
    if (cat.key === "habits") return "You have solid daily routines";
    if (cat.key === "systems") return "You use systems that work for you";
    if (cat.key === "energy") return "You manage your energy well";
    return "Positive mindset about growth and improvement";
  });

  // Generate action plan based on bottlenecks
  const actionPlan: ActionStep[] = [];
  const topBottleneck = bottlenecks[0];
  
  if (topBottleneck.category === "Focus") {
    actionPlan.push(
      { step: 1, title: "Remove one distraction source", action: "Put your phone in another room for 90 minutes tomorrow. Check it only after.", timeframe: "today", effort: "easy" },
      { step: 2, title: "Use a focus timer", action: "Try 25-minute focused blocks with 5-minute breaks. Track how many you complete.", timeframe: "this week", effort: "easy" },
      { step: 3, title: "Create a distraction log", action: "Note what interrupts you. Patterns will reveal what to fix.", timeframe: "this week", effort: "medium" }
    );
  } else if (topBottleneck.category === "Habits") {
    actionPlan.push(
      { step: 1, title: "Pick one morning anchor", action: "Do ONE thing consistently: make your bed, drink water, or write one priority.", timeframe: "today", effort: "easy" },
      { step: 2, title: "Time-block your hardest task", action: "Schedule it for your best energy hour. No email before it's done.", timeframe: "this week", effort: "medium" },
      { step: 3, title: "Build a shutdown ritual", action: "End your day by writing tomorrow's top priority. Sleep better.", timeframe: "this week", effort: "medium" }
    );
  } else if (topBottleneck.category === "Systems") {
    actionPlan.push(
      { step: 1, title: "Pick ONE task manager", action: "Choose a simple tool (Apple Reminders, Todoist, or paper). Move everything there.", timeframe: "today", effort: "easy" },
      { step: 2, title: "Use the 3-3-3 method", action: "3 big things, 3 medium things, 3 small things. That's your day.", timeframe: "this week", effort: "medium" },
      { step: 3, title: "Weekly review habit", action: "Every Friday: clear done tasks, review next week, reset.", timeframe: "this month", effort: "significant" }
    );
  } else if (topBottleneck.category === "Energy") {
    actionPlan.push(
      { step: 1, title: "Track your energy for 3 days", action: "Note when you feel sharp vs foggy. Patterns will appear.", timeframe: "this week", effort: "easy" },
      { step: 2, title: "Protect your peak hours", action: "Block 90 minutes of deep work when you're naturally sharpest.", timeframe: "this week", effort: "medium" },
      { step: 3, title: "Take real breaks", action: "Step away from screens. Walk, stretch, do nothing. 10 mins counts.", timeframe: "today", effort: "easy" }
    );
  } else {
    actionPlan.push(
      { step: 1, title: "Celebrate one win today", action: "Write down one thing you did well. No 'buts'.", timeframe: "today", effort: "easy" },
      { step: 2, title: "Reframe 'I should' to 'I choose'", action: "Notice when you're guilt-motivated. Reframe to choice.", timeframe: "this week", effort: "medium" },
      { step: 3, title: "Separate worth from output", action: "You are not your productivity. Remind yourself daily.", timeframe: "this month", effort: "significant" }
    );
  }

  // Insight based on score
  let insight = "";
  if (finalScore >= 80) {
    insight = "You've built strong systems that work. Your challenge is sustainability — protect your energy and keep refining.";
  } else if (finalScore >= 60) {
    insight = `You're doing well in ${strengths[0].toLowerCase()} and ${strengths[1].toLowerCase()}. Fix ${topBottleneck.category.toLowerCase()} and you'll see big gains.`;
  } else if (finalScore >= 40) {
    insight = `You have solid foundations. The bottleneck is ${topBottleneck.category.toLowerCase()}. Focus there first — small changes will have outsized impact.`;
  } else {
    insight = "Good on you for doing this audit. You're not broken — you just haven't built the right systems yet. Start with one action from below.";
  }

  // Shareable stats
  const shareHeadline = finalScore >= 70 ? `My Productivity Score: ${finalScore}/100 🔥` 
    : finalScore >= 50 ? `My Productivity Score: ${finalScore}/100 — room to grow 📈`
    : `My Productivity Score: ${finalScore}/100 — here's what I'm fixing 🎯`;

  const shareStats = `${topBottleneck.category} is my biggest bottleneck. ${actionPlan[0].action.split(".")[0]}.`;

  return {
    totalScore: finalScore,
    categoryScores,
    bottlenecks,
    actionPlan,
    strengths,
    insight,
    shareHeadline,
    shareStats,
  };
}

// ─── Question Component ───────────────────────────────────────────────────────

function QuestionCard({ question, index, value, onChange }: {
  question: Question;
  index: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const options = [
    { value: 1, label: "Never", color: "#ef4444" },
    { value: 2, label: "Rarely", color: "#f97316" },
    { value: 3, label: "Sometimes", color: "#f59e0b" },
    { value: 4, label: "Often", color: "#10b981" },
    { value: 5, label: "Always", color: "#22c55e" },
  ];

  return (
    <div className="border border-stone-100 rounded-sm p-5 bg-white">
      <div className="flex items-start gap-3 mb-4">
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 text-sm font-black flex items-center justify-center">
          {index + 1}
        </span>
        <p className="text-sm font-semibold text-stone-800 leading-relaxed flex-1">
          {question.text}
        </p>
      </div>
      
      <div className="flex gap-1 sm:gap-2 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 min-w-[55px] py-2 text-[11px] font-semibold rounded-sm border transition-all ${
              value === opt.value
                ? `border-${opt.color} bg-${opt.color}/10 text-${opt.color}`
                : "border-stone-200 bg-white text-stone-400 hover:border-stone-300"
            }`}
            style={{
              borderColor: value === opt.value ? opt.color : undefined,
              backgroundColor: value === opt.value ? `${opt.color}10` : undefined,
              color: value === opt.value ? opt.color : undefined,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Score Ring Component ─────────────────────────────────────────────────────

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color }}>{score}</span>
        <span className="text-[10px] text-stone-400 font-semibold">/100</span>
      </div>
    </div>
  );
}

// ─── Category Bar Component ───────────────────────────────────────────────────

function CategoryBar({ category, score, color }: { category: string; score: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-stone-600">{category}</span>
        <span className="text-xs font-black" style={{ color }}>{score}%</span>
      </div>
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, delay: 0.1 }}
        />
      </div>
    </div>
  );
}

// ─── Input Stage (Questions) ──────────────────────────────────────────────────

function QuestionsStage({ onSubmit }: { onSubmit: (answers: number[]) => void }) {
  const [answers, setAnswers] = useState<number[]>(Array(20).fill(3));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (value: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = value;
    setAnswers(newAnswers);
    
    if (currentIndex < 19) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const currentQuestion = QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / 20) * 100;

  if (showResults) {
    return (
      <div className="space-y-6">
        <div className="bg-indigo-50 border border-indigo-200 rounded-sm p-6 text-center">
          <CheckCircle className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
          <h3 className="text-xl font-black text-stone-900 mb-2">You've answered all 20 questions</h3>
          <p className="text-sm text-stone-600">Ready to see your Productivity Score and personalised plan?</p>
          <button
            onClick={handleSubmit}
            className="mt-4 flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-sm transition-colors mx-auto"
          >
            <Sparkles className="w-4 h-4" /> Calculate My Score
          </button>
        </div>

        {/* Review answers */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {QUESTIONS.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => {
                setCurrentIndex(idx);
                setShowResults(false);
              }}
              className="w-full flex items-center gap-3 p-3 text-left border border-stone-100 rounded-sm hover:border-stone-200 transition-colors"
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                answers[idx] >= 4 ? "bg-green-100 text-green-700" : 
                answers[idx] <= 2 ? "bg-red-100 text-red-700" : "bg-stone-100 text-stone-600"
              }`}>
                {answers[idx]}
              </span>
              <span className="text-xs text-stone-600 flex-1">{q.text.substring(0, 60)}...</span>
              <ChevronRight className="w-4 h-4 text-stone-300" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-stone-400 mb-1">
          <span>Question {currentIndex + 1} of 20</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Current question */}
      <QuestionCard
        question={currentQuestion}
        index={currentIndex}
        value={answers[currentIndex]}
        onChange={handleAnswer}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-sm transition-colors ${
            currentIndex > 0 ? "text-stone-600 hover:text-stone-900" : "text-stone-300 cursor-not-allowed"
          }`}
        >
          <ChevronDown className="w-4 h-4 rotate-90" /> Previous
        </button>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((val) => (
            <button
              key={val}
              onClick={() => handleAnswer(val)}
              className={`w-10 h-10 rounded-sm text-sm font-bold transition-all ${
                answers[currentIndex] === val
                  ? "bg-indigo-600 text-white"
                  : "bg-stone-50 text-stone-500 hover:bg-stone-100"
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1 flex-wrap">
        {QUESTIONS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentIndex ? "bg-indigo-500 scale-125" : 
              answers[idx] !== 3 ? "bg-indigo-200" : "bg-stone-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Results Stage ────────────────────────────────────────────────────────────

function ResultsStage({
  result,
  onReset,
}: {
  result: ProductivityResult;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const handleShare = () => {
    const text = `${result.shareHeadline}\n\n${result.shareStats}\n\nTake the free audit: isaacpaha.com/tools/productivity-score`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#10b981";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Exceptional — you've built systems that work";
    if (score >= 60) return "Strong — fine-tuning will make you elite";
    if (score >= 40) return "Solid — fix one bottleneck for big gains";
    return "Starting point — small changes will transform your work";
  };

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="bg-stone-900 text-white rounded-sm p-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Your Productivity Score</p>
            <h2 className="text-2xl font-black">{result.totalScore}/100</h2>
            <p className="text-xs text-white/60 mt-1 max-w-sm">{getScoreLabel(result.totalScore)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all"
            >
              {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" />Copied</> : <><Share2 className="w-3.5 h-3.5" />Share</>}
            </button>
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/25 px-3 py-2 rounded-sm transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />Retake
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center py-4">
          <ScoreRing score={result.totalScore} size={140} />
        </div>
      </div>

      {/* Insight */}
      <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 rounded-sm p-4">
        <Lightbulb className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-indigo-900 leading-relaxed">{result.insight}</p>
      </div>

      {/* Category breakdown */}
      <div>
        <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3">Score Breakdown</p>
        <div className="space-y-3">
          {result.categoryScores.map((cat) => (
            <CategoryBar
              key={cat.key}
              category={cat.name}
              score={cat.score}
              color={CATEGORY_CONFIG[cat.key].color}
            />
          ))}
        </div>
      </div>

      {/* Bottlenecks */}
      {result.bottlenecks.length > 0 && (
        <div>
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> What's Slowing You Down
          </p>
          <div className="space-y-3">
            {result.bottlenecks.map((b, i) => (
              <div
                key={i}
                className={`border rounded-sm p-4 ${
                  b.severity === "high" ? "border-red-200 bg-red-50/30" :
                  b.severity === "medium" ? "border-amber-200 bg-amber-50/30" :
                  "border-stone-200 bg-stone-50/30"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm ${
                    b.severity === "high" ? "bg-red-100 text-red-700" :
                    b.severity === "medium" ? "bg-amber-100 text-amber-700" :
                    "bg-stone-100 text-stone-600"
                  }`}>
                    {b.category}
                  </span>
                  <span className="text-xs font-bold text-stone-800">{b.issue}</span>
                </div>
                <p className="text-xs text-stone-600">{b.impact}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {result.strengths.length > 0 && (
        <div>
          <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Award className="w-3.5 h-3.5" /> What's Working
          </p>
          <div className="flex flex-wrap gap-2">
            {result.strengths.map((s, i) => (
              <span key={i} className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-sm">
                ✓ {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Action plan */}
      <div>
        <p className="text-xs font-black text-stone-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Target className="w-3.5 h-3.5" /> 3-Step Fix Plan
        </p>
        <div className="space-y-3">
          {result.actionPlan.map((step) => (
            <div key={step.step} className="flex gap-3 border border-stone-100 rounded-sm p-4">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-sm font-black flex items-center justify-center flex-shrink-0">
                {step.step}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="text-sm font-bold text-stone-800">{step.title}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm ${
                    step.effort === "easy" ? "bg-green-100 text-green-700" :
                    step.effort === "medium" ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {step.effort} effort
                  </span>
                  <span className="text-[9px] text-stone-400">{step.timeframe}</span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">{step.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly re-check CTA */}
      <div className="flex items-start gap-3 bg-stone-50 border border-stone-200 rounded-sm p-4">
        <Repeat className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-stone-800">Retake in 7 days</p>
          <p className="text-xs text-stone-500 mt-0.5">
            Your score will improve as you implement these changes. Come back weekly to track your progress.
          </p>
          <button
            onClick={() => {
              localStorage.setItem("lastProductivityScore", JSON.stringify({
                score: result.totalScore,
                date: new Date().toISOString(),
              }));
            }}
            className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline-offset-2 hover:underline"
          >
            Save this result →
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 text-[10px] text-stone-400">
        <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
        <p>This is a self-assessment tool. Your results are based on your honest answers. Use the insights to improve, not as a measure of self-worth.</p>
      </div>
    </div>
  );
}

// ─── Loading Stage ────────────────────────────────────────────────────────────

function LoadingStage() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-stone-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">📊</div>
      </div>
      <div>
        <p className="text-sm font-semibold text-stone-600">Calculating your productivity score...</p>
        <p className="text-xs text-stone-400 mt-1">Analysing patterns and building your plan</p>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function ProductivityScoreTool({ isSignedIn = false }: { isSignedIn?: boolean }) {
  const [stage, setStage] = useState<"questions" | "loading" | "results">("questions");
  const [result, setResult] = useState<ProductivityResult | null>(null);

  const handleSubmit = (answers: number[]) => {
    setStage("loading");
    // Simulate loading for better UX
    setTimeout(() => {
      const calculatedResult = calculateScores(answers);
      setResult(calculatedResult);
      setStage("results");
    }, 1500);
  };

  const handleReset = () => {
    setStage("questions");
    setResult(null);
  };

  return (
    <div className="space-y-0" style={{ fontFamily: "Sora, sans-serif" }}>
      {stage === "questions" && <QuestionsStage onSubmit={handleSubmit} />}
      {stage === "loading" && <LoadingStage />}
      {stage === "results" && result && <ResultsStage result={result} onReset={handleReset} />}
    </div>
  );
}