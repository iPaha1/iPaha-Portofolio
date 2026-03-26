"use client";

// app/tools/random-toolkit/_components/generators/uuid-generator.tsx

import React, { useState, useCallback } from "react";
import {
  SliderControl, GenerateButton, OutputCard, OutputList,
  CodeSnippet, SectionHeader, ToggleControl,
} from "./shared";

function uuidv4(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Polyfill via getRandomValues
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  arr[6] = (arr[6] & 0x0f) | 0x40; // version 4
  arr[8] = (arr[8] & 0x3f) | 0x80; // variant
  const hex = Array.from(arr).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

type UUIDFormat = "hyphenated" | "no-hyphens" | "uppercase" | "braces" | "urn";

function formatUUID(uuid: string, format: UUIDFormat): string {
  switch (format) {
    case "no-hyphens": return uuid.replace(/-/g, "");
    case "uppercase":  return uuid.toUpperCase();
    case "braces":     return `{${uuid}}`;
    case "urn":        return `urn:uuid:${uuid}`;
    default:           return uuid;
  }
}

export function UUIDGenerator() {
  const [count,   setCount]   = useState(1);
  const [format,  setFormat]  = useState<UUIDFormat>("hyphenated");
  const [values,  setValues]  = useState<string[]>([]);

  const FORMAT_OPTIONS: { id: UUIDFormat; label: string; example: string }[] = [
    { id: "hyphenated",  label: "Standard",     example: "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx" },
    { id: "uppercase",   label: "Uppercase",    example: "XXXXXXXX-XXXX-4XXX-YXXX-XXXXXXXXXXXX" },
    { id: "no-hyphens",  label: "No Hyphens",   example: "xxxxxxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx" },
    { id: "braces",      label: "Braces",       example: "{xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx}" },
    { id: "urn",         label: "URN",          example: "urn:uuid:xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx" },
  ];

  const generate = useCallback(() => {
    setValues(Array.from({ length: count }, () => formatUUID(uuidv4(), format)));
  }, [count, format]);

  return (
    <div className="space-y-5">
      <div>
        <SectionHeader label="Format" />
        <div className="space-y-1">
          {FORMAT_OPTIONS.map((f) => (
            <button key={f.id} onClick={() => setFormat(f.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-sm border transition-all text-left ${
                format === f.id
                  ? "bg-violet-900/30 border-violet-600 text-violet-300"
                  : "bg-stone-900/20 border-stone-800 text-stone-400 hover:border-stone-700 hover:text-stone-300"
              }`}>
              <span className="text-xs font-bold">{f.label}</span>
              <span className="text-[10px] font-mono text-stone-600 truncate ml-3 max-w-[200px]">{f.example}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionHeader label="Quantity" />
        <SliderControl label="Count" value={count} min={1} max={100} onChange={setCount} />
      </div>

      <GenerateButton onClick={generate} label={count > 1 ? `Generate ${count} UUIDs` : "Generate UUID"} />

      {values.length === 1 && <OutputCard value={values[0]} label="UUID v4" />}
      {values.length > 1  && <OutputList values={values} />}

      <div className="bg-stone-900/40 border border-stone-800 rounded-sm px-4 py-3">
        <p className="text-[11px] text-stone-500 leading-relaxed">
          UUID v4 — random 128-bit identifier. Uses <span className="font-mono text-violet-400">crypto.randomUUID()</span> where available, falling back to <span className="font-mono text-violet-400">crypto.getRandomValues()</span>. Collision probability is negligible: 1 in 2¹²² per pair.
        </p>
      </div>

      <CodeSnippet snippets={[
        {
          lang: "js", label: "JS",
          code: `// Modern browsers & Node 14.17+\nconst uuid = crypto.randomUUID();\nconsole.log(uuid); // e.g. '110e8400-e29b-41d4-a716-446655440000'\n\n// Bulk generation\nconst uuids = Array.from({ length: ${count} }, () => crypto.randomUUID());`,
        },
        {
          lang: "node", label: "Node.js",
          code: `const { randomUUID } = require('crypto');\nconst uuid = randomUUID();\nconsole.log(uuid);\n\n// Bulk\nconst uuids = Array.from({ length: ${count} }, randomUUID);`,
        },
        {
          lang: "py", label: "Python",
          code: `import uuid\n\n# Single\nuuid_val = str(uuid.uuid4())\nprint(uuid_val)\n\n# Bulk\nuuids = [str(uuid.uuid4()) for _ in range(${count})]`,
        },
        {
          lang: "bash", label: "Bash",
          code: `# Linux\nuuidgen\n\n# macOS\nuuidgen | tr '[:upper:]' '[:lower:]'\n\n# Bulk (${count})\nfor i in $(seq 1 ${count}); do uuidgen; done`,
        },
      ]} />
    </div>
  );
}