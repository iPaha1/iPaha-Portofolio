"use client";

// app/tools/random-toolkit/_components/generators/string-generator.tsx

import React, { useState, useCallback } from "react";
import {
  SliderControl, ToggleControl, GenerateButton, OutputCard,
  OutputList, CodeSnippet, SectionHeader, StrengthMeter,
  calcEntropy, entropyToStrength,
} from "./shared";

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers:   "0123456789",
  symbols:   "!@#$%^&*()-_=+[]{}|;:,.<>?",
  ambiguous: "0O1lI",
};

const PRESETS = [
  { label: "API Key",        length: 32, upper: true,  lower: true,  nums: true,  syms: false, noAmb: true  },
  { label: "JWT Secret",     length: 64, upper: true,  lower: true,  nums: true,  syms: false, noAmb: false },
  { label: "Database ID",    length: 16, upper: false, lower: true,  nums: true,  syms: false, noAmb: true  },
  { label: "Session Token",  length: 48, upper: true,  lower: true,  nums: true,  syms: false, noAmb: false },
  { label: "Password Reset", length: 24, upper: true,  lower: true,  nums: true,  syms: true,  noAmb: true  },
];

function generateString(length: number, upper: boolean, lower: boolean, nums: boolean, syms: boolean, noAmb: boolean): string {
  let charset = "";
  if (upper) charset += CHARSETS.uppercase;
  if (lower) charset += CHARSETS.lowercase;
  if (nums)  charset += CHARSETS.numbers;
  if (syms)  charset += CHARSETS.symbols;
  if (!charset) charset = CHARSETS.lowercase + CHARSETS.numbers;
  if (noAmb) charset = charset.split("").filter(c => !CHARSETS.ambiguous.includes(c)).join("");

  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(v => charset[v % charset.length]).join("");
}

export function StringGenerator() {
  const [length, setLength] = useState(32);
  const [upper,  setUpper]  = useState(true);
  const [lower,  setLower]  = useState(true);
  const [nums,   setNums]   = useState(true);
  const [syms,   setSyms]   = useState(false);
  const [noAmb,  setNoAmb]  = useState(false);
  const [count,  setCount]  = useState(1);
  const [values, setValues] = useState<string[]>([]);

  const charsetSize = () => {
    let n = 0;
    if (upper) n += 26;
    if (lower) n += 26;
    if (nums)  n += 10;
    if (syms)  n += 26;
    if (noAmb) n = Math.max(1, n - 5);
    return Math.max(1, n);
  };

  const entropy  = calcEntropy(charsetSize(), length);
  const strength = entropyToStrength(entropy);

  const generate = useCallback(() => {
    setValues(Array.from({ length: count }, () => generateString(length, upper, lower, nums, syms, noAmb)));
  }, [length, upper, lower, nums, syms, noAmb, count]);

  const applyPreset = (p: typeof PRESETS[0]) => {
    setLength(p.length); setUpper(p.upper); setLower(p.lower);
    setNums(p.nums); setSyms(p.syms); setNoAmb(p.noAmb);
    const v = generateString(p.length, p.upper, p.lower, p.nums, p.syms, p.noAmb);
    setValues([v]);
  };

  return (
    <div className="space-y-5">
      {/* Smart presets */}
      <div>
        <SectionHeader label="Presets" />
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => applyPreset(p)}
              className="text-xs font-bold text-stone-300 bg-stone-800 hover:bg-violet-900/40 hover:text-violet-300 border border-stone-700 hover:border-violet-600 px-3 py-1.5 rounded-sm transition-all">
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <SectionHeader label="Options" />
        <SliderControl label="Length" value={length} min={4} max={256} onChange={setLength} unit=" chars" />
        <SliderControl label="Quantity" value={count} min={1} max={100} onChange={setCount} />

        <div className="grid grid-cols-2 gap-x-6">
          <ToggleControl label="Uppercase (A–Z)"   checked={upper}  onChange={setUpper} />
          <ToggleControl label="Lowercase (a–z)"   checked={lower}  onChange={setLower} />
          <ToggleControl label="Numbers (0–9)"      checked={nums}   onChange={setNums}  />
          <ToggleControl label="Symbols (!@#…)"    checked={syms}   onChange={setSyms}  />
          <ToggleControl label="Exclude ambiguous" checked={noAmb}  onChange={setNoAmb}
            description="Removes 0, O, 1, l, I" />
        </div>
      </div>

      {/* Strength */}
      <StrengthMeter level={strength} entropy={entropy} />

      <GenerateButton onClick={generate} label={count > 1 ? `Generate ${count} Strings` : "Generate String"} />

      {/* Output */}
      {values.length === 1 && <OutputCard value={values[0]} label="Generated String" />}
      {values.length > 1  && <OutputList values={values} />}

      {/* Code snippets */}
      <CodeSnippet snippets={[
        {
          lang: "js", label: "JS",
          code: `// Browser (Web Crypto API)\nfunction randomString(length, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {\n  const arr = new Uint32Array(length);\n  crypto.getRandomValues(arr);\n  return Array.from(arr).map(v => charset[v % charset.length]).join('');\n}\n\nconsole.log(randomString(${length}));`,
        },
        {
          lang: "node", label: "Node.js",
          code: `const { randomBytes } = require('crypto');\n\nfunction randomString(length) {\n  return randomBytes(length).toString('base64url').slice(0, length);\n}\n\nconsole.log(randomString(${length}));`,
        },
        {
          lang: "py", label: "Python",
          code: `import secrets\nimport string\n\ncharset = string.ascii_letters + string.digits\nresult = ''.join(secrets.choice(charset) for _ in range(${length}))\nprint(result)`,
        },
        {
          lang: "bash", label: "Bash",
          code: `# macOS / Linux\nopenssl rand -base64 ${Math.ceil(length * 3/4)} | tr -d '/+=' | head -c ${length}`,
        },
      ]} />
    </div>
  );
}