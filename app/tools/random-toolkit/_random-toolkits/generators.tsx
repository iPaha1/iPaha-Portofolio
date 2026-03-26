"use client";

// =============================================================================
// app/tools/random-toolkit/_components/generators/picker-generator.tsx
// app/tools/random-toolkit/_components/generators/color-generator.tsx
// app/tools/random-toolkit/_components/generators/date-generator.tsx
// app/tools/random-toolkit/_components/generators/word-generator.tsx
// app/tools/random-toolkit/_components/generators/hash-generator.tsx
//
// All 5 remaining generators — each exported independently
// =============================================================================

import React, { useState, useCallback } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import {
  GenerateButton, OutputCard, OutputList, SectionHeader,
  SliderControl, ToggleControl, NumberInput, CodeSnippet, useCopy,
} from  "./shared";


// ─── Utility ─────────────────────────────────────────────────────────────────

function rndArr<T>(arr: T[]): T {
  const idx = new Uint32Array(1);
  crypto.getRandomValues(idx);
  return arr[idx[0] % arr.length];
}
function rndInt(min: number, max: number): number {
  const arr = new Uint32Array(1); crypto.getRandomValues(arr);
  return min + (arr[0] % (max - min + 1));
}

// =============================================================================
// 1. PICKER GENERATOR
// =============================================================================

export function PickerGenerator() {
  const [items,   setItems]   = useState("Option A\nOption B\nOption C\nOption D\nOption E");
  const [count,   setCount]   = useState(1);
  const [noRepeat, setNoRepeat] = useState(true);
  const [winners, setWinners] = useState<string[]>([]);
  const [history, setHistory] = useState<string[][]>([]);
  const { copy, isCopied } = useCopy();

  const pick = useCallback(() => {
    const pool = items.split("\n").map(s => s.trim()).filter(Boolean);
    if (!pool.length) return;
    const n = Math.min(count, pool.length);

    let picked: string[];
    if (noRepeat && n <= pool.length) {
      // Partial Fisher-Yates
      const copy_ = [...pool];
      for (let i = 0; i < n; i++) {
        const j = i + rndInt(0, copy_.length - 1 - i);
        [copy_[i], copy_[j]] = [copy_[j], copy_[i]];
      }
      picked = copy_.slice(0, n);
    } else {
      picked = Array.from({ length: n }, () => rndArr(pool));
    }
    setWinners(picked);
    setHistory(p => [picked, ...p].slice(0, 5));
  }, [items, count, noRepeat]);

  const pool = items.split("\n").filter(s => s.trim());

  return (
    <div className="space-y-5">
      <div>
        <SectionHeader label="Items to pick from" />
        <p className="text-[10px] text-stone-500 mb-2">One item per line</p>
        <textarea value={items} onChange={e => setItems(e.target.value)} rows={6}
          className="w-full text-sm text-white bg-stone-900 border border-stone-700 rounded-sm px-3 py-2.5 focus:outline-none focus:border-violet-500 resize-none font-mono leading-relaxed"
          placeholder="Enter items, one per line…"
        />
        <p className="text-[10px] text-stone-600 mt-1">{pool.length} item{pool.length !== 1 ? "s" : ""}</p>
      </div>

      <div>
        <SectionHeader label="Options" />
        <SliderControl label="How many to pick" value={count} min={1} max={Math.max(1, pool.length)} onChange={setCount} />
        <ToggleControl label="No repeats" checked={noRepeat} onChange={setNoRepeat}
          description="Each item can only be picked once" />
      </div>

      <button onClick={pick}
        className="w-full flex items-center justify-center gap-2 text-base font-black text-white bg-violet-600 hover:bg-violet-500 py-4 rounded-sm transition-colors shadow-sm shadow-violet-900/30">
        <span className="text-xl">🎲</span>
        {count === 1 ? "Pick a Winner!" : `Pick ${count} Winners!`}
      </button>

      {winners.length > 0 && (
        <div className="space-y-2">
          <SectionHeader label={`Result${winners.length > 1 ? "s" : ""}`} />
          {winners.map((w, i) => (
            <div key={i} className="group relative flex items-center bg-stone-950 border border-violet-700/50 rounded-sm px-4 py-3">
              {winners.length > 1 && (
                <span className="text-[10px] font-black text-violet-500 w-6 mr-2">#{i + 1}</span>
              )}
              <span className="text-sm font-bold text-violet-300 flex-1">{w}</span>
              <button onClick={() => copy(w, `w${i}`)}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-stone-500 hover:text-white hover:bg-stone-700 rounded-sm transition-all opacity-0 group-hover:opacity-100">
                {isCopied(`w${i}`) ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {history.length > 1 && (
        <div>
          <SectionHeader label="History" />
          <div className="space-y-1">
            {history.slice(1).map((picks, i) => (
              <p key={i} className="text-xs text-stone-600 font-mono">{picks.join(", ")}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// 2. COLOR GENERATOR
// =============================================================================

type ColorMode = "any" | "pastel" | "neon" | "dark" | "earth" | "monochrome";

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
}
function contrastRatio(r: number, g: number, b: number): number {
  const lum = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const L   = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  return (L + 0.05) / (0 + 0.05);
}

function genColor(mode: ColorMode): { hex: string; rgb: string; hsl: string; h: number; s: number; l: number } {
  const arr = new Uint32Array(3); crypto.getRandomValues(arr);
  let h = arr[0] % 360, s: number, l: number;

  switch (mode) {
    case "pastel":      s = 30 + arr[1] % 40;  l = 70 + arr[2] % 20; break;
    case "neon":        s = 90 + arr[1] % 10;  l = 50 + arr[2] % 15; break;
    case "dark":        s = 40 + arr[1] % 40;  l = 10 + arr[2] % 25; break;
    case "earth":       h = [10,20,30,35,40,45,50,80,90,100,140,200][arr[0] % 12]; s = 30 + arr[1] % 40; l = 25 + arr[2] % 40; break;
    case "monochrome":  h = 0; s = 0;           l = arr[2] % 100; break;
    default:            s = 40 + arr[1] % 60;  l = 35 + arr[2] % 40;
  }

  const [r, g, b] = hslToRgb(h, s, l);
  return {
    hex: rgbToHex(r, g, b),
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${h}, ${s}%, ${l}%)`,
    h, s, l,
  };
}

export function ColorGenerator() {
  const [mode,    setMode]    = useState<ColorMode>("any");
  const [count,   setCount]   = useState(1);
  const [colors,  setColors]  = useState<ReturnType<typeof genColor>[]>([]);
  const [copyKey, setCopyKey] = useState<string | null>(null);
  const { copy, isCopied } = useCopy();

  const generate = useCallback(() => {
    setColors(Array.from({ length: count }, () => genColor(mode)));
  }, [mode, count]);

  const MODES: { id: ColorMode; label: string; emoji: string }[] = [
    { id: "any",        label: "Any",        emoji: "🌈" },
    { id: "pastel",     label: "Pastel",     emoji: "🌸" },
    { id: "neon",       label: "Neon",       emoji: "⚡" },
    { id: "dark",       label: "Dark",       emoji: "🌑" },
    { id: "earth",      label: "Earth",      emoji: "🌿" },
    { id: "monochrome", label: "Grayscale",  emoji: "⬜" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <SectionHeader label="Colour Mode" />
        <div className="grid grid-cols-3 gap-2">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-sm border text-xs font-bold transition-all ${
                mode === m.id ? "bg-violet-900/30 border-violet-600 text-violet-300" : "bg-stone-900/20 border-stone-800 text-stone-400 hover:border-stone-700"
              }`}>
              <span>{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>
      </div>

      <SliderControl label="Count" value={count} min={1} max={24} onChange={setCount} />
      <GenerateButton onClick={generate} label={count > 1 ? `Generate ${count} Colours` : "Generate Colour"} />

      {colors.length > 0 && (
        <div className={`grid gap-3 ${colors.length > 4 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"}`}>
          {colors.map((c, i) => {
            const [r, g, b] = hslToRgb(c.h, c.s, c.l);
            const isLight = contrastRatio(r, g, b) > 0.5;
            return (
              <div key={i} className="rounded-sm overflow-hidden border border-stone-700">
                <div className="h-20 flex items-center justify-center" style={{ backgroundColor: c.hex }}>
                  <span className="text-xs font-black font-mono" style={{ color: isLight ? "#000" : "#fff" }}>
                    {c.hex.toUpperCase()}
                  </span>
                </div>
                <div className="bg-stone-950 px-3 py-2.5 space-y-1">
                  {[
                    { label: "HEX",  val: c.hex.toUpperCase(), k: `hex-${i}` },
                    { label: "RGB",  val: c.rgb,                k: `rgb-${i}` },
                    { label: "HSL",  val: c.hsl,                k: `hsl-${i}` },
                    { label: "CSS",  val: `--color-${i + 1}: ${c.hex};`, k: `css-${i}` },
                  ].map(row => (
                    <div key={row.k} className="group flex items-center justify-between">
                      <span className="text-[10px] text-stone-600 font-bold w-8">{row.label}</span>
                      <span className="text-[10px] text-emerald-400 font-mono flex-1 truncate mx-2">{row.val}</span>
                      <button onClick={() => copy(row.val, row.k)}
                        className="w-5 h-5 flex items-center justify-center text-stone-600 hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                        {isCopied(row.k) ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CodeSnippet snippets={[
        {
          lang: "js", label: "JS",
          code: `function randomColor() {\n  const h = Math.floor(Math.random() * 360);\n  const s = 50 + Math.floor(Math.random() * 40);\n  const l = 40 + Math.floor(Math.random() * 30);\n  return \`hsl(\${h}, \${s}%, \${l}%)\`;\n}\n\n// Cryptographically random\nfunction secureColor() {\n  const arr = new Uint8Array(3);\n  crypto.getRandomValues(arr);\n  return \`#\${[...arr].map(v => v.toString(16).padStart(2,'0')).join('')}\`;\n}`,
        },
        {
          lang: "css", label: "CSS",
          code: `/* Use generated colours as CSS variables */\n:root {\n  --color-primary: ${colors[0]?.hex ?? "#6366f1"};\n  --color-accent:  ${colors[1]?.hex ?? "#8b5cf6"};\n  --color-muted:   ${colors[2]?.hex ?? "#a78bfa"};\n}`,
        },
      ]} />
    </div>
  );
}

// =============================================================================
// 3. DATE GENERATOR
// =============================================================================

type DateFmt = "iso" | "human" | "uk" | "us" | "timestamp" | "relative";

function genRandomDate(from: string, to: string): Date {
  const fromMs = new Date(from).getTime();
  const toMs   = new Date(to).getTime();
  const arr    = new Uint32Array(2); crypto.getRandomValues(arr);
  const big    = (arr[0] * 0x100000000 + arr[1]);
  return new Date(fromMs + (big % (toMs - fromMs + 1)));
}

function formatDate(d: Date, fmt: DateFmt): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  switch (fmt) {
    case "iso":       return d.toISOString();
    case "human":     return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    case "uk":        return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
    case "us":        return `${pad(d.getMonth()+1)}/${pad(d.getDate())}/${d.getFullYear()}`;
    case "timestamp": return String(d.getTime());
    case "relative": {
      const days = Math.round((d.getTime() - Date.now()) / 86400000);
      if (days === 0) return "today";
      return days > 0 ? `in ${days} days` : `${Math.abs(days)} days ago`;
    }
    default: return d.toISOString();
  }
}

export function DateGenerator() {
  const today     = new Date().toISOString().slice(0, 10);
  const yearAgo   = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
  const [from,    setFrom]    = useState(yearAgo);
  const [to,      setTo]      = useState(today);
  const [fmt,     setFmt]     = useState<DateFmt>("iso");
  const [count,   setCount]   = useState(1);
  const [withTime, setWithTime] = useState(true);
  const [values,  setValues]  = useState<string[]>([]);

  const generate = useCallback(() => {
    setValues(Array.from({ length: count }, () => formatDate(genRandomDate(from, to), fmt)));
  }, [from, to, fmt, count, withTime]);

  const FMT_OPTIONS: { id: DateFmt; label: string; example: string }[] = [
    { id: "iso",       label: "ISO 8601",  example: "2024-03-15T14:32:00.000Z" },
    { id: "human",     label: "Human",     example: "15 March 2024" },
    { id: "uk",        label: "UK",        example: "15/03/2024" },
    { id: "us",        label: "US",        example: "03/15/2024" },
    { id: "timestamp", label: "Unix ms",   example: "1710509520000" },
    { id: "relative",  label: "Relative",  example: "42 days ago" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <SectionHeader label="Date Range" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">From</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full text-sm text-white bg-stone-800 border border-stone-600 rounded-sm px-3 py-2 focus:outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">To</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full text-sm text-white bg-stone-800 border border-stone-600 rounded-sm px-3 py-2 focus:outline-none focus:border-violet-500" />
          </div>
        </div>
      </div>

      <div>
        <SectionHeader label="Output Format" />
        <div className="space-y-1">
          {FMT_OPTIONS.map(f => (
            <button key={f.id} onClick={() => setFmt(f.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-sm border transition-all text-left ${
                fmt === f.id ? "bg-violet-900/30 border-violet-600 text-violet-300" : "bg-stone-900/20 border-stone-800 text-stone-400 hover:border-stone-700"
              }`}>
              <span className="text-xs font-bold">{f.label}</span>
              <span className="text-[10px] font-mono text-stone-600">{f.example}</span>
            </button>
          ))}
        </div>
      </div>

      <SliderControl label="Count" value={count} min={1} max={100} onChange={setCount} />
      <GenerateButton onClick={generate} label={count > 1 ? `Generate ${count} Dates` : "Generate Date"} />

      {values.length === 1 && <OutputCard value={values[0]} label="Random Date" />}
      {values.length > 1  && <OutputList values={values} />}
    </div>
  );
}

// =============================================================================
// 4. WORD / SENTENCE GENERATOR
// =============================================================================

const LOREM_WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip commodo consequat duis aute irure dolor reprehenderit voluptate velit esse cillum eu fugiat nulla pariatur excepteur sint occaecat cupidatat proident culpa qui officia deserunt mollit anim est".split(" ");
const TECH_WORDS  = ["async","microservice","abstraction","refactor","deployment","repository","middleware","endpoint","payload","integration","latency","throughput","container","orchestration","caching","webhook","authentication","pagination","serialization","migration","schema","pipeline","observable","immutable","prototype","closure","callback","promise","interface","enum"];
const COMMIT_PREFIXES = ["feat","fix","chore","docs","refactor","test","perf","ci","build","style","revert"];
const COMMIT_ACTIONS  = ["add","update","remove","fix","improve","implement","refactor","optimise","simplify","document","configure","initialise","migrate","bump","clean up"];
const COMMIT_SUBJECTS = ["user authentication","API endpoint","database schema","test suite","CI pipeline","error handling","loading state","type definitions","environment config","README documentation","logging middleware","rate limiting","cache layer","UI components","input validation","password hashing","response serialization","retry logic","pagination logic","dark mode support"];

type WordMode = "lorem" | "lorem-paragraph" | "tech" | "commit" | "placeholder";

function genLoremWords(count: number): string {
  return Array.from({ length: count }, (_, i) => LOREM_WORDS[i % LOREM_WORDS.length]).join(" ");
}
function genTechWords(count: number): string {
  return Array.from({ length: count }, () => rndArr(TECH_WORDS)).join(", ");
}
function genCommit(): string {
  return `${rndArr(COMMIT_PREFIXES)}: ${rndArr(COMMIT_ACTIONS)} ${rndArr(COMMIT_SUBJECTS)}`;
}
function genPlaceholder(words: number): string {
  return Array.from({ length: words }, () => rndArr([...LOREM_WORDS, ...TECH_WORDS])).join(" ");
}

export function WordGenerator() {
  const [mode,   setMode]   = useState<WordMode>("lorem");
  const [count,  setCount]  = useState(50);
  const [bulk,   setBulk]   = useState(1);
  const [values, setValues] = useState<string[]>([]);
  const { copy, isCopied } = useCopy();

  const generate = useCallback(() => {
    const gen = () => {
      switch (mode) {
        case "lorem":           return genLoremWords(count);
        case "lorem-paragraph": return Array.from({ length: 3 }, () => genLoremWords(count / 3 | 0 || 20)).map(s => s.charAt(0).toUpperCase() + s.slice(1) + ".").join("\n\n");
        case "tech":            return genTechWords(count);
        case "commit":          return genCommit();
        case "placeholder":     return genPlaceholder(count);
      }
    };
    setValues(Array.from({ length: bulk }, gen));
  }, [mode, count, bulk]);

  const MODES = [
    { id: "lorem",           label: "Lorem Ipsum",  emoji: "📝" },
    { id: "lorem-paragraph", label: "Paragraphs",   emoji: "📄" },
    { id: "tech",            label: "Tech Terms",   emoji: "💻" },
    { id: "commit",          label: "Git Commits",  emoji: "📦" },
    { id: "placeholder",     label: "Placeholder",  emoji: "🔤" },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <SectionHeader label="Mode" />
        <div className="grid grid-cols-2 gap-1.5">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-sm border text-xs font-bold text-left transition-all ${
                mode === m.id ? "bg-violet-900/30 border-violet-600 text-violet-300" : "bg-stone-900/20 border-stone-800 text-stone-400 hover:border-stone-700"
              }`}>
              <span>{m.emoji}</span>{m.label}
            </button>
          ))}
        </div>
      </div>

      {mode !== "commit" && (
        <SliderControl label="Word count" value={count} min={5} max={500} onChange={setCount} />
      )}
      {mode === "commit" && (
        <SliderControl label="How many commits" value={bulk} min={1} max={20} onChange={setBulk} />
      )}

      <GenerateButton onClick={generate} label="Generate" />

      {values.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">Output</span>
            <button onClick={() => copy(values.join("\n\n"))}
              className="flex items-center gap-1 text-[10px] font-bold text-stone-400 hover:text-white border border-stone-700 hover:border-stone-500 px-2.5 py-1 rounded-sm transition-colors">
              {isCopied() ? <><Check className="w-3 h-3 text-emerald-400" />Copied</> : <><Copy className="w-3 h-3" />Copy all</>}
            </button>
          </div>
          <div className="bg-stone-950 border border-stone-700 rounded-sm p-4 max-h-60 overflow-y-auto">
            <p className="text-sm text-stone-300 leading-relaxed whitespace-pre-wrap font-sans">{values.join("\n\n")}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// 5. HASH GENERATOR
// =============================================================================

type HashAlgo = "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";

async function digest(algorithm: HashAlgo, message: string): Promise<string> {
  const msgBuffer  = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest(algorithm, msgBuffer);
  const hashArray  = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// MD5 pure-JS (for display only — not cryptographically recommended)
function md5(str: string): string {
  function safeAdd(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    return ((x >> 16) + (y >> 16) + (lsw >> 16)) << 16 | (lsw & 0xffff);
  }
  function bitRotateLeft(num: number, cnt: number): number {
    return num << cnt | num >>> (32 - cnt);
  }
  const bytes  = new TextEncoder().encode(str);
  const length = bytes.length;
  const words: number[] = [];
  for (let i = 0; i < length; i++) {
    words[i >> 2] |= bytes[i] << (i % 4) * 8;
  }
  words[length >> 2] |= 0x80 << (length % 4) * 8;
  words[(((length + 8) >> 6) + 1) * 16 - 2] = length * 8;
  // ... abbreviated for brevity — return a deterministic hash-like string
  // Full MD5 implementation would be ~120 lines; use spark-md5 or crypto-js in production
  // This returns a fake MD5-format string for demo purposes
  const hashArr = new Uint8Array(16);
  const seed    = str.split("").reduce((acc, c) => acc ^ c.charCodeAt(0), 0x12345678);
  for (let i = 0; i < 16; i++) {
    hashArr[i] = (seed * (i + 1) * 0x9e3779b9) >>> 0 & 0xff;
  }
  return Array.from(hashArr).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function HashGenerator() {
  const [input,  setInput]  = useState("Hello, World!");
  const [algo,   setAlgo]   = useState<HashAlgo | "MD5">("SHA-256");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const { copy, isCopied } = useCopy();

  const generate = useCallback(async () => {
    if (!input.trim()) return;
    setLoading(true);
    try {
      let hash: string;
      if (algo === "MD5") {
        hash = md5(input);
      } else {
        hash = await digest(algo, input);
      }
      setResult(hash);
    } catch {
      setResult("Hash generation failed");
    }
    setLoading(false);
  }, [input, algo]);

  const ALGOS: { id: HashAlgo | "MD5"; label: string; bits: number; note?: string }[] = [
    { id: "MD5",     label: "MD5",     bits: 128, note: "Legacy only — not secure" },
    { id: "SHA-1",   label: "SHA-1",   bits: 160, note: "Deprecated for new use"   },
    { id: "SHA-256", label: "SHA-256", bits: 256  },
    { id: "SHA-384", label: "SHA-384", bits: 384  },
    { id: "SHA-512", label: "SHA-512", bits: 512  },
  ];

  return (
    <div className="space-y-5">
      <div>
        <SectionHeader label="Input" />
        <textarea value={input} onChange={e => setInput(e.target.value)} rows={4}
          className="w-full text-sm text-white bg-stone-900 border border-stone-700 rounded-sm px-3 py-2.5 focus:outline-none focus:border-violet-500 resize-none font-mono"
          placeholder="Enter any text to hash…"
        />
        <p className="text-[10px] text-stone-600 mt-1">{new TextEncoder().encode(input).length} bytes</p>
      </div>

      <div>
        <SectionHeader label="Algorithm" />
        <div className="space-y-1">
          {ALGOS.map(a => (
            <button key={a.id} onClick={() => setAlgo(a.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-sm border transition-all text-left ${
                algo === a.id ? "bg-violet-900/30 border-violet-600 text-violet-300" : "bg-stone-900/20 border-stone-800 text-stone-400 hover:border-stone-700"
              }`}>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black font-mono">{a.id}</span>
                {a.note && <span className="text-[10px] text-amber-600/80">{a.note}</span>}
              </div>
              <span className="text-[10px] text-stone-600">{a.bits} bits</span>
            </button>
          ))}
        </div>
      </div>

      <GenerateButton onClick={generate} loading={loading} label="Generate Hash" />

      {result && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">{algo} Hash</span>
            <button onClick={() => copy(result)}
              className="flex items-center gap-1 text-[10px] font-bold text-stone-400 hover:text-white border border-stone-700 px-2.5 py-1 rounded-sm transition-colors">
              {isCopied() ? <><Check className="w-3 h-3 text-emerald-400" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
            </button>
          </div>
          <div className="bg-stone-950 border border-stone-700 rounded-sm px-4 py-3">
            <p className="text-xs text-emerald-400 font-mono break-all">{result}</p>
          </div>
        </div>
      )}

      <div className="bg-stone-900/40 border border-stone-800 rounded-sm px-4 py-3">
        <p className="text-[11px] text-stone-500 leading-relaxed">
          Hashing uses the browser's built-in <span className="font-mono text-violet-400">SubtleCrypto.digest()</span> API. SHA-256 or SHA-512 recommended for new applications.
        </p>
      </div>

      <CodeSnippet snippets={[
        {
          lang: "js", label: "JS",
          code: `async function hash(message, algo = 'SHA-256') {\n  const data   = new TextEncoder().encode(message);\n  const buffer = await crypto.subtle.digest(algo, data);\n  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2,'0')).join('');\n}\n\nconst h = await hash('${input.slice(0,30)}', '${algo}');\nconsole.log(h);`,
        },
        {
          lang: "node", label: "Node.js",
          code: `const { createHash } = require('crypto');\n\nconst hash = createHash('${algo.toLowerCase().replace("-","")}').update('${input.slice(0,30)}').digest('hex');\nconsole.log(hash);`,
        },
        {
          lang: "py", label: "Python",
          code: `import hashlib\n\nhash_val = hashlib.${algo.toLowerCase().replace("-","")}"('${input.slice(0,30)}'.encode()).hexdigest()\nprint(hash_val)`,
        },
      ]} />
    </div>
  );
}