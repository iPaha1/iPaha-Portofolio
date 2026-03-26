"use client";

// =============================================================================
// isaacpaha.com — Random Toolkit: Shared Utilities
// app/tools/random-toolkit/_components/generators/shared.tsx
// =============================================================================

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence }        from "framer-motion";
import { Copy, Check, RefreshCw, Code2, ChevronDown, ChevronUp } from "lucide-react";

// ─── useCopy hook ─────────────────────────────────────────────────────────────

export function useCopy(timeout = 1800) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = useCallback((text: string, key?: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key ?? "default");
    setTimeout(() => setCopied(null), timeout);
  }, [timeout]);
  const isCopied = (key?: string) => copied === (key ?? "default");
  return { copy, isCopied };
}

// ─── Output Card ─────────────────────────────────────────────────────────────

export function OutputCard({
  value, label, copyKey, mono = true,
}: {
  value:    string;
  label?:   string;
  copyKey?: string;
  mono?:    boolean;
}) {
  const { copy, isCopied } = useCopy();
  if (!value) return null;
  return (
    <div className="group relative bg-stone-950 border border-stone-700 rounded-sm overflow-hidden">
      {label && (
        <div className="px-3 py-1.5 border-b border-stone-800 bg-stone-900/60">
          <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">{label}</span>
        </div>
      )}
      <div className="px-4 py-3 pr-12 min-h-[44px] flex items-center">
        <span className={`text-sm text-emerald-400 break-all leading-relaxed ${mono ? "font-mono" : ""}`}>
          {value}
        </span>
      </div>
      <button
        onClick={() => copy(value, copyKey)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-stone-500 hover:text-white hover:bg-stone-700 rounded-sm transition-all"
      >
        {isCopied(copyKey) ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

// ─── Multi-output list ────────────────────────────────────────────────────────

export function OutputList({
  values, onCopyAll, onExportCSV, onExportJSON,
}: {
  values:        string[];
  onCopyAll?:    () => void;
  onExportCSV?:  () => void;
  onExportJSON?: () => void;
}) {
  const { copy, isCopied } = useCopy();
  if (!values.length) return null;

  const copyAll = () => {
    navigator.clipboard.writeText(values.join("\n"));
  };
  const exportCSV  = () => {
    const blob = new Blob([values.join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "generated.csv"; a.click(); URL.revokeObjectURL(url);
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(values, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "generated.json"; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">{values.length} values</span>
        <div className="flex gap-1.5">
          <button onClick={copyAll} className="text-[10px] font-bold text-stone-400 hover:text-white border border-stone-700 hover:border-stone-500 px-2.5 py-1 rounded-sm transition-colors">
            Copy All
          </button>
          <button onClick={exportCSV} className="text-[10px] font-bold text-stone-400 hover:text-white border border-stone-700 hover:border-stone-500 px-2.5 py-1 rounded-sm transition-colors">
            CSV
          </button>
          <button onClick={exportJSON} className="text-[10px] font-bold text-stone-400 hover:text-white border border-stone-700 hover:border-stone-500 px-2.5 py-1 rounded-sm transition-colors">
            JSON
          </button>
        </div>
      </div>
      <div className="bg-stone-950 border border-stone-700 rounded-sm overflow-hidden max-h-64 overflow-y-auto">
        {values.map((v, i) => (
          <div key={i} className="group flex items-center justify-between px-3 py-1.5 border-b border-stone-800/50 last:border-0 hover:bg-stone-900/50 transition-colors">
            <span className="text-xs text-emerald-400 font-mono break-all flex-1 mr-2">{v}</span>
            <button onClick={() => copy(v, `item-${i}`)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-stone-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all rounded-sm">
              {isCopied(`item-${i}`) ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Generate Button ──────────────────────────────────────────────────────────

export function GenerateButton({
  onClick, loading = false, label = "Generate",
}: {
  onClick:  () => void;
  loading?: boolean;
  label?:   string;
}) {
  return (
    <button onClick={onClick} disabled={loading}
      className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 active:bg-violet-700 py-3 rounded-sm transition-colors disabled:opacity-60 shadow-sm shadow-violet-900/30">
      <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
      {label}
    </button>
  );
}

// ─── Slider Control ───────────────────────────────────────────────────────────

export function SliderControl({
  label, value, min, max, step = 1, onChange, unit = "",
}: {
  label:    string;
  value:    number;
  min:      number;
  max:      number;
  step?:    number;
  onChange: (v: number) => void;
  unit?:    string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">{label}</label>
        <span className="text-xs font-black text-violet-400">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full accent-violet-500 bg-stone-700 cursor-pointer"
      />
      <div className="flex justify-between text-[9px] text-stone-600 mt-0.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ─── Toggle Control ───────────────────────────────────────────────────────────

export function ToggleControl({
  label, checked, onChange, description,
}: {
  label:        string;
  checked:      boolean;
  onChange:     (v: boolean) => void;
  description?: string;
}) {
  return (
    <button onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-2 group">
      <div className="text-left">
        <p className="text-xs font-semibold text-stone-300 group-hover:text-white transition-colors">{label}</p>
        {description && <p className="text-[10px] text-stone-600 mt-0.5">{description}</p>}
      </div>
      <div className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors ${checked ? "bg-violet-600" : "bg-stone-700"}`}>
        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
    </button>
  );
}

// ─── Number Input ─────────────────────────────────────────────────────────────

export function NumberInput({
  label, value, min, max, onChange,
}: {
  label:    string;
  value:    number;
  min:      number;
  max:      number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">{label}</label>
      <input type="number" value={value} min={min} max={max}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (v >= min && v <= max) onChange(v);
        }}
        className="w-full text-sm text-white bg-stone-800 border border-stone-600 rounded-sm px-3 py-2 focus:outline-none focus:border-violet-500 font-mono"
      />
    </div>
  );
}

// ─── Code Snippet Block ───────────────────────────────────────────────────────

export function CodeSnippet({
  snippets,
}: {
  snippets: { lang: string; label: string; code: string }[];
}) {
  const [open,       setOpen]       = useState(false);
  const [activeTab,  setActiveTab]  = useState(0);
  const { copy, isCopied } = useCopy();

  return (
    <div className="border border-stone-700/50 rounded-sm overflow-hidden">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-stone-900/60 hover:bg-stone-800/60 transition-colors">
        <div className="flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-[11px] font-bold text-stone-400">Developer code snippets</span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-stone-600" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-600" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="border-t border-stone-800">
              {/* Lang tabs */}
              <div className="flex gap-0.5 px-3 pt-2 bg-stone-900/40">
                {snippets.map((s, i) => (
                  <button key={i} onClick={() => setActiveTab(i)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-t-sm transition-colors ${
                      activeTab === i ? "bg-stone-800 text-violet-400" : "text-stone-600 hover:text-stone-400"
                    }`}>{s.label}</button>
                ))}
              </div>
              <div className="relative bg-stone-900/40 p-4">
                <pre className="text-xs text-stone-300 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
                  {snippets[activeTab]?.code}
                </pre>
                <button onClick={() => copy(snippets[activeTab]?.code ?? "", "snippet")}
                  className="absolute top-3 right-3 flex items-center gap-1 text-[10px] text-stone-500 hover:text-white border border-stone-700 hover:border-stone-500 px-2 py-1 rounded-sm transition-colors">
                  {isCopied("snippet") ? <><Check className="w-3 h-3 text-emerald-400" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Strength Meter ───────────────────────────────────────────────────────────

export type StrengthLevel = "very-weak" | "weak" | "fair" | "strong" | "very-strong";

const STRENGTH_CFG: Record<StrengthLevel, { label: string; color: string; bars: number }> = {
  "very-weak":   { label: "Very Weak",   color: "#ef4444", bars: 1 },
  "weak":        { label: "Weak",        color: "#f97316", bars: 2 },
  "fair":        { label: "Fair",        color: "#f59e0b", bars: 3 },
  "strong":      { label: "Strong",      color: "#84cc16", bars: 4 },
  "very-strong": { label: "Very Strong", color: "#10b981", bars: 5 },
};

export function StrengthMeter({ level, entropy }: { level: StrengthLevel; entropy?: number }) {
  const cfg = STRENGTH_CFG[level];
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Strength</span>
        <div className="flex items-center gap-2">
          {entropy !== undefined && (
            <span className="text-[10px] text-stone-600 font-mono">{entropy.toFixed(1)} bits</span>
          )}
          <span className="text-[11px] font-black" style={{ color: cfg.color }}>{cfg.label}</span>
        </div>
      </div>
      <div className="flex gap-1">
        {[1,2,3,4,5].map((bar) => (
          <div key={bar} className="flex-1 h-1.5 rounded-full transition-colors"
            style={{ backgroundColor: bar <= cfg.bars ? cfg.color : "#374151" }} />
        ))}
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

export function SectionHeader({ label }: { label: string }) {
  return (
    <div className="border-b border-stone-800 pb-2 mb-4">
      <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ─── Entropy Calculator ───────────────────────────────────────────────────────

export function calcEntropy(charsetSize: number, length: number): number {
  return Math.log2(charsetSize) * length;
}

export function entropyToStrength(entropy: number): StrengthLevel {
  if (entropy < 28)  return "very-weak";
  if (entropy < 40)  return "weak";
  if (entropy < 60)  return "fair";
  if (entropy < 80)  return "strong";
  return "very-strong";
}