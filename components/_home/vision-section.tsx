"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Section } from "@/components/shared/section";
import { staggerContainer, staggerItem } from "@/lib/animations";

const MANIFESTO_LINES = [
  "I build technology that solves real problems.",
  "With a focus on employment, commerce,",
  "education, and productivity",
  "— in UK and beyond.",
];

const PILLARS = [
  {
    icon: "🌍",
    title: "Global impact",
    desc: "Technology without borders. Solutions built for everyone, starting where it matters most.",
  },
  {
    icon: "⚡",
    title: "Build with purpose",
    desc: "Every line of code written with intent. Every product designed for real human outcomes.",
  },
  {
    icon: "💡",
    title: "Think differently",
    desc: "The most valuable thinking happens at the intersection of technology, business, and society.",
  },
];

export const VisionSection = () => (
  <Section id="vision" className="bg-gray-900 text-white overflow-hidden">
    {/* Background texture */}
    <div
      className="absolute inset-0 opacity-5"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
        backgroundSize: "40px 40px",
      }}
    />
    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="relative z-10"
    >
      {/* Eyebrow */}
      <motion.p
        variants={staggerItem}
        className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-amber-400 mb-10"
      >
        <span className="w-8 h-px bg-amber-500 inline-block" />
        My Vision
        <span className="w-8 h-px bg-amber-500 inline-block" />
      </motion.p>

      {/* Large manifesto text */}
      <div className="mb-16 max-w-3xl">
        {MANIFESTO_LINES.map((line, i) => (
          <motion.p
            key={i}
            variants={staggerItem}
            className="text-3xl md:text-5xl font-black leading-tight text-white/90 mb-1"
          >
            {line}
          </motion.p>
        ))}
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
        {PILLARS.map((pillar) => (
          <motion.div
            key={pillar.title}
            variants={staggerItem}
            whileHover={{ y: -4 }}
            className="border border-white/10 rounded-xs p-6 bg-white/5 hover:bg-white/8 hover:border-amber-500/30 transition-all duration-300"
          >
            <span className="text-3xl mb-4 block">{pillar.icon}</span>
            <h3 className="text-lg font-bold text-white mb-2">{pillar.title}</h3>
            <p className="text-sm text-white/50 leading-relaxed">{pillar.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/about"
          className="group inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold px-7 py-3 rounded-xs transition-all duration-200"
        >
          Read my story
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
        <Link
          href="/newsletter"
          className="group inline-flex items-center gap-2 border border-white/20 hover:border-amber-400/50 text-white/70 hover:text-white font-semibold px-7 py-3 rounded-xs transition-all duration-200"
        >
          Join the newsletter
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
        </Link>
      </motion.div>
    </motion.div>
  </Section>
);