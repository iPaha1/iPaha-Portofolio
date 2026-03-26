"use client";

import React, { useState, useMemo } from "react";
import { IDEAS, type IdeaCategory, type IdeaStatus } from "@/lib/data/ideas-data";
import { IdeasHero } from "./ideas-hero";
import { FeaturedIdeaCard } from "./featured-idea-card";
import { IdeasFilterBar } from "./ideas-filter-bar";
import { IdeasGrid } from "./idea-grid";
import { IdeasManifesto } from "./idea-manifesto";
import { IdeasSidebar } from "./idea-side-bar";

export const IdeasLabClient = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<IdeaCategory | "All">("All");
  const [activeStatus, setActiveStatus] = useState<IdeaStatus | "All">("All");

  const featuredIdea = IDEAS.find((i) => i.isFeatured)!;

  const filtered = useMemo(() => {
    return IDEAS.filter((idea) => {
      // Exclude featured from main grid when no filters active
      const matchesSearch =
        search.length === 0 ||
        idea.title.toLowerCase().includes(search.toLowerCase()) ||
        idea.summary.toLowerCase().includes(search.toLowerCase()) ||
        idea.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));

      const matchesCategory =
        activeCategory === "All" || idea.category === activeCategory;

      const matchesStatus =
        activeStatus === "All" || idea.status === activeStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    }).filter((idea) => {
      // Only hide featured from grid when browsing without filters
      const hasFilters =
        search.length > 0 || activeCategory !== "All" || activeStatus !== "All";
      return hasFilters || !idea.isFeatured;
    });
  }, [search, activeCategory, activeStatus]);

  const hasFilters =
    search.length > 0 || activeCategory !== "All" || activeStatus !== "All";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <IdeasHero />

      {/* Featured idea (only when not filtering) */}
      {!hasFilters && featuredIdea && (
        <FeaturedIdeaCard idea={featuredIdea} />
      )}

      {/* Filter bar */}
      <IdeasFilterBar
        search={search}
        onSearch={setSearch}
        activeCategory={activeCategory}
        onCategory={setActiveCategory}
        activeStatus={activeStatus}
        onStatus={setActiveStatus}
        totalResults={filtered.length}
      />

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Ideas grid */}
          <div className="lg:col-span-2">
            <IdeasGrid ideas={filtered} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-52">
              <IdeasSidebar
                activeCategory={activeCategory}
                onCategory={setActiveCategory}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Manifesto */}
      <IdeasManifesto />
    </div>
  );
};