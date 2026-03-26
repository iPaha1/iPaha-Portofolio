"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/animations";

interface SectionProps {
  id?: string;
  className?: string;
  children: React.ReactNode;
}

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}

// ─── Section Wrapper ──────────────────────────────────────────────────────────
export const Section = ({ id, className, children }: SectionProps) => (
  <section
    id={id}
    className={cn("relative z-10 py-24 px-4 sm:px-6 lg:px-8", className)}
  >
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

// ─── Section Header ───────────────────────────────────────────────────────────
export const SectionHeader = ({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: SectionHeaderProps) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-80px" }}
    variants={fadeUp}
    className={cn(
      "mb-16",
      align === "center" ? "text-center" : "text-left",
      className
    )}
  >
    {eyebrow && (
      <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase text-amber-600 mb-4">
        <span className="w-8 h-px bg-amber-500 inline-block" />
        {eyebrow}
        <span className="w-8 h-px bg-amber-500 inline-block" />
      </p>
    )}
    <h2 className="text-3xl md:text-5xl font-bold mb-5 text-gray-900 leading-tight">
      {title}
    </h2>
    {subtitle && (
      <p
        className={cn(
          "text-lg text-gray-500 max-w-2xl leading-relaxed",
          align === "center" && "mx-auto"
        )}
      >
        {subtitle}
      </p>
    )}
  </motion.div>
);

// ─── Divider ─────────────────────────────────────────────────────────────────
export const SectionDivider = () => (
  <div className="max-w-6xl mx-auto px-4">
    <div className="h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
  </div>
);