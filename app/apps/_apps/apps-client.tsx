"use client";

import React, { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AppsHero } from "./apps-hero";
import { AppSpotlight } from "./app-spotlight";
import { AppsFilterBar, type FilterState } from "./apps-filter-bar";
import { CompanySection } from "./company-section";
import { Search } from "lucide-react";
import { WhatsNextSection } from "./whats-next-section";
import { APPS, CompanyId } from "@/lib/data/apps-data";
import { AppCard } from "./app-card";

const COMPANY_ORDER: CompanyId[] = ["okpah", "ipaha", "ipahaStores"];

export function AppsClient() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    status: "ALL",
    category: "ALL",
    company: "ALL",
  });

  const hasFilters =
    filters.search !== "" ||
    filters.status !== "ALL" ||
    filters.category !== "ALL" ||
    filters.company !== "ALL";

  const filtered = useMemo(() => {
    return APPS.filter(app => {
      if (filters.status !== "ALL" && app.status !== filters.status) return false;
      if (filters.category !== "ALL" && app.category !== filters.category) return false;
      if (filters.company !== "ALL" && app.company !== filters.company) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const inName = app.name.toLowerCase().includes(q);
        const inTagline = app.tagline.toLowerCase().includes(q);
        const inDesc = app.description.toLowerCase().includes(q);
        const inStack = app.techStack.some(t => t.name.toLowerCase().includes(q));
        const inCat = app.category.toLowerCase().includes(q);
        if (!inName && !inTagline && !inDesc && !inStack && !inCat) return false;
      }
      return true;
    });
  }, [filters]);

  return (
    <div className="min-h-screen bg-[#080810]">
      <AppsHero />

      {/* Featured spotlight — only when no filters active */}
      {!hasFilters && <AppSpotlight />}

      {/* Filter bar */}
      <AppsFilterBar
        filters={filters}
        onFilters={setFilters}
        resultCount={filtered.length}
      />

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <Search className="w-10 h-10 text-white/10 mb-4" />
              <p className="text-lg font-bold text-white/30 mb-2">No apps match your filters</p>
              <p className="text-sm text-white/20">Try broadening your search or clearing filters</p>
            </motion.div>
          ) : hasFilters ? (
            /* Flat grid when filters are active */
            <motion.div
              key="flat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-6">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((app, i) => (
                  <div key={app.id} className="h-full">
                    {/* inline card to avoid circular dep issue — use AppCard */}
                    {(() => {
                      return <AppCard app={app} index={i} />;
                    })()}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* Company-grouped layout when no filters */
            <motion.div key="grouped" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Section header */}
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-black text-white mb-1">All Applications</h2>
                  <p className="text-sm text-white/30">Grouped by company · {APPS.length} apps total</p>
                </div>
              </div>

              {COMPANY_ORDER.map(companyId => {
                const companyApps = APPS.filter(a => a.company === companyId);
                return (
                  <CompanySection
                    key={companyId}
                    companyId={companyId}
                    filteredApps={companyApps}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* What's next */}
      {!hasFilters && <WhatsNextSection />}
    </div>
  );
}