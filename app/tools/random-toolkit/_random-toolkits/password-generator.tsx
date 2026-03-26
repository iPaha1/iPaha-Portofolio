"use client";

// app/tools/random-toolkit/_components/generators/password-generator.tsx

import React, { useState, useCallback, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  SliderControl, ToggleControl, GenerateButton, OutputList,
  CodeSnippet, SectionHeader, StrengthMeter,
  calcEntropy, entropyToStrength, useCopy,
} from "./shared";
import { Copy, Check, RefreshCw } from "lucide-react";

const UPPER   = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER   = "abcdefghijklmnopqrstuvwxyz";
const NUMS    = "0123456789";
const SYMS    = "!@#$%^&*()-_=+[]{}|;:,.<>?";
const AMBIG   = "0O1lI";

function genPassword(length: number, upper: boolean, lower: boolean, nums: boolean, syms: boolean, noAmb: boolean): string {
  let charset = "";
  if (upper) charset += UPPER;
  if (lower) charset += LOWER;
  if (nums)  charset += NUMS;
  if (syms)  charset += SYMS;
  if (!charset) charset = LOWER + NUMS;
  if (noAmb) charset = charset.split("").filter(c => !AMBIG.includes(c)).join("");

  // Guarantee at least one char from each selected set
  const required: string[] = [];
  const getOne = (set: string) => {
    const s = noAmb ? set.split("").filter(c => !AMBIG.includes(c)).join("") : set;
    const arr = new Uint32Array(1); crypto.getRandomValues(arr);
    return s[arr[0] % s.length];
  };
  if (upper) required.push(getOne(UPPER));
  if (lower) required.push(getOne(LOWER));
  if (nums)  required.push(getOne(NUMS));
  if (syms)  required.push(getOne(SYMS));

  const arr = new Uint32Array(length - required.length);
  crypto.getRandomValues(arr);
  const rest = Array.from(arr).map(v => charset[v % charset.length]);

  // Shuffle required + rest
  const combined = [...required, ...rest];
  const shuffle   = new Uint32Array(combined.length);
  crypto.getRandomValues(shuffle);
  combined.sort((_, __, i = 0) => shuffle[i++] - shuffle[i]);
  // Proper Fisher-Yates
  for (let i = combined.length - 1; i > 0; i--) {
    const j = shuffle[i] % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }
  return combined.join("");
}

export function PasswordGenerator() {
  const [length,  setLength]  = useState(16);
  const [upper,   setUpper]   = useState(true);
  const [lower,   setLower]   = useState(true);
  const [nums,    setNums]    = useState(true);
  const [syms,    setSyms]    = useState(true);
  const [noAmb,   setNoAmb]   = useState(false);
  const [count,   setCount]   = useState(1);
  const [show,    setShow]    = useState(true);
  const [values,  setValues]  = useState<string[]>([]);
  const { copy, isCopied } = useCopy();

  const charsetSize = () => {
    let n = 0;
    if (upper) n += noAmb ? 24 : 26;
    if (lower) n += noAmb ? 24 : 26;
    if (nums)  n += noAmb ? 8  : 10;
    if (syms)  n += 26;
    return Math.max(1, n);
  };
  const entropy  = calcEntropy(charsetSize(), length);
  const strength = entropyToStrength(entropy);

  const generate = useCallback(() => {
    setValues(Array.from({ length: count }, () => genPassword(length, upper, lower, nums, syms, noAmb)));
  }, [length, upper, lower, nums, syms, noAmb, count]);

  // Auto-generate on mount
  useEffect(() => { generate(); }, []);

  const PASSWORD_PRESETS = [
    { label: "Memorable",   length: 12, upper: true,  lower: true,  nums: true,  syms: false, noAmb: true  },
    { label: "Standard",    length: 16, upper: true,  lower: true,  nums: true,  syms: true,  noAmb: false },
    { label: "Strong",      length: 24, upper: true,  lower: true,  nums: true,  syms: true,  noAmb: false },
    { label: "Maximum",     length: 48, upper: true,  lower: true,  nums: true,  syms: true,  noAmb: false },
  ];

  const applyPreset = (p: typeof PASSWORD_PRESETS[0]) => {
    setLength(p.length); setUpper(p.upper); setLower(p.lower);
    setNums(p.nums); setSyms(p.syms); setNoAmb(p.noAmb);
    setValues([genPassword(p.length, p.upper, p.lower, p.nums, p.syms, p.noAmb)]);
  };

  return (
    <div className="space-y-5">
      {/* Presets */}
      <div>
        <SectionHeader label="Presets" />
        <div className="flex flex-wrap gap-2">
          {PASSWORD_PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className="text-xs font-bold text-stone-300 bg-stone-800 hover:bg-violet-900/40 hover:text-violet-300 border border-stone-700 hover:border-violet-600 px-3 py-1.5 rounded-sm transition-all">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Single password display */}
      {values.length === 1 && values[0] && (
        <div className="space-y-3">
          <div className="group relative bg-stone-950 border border-stone-700 rounded-sm overflow-hidden">
            <div className="px-4 py-4 pr-20 min-h-[56px] flex items-center">
              <span className={`text-base font-mono break-all leading-relaxed tracking-widest ${show ? "text-emerald-400" : "text-stone-600 select-none"}`}>
                {show ? values[0] : "•".repeat(values[0].length)}
              </span>
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <button onClick={() => setShow(p => !p)}
                className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-white hover:bg-stone-700 rounded-sm transition-all">
                {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => copy(values[0])}
                className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-white hover:bg-stone-700 rounded-sm transition-all">
                {isCopied() ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <StrengthMeter level={strength} entropy={entropy} />
        </div>
      )}

      {/* Controls */}
      <div className="space-y-4">
        <SectionHeader label="Options" />
        <SliderControl label="Length" value={length} min={6} max={128} onChange={setLength} unit=" chars" />
        <SliderControl label="Quantity" value={count} min={1} max={50} onChange={setCount} />
        <div className="grid grid-cols-2 gap-x-6">
          <ToggleControl label="Uppercase (A–Z)"   checked={upper} onChange={setUpper} />
          <ToggleControl label="Lowercase (a–z)"   checked={lower} onChange={setLower} />
          <ToggleControl label="Numbers (0–9)"      checked={nums}  onChange={setNums}  />
          <ToggleControl label="Symbols (!@#…)"    checked={syms}  onChange={setSyms}  />
          <ToggleControl label="Exclude ambiguous" checked={noAmb} onChange={setNoAmb}
            description="Removes 0, O, 1, l, I" />
        </div>
      </div>

      <GenerateButton onClick={generate} label={count > 1 ? `Generate ${count} Passwords` : "Generate Password"} />

      {values.length > 1 && <OutputList values={values} />}

      <div className="bg-stone-900/40 border border-stone-800 rounded-sm px-4 py-3">
        <p className="text-[11px] text-stone-500 leading-relaxed">
          <span className="text-stone-400 font-semibold">Security note:</span> Generated entirely in your browser using <span className="font-mono text-violet-400">crypto.getRandomValues()</span>. Nothing is transmitted or stored.
        </p>
      </div>

      <CodeSnippet snippets={[
        {
          lang: "js", label: "JS",
          code: `// Cryptographically secure password\nfunction generatePassword(length = ${length}) {\n  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';\n  const arr = new Uint32Array(length);\n  crypto.getRandomValues(arr);\n  return Array.from(arr).map(v => charset[v % charset.length]).join('');\n}`,
        },
        {
          lang: "py", label: "Python",
          code: `import secrets\nimport string\n\ndef generate_password(length=${length}):\n    charset = string.ascii_letters + string.digits + '!@#$%^&*()'\n    return ''.join(secrets.choice(charset) for _ in range(length))\n\nprint(generate_password())`,
        },
        {
          lang: "bash", label: "Bash",
          code: `# Generate ${length}-char password\nopenssl rand -base64 48 | tr -d '\\n' | head -c ${length}`,
        },
      ]} />
    </div>
  );
}