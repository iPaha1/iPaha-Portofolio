"use client";

// =============================================================================
// isaacpaha.com — Random Generator Toolkit
// app/tools/random-toolkit/_components/random-toolkit.tsx
//
// Central client component that:
//   - Renders the left sidebar generator list
//   - Renders the active generator in the main panel
//   - Owns dark/light mode toggle (default: dark — dev audience)
//   - Local history (localStorage, no server)
// =============================================================================

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence }     from "framer-motion";
import {
  Hash, Key, Lock, Shuffle, Database, Dices, Palette,
  Calendar, Type, Shield, ChevronRight, Search, Moon, Sun,
  Zap,
} from "lucide-react";
import {
  
  PickerGenerator,
  ColorGenerator,
  DateGenerator,
  WordGenerator,
  HashGenerator,
} from "./generators";
import { PasswordGenerator } from "./password-generator";
import { StringGenerator } from "./string-generator";
import { UUIDGenerator } from "./uuid-generator";
import { NumberGenerator } from "./number-generator";
import { DataGenerator } from "./data-generator";

// ─── Generator Registry ───────────────────────────────────────────────────────

interface GeneratorDef {
  id:          string;
  label:       string;
  shortLabel:  string;
  icon:        React.ElementType;
  color:       string;
  description: string;
  tags:        string[];
  component:   React.ComponentType;
}

const GENERATORS: GeneratorDef[] = [
  {
    id:          "password",
    label:       "Password Generator",
    shortLabel:  "Password",
    icon:        Lock,
    color:       "#10b981",
    description: "Cryptographically secure passwords with strength meter and customisable complexity.",
    tags:        ["security", "auth", "login"],
    component:   PasswordGenerator,
  },
  {
    id:          "string",
    label:       "String Generator",
    shortLabel:  "String",
    icon:        Key,
    color:       "#6366f1",
    description: "Random strings for API keys, tokens, session IDs, and test data.",
    tags:        ["api", "token", "key", "dev"],
    component:   StringGenerator,
  },
  {
    id:          "uuid",
    label:       "UUID Generator",
    shortLabel:  "UUID",
    icon:        Hash,
    color:       "#8b5cf6",
    description: "UUID v4 — globally unique identifiers. Single or bulk. Multiple formats.",
    tags:        ["uuid", "id", "database"],
    component:   UUIDGenerator,
  },
  {
    id:          "number",
    label:       "Number Generator",
    shortLabel:  "Number",
    icon:        Shuffle,
    color:       "#3b82f6",
    description: "Random integers or decimals, custom range, unique values, sorted output.",
    tags:        ["integer", "float", "range"],
    component:   NumberGenerator,
  },
  {
    id:          "data",
    label:       "Fake Data Generator",
    shortLabel:  "Fake Data",
    icon:        Database,
    color:       "#f59e0b",
    description: "Realistic names, emails, addresses, phone numbers, and full user objects for testing.",
    tags:        ["test", "mock", "seed", "faker"],
    component:   DataGenerator,
  },
  {
    id:          "picker",
    label:       "Random Picker",
    shortLabel:  "Picker",
    icon:        Dices,
    color:       "#ec4899",
    description: "Pick randomly from your own list. Perfect for giveaways, decisions, and drawing lots.",
    tags:        ["list", "decision", "giveaway"],
    component:   PickerGenerator,
  },
  {
    id:          "color",
    label:       "Colour Generator",
    shortLabel:  "Colour",
    icon:        Palette,
    color:       "#f97316",
    description: "Random colours in HEX, RGB, HSL, and CSS variables. Pastel, neon, earth, and more.",
    tags:        ["hex", "css", "design", "ui"],
    component:   ColorGenerator,
  },
  {
    id:          "date",
    label:       "Date Generator",
    shortLabel:  "Date",
    icon:        Calendar,
    color:       "#14b8a6",
    description: "Random dates within a range. ISO, UK, US, Unix timestamp, and relative formats.",
    tags:        ["iso", "timestamp", "test"],
    component:   DateGenerator,
  },
  {
    id:          "word",
    label:       "Word Generator",
    shortLabel:  "Words",
    icon:        Type,
    color:       "#84cc16",
    description: "Lorem ipsum, tech terms, placeholder text, and realistic Git commit messages.",
    tags:        ["lorem", "text", "placeholder", "commit"],
    component:   WordGenerator,
  },
  {
    id:          "hash",
    label:       "Hash Generator",
    shortLabel:  "Hash",
    icon:        Shield,
    color:       "#ef4444",
    description: "Hash any string with SHA-1, SHA-256, SHA-384, SHA-512, and MD5.",
    tags:        ["sha", "md5", "checksum", "crypto"],
    component:   HashGenerator,
  },
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function RandomToolkit() {
  const [activeId,    setActiveId]    = useState("password");
  const [search,      setSearch]      = useState("");
  const [dark,        setDark]        = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Persist dark mode preference
  useEffect(() => {
    const pref = localStorage.getItem("rt-dark");
    if (pref !== null) setDark(pref === "true");
  }, []);
  const toggleDark = () => {
    setDark(p => { localStorage.setItem("rt-dark", String(!p)); return !p; });
  };

  const filtered = search.trim()
    ? GENERATORS.filter(g =>
        g.label.toLowerCase().includes(search.toLowerCase()) ||
        g.tags.some(t => t.includes(search.toLowerCase()))
      )
    : GENERATORS;

  const active    = GENERATORS.find(g => g.id === activeId) ?? GENERATORS[0];
  const ActiveGen = active.component;

  // If search filters out the active generator, reset
  useEffect(() => {
    if (filtered.length > 0 && !filtered.find(g => g.id === activeId)) {
      setActiveId(filtered[0].id);
    }
  }, [filtered, activeId]);

  const bg          = dark ? "#0f0f11" : "#ffffff";
  const panelBg     = dark ? "#18181b" : "#f9fafb";
  const sidebarBg   = dark ? "#111113" : "#f4f4f5";
  const borderColor = dark ? "#27272a" : "#e4e4e7";
  const textPrimary = dark ? "#f4f4f5" : "#09090b";
  const textMuted   = dark ? "#71717a" : "#71717a";

  return (
    <div className="rounded-sm overflow-hidden border" style={{ backgroundColor: bg, borderColor, fontFamily: "Sora, sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor, backgroundColor: sidebarBg }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🎲</span>
          <p className="text-sm font-black" style={{ color: textPrimary }}>Random Toolkit</p>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm bg-violet-600 text-white uppercase tracking-wider">
            {GENERATORS.length} tools
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleDark}
            className="w-8 h-8 flex items-center justify-center rounded-sm transition-colors"
            style={{ color: textMuted, backgroundColor: dark ? "#27272a" : "#e4e4e7" }}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}>
            {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => setSidebarOpen(p => !p)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-sm"
            style={{ color: textMuted, backgroundColor: dark ? "#27272a" : "#e4e4e7" }}>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row" style={{ minHeight: "600px" }}>

        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside
          className={`flex-shrink-0 border-r flex flex-col transition-all ${sidebarOpen ? "w-full md:w-56" : "w-0 overflow-hidden"}`}
          style={{ borderColor, backgroundColor: sidebarBg }}>

          {/* Search */}
          <div className="px-3 py-3 border-b" style={{ borderColor }}>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: textMuted }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search generators…"
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-sm border focus:outline-none"
                style={{
                  backgroundColor: dark ? "#27272a" : "#e4e4e7",
                  borderColor,
                  color: textPrimary,
                }}
              />
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 py-2 overflow-y-auto">
            {filtered.map(gen => {
              const isActive = gen.id === activeId;
              return (
                <button
                  key={gen.id}
                  onClick={() => { setActiveId(gen.id); setSidebarOpen(window.innerWidth >= 768 ? true : false); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all"
                  style={{
                    backgroundColor: isActive ? `${gen.color}18` : "transparent",
                    borderLeft:      isActive ? `3px solid ${gen.color}` : "3px solid transparent",
                  }}
                >
                  <gen.icon className="w-4 h-4 flex-shrink-0 transition-colors"
                    style={{ color: isActive ? gen.color : textMuted }} />
                  <span className="text-xs font-semibold transition-colors"
                    style={{ color: isActive ? textPrimary : textMuted }}>
                    {gen.shortLabel}
                  </span>
                  {isActive && (
                    <ChevronRight className="w-3 h-3 ml-auto" style={{ color: gen.color }} />
                  )}
                </button>
              );
            })}

            {filtered.length === 0 && (
              <p className="text-xs px-4 py-6 text-center" style={{ color: textMuted }}>
                No generators match "{search}"
              </p>
            )}
          </nav>

          {/* Footer note */}
          <div className="px-3 py-3 border-t" style={{ borderColor }}>
            <p className="text-[10px] leading-relaxed" style={{ color: textMuted }}>
              100% client-side. Zero data stored.
            </p>
          </div>
        </aside>

        {/* ── Main Panel ────────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Panel header */}
          <div className="px-6 py-4 border-b flex-shrink-0" style={{ borderColor, backgroundColor: panelBg }}>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: `${active.color}20` }}>
                <active.icon className="w-5 h-5" style={{ color: active.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-black leading-tight" style={{ color: textPrimary }}>{active.label}</h2>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: textMuted }}>{active.description}</p>
              </div>
            </div>
          </div>

          {/* Generator content */}
          <div className="flex-1 p-6 overflow-y-auto" style={{ backgroundColor: bg }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                <ActiveGen />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}