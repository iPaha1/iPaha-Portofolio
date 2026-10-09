"use client";

// =============================================================================
// isaacpaha.com — Teleprompter — Script Editor Component
// app/tools/teleprompter/_teleprompter/script-editor.tsx
// =============================================================================

import React, { useRef, useEffect } from "react";
import { motion }                   from "framer-motion";
import { Upload, Download, FilePlus2, Trash2, Hash, Clock, AlignLeft, BookOpen } from "lucide-react";
import { calcStats } from "./teleprompter-types";


interface ScriptEditorProps {
  script:      string;
  scriptName:  string;
  wpm:         number;
  onChange:    (v: string) => void;
  onNameChange:(v: string) => void;
}

const ACCENT = "#14b8a6";

const PLACEHOLDER = `Type or paste your script here…

Tips for a great teleprompter script:
  • Write how you speak — short sentences, natural rhythm
  • Use the cue buttons below: [PAUSE] [BREATHE] [EMPHASIS]
  • Break long paragraphs into shorter chunks
  • Read aloud as you write to feel the flow

Keyboard shortcuts during playback:
  Space / K   →  Play / Pause
  ↑ / ↓       →  Speed up / down  
  ← / →       →  Manual scroll step
  F            →  Toggle focus guide
  R            →  Restart from top
  Esc          →  Exit teleprompter`;

export function ScriptEditor({ script, scriptName, wpm, onChange, onNameChange }: ScriptEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const stats       = calcStats(script, wpm);

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart ?? 0;
    const e = el.selectionEnd   ?? 0;
    const next = script.slice(0, s) + text + script.slice(e);
    onChange(next);
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = s + text.length;
      el.focus();
    }, 0);
  };

  const handleImport = () => fileRef.current?.click();
  const handleFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onChange(text);
      onNameChange(file.name.replace(/\.[^.]+$/, ""));
    };
    reader.readAsText(file);
    ev.target.value = "";
  };

  const handleDownload = () => {
    const blob = new Blob([script], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = (scriptName || "script") + ".txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleNew = () => {
    if (!script.trim() || window.confirm("Clear the current script?")) {
      onChange("");
      onNameChange("Untitled script");
    }
  };

  const removeCues = () => {
    onChange(
      script
        .replace(/\s*\[PAUSE\]\s*/g,    " ")
        .replace(/\s*\[BREATHE\]\s*/g,  " ")
        .replace(/\s*\[EMPHASIS\]\s*/g, " ")
        .replace(/\n*\[SECTION\]\n*/g,  "\n\n")
    );
  };

  const pct = Math.min(100, Math.round((stats.words / 500) * 100));

  return (
    <div className="flex flex-col h-full min-h-0" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap flex-shrink-0"
        style={{ background: "#0d0d0d", borderBottom: "1px solid #1f1f1f" }}>

        {/* File ops */}
        <div className="flex items-center gap-1.5 pr-3" style={{ borderRight: "1px solid #1f1f1f" }}>
          <button onClick={handleNew}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#ccc" }}
            onMouseEnter={e => (e.currentTarget.style.background="#222")}
            onMouseLeave={e => (e.currentTarget.style.background="#1a1a1a")}>
            <FilePlus2 size={12} />New
          </button>
          <button onClick={handleImport}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#ccc" }}
            onMouseEnter={e => (e.currentTarget.style.background="#222")}
            onMouseLeave={e => (e.currentTarget.style.background="#1a1a1a")}>
            <Upload size={12} />Import
          </button>
          <button onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#ccc" }}
            onMouseEnter={e => (e.currentTarget.style.background="#222")}
            onMouseLeave={e => (e.currentTarget.style.background="#1a1a1a")}>
            <Download size={12} />Save .txt
          </button>
          <input ref={fileRef} type="file" accept=".txt,.md,.rtf" style={{ display: "none" }} onChange={handleFileChange} />
        </div>

        {/* Cue insertion */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#555" }}>Cue:</span>
          {[
            { label: "⏸ PAUSE",    text: " [PAUSE] ",    bg: "rgba(245,158,11,.12)",  border: "rgba(245,158,11,.3)",  color: "#fbbf24" },
            { label: "↕ BREATHE",  text: " [BREATHE] ",  bg: "rgba(59,130,246,.12)",  border: "rgba(59,130,246,.3)",  color: "#93c5fd" },
            { label: "★ EMPHASIS", text: " [EMPHASIS] ", bg: "rgba(168,85,247,.12)",  border: "rgba(168,85,247,.3)",  color: "#d8b4fe" },
            { label: "— SECTION",  text: "\n\n[SECTION]\n\n", bg: "rgba(20,184,166,.12)", border: "rgba(20,184,166,.3)", color: "#5eead4" },
          ].map(c => (
            <button key={c.label} onClick={() => insertAtCursor(c.text)}
              className="text-[11px] font-bold px-2.5 py-1 rounded-md transition-opacity"
              style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
              onMouseEnter={e => (e.currentTarget.style.opacity="0.8")}
              onMouseLeave={e => (e.currentTarget.style.opacity="1")}>
              {c.label}
            </button>
          ))}
          <button onClick={removeCues}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md ml-1 transition-colors"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#555" }}
            onMouseEnter={e => (e.currentTarget.style.color="#999")}
            onMouseLeave={e => (e.currentTarget.style.color="#555")}>
            <Trash2 size={11} />Remove cues
          </button>
        </div>
      </div>

      {/* ── Script header ── */}
      <div className="flex items-center justify-between px-5 py-2 flex-shrink-0"
        style={{ background: "#111", borderBottom: "1px solid #1a1a1a" }}>
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#f59e0b" }} />
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#10b981" }} />
          </div>
          <input value={scriptName} onChange={e => onNameChange(e.target.value)}
            className="text-xs font-semibold bg-transparent border-none outline-none"
            style={{ color: "#666", minWidth: 80, maxWidth: 200 }}
          />
        </div>
        <div className="flex items-center gap-4 text-[11px]" style={{ color: "#444" }}>
          <span className="flex items-center gap-1.5">
            <Hash size={11} /><span style={{ color: "#f59e0b", fontWeight: 600 }}>{stats.words.toLocaleString()}</span> words
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={11} /><span style={{ color: "#f59e0b", fontWeight: 600 }}>{stats.readTime}</span> est.
          </span>
          <span className="flex items-center gap-1.5">
            <AlignLeft size={11} /><span style={{ color: "#f59e0b", fontWeight: 600 }}>{stats.lines}</span> lines
          </span>
        </div>
      </div>

      {/* ── Word count progress bar ── */}
      <div className="h-px flex-shrink-0" style={{ background: "#1a1a1a" }}>
        <motion.div className="h-full" style={{ background: ACCENT }}
          animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
      </div>

      {/* ── Textarea ── */}
      <div className="flex-1 min-h-0 overflow-auto">
        <textarea
          ref={textareaRef}
          value={script}
          onChange={e => onChange(e.target.value)}
          placeholder={PLACEHOLDER}
          spellCheck
          className="w-full h-full resize-none outline-none"
          style={{
            background: "#0a0a0a", color: "#d4d4d4", border: "none",
            fontSize: 15, lineHeight: 1.9, padding: "24px 10%",
            fontFamily: "inherit",
            height: "100%",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}



// "use client";

// // =============================================================================
// // isaacpaha.com — Teleprompter — Script Editor Component
// // app/tools/teleprompter/_teleprompter/script-editor.tsx
// // =============================================================================

// import React, { useRef, useEffect } from "react";
// import { motion }                   from "framer-motion";
// import { Upload, Download, FilePlus2, Trash2, Hash, Clock, AlignLeft, BookOpen } from "lucide-react";
// import { calcStats } from "./teleprompter-types";


// interface ScriptEditorProps {
//   script:      string;
//   scriptName:  string;
//   wpm:         number;
//   onChange:    (v: string) => void;
//   onNameChange:(v: string) => void;
// }

// const ACCENT = "#14b8a6";

// const PLACEHOLDER = `Type or paste your script here…

// Tips for a great teleprompter script:
//   • Write how you speak — short sentences, natural rhythm
//   • Use the cue buttons below: [PAUSE] [BREATHE] [EMPHASIS]
//   • Break long paragraphs into shorter chunks
//   • Read aloud as you write to feel the flow

// Keyboard shortcuts during playback:
//   Space / K   →  Play / Pause
//   ↑ / ↓       →  Speed up / down  
//   ← / →       →  Manual scroll step
//   F            →  Toggle focus guide
//   R            →  Restart from top
//   Esc          →  Exit teleprompter`;

// export function ScriptEditor({ script, scriptName, wpm, onChange, onNameChange }: ScriptEditorProps) {
//   const textareaRef = useRef<HTMLTextAreaElement>(null);
//   const fileRef     = useRef<HTMLInputElement>(null);
//   const stats       = calcStats(script, wpm);

//   const insertAtCursor = (text: string) => {
//     const el = textareaRef.current;
//     if (!el) return;
//     const s = el.selectionStart ?? 0;
//     const e = el.selectionEnd   ?? 0;
//     const next = script.slice(0, s) + text + script.slice(e);
//     onChange(next);
//     setTimeout(() => {
//       el.selectionStart = el.selectionEnd = s + text.length;
//       el.focus();
//     }, 0);
//   };

//   const handleImport = () => fileRef.current?.click();
//   const handleFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
//     const file = ev.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       const text = e.target?.result as string;
//       onChange(text);
//       onNameChange(file.name.replace(/\.[^.]+$/, ""));
//     };
//     reader.readAsText(file);
//     ev.target.value = "";
//   };

//   const handleDownload = () => {
//     const blob = new Blob([script], { type: "text/plain" });
//     const url  = URL.createObjectURL(blob);
//     const a    = document.createElement("a");
//     a.href     = url;
//     a.download = (scriptName || "script") + ".txt";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const handleNew = () => {
//     if (!script.trim() || window.confirm("Clear the current script?")) {
//       onChange("");
//       onNameChange("Untitled script");
//     }
//   };

//   const removeCues = () => {
//     onChange(
//       script
//         .replace(/\s*\[PAUSE\]\s*/g,    " ")
//         .replace(/\s*\[BREATHE\]\s*/g,  " ")
//         .replace(/\s*\[EMPHASIS\]\s*/g, " ")
//         .replace(/\n*\[SECTION\]\n*/g,  "\n\n")
//     );
//   };

//   const pct = Math.min(100, Math.round((stats.words / 500) * 100));

//   return (
//     <div className="flex flex-col h-full" style={{ fontFamily: "Sora, sans-serif" }}>

//       {/* ── Toolbar ── */}
//       <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap"
//         style={{ background: "#0d0d0d", borderBottom: "1px solid #1f1f1f" }}>

//         {/* File ops */}
//         <div className="flex items-center gap-1.5 pr-3" style={{ borderRight: "1px solid #1f1f1f" }}>
//           <button onClick={handleNew}
//             className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
//             style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#ccc" }}
//             onMouseEnter={e => (e.currentTarget.style.background="#222")}
//             onMouseLeave={e => (e.currentTarget.style.background="#1a1a1a")}>
//             <FilePlus2 size={12} />New
//           </button>
//           <button onClick={handleImport}
//             className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
//             style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#ccc" }}
//             onMouseEnter={e => (e.currentTarget.style.background="#222")}
//             onMouseLeave={e => (e.currentTarget.style.background="#1a1a1a")}>
//             <Upload size={12} />Import
//           </button>
//           <button onClick={handleDownload}
//             className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
//             style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#ccc" }}
//             onMouseEnter={e => (e.currentTarget.style.background="#222")}
//             onMouseLeave={e => (e.currentTarget.style.background="#1a1a1a")}>
//             <Download size={12} />Save .txt
//           </button>
//           <input ref={fileRef} type="file" accept=".txt,.md,.rtf" style={{ display: "none" }} onChange={handleFileChange} />
//         </div>

//         {/* Cue insertion */}
//         <div className="flex items-center gap-1.5 flex-wrap">
//           <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#555" }}>Cue:</span>
//           {[
//             { label: "⏸ PAUSE",    text: " [PAUSE] ",    bg: "rgba(245,158,11,.12)",  border: "rgba(245,158,11,.3)",  color: "#fbbf24" },
//             { label: "↕ BREATHE",  text: " [BREATHE] ",  bg: "rgba(59,130,246,.12)",  border: "rgba(59,130,246,.3)",  color: "#93c5fd" },
//             { label: "★ EMPHASIS", text: " [EMPHASIS] ", bg: "rgba(168,85,247,.12)",  border: "rgba(168,85,247,.3)",  color: "#d8b4fe" },
//             { label: "— SECTION",  text: "\n\n[SECTION]\n\n", bg: "rgba(20,184,166,.12)", border: "rgba(20,184,166,.3)", color: "#5eead4" },
//           ].map(c => (
//             <button key={c.label} onClick={() => insertAtCursor(c.text)}
//               className="text-[11px] font-bold px-2.5 py-1 rounded-md transition-opacity"
//               style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
//               onMouseEnter={e => (e.currentTarget.style.opacity="0.8")}
//               onMouseLeave={e => (e.currentTarget.style.opacity="1")}>
//               {c.label}
//             </button>
//           ))}
//           <button onClick={removeCues}
//             className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md ml-1 transition-colors"
//             style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", color: "#555" }}
//             onMouseEnter={e => (e.currentTarget.style.color="#999")}
//             onMouseLeave={e => (e.currentTarget.style.color="#555")}>
//             <Trash2 size={11} />Remove cues
//           </button>
//         </div>
//       </div>

//       {/* ── Script header ── */}
//       <div className="flex items-center justify-between px-5 py-2"
//         style={{ background: "#111", borderBottom: "1px solid #1a1a1a" }}>
//         <div className="flex items-center gap-2.5">
//           <div className="flex gap-1.5">
//             <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
//             <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#f59e0b" }} />
//             <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#10b981" }} />
//           </div>
//           <input value={scriptName} onChange={e => onNameChange(e.target.value)}
//             className="text-xs font-semibold bg-transparent border-none outline-none"
//             style={{ color: "#666", minWidth: 80, maxWidth: 200 }}
//           />
//         </div>
//         <div className="flex items-center gap-4 text-[11px]" style={{ color: "#444" }}>
//           <span className="flex items-center gap-1.5">
//             <Hash size={11} /><span style={{ color: "#f59e0b", fontWeight: 600 }}>{stats.words.toLocaleString()}</span> words
//           </span>
//           <span className="flex items-center gap-1.5">
//             <Clock size={11} /><span style={{ color: "#f59e0b", fontWeight: 600 }}>{stats.readTime}</span> est.
//           </span>
//           <span className="flex items-center gap-1.5">
//             <AlignLeft size={11} /><span style={{ color: "#f59e0b", fontWeight: 600 }}>{stats.lines}</span> lines
//           </span>
//         </div>
//       </div>

//       {/* ── Word count progress bar ── */}
//       <div className="h-px flex-shrink-0" style={{ background: "#1a1a1a" }}>
//         <motion.div className="h-full" style={{ background: ACCENT }}
//           animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
//       </div>

//       {/* ── Textarea ── */}
//       <div className="flex-1 overflow-hidden">
//         <textarea
//           ref={textareaRef}
//           value={script}
//           onChange={e => onChange(e.target.value)}
//           placeholder={PLACEHOLDER}
//           spellCheck
//           className="w-full h-full resize-none outline-none"
//           style={{
//             background: "#0a0a0a", color: "#d4d4d4", border: "none",
//             fontSize: 15, lineHeight: 1.9, padding: "24px 10%",
//             fontFamily: "inherit",
//           }}
//         />
//       </div>
//     </div>
//   );
// }