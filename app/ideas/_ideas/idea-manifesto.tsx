"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";

const PRINCIPLES = [
  {
    number: "01",
    title: "Ideas are free",
    body: "The scarcest resource is not ideas — it's the courage to explore them seriously. Every concept here is freely shared because good ideas get better in the open.",
  },
  {
    number: "02",
    title: "Thinking out loud",
    body: "Not every idea here is finished or correct. This lab is where hypotheses live before they become conclusions. Uncertainty is not a weakness — it's the point.",
  },
  {
    number: "03",
    title: "From concept to product",
    body: "Some of these ideas will become real products. Some already have. The gap between an idea and a company is smaller than most people think.",
  },
];

export const IdeasManifesto = () => (
  <section className="py-20 px-4 border-t border-white/5">
    <div className="max-w-6xl mx-auto">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
      >
        {/* Left: quote */}
        <div>
          <motion.div variants={staggerItem} className="relative">
            <Quote className="w-12 h-12 text-amber-500/20 mb-6" />
            <blockquote className="text-2xl md:text-3xl font-black text-white leading-snug mb-6">
              &#34;The most valuable thinking happens at the intersection of technology,
              <span className="text-amber-400"> business</span>, and
              <span className="text-amber-400"> society</span>.&#34;
            </blockquote>
            <cite className="text-sm text-white/40 not-italic">— Isaac Paha</cite>
          </motion.div>
        </div>

        {/* Right: principles */}
        <div className="space-y-6">
          {PRINCIPLES.map((p) => (
            <motion.div
              key={p.number}
              variants={staggerItem}
              className="flex gap-5 group"
            >
              <span className="text-3xl font-black text-white/6 leading-none shrink-0 select-none group-hover:text-amber-500/20 transition-colors duration-300">
                {p.number}
              </span>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">{p.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{p.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);