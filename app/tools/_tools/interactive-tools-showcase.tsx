"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
import { CVAnalyzerTool } from "./cv-analyzer";
import { StartupIdeaGenerator } from "./startup-ideas-generator";
import { LearningRoadmapGenerator } from "./learning-roadmap";
import { ReadingTimeCalculator } from "./reading-time-calculator";


const TOOLS = [
  {
    id: "cv",
    icon: "📄",
    name: "CV Analyzer",
    tagline: "AI-powered CV feedback",
    color: "#f59e0b",
    component: <CVAnalyzerTool />,
  },
  {
    id: "startup",
    icon: "🚀",
    name: "Startup Ideas",
    tagline: "Validate your next venture",
    color: "#10b981",
    component: <StartupIdeaGenerator />,
  },
  {
    id: "roadmap",
    icon: "🗺️",
    name: "Learning Roadmap",
    tagline: "Custom curriculum builder",
    color: "#8b5cf6",
    component: <LearningRoadmapGenerator />,
  },
  {
    id: "reading",
    icon: "⏱️",
    name: "Reading Time",
    tagline: "Instant content analysis",
    color: "#3b82f6",
    component: <ReadingTimeCalculator />,
  },
];

export const InteractiveToolsShowcase = () => {
  const [active, setActive] = useState("cv");
  const activeTool = TOOLS.find((t) => t.id === active)!;

  return (
    <section className="py-20 px-4 bg-gray-50 border-t border-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xs px-4 py-2 mb-5 shadow-sm">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="text-xs font-semibold tracking-widest uppercase text-amber-600">
              Try it right now
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            4 tools. Zero sign-up.
          </h2>
          <p className="text-lg text-gray-500 max-w-lg mx-auto">
            Built and tested. Use them directly — no accounts, no paywalls on the core experience.
          </p>
        </div>

        {/* Tab selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActive(tool.id)}
              className="group relative text-left p-4 rounded-xs border transition-all duration-200 overflow-hidden"
              style={
                active === tool.id
                  ? { borderColor: tool.color, backgroundColor: `${tool.color}08` }
                  : { borderColor: "#e5e7eb", backgroundColor: "#fff" }
              }
            >
              {/* Active indicator */}
              {active === tool.id && (
                <motion.div
                  layoutId="tool-active-border"
                  className="absolute top-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: tool.color }}
                />
              )}
              <span className="text-2xl block mb-2">{tool.icon}</span>
              <p
                className="text-sm font-bold leading-tight"
                style={{ color: active === tool.id ? tool.color : "#374151" }}
              >
                {tool.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-snug">{tool.tagline}</p>
            </button>
          ))}
        </div>

        {/* Tool panel */}
        <div className="bg-white border border-gray-200 rounded-xs overflow-hidden shadow-sm">
          {/* Panel header */}
          <div
            className="flex items-center gap-3 px-6 py-4 border-b border-gray-100"
            style={{ backgroundColor: `${activeTool.color}06` }}
          >
            <span className="text-xl">{activeTool.icon}</span>
            <div>
              <p className="text-sm font-bold text-gray-900">{activeTool.name}</p>
              <p className="text-xs text-gray-500">{activeTool.tagline}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live tool
            </div>
          </div>

          {/* Tool body */}
          <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                {activeTool.component}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};