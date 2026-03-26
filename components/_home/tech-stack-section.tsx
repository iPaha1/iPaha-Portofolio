"use client";

import React from "react";
import { motion } from "framer-motion";
import { Section, SectionHeader } from "@/components/shared/section";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { TECH_STACK } from "@/lib/data/site-data";


const categoryColors: Record<string, string> = {
  Frontend: "text-blue-600 bg-blue-50 border-blue-100",
  Backend: "text-green-700 bg-green-50 border-green-100",
  Language: "text-purple-700 bg-purple-50 border-purple-100",
  Database: "text-orange-700 bg-orange-50 border-orange-100",
  AI: "text-pink-700 bg-pink-50 border-pink-100",
  API: "text-cyan-700 bg-cyan-50 border-cyan-100",
  Payments: "text-emerald-700 bg-emerald-50 border-emerald-100",
  Auth: "text-rose-700 bg-rose-50 border-rose-100",
  Cloud: "text-sky-700 bg-sky-50 border-sky-100",
  DevOps: "text-gray-700 bg-gray-100 border-gray-200",
};

// Group by category
const grouped = TECH_STACK.reduce<Record<string, string[]>>((acc, item) => {
  if (!acc[item.category]) acc[item.category] = [];
  acc[item.category].push(item.name);
  return acc;
}, {});

const TechChip = ({
  name,
  category,
}: {
  name: string;
  category: string;
}) => (
  <motion.div
    variants={staggerItem}
    whileHover={{ scale: 1.05, y: -2 }}
    className={`inline-flex items-center gap-1.5 border px-3.5 py-1.5 rounded-xs text-sm font-medium cursor-default transition-all duration-200 ${
      categoryColors[category] ?? "text-gray-700 bg-gray-50 border-gray-100"
    }`}
  >
    {name}
  </motion.div>
);

export const TechStackSection = () => (
  <Section id="tech-stack" className="bg-gray-50/60">
    <SectionHeader
      eyebrow="Tech Stack"
      title="Tools I build with"
      subtitle="Mastering modern technologies to deliver scalable, efficient, and beautiful applications."
    />

    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="space-y-8"
    >
      {Object.entries(grouped).map(([category, techs]) => (
        <div key={category} className="flex flex-col sm:flex-row gap-3 sm:items-center">
          {/* Category label */}
          <div className="w-24 shrink-0">
            <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">
              {category}
            </span>
          </div>
          {/* Chips */}
          <div className="flex flex-wrap gap-2">
            {techs.map((tech) => (
              <TechChip key={tech} name={tech} category={category} />
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  </Section>
);