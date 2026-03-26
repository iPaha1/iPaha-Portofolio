"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Zap } from "lucide-react";
import { Section, SectionHeader } from "@/components/shared/section";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { PRODUCTS } from "@/lib/data/site-data";

// ─── Status badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: "live" | "coming-soon" }) =>
  status === "live" ? (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-green-700 bg-green-50 border border-green-100 px-2.5 py-1 rounded-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      Live
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-amber-700 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Coming Soon
    </span>
  );

// ─── Product card ─────────────────────────────────────────────────────────────
const ProductCard = ({
  product,
}: {
  product: (typeof PRODUCTS)[0];
}) => {
  const isLive = product.status === "live";

  const Wrapper = isLive ? Link : "div";
  const wrapperProps: React.ComponentProps<typeof Link> | Record<string, never> = isLive
    ? { href: product.href, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <motion.div variants={staggerItem}>
      <Wrapper
        {...(wrapperProps as React.ComponentProps<typeof Link> & React.ComponentProps<"div">)}
        className={cn(
          "group block bg-white border border-gray-100 rounded-xs p-6 transition-all duration-300 overflow-hidden relative",
          isLive
            ? "hover:border-amber-200 hover:shadow-lg hover:shadow-amber-50 cursor-pointer"
            : "opacity-70 cursor-default"
        )}
      >
        {/* Top accent on hover */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

        {/* Header row */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-gray-400 font-mono">{product.domain}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors duration-200">
              {product.name}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={product.status} />
            {isLive && (
              <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors duration-200" />
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed mb-4">
          {product.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium text-gray-400 bg-gray-50 border border-gray-100 px-2.5 py-0.5 rounded-xs"
            >
              {tag}
            </span>
          ))}
        </div>
      </Wrapper>
    </motion.div>
  );
};

// ─── Products Section ─────────────────────────────────────────────────────────
export const ProductsSection = () => (
  <Section id="products">
    <SectionHeader
      eyebrow="Products I've Built"
      title="Solving real problems"
      subtitle="Technology that makes a genuine difference — in employment, commerce, education, and productivity across UK and beyond."
    />
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {PRODUCTS.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </motion.div>
  </Section>
);