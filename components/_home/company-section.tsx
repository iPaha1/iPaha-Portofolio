"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Globe, ArrowUpRight, Calendar } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { COMPANIES } from "@/lib/data/site-data";
import { Section, SectionHeader } from "../shared/section";

// ─── Single company card ───────────────────────────────────────────────────────
const CompanyCard = ({
  company,
}: {
  company: (typeof COMPANIES)[0];
}) => (
  <motion.div
    variants={staggerItem}
    whileHover={{ y: -4 }}
    className="group relative bg-white border border-gray-100 rounded-xs p-7 hover:border-amber-200 hover:shadow-lg hover:shadow-amber-50 transition-all duration-300 overflow-hidden"
  >
    {/* Hover accent */}
    <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-400 to-amber-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

    {/* Flag + Year */}
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{company.flag}</span>
        <span className="text-xs text-gray-400 font-medium">{company.location}</span>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-300">
        <Calendar className="w-3 h-3" />
        <span>Est. {company.year}</span>
      </div>
    </div>

    {/* Name */}
    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-amber-600 transition-colors duration-200">
      {company.name}
    </h3>

    {/* Description */}
    <p className="text-sm text-gray-500 leading-relaxed mb-6">{company.description}</p>

    {/* Website link */}
    <Link
      href={company.href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
    >
      <Globe className="w-3.5 h-3.5" />
      {company.website}
      <ArrowUpRight className="w-3.5 h-3.5" />
    </Link>
  </motion.div>
);

// ─── Companies Section ─────────────────────────────────────────────────────────
export const CompaniesSection = () => (
  <Section id="companies" className="bg-gray-50/60">
    <SectionHeader
      eyebrow="My Companies"
      title="Building with purpose"
      subtitle="Three technology companies — one vision. Serving clients across the UK, Ghana, and beyond with innovative digital solutions."
    />
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {COMPANIES.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </motion.div>
  </Section>
);