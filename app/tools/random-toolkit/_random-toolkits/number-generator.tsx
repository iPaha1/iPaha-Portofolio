"use client";

// app/tools/random-toolkit/_components/generators/number-generator.tsx

import React, { useState, useCallback } from "react";
import {
  SliderControl, ToggleControl, GenerateButton, OutputCard,
  OutputList, CodeSnippet, SectionHeader, NumberInput,
} from "./shared";

function randomInt(min: number, max: number): number {
  const range  = max - min + 1;
  const arr    = new Uint32Array(1);
  const limit  = Math.floor(0x100000000 / range) * range;
  do { crypto.getRandomValues(arr); } while (arr[0] >= limit);
  return min + (arr[0] % range);
}

function randomFloat(min: number, max: number, decimals: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  const raw = min + (arr[0] / 0x100000000) * (max - min);
  return parseFloat(raw.toFixed(decimals));
}

export function NumberGenerator() {
  const [min,       setMin]       = useState(1);
  const [max,       setMax]       = useState(100);
  const [count,     setCount]     = useState(1);
  const [decimals,  setDecimals]  = useState(2);
  const [isFloat,   setIsFloat]   = useState(false);
  const [unique,    setUnique]    = useState(false);
  const [sorted,    setSorted]    = useState(false);
  const [values,    setValues]    = useState<string[]>([]);
  const [error,     setError]     = useState("");

  const generate = useCallback(() => {
    setError("");
    if (min >= max) { setError("Min must be less than Max"); return; }
    if (unique && !isFloat && max - min + 1 < count) {
      setError(`Can't generate ${count} unique integers from range ${min}–${max}`);
      return;
    }

    let result: number[];

    if (unique && !isFloat) {
      // Fisher-Yates partial shuffle
      const pool = Array.from({ length: max - min + 1 }, (_, i) => i + min);
      for (let i = 0; i < count; i++) {
        const j = i + randomInt(0, pool.length - 1 - i);
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      result = pool.slice(0, count);
    } else {
      result = Array.from({ length: count }, () =>
        isFloat ? randomFloat(min, max, decimals) : randomInt(min, max)
      );
    }

    if (sorted) result.sort((a, b) => a - b);
    setValues(result.map(String));
  }, [min, max, count, isFloat, decimals, unique, sorted]);

  return (
    <div className="space-y-5">
      <div>
        <SectionHeader label="Range" />
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="Minimum" value={min} min={-1e15} max={max - 1} onChange={setMin} />
          <NumberInput label="Maximum" value={max} min={min + 1} max={1e15}  onChange={setMax} />
        </div>
      </div>

      <div>
        <SectionHeader label="Options" />
        <SliderControl label="Quantity" value={count} min={1} max={1000} onChange={setCount} />

        <div className="space-y-0.5 mt-3">
          <ToggleControl label="Decimal numbers" checked={isFloat} onChange={setIsFloat}
            description="Generate floating-point numbers" />
          {isFloat && (
            <SliderControl label="Decimal places" value={decimals} min={1} max={10} onChange={setDecimals} />
          )}
          {!isFloat && (
            <ToggleControl label="Unique only" checked={unique} onChange={setUnique}
              description="No duplicates in bulk generation" />
          )}
          <ToggleControl label="Sort ascending" checked={sorted} onChange={setSorted} />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-900/20 border border-red-800 px-3 py-2 rounded-sm">{error}</p>
      )}

      <GenerateButton onClick={generate} label={count > 1 ? `Generate ${count} Numbers` : "Generate Number"} />

      {values.length === 1 && <OutputCard value={values[0]} label="Random Number" />}
      {values.length > 1  && <OutputList values={values} />}

      <CodeSnippet snippets={[
        {
          lang: "js", label: "JS",
          code: `// Cryptographically random integer in range\nfunction randomInt(min = ${min}, max = ${max}) {\n  const range = max - min + 1;\n  const arr = new Uint32Array(1);\n  const limit = Math.floor(0x100000000 / range) * range;\n  do { crypto.getRandomValues(arr); } while (arr[0] >= limit);\n  return min + (arr[0] % range);\n}\n\nconsole.log(randomInt()); // ${min}–${max}`,
        },
        {
          lang: "py", label: "Python",
          code: `import secrets\n\n# Secure random integer\nresult = secrets.randbelow(${max - min + 1}) + ${min}\nprint(result)\n\n# Bulk\nresults = [secrets.randbelow(${max - min + 1}) + ${min} for _ in range(${count})]`,
        },
        {
          lang: "bash", label: "Bash",
          code: `# Random integer between ${min} and ${max}\necho $(( RANDOM % ${max - min + 1} + ${min} ))\n\n# Using shuf (more uniform)\nshuf -i ${min}-${max} -n 1`,
        },
      ]} />
    </div>
  );
}