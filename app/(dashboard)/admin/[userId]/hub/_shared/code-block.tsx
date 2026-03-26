"use client";

// =============================================================================
// isaacpaha.com — Developer Hub: CodeBlock
// components/admin/hub/shared/code-block.tsx
// =============================================================================

import React, { useState } from "react";
import { LANG_LABELS, LANG_COLOR, type HubLanguage } from "./hub-types";
import { CopyBtn } from "./copy-button";


interface CodeBlockProps {
  code:       string;
  language?:  HubLanguage | null;
  maxLines?:  number;
  entryId?:   string;
  className?: string;
}

export function CodeBlock({
  code, language, maxLines = 12, entryId, className,
}: CodeBlockProps) {
  const [expanded, setExpanded] = useState(false);

  const lines   = code.split("\n");
  const display = expanded ? lines : lines.slice(0, maxLines);
  const clipped = !expanded && lines.length > maxLines;
  const langColor = LANG_COLOR[language ?? ""] ?? LANG_COLOR.DEFAULT;

  return (
    <div className={`relative rounded-sm border border-stone-700 bg-stone-950 overflow-hidden ${className ?? ""}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] bg-stone-900">
        <div className="flex items-center gap-2">
          {/* Traffic lights decoration */}
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
          </div>
          {language && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm ml-1"
              style={{ color: langColor, backgroundColor: `${langColor}22` }}
            >
              {LANG_LABELS[language] ?? language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {clipped && (
            <button
              onClick={() => setExpanded(true)}
              className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
            >
              +{lines.length - maxLines} more lines
            </button>
          )}
          {expanded && lines.length > maxLines && (
            <button
              onClick={() => setExpanded(false)}
              className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
            >
              Collapse
            </button>
          )}
          <CopyBtn text={code} entryId={entryId} size="xs" />
        </div>
      </div>

      {/* Line numbers + code */}
      <div className="flex overflow-x-auto">
        {/* Line numbers */}
        <div className="flex-shrink-0 select-none px-3 py-3 text-right border-r border-white/[0.04]">
          {display.map((_, i) => (
            <div key={i} className="text-[11px] text-white/20 leading-[1.6] font-mono">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code */}
        <pre className="flex-1 px-3 py-3 text-[12px] text-stone-200 leading-[1.6] font-mono min-w-0 overflow-x-auto">
          <code>{display.join("\n")}</code>
        </pre>
      </div>
    </div>
  );
}