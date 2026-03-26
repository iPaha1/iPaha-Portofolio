"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, ChevronDown, ChevronUp, MapPin, Calendar, Layers } from "lucide-react";
import { APPS, COMPANIES, type CompanyId, type App } from "@/lib/data/apps-data";
import { AppCard } from "./app-card";


interface CompanySectionProps {
  companyId: CompanyId;
  filteredApps: App[];
}

export function CompanySection({ companyId, filteredApps }: CompanySectionProps) {
  const [expanded, setExpanded] = useState(true);
  const company = COMPANIES[companyId];
  const allCompanyApps = APPS.filter(a => a.company === companyId);
  const liveCount = allCompanyApps.filter(a => a.status === "LIVE").length;

  if (filteredApps.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
      className="mb-20"
    >
      {/* Company header */}
      <div
        className="relative rounded overflow-hidden border border-white/[0.07] mb-6"
        style={{
          background: `linear-gradient(135deg, ${company.primaryColor}0a, transparent 60%)`,
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[1.5px]"
          style={{ background: `linear-gradient(90deg, ${company.primaryColor}60, transparent)` }}
        />

        <div className="relative z-10 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Flag badge */}
            <div
              className="w-12 h-12 rounded-lg border flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: `${company.primaryColor}12`, borderColor: `${company.primaryColor}25` }}
            >
              {company.flag}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-black text-white">{company.name}</h2>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-[11px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded">
                    <MapPin className="w-2.5 h-2.5" /> {company.country}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded">
                    <Calendar className="w-2.5 h-2.5" /> Est. {company.founded}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded">
                    <Layers className="w-2.5 h-2.5" /> {company.focus}
                  </span>
                </div>
              </div>
              <p className="text-sm text-white/40 mt-1 max-w-xl">{company.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 ml-0 md:ml-auto flex-shrink-0">
            {/* Stats */}
            <div className="hidden md:flex items-center gap-3 text-[11px] text-white/25">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: company.primaryColor }}
                />
                {liveCount} live
              </div>
              <span>·</span>
              <span>{allCompanyApps.length} total</span>
            </div>

            {/* Website */}
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[11px] font-semibold text-white/35 hover:text-white border border-white/[0.08] hover:border-white/20 px-3 py-2 rounded transition-all"
            >
              <ExternalLink className="w-3 h-3" />
              <span className="hidden md:inline">{company.website.replace("https://","")}</span>
              <span className="md:hidden">Website</span>
            </a>

            {/* Toggle */}
            <button
              onClick={() => setExpanded(e => !e)}
              className="w-8 h-8 flex items-center justify-center border border-white/[0.08] hover:border-white/20 text-white/30 hover:text-white rounded transition-all"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Apps grid */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredApps.map((app, i) => (
                <AppCard key={app.id} app={app} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center justify-center gap-2 text-sm text-white/30 hover:text-white border border-white/[0.06] hover:border-white/15 py-4 rounded transition-all"
        >
          <ChevronDown className="w-4 h-4" />
          Show {filteredApps.length} app{filteredApps.length !== 1 ? "s" : ""} from {company.name}
        </button>
      )}
    </motion.section>
  );
}