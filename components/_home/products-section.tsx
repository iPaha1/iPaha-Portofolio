// =============================================================================
// PRODUCTS SECTION — Premium Redesign
// components/_home/products-section.tsx
//
// Design direction:
//  • Dark #0a0a0c canvas — matches hero + game teaser — zero contrast breaks
//  • Each card: frosted glass shell, unique accent colour, kinetic hover
//  • Featured (first live) product gets a full-width hero card
//  • Status system: glowing live dot, subtle coming-soon treatment
//  • Company badge on every card (iPaha Ltd / iPahaStores / Okpah)
//  • Tag pills use the card's accent tint
//  • Staggered entrance via Framer Motion, matching site animation style
//  • Fully responsive: 1 col mobile → 2 col tablet → 3 col desktop
//    with the featured card spanning full width on tablet+
// =============================================================================

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Zap, Globe, ExternalLink } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { PRODUCTS } from "@/lib/data/site-data";

// ─── Accent colours per product index ────────────────────────────────────────
// Cycles through the game system's neon palette so the section feels
// cohesive with the Game Teaser above it.
const ACCENTS = [
  { primary: "#f59e0b", glow: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.22)" },
  { primary: "#10b981", glow: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.2)"  },
  { primary: "#3b82f6", glow: "rgba(59,130,246,0.1)",  border: "rgba(59,130,246,0.2)"  },
  { primary: "#8b5cf6", glow: "rgba(139,92,246,0.1)",  border: "rgba(139,92,246,0.2)"  },
  { primary: "#ec4899", glow: "rgba(236,72,153,0.1)",  border: "rgba(236,72,153,0.2)"  },
  { primary: "#06b6d4", glow: "rgba(6,182,212,0.1)",   border: "rgba(6,182,212,0.2)"   },
  { primary: "#f97316", glow: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.2)"  },
  { primary: "#84cc16", glow: "rgba(132,204,22,0.1)",  border: "rgba(132,204,22,0.2)"  },
];

// ─── Live status badge ────────────────────────────────────────────────────────
function LiveBadge({ accent }: { accent: string }) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs"
      style={{
        background: `${accent}18`,
        border:     `1px solid ${accent}35`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
        style={{ background: accent, boxShadow: `0 0 5px ${accent}` }}
      />
      <span
        className="text-[10px] font-black tracking-[0.18em] uppercase"
        style={{ color: accent }}
      >
        Live
      </span>
    </div>
  );
}

function ComingSoonBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white/20 flex-shrink-0" />
      <span className="text-[10px] font-black tracking-[0.18em] uppercase text-white/30">
        Soon
      </span>
    </div>
  );
}

// ─── Company tag ──────────────────────────────────────────────────────────────
function CompanyTag({ company }: { company: string }) {
  return (
    <span className="text-[10px] font-bold text-white/20 tracking-wide">
      {company}
    </span>
  );
}

// ─── Standard product card ────────────────────────────────────────────────────
function ProductCard({
  product,
  accentIdx,
  featured = false,
}: {
  product: (typeof PRODUCTS)[0];
  accentIdx: number;
  featured?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const accent = ACCENTS[accentIdx % ACCENTS.length];
  const isLive = product.status === "live";

  const inner = (
    <motion.div
      variants={staggerItem}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={cn("relative rounded-xs overflow-hidden h-full group", isLive ? "cursor-pointer" : "cursor-default")}
      style={{
        background: hovered && isLive
          ? `linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)`
          : "rgba(255,255,255,0.025)",
        border: hovered && isLive
          ? `1px solid ${accent.border}`
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: hovered && isLive
          ? `0 20px 60px -20px rgba(0,0,0,0.6), 0 0 40px -10px ${accent.glow}`
          : "0 4px 24px -8px rgba(0,0,0,0.4)",
        transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Top accent bar — slides in on hover */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[2px] origin-left"
        animate={{ scaleX: hovered && isLive ? 1 : 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: `linear-gradient(90deg, ${accent.primary} 0%, ${accent.primary}60 70%, transparent 100%)`,
          boxShadow: `0 0 12px ${accent.primary}80`,
        }}
      />

      {/* Ambient glow — bottom right */}
      {isLive && hovered && (
        <div
          className="absolute -bottom-16 -right-16 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${accent.primary}10 0%, transparent 70%)`,
            filter: "blur(24px)",
          }}
        />
      )}

      <div className={cn("relative p-6 flex flex-col h-full", featured && "lg:p-8")}>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-3">
            {/* Company + domain row */}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-6 h-6 rounded-xs flex items-center justify-center flex-shrink-0"
                style={{
                  background: isLive ? `${accent.primary}18` : "rgba(255,255,255,0.06)",
                  border: `1px solid ${isLive ? accent.border : "rgba(255,255,255,0.08)"}`,
                }}
              >
                {isLive
                  ? <Zap className="w-3 h-3" style={{ color: accent.primary }} />
                  : <Globe className="w-3 h-3 text-white/20" />
                }
              </div>
              <span className="text-[10px] font-mono text-white/25 tracking-wider">
                {product.domain}
              </span>
            </div>

            {/* Product name */}
            <h3
              className="font-black text-white leading-tight transition-colors duration-200"
              style={{
                fontSize:      featured ? "clamp(20px, 2.5vw, 26px)" : "17px",
                letterSpacing: "-0.025em",
                color:         hovered && isLive ? "white" : "rgba(255,255,255,0.88)",
              }}
            >
              {product.name}
            </h3>
          </div>

          {/* Right badges */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {isLive
              ? <LiveBadge accent={accent.primary} />
              : <ComingSoonBadge />
            }
            {isLive && (
              <motion.div
                animate={{ rotate: hovered ? 0 : -45, opacity: hovered ? 1 : 0.3 }}
                transition={{ duration: 0.2 }}
              >
                <ArrowUpRight
                  className="w-4 h-4"
                  style={{ color: hovered ? accent.primary : "rgba(255,255,255,0.3)" }}
                />
              </motion.div>
            )}
          </div>
        </div>

        {/* Description */}
        <p
          className="text-sm leading-relaxed flex-1 mb-5"
          style={{ color: "rgba(255,255,255,0.38)" }}
        >
          {product.description}
        </p>

        {/* Footer: tags + company */}
        <div className="flex items-end justify-between gap-2 mt-auto">
          <div className="flex flex-wrap gap-1.5">
            {product.tags.slice(0, featured ? 5 : 3).map(tag => (
              <span
                key={tag}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-xs transition-all duration-200"
                style={{
                  background: hovered && isLive ? `${accent.primary}14` : "rgba(255,255,255,0.05)",
                  border:     `1px solid ${hovered && isLive ? accent.border : "rgba(255,255,255,0.08)"}`,
                  color:      hovered && isLive ? `${accent.primary}cc` : "rgba(255,255,255,0.28)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          {("company" in product && typeof product.company === "string") && (
            <CompanyTag company={product.company} />
          )}
        </div>
      </div>
    </motion.div>
  );

  if (isLive) {
    return (
      <Link
        href={product.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

// ─── Section eyebrow ──────────────────────────────────────────────────────────
function SectionEyebrow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="mb-14"
    >
      {/* Eyebrow pill */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xs"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[10px] font-black tracking-[0.28em] uppercase text-white/35">
            Products I've Built
          </span>
        </div>
        <div className="h-px w-10 bg-white/[0.06]" />
      </div>

      {/* Headline + sub in a split layout */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-12 max-w-4xl">
        <h2
          className="font-black text-white leading-[0.92] tracking-tight flex-shrink-0"
          style={{ fontSize: "clamp(32px, 5vw, 60px)", letterSpacing: "-0.035em" }}
        >
          Solving real
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #fcd34d 50%, #f59e0b 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            problems.
          </span>
        </h2>
        <p
          className="text-[14px] leading-relaxed sm:pb-1"
          style={{
            color:       "rgba(255,255,255,0.3)",
            borderLeft:  "2px solid rgba(245,158,11,0.3)",
            paddingLeft: "14px",
            maxWidth:    "340px",
          }}
        >
          Technology that makes a genuine difference — in employment, commerce, education, and productivity across the UK and beyond.
        </p>
      </div>
    </motion.div>
  );
}

// ─── Products Section ─────────────────────────────────────────────────────────
export const ProductsSection = () => {
  const featured   = PRODUCTS[0];
  const rest       = PRODUCTS.slice(1);

  return (
    <section
      id="products"
      className="relative overflow-hidden"
      style={{
        background:  "#0a0a0c",
        fontFamily:  "'Sora', system-ui, sans-serif",
      }}
    >
      {/* Ambient layer */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-[20%] w-[500px] h-[300px]"
          style={{
            background: "radial-gradient(ellipse, rgba(245,158,11,0.04) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute bottom-0 right-[10%] w-[400px] h-[400px]"
          style={{
            background: "radial-gradient(ellipse, rgba(139,92,246,0.04) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.6]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 py-24 lg:py-28">

        <SectionEyebrow />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {/* ── Featured card (first product) — full width ── */}
          {featured && (
            <motion.div variants={staggerItem} className="mb-4">
              <ProductCard product={featured} accentIdx={0} featured />
            </motion.div>
          )}

          {/* ── Grid: remaining products — 2 col → 3 col ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                accentIdx={i + 1}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Footer count bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-12 flex flex-wrap items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "24px" }}
        >
          <div className="flex items-center gap-6">
            {[
              { value: PRODUCTS.filter(p => p.status === "live").length,       label: "Live products"  },
              { value: PRODUCTS.filter(p => p.status === "coming-soon").length, label: "In development" },
              { value: PRODUCTS.length,                                          label: "Total built"    },
            ].map(stat => (
              <div key={stat.label} className="flex items-center gap-2">
                <span className="text-base font-black text-white" style={{ letterSpacing: "-0.02em" }}>
                  {stat.value}
                </span>
                <span className="text-[11px] text-white/25 font-semibold">{stat.label}</span>
              </div>
            ))}
          </div>

          <Link
            href="/apps"
            className="group flex items-center gap-2 text-[11px] font-black tracking-wider uppercase text-white/30 hover:text-amber-400 transition-colors duration-200"
          >
            View all apps
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};