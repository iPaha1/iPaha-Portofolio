"use client";
// app/tools/ai-cv-analyser/_components/cv-export-studio.tsx
//
// Self-contained: owns its own "which version of the CV to export" logic.
// Does NOT depend on state from other tabs (e.g. Overview's rewriteResult) —
// it fetches/caches its own rewrite via the existing rewrite endpoint.

import React, { useState } from "react";
import { Download, FileText, Loader2, Check, Sparkles, AlertCircle, RefreshCw, Eye } from "lucide-react";
import { CV_TEMPLATES } from "@/lib/cv-templates";

type SourceMode = "original" | "improve" | "full_rewrite" | "tailor";

interface CVExportStudioProps {
  originalCvText: string;
  jobDescription?: string;
  analysisId?: string;
  jobTitle?: string;
  companyName?: string;
  onInsufficientTokens?: (info: { required: number; balance: number; toolName: string | null }) => void;
}

const SOURCE_OPTIONS: { id: SourceMode; label: string; desc: string }[] = [
  { id: "original",     label: "Original",           desc: "Exactly what you pasted in — no AI changes" },
  { id: "improve",      label: "Improved Language",  desc: "Stronger phrasing, same content" },
  { id: "full_rewrite", label: "Full Rewrite",       desc: "Comprehensively rewritten by AI" },
  { id: "tailor",       label: "Tailored to Job",    desc: "Rewritten to match the job description" },
];

export function CVExportStudio({
  originalCvText, jobDescription = "", analysisId, jobTitle, companyName, onInsufficientTokens,
}: CVExportStudioProps) {
  const hasJD = jobDescription.trim().length > 50;

  const [sourceMode, setSourceMode]   = useState<SourceMode>("original");
  const [template, setTemplate]       = useState(CV_TEMPLATES[0].id);
  const [cache, setCache]             = useState<Partial<Record<SourceMode, string>>>({ original: originalCvText });
  const [resolving, setResolving]     = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generating, setGenerating]   = useState<"pdf" | "docx" | null>(null);
  const [done, setDone]               = useState<"pdf" | "docx" | null>(null);
  const [error, setError]             = useState("");

  const resolvedText = cache[sourceMode];

  // Fetch (and cache) a rewritten version the first time a non-original mode is selected
  const ensureSource = async (mode: SourceMode): Promise<string | null> => {
    if (cache[mode]) return cache[mode]!;
    if (mode === "original") return originalCvText;

    setResolving(true); setError("");
    try {
      const res = await fetch("/api/tools/cv-analyser/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "Full CV", content: originalCvText, jobDescription, mode }),
      });
      if (res.status === 402) {
        const data = await res.json();
        onInsufficientTokens?.({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: data.toolName ?? "CV Rewriter" });
        setResolving(false);
        return null;
      }
      const data = await res.json();
      if (!data.result) throw new Error(data.error ?? "Rewrite failed");
      setCache((prev) => ({ ...prev, [mode]: data.result }));
      setResolving(false);
      return data.result;
    } catch (e: any) {
      setError(e.message ?? "Couldn't generate that version — try again.");
      setResolving(false);
      return null;
    }
  };

  const selectSource = async (mode: SourceMode) => {
    setSourceMode(mode);
    setDone(null);
    await ensureSource(mode);
  };

  const generate = async (format: "pdf" | "docx") => {
    setError("");
    const text = await ensureSource(sourceMode);
    if (!text) return; // resolution failed or hit token gate — error/modal already shown

    setGenerating(format);
    try {
      const res = await fetch(`/api/tools/cv-analyser/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText: text, templateId: template, analysisId, jobTitle, companyName }),
      });
      if (res.status === 402) {
        const data = await res.json();
        onInsufficientTokens?.({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: data.toolName ?? "CV Export" });
        setGenerating(null);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CV-${template}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(format);
      setTimeout(() => setDone(null), 3000);
    } catch (e: any) {
      setError(e.message ?? "Export failed — please try again.");
    }
    setGenerating(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3.5">
        <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-700 leading-relaxed">
          Choose which version of your CV to export, pick a template, then download as PDF or Word.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
        </div>
      )}

      {/* Source version selector */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
          Which version?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {SOURCE_OPTIONS.filter((o) => o.id !== "tailor" || hasJD).map((o) => (
            <button
              key={o.id}
              onClick={() => selectSource(o.id)}
              title={o.desc}
              disabled={resolving}
              className={`text-left text-xs font-bold px-3 py-2.5 rounded-sm border transition-colors disabled:opacity-50 ${
                sourceMode === o.id ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {o.label}
                {cache[o.id] && o.id !== "original" && <Check className="w-3 h-3 text-emerald-500" />}
              </div>
              <p className="text-[10px] font-normal text-stone-400 mt-0.5">{o.desc}</p>
            </button>
          ))}
        </div>
        {resolving && (
          <div className="flex items-center gap-2 text-xs text-stone-500 mt-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />Generating this version…
          </div>
        )}
      </div>

      {/* Preview toggle so the user can confirm what's about to be exported */}
      {resolvedText && (
        <div className="border border-stone-200 rounded-sm overflow-hidden">
          <button
            onClick={() => setPreviewOpen((p) => !p)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-stone-50 text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <span className="flex items-center gap-2"><Eye className="w-3.5 h-3.5" />Preview content that will be exported</span>
            <span className="text-stone-400 font-normal">{previewOpen ? "Hide" : "Show"}</span>
          </button>
          {previewOpen && (
            <div className="p-4 max-h-64 overflow-y-auto">
              <pre className="text-xs text-stone-600 whitespace-pre-wrap font-sans leading-relaxed">{resolvedText}</pre>
            </div>
          )}
        </div>
      )}

      {/* Template gallery */}
      <div>
        <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Template</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CV_TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`text-left border rounded-sm overflow-hidden transition-all ${
                template === t.id ? "border-emerald-400 ring-2 ring-emerald-100" : "border-stone-200 hover:border-stone-300"
              }`}
            >
              <div className="aspect-[3/4] bg-stone-50 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <p className="text-xs font-bold text-stone-800">{t.name}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Generate actions */}
      <div className="flex gap-2">
        <button
          onClick={() => generate("pdf")}
          disabled={!!generating || resolving}
          className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 py-3 rounded-sm transition-colors"
        >
          {generating === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : done === "pdf" ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {generating === "pdf" ? "Generating PDF…" : "Download as PDF"}
        </button>
        <button
          onClick={() => generate("docx")}
          disabled={!!generating || resolving}
          className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-stone-700 border border-stone-300 hover:border-stone-400 disabled:opacity-60 py-3 rounded-sm transition-colors"
        >
          {generating === "docx" ? <Loader2 className="w-4 h-4 animate-spin" /> : done === "docx" ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          {generating === "docx" ? "Generating Word…" : "Download as Word"}
        </button>
      </div>
    </div>
  );
}







// "use client";
// // app/tools/ai-cv-analyser/_components/cv-export-studio.tsx
// // Self-contained: takes CV text in, renders template gallery, generates files out.
// // Does not import from or get imported by cv-dashboard.tsx or cv-analyser-tool.tsx internals —
// // only receives props and calls its own API routes.

// import React, { useState } from "react";
// import { motion } from "framer-motion";
// import { Download, FileText, Loader2, Check, Sparkles, AlertCircle } from "lucide-react";
// import { CV_TEMPLATES } from "@/lib/cv-templates";

// interface CVExportStudioProps {
//   cvText: string;
//   analysisId?: string;
//   jobTitle?: string;
//   companyName?: string;
//   onInsufficientTokens?: (info: { required: number; balance: number; toolName: string | null }) => void;
// }

// export function CVExportStudio({ cvText, analysisId, jobTitle, companyName, onInsufficientTokens }: CVExportStudioProps) {
//   const [selected, setSelected] = useState(CV_TEMPLATES[0].id);
//   const [generating, setGenerating] = useState<"pdf" | "docx" | null>(null);
//   const [error, setError] = useState("");
//   const [done, setDone] = useState<"pdf" | "docx" | null>(null);

//   const generate = async (format: "pdf" | "docx") => {
//     setGenerating(format); setError(""); setDone(null);
//     try {
//       const res = await fetch(`/api/tools/cv-analyser/export/${format}`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ cvText, templateId: selected, analysisId, jobTitle, companyName }),
//       });
//       if (res.status === 402) {
//         const data = await res.json();
//         onInsufficientTokens?.({ required: data.required ?? 0, balance: data.balance ?? 0, toolName: data.toolName ?? "CV Export" });
//         setGenerating(null);
//         return;
//       }
//       if (!res.ok) {
//         const data = await res.json().catch(() => ({}));
//         throw new Error(data.error ?? "Export failed");
//       }
//       const blob = await res.blob();
//       const url = URL.createObjectURL(blob);
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = `CV-${selected}.${format}`;
//       a.click();
//       URL.revokeObjectURL(url);
//       setDone(format);
//       setTimeout(() => setDone(null), 3000);
//     } catch (e: any) {
//       setError(e.message ?? "Export failed — please try again.");
//     }
//     setGenerating(null);
//   };

//   return (
//     <div className="space-y-5">
//       <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-sm px-4 py-3.5">
//         <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
//         <p className="text-xs text-emerald-700 leading-relaxed">
//           Pick a template below, then generate a ready-to-send PDF or an editable Word document from your CV.
//         </p>
//       </div>

//       {error && (
//         <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-sm">
//           <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
//         </div>
//       )}

//       {/* Template gallery */}
//       <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//         {CV_TEMPLATES.map((t) => (
//           <button
//             key={t.id}
//             onClick={() => setSelected(t.id)}
//             className={`text-left border rounded-sm overflow-hidden transition-all ${
//               selected === t.id ? "border-emerald-400 ring-2 ring-emerald-100" : "border-stone-200 hover:border-stone-300"
//             }`}
//           >
//             <div className="aspect-[3/4] bg-stone-50 flex items-center justify-center">
//               {/* eslint-disable-next-line @next/next/no-img-element */}
//               <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover" />
//             </div>
//             <div className="p-3">
//               <p className="text-xs font-bold text-stone-800">{t.name}</p>
//               <p className="text-[11px] text-stone-400 mt-0.5">{t.description}</p>
//             </div>
//           </button>
//         ))}
//       </div>

//       {/* Generate actions */}
//       <div className="flex gap-2">
//         <button
//           onClick={() => generate("pdf")}
//           disabled={!!generating}
//           className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 py-3 rounded-sm transition-colors"
//         >
//           {generating === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : done === "pdf" ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
//           {generating === "pdf" ? "Generating PDF…" : "Download as PDF"}
//         </button>
//         <button
//           onClick={() => generate("docx")}
//           disabled={!!generating}
//           className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-stone-700 border border-stone-300 hover:border-stone-400 disabled:opacity-60 py-3 rounded-sm transition-colors"
//         >
//           {generating === "docx" ? <Loader2 className="w-4 h-4 animate-spin" /> : done === "docx" ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
//           {generating === "docx" ? "Generating Word…" : "Download as Word"}
//         </button>
//       </div>
//     </div>
//   );
// }