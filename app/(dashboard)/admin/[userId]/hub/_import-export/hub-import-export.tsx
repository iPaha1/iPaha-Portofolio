"use client";

// =============================================================================
// isaacpaha.com — Developer Hub: Import / Export Panel
// components/admin/hub/import-export/hub-import-export.tsx
//
// Export: Download all (or filtered) entries as JSON or CSV
// Import: Upload JSON/CSV, preview parsed entries, confirm bulk create
// =============================================================================

import React, { useState, useRef } from "react";
import {
  Download, Upload, FileJson, FileText, Check, AlertCircle,
  Loader2, X, CheckSquare, Square,
} from "lucide-react";
import { TAB_CFG, type HubType, type HubEntry } from "../_shared/hub-types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportFormat = "json" | "csv";
type ImportRow = Partial<HubEntry> & { _valid: boolean; _errors: string[] };

// ─── Export panel ─────────────────────────────────────────────────────────────

function ExportPanel() {
  const [format,      setFormat]      = useState<ExportFormat>("json");
  const [selectedTypes, setSelectedTypes] = useState<Set<HubType>>(new Set());
  const [exporting,   setExporting]   = useState(false);
  const [exported,    setExported]    = useState(false);

  const ALL_TYPES = Object.entries(TAB_CFG)
    .filter(([k]) => k !== "search")
    .map(([, cfg]) => cfg.type!)
    .filter(Boolean);

  const toggleType = (t: HubType) => {
    setSelectedTypes((p) => {
      const n = new Set(p);
      if (p.has(t)) {
        n.delete(t);
      } else {
        n.add(t);
      }
      return n;
    });
  };

  const doExport = async () => {
    setExporting(true);
    try {
      const types = selectedTypes.size > 0 ? [...selectedTypes] : ALL_TYPES;
      const params = new URLSearchParams({ format, types: types.join(",") });
      const res = await fetch(`/api/admin/hub/export?${params}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `hub-export-${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      setExported(true);
      setTimeout(() => setExported(false), 2500);
    } catch (e: unknown) {
      alert((e as Error).message);
    }
    setExporting(false);
  };

  return (
    <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-stone-100">
        <Download className="w-4 h-4 text-emerald-500" />
        <p className="text-sm font-black text-stone-800">Export Knowledge Base</p>
      </div>
      <div className="p-5 space-y-5">

        {/* Format */}
        <div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Format</p>
          <div className="flex gap-3">
            {(["json", "csv"] as ExportFormat[]).map((f) => (
              <button key={f} onClick={() => setFormat(f)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-sm border text-sm font-semibold transition-colors ${
                  format === f
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-stone-200 text-stone-500 hover:border-stone-400"
                }`}>
                {f === "json" ? <FileJson className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-stone-400 mt-1.5">
            {format === "json" ? "Full fidelity — preserves all fields including JSON metadata (recommended)" : "Spreadsheet-friendly — main fields only, no nested JSON"}
          </p>
        </div>

        {/* Types */}
        <div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
            Entry types <span className="font-normal text-stone-300">(leave all unchecked to export everything)</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(TAB_CFG)
              .filter(([k]) => k !== "search")
              .map(([key, cfg]) => {
                if (!cfg.type) return null;
                const selected = selectedTypes.has(cfg.type);
                return (
                  <button key={key} onClick={() => toggleType(cfg.type!)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-sm border text-xs font-semibold transition-colors ${
                      selected
                        ? "border-current"
                        : "border-stone-200 text-stone-500 hover:border-stone-300"
                    }`}
                    style={selected ? { borderColor: cfg.color, backgroundColor: `${cfg.color}10`, color: cfg.color } : {}}>
                    <cfg.icon className="w-3.5 h-3.5" />
                    {cfg.label}
                    {selected && <Check className="w-3 h-3 ml-auto" />}
                  </button>
                );
              })}
          </div>
        </div>

        <button onClick={doExport} disabled={exporting}
          className="flex items-center gap-2 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-5 py-3 rounded-sm transition-colors disabled:opacity-60 w-full justify-center">
          {exporting  ? <Loader2 className="w-4 h-4 animate-spin" /> :
           exported   ? <Check   className="w-4 h-4" /> :
                        <Download className="w-4 h-4" />}
          {exporting ? "Exporting…" : exported ? "Downloaded!" : "Export"}
        </button>
      </div>
    </div>
  );
}

// ─── Import panel ─────────────────────────────────────────────────────────────

function ImportPanel() {
  const [stage,     setStage]     = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [rows,      setRows]      = useState<ImportRow[]>([]);
  const [selected,  setSelected]  = useState<Set<number>>(new Set());
  const [imported,  setImported]  = useState(0);
  const [errors,    setErrors]    = useState<string[]>([]);
  const [dragging,  setDragging]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseFile = async (file: File) => {
    const text = await file.text();
    const ext  = file.name.split(".").pop()?.toLowerCase();

    try {
      let parsed: ImportRow[] = [];

      if (ext === "json") {
        const data = JSON.parse(text);
        const arr  = Array.isArray(data) ? data : data.entries ?? [];
        parsed = arr.map((item: unknown) => {
          const entry = item as Partial<HubEntry>;
          return {
            ...entry,
            _valid:  !!entry.title && !!entry.content && !!entry.type,
            _errors: [
              !entry.title   ? "Missing title"   : "",
              !entry.content ? "Missing content" : "",
              !entry.type    ? "Missing type"    : "",
            ].filter(Boolean),
          };
        });
      } else if (ext === "csv") {
        const lines = text.split("\n").filter((l) => l.trim());
        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
        parsed = lines.slice(1).map((line) => {
          const values: Record<string, string> = {};
          // Simple CSV parse (handle quoted fields)
          const cells = line.match(/(".*?"|[^,]+)(?=,|$)/g) ?? [];
          headers.forEach((h, i) => {
            values[h] = (cells[i] ?? "").replace(/^"|"$/g, "").trim();
          });
          return {
            ...values,
            _valid:  !!values.title && !!values.content && !!values.type,
            _errors: [
              !values.title   ? "Missing title"   : "",
              !values.content ? "Missing content" : "",
              !values.type    ? "Missing type"    : "",
            ].filter(Boolean),
          } as ImportRow;
        });
      }

      setRows(parsed);
      setSelected(new Set(parsed.map((_, i) => i).filter((i) => parsed[i]._valid)));
      setStage("preview");
    } catch {
      setErrors(["Failed to parse file. Please check the format."]);
    }
  };

  const handleFile = (file: File) => {
    setErrors([]);
    parseFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const doImport = async () => {
    setStage("importing");
    const toImport = rows.filter((_, i) => selected.has(i));
    try {
      const res = await fetch("/api/admin/hub/import", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ entries: toImport }),
      });
      const data = await res.json();
      setImported(data.created ?? 0);
      setErrors(data.errors ?? []);
      setStage("done");
    } catch {
      setErrors(["Import failed. Please try again."]);
      setStage("preview");
    }
  };

  const reset = () => {
    setStage("upload"); setRows([]); setSelected(new Set());
    setImported(0); setErrors([]);
  };

  const toggleRow = (i: number) => {
    setSelected((p) => {
      const n = new Set(p);
      if (p.has(i)) {
        n.delete(i);
      } else {
        n.add(i);
      }
      return n;
    });
  };

  const validRows   = rows.filter((r) => r._valid).length;
  const invalidRows = rows.length - validRows;

  return (
    <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-stone-100">
        <Upload className="w-4 h-4 text-blue-500" />
        <p className="text-sm font-black text-stone-800">Import Entries</p>
      </div>
      <div className="p-5">

        {/* Upload stage */}
        {stage === "upload" && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-sm p-10 text-center cursor-pointer transition-all ${
                dragging
                  ? "border-blue-400 bg-blue-50"
                  : "border-stone-200 hover:border-stone-400 hover:bg-stone-50"
              }`}
            >
              <Upload className={`w-8 h-8 mx-auto mb-3 ${dragging ? "text-blue-500" : "text-stone-300"}`} />
              <p className="text-sm font-bold text-stone-600">Drop a file or click to browse</p>
              <p className="text-xs text-stone-400 mt-1">Supports JSON (from Hub Export) or CSV</p>
              <input ref={fileRef} type="file" accept=".json,.csv" className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </div>

            {errors.length > 0 && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 px-3 py-2.5 rounded-sm">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-red-600 space-y-0.5">
                  {errors.map((e, i) => <p key={i}>{e}</p>)}
                </div>
              </div>
            )}

            {/* Format reference */}
            <div className="bg-stone-50 border border-stone-200 rounded-sm p-4">
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Expected JSON format</p>
              <pre className="text-[11px] text-stone-600 font-mono leading-relaxed">{`[
  {
    "type": "SNIPPET",
    "title": "Prisma upsert pattern",
    "content": "await prisma.user.upsert({...})",
    "category": "Prisma",
    "tags": ["Prisma", "Database"],
    "language": "TYPESCRIPT"
  }
]`}</pre>
            </div>
          </div>
        )}

        {/* Preview stage */}
        {stage === "preview" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-stone-800">{rows.length} rows found</span>
                {validRows > 0   && <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-sm font-semibold">✓ {validRows} valid</span>}
                {invalidRows > 0 && <span className="text-[11px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-sm font-semibold">✗ {invalidRows} invalid</span>}
              </div>
              <button onClick={reset}
                className="ml-auto text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1.5 transition-colors">
                <X className="w-3.5 h-3.5" />Change file
              </button>
            </div>

            <div className="border border-stone-200 rounded-sm overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="w-8 px-3 py-2">
                      <button onClick={() => setSelected(selected.size === rows.filter((r) => r._valid).length ? new Set() : new Set(rows.map((_, i) => i).filter((i) => rows[i]._valid)))}>
                        {selected.size === validRows && validRows > 0
                          ? <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                          : <Square className="w-3.5 h-3.5 text-stone-300" />}
                      </button>
                    </th>
                    {["Type", "Title", "Category", "Status"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-black text-stone-500 uppercase text-[9px] tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rows.map((row, i) => {
                    const cfg = Object.values(TAB_CFG).find((c) => c.type === row.type);
                    return (
                      <tr key={i} className={`${row._valid ? "" : "opacity-50 bg-red-50/30"}`}>
                        <td className="px-3 py-2">
                          {row._valid && (
                            <button onClick={() => toggleRow(i)}>
                              {selected.has(i)
                                ? <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                                : <Square className="w-3.5 h-3.5 text-stone-300" />}
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {cfg ? (
                            <span className="flex items-center gap-1" style={{ color: cfg.color }}>
                              <cfg.icon className="w-3 h-3" />{cfg.label}
                            </span>
                          ) : <span className="text-red-500">{row.type ?? "?"}</span>}
                        </td>
                        <td className="px-3 py-2 font-semibold text-stone-700 max-w-[200px] truncate">{row.title ?? "—"}</td>
                        <td className="px-3 py-2 text-stone-500">{row.category ?? "—"}</td>
                        <td className="px-3 py-2">
                          {row._valid
                            ? <span className="text-emerald-600 font-semibold">Ready</span>
                            : <span className="text-red-500" title={row._errors.join(", ")}>⚠ {row._errors[0]}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button onClick={doImport} disabled={selected.size === 0}
              className="flex items-center gap-2 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 px-5 py-3 rounded-sm transition-colors disabled:opacity-50 w-full justify-center">
              <Upload className="w-4 h-4" />
              Import {selected.size} entr{selected.size === 1 ? "y" : "ies"}
            </button>
          </div>
        )}

        {/* Importing stage */}
        {stage === "importing" && (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
            <p className="text-sm text-stone-500">Importing entries…</p>
          </div>
        )}

        {/* Done stage */}
        {stage === "done" && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check className="w-7 h-7 text-emerald-600" />
              </div>
              <p className="text-base font-black text-stone-800">Import complete</p>
              <p className="text-sm text-stone-500">{imported} entr{imported === 1 ? "y" : "ies"} added to your knowledge base</p>
              {errors.length > 0 && (
                <div className="text-xs text-red-500 bg-red-50 border border-red-200 px-3 py-2 rounded-sm w-full">
                  {errors.length} row{errors.length === 1 ? "" : "s"} skipped: {errors[0]}
                </div>
              )}
            </div>
            <button onClick={reset}
              className="text-sm font-bold text-stone-600 border border-stone-200 px-5 py-3 rounded-sm hover:border-stone-400 transition-colors w-full">
              Import another file
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export function HubImportExport() {
  return (
    <div className="flex-1 overflow-y-auto p-5">
      <div className="max-w-2xl mx-auto space-y-5">
        <div>
          <h2 className="text-sm font-black text-stone-800 mb-1">Import & Export</h2>
          <p className="text-xs text-stone-400">Back up your knowledge base or migrate entries between environments.</p>
        </div>
        <ExportPanel />
        <ImportPanel />
      </div>
    </div>
  );
}