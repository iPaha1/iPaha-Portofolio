"use client";

// =============================================================================
// isaacpaha.com — Developer Hub: Editor Shell
// components/admin/hub/editors/editor-shell.tsx
//
// Wraps every type-specific editor with:
//   - Slide-in panel header (title, save button, preview link)
//   - Save/cancel logic via API
//   - Error display
//   - Loading states
// =============================================================================

import React, { useState } from "react";
import {
  ArrowLeft, Save, Check, Loader2, AlertCircle,
} from "lucide-react";
import { type HubEntry, type HubType, TAB_CFG } from "../_shared/hub-types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type EditorPayload = Omit<HubEntry,
  "id" | "isFavourite" | "isPinned" | "copyCount" | "viewCount" | "createdAt" | "updatedAt"
> & {
  isFavourite: boolean;
  isPinned:    boolean;
};

interface EditorShellProps {
  entry:       HubEntry | null;    // null = new
  defaultType: HubType;
  onSaved:     (saved: HubEntry) => void;
  onCancel:    () => void;
  children:    (props: {
    payload:    EditorPayload;
    setPayload: React.Dispatch<React.SetStateAction<EditorPayload>>;
    saving:     boolean;
  }) => React.ReactNode;
}

// ─── Default payload factory ──────────────────────────────────────────────────

function makeDefault(entry: HubEntry | null, defaultType: HubType): EditorPayload {
  if (entry) {
    return { ...entry };
  }
  return {
    type:            defaultType,
    title:           "",
    description:     null,
    content:         "",
    tags:            null,
    category:        null,
    isFavourite:     false,
    isPinned:        false,
    language:        null,
    framework:       null,
    aiModel:         null,
    exampleOutput:   null,
    errorMessage:    null,
    solution:        null,
    technology:      null,
    references:      null,
    difficulty:      null,
    httpMethod:      null,
    endpointUrl:     null,
    requestExample:  null,
    responseExample: null,
    apiHeaders:      null,
    authType:        null,
    advantages:      null,
    disadvantages:   null,
    useCases:        null,
    relatedTech:     null,
    diagramUrl:      null,
    templateType:    null,
    steps:           null,
    estimatedTime:   null,
    resourceUrl:     null,
    resourceType:    null,
    rating:          null,
    author:          null,
  };
}

// ─── EditorShell ─────────────────────────────────────────────────────────────

export function EditorShell({
  entry, defaultType, onSaved, onCancel, children,
}: EditorShellProps) {
  const isEdit = !!entry;
  const type   = entry?.type ?? defaultType;
  const cfg    = Object.values(TAB_CFG).find((c) => c.type === type);

  const [payload,  setPayload]  = useState<EditorPayload>(makeDefault(entry, defaultType));
  const [saving,   setSaving]   = useState(false);
  const [saveErr,  setSaveErr]  = useState("");
  const [savedOk,  setSavedOk]  = useState(false);

  const handleSave = async () => {
    if (!payload.title.trim() || !payload.content.trim()) {
      setSaveErr("Title and main content are required."); return;
    }
    setSaving(true); setSaveErr("");

    try {
      const body = { ...payload };
      let saved: HubEntry;

      if (isEdit && entry) {
        const res  = await fetch(`/api/admin/hub/${entry.id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Update failed");
        saved = await res.json();
      } else {
        const res  = await fetch("/api/admin/hub", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Create failed");
        const data = await res.json();
        saved = data.entry;
      }

      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
      onSaved(saved);
    } catch (e: unknown) {
      setSaveErr((e as Error).message ?? "Save failed");
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-stone-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-stone-100 flex-shrink-0 bg-white">
        <div className="flex items-center gap-2.5">
          <button onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          {cfg && (
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-sm flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${cfg.color}22` }}>
                {React.createElement(cfg.icon, { className: "w-3 h-3", style: { color: cfg.color } })}
              </span>
              <span className="text-sm font-black text-stone-800">
                {isEdit ? `Edit ${cfg.label.replace(/s$/, "")}` : `New ${cfg.label.replace(/s$/, "")}`}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEdit && entry?.type === "SNIPPET" && (
            <span className="text-[10px] text-stone-400 italic">ID: {entry.id.slice(0, 8)}…</span>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-sm transition-colors disabled:opacity-60 shadow-sm">
            {saving  ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
             savedOk ? <Check   className="w-3.5 h-3.5" /> :
                       <Save   className="w-3.5 h-3.5" />}
            {saving ? "Saving…" : savedOk ? "Saved!" : isEdit ? "Save Changes" : "Create"}
          </button>
        </div>
      </div>

      {/* Error */}
      {saveErr && (
        <div className="mx-5 mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2.5 rounded-sm flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{saveErr}
        </div>
      )}

      {/* Editor body — injected by each type-specific editor */}
      <div className="flex-1 overflow-y-auto">
        {children({ payload, setPayload, saving })}
      </div>
    </div>
  );
}

// ─── Shared editor field components used by all editors ───────────────────────

interface EditorFieldProps {
  label:       string;
  required?:   boolean;
  hint?:       string;
  children:    React.ReactNode;
}

export function EditorField({ label, required, hint, children }: EditorFieldProps) {
  return (
    <div>
      <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {hint && <span className="ml-2 text-stone-300 font-normal normal-case">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

export function EditorInput({
  value, onChange, placeholder, mono = false, list,
}: {
  value:       string;
  onChange:    (v: string) => void;
  placeholder?: string;
  mono?:        boolean;
  list?:        string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      list={list}
      className={`w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 ${mono ? "font-mono" : ""}`}
    />
  );
}

export function EditorTextarea({
  value, onChange, placeholder, rows = 6, mono = false, dark = false,
}: {
  value:       string;
  onChange:    (v: string) => void;
  placeholder?: string;
  rows?:        number;
  mono?:        boolean;
  dark?:        boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={`w-full text-sm border rounded-sm px-3 py-3 focus:outline-none focus:border-amber-400 resize-y leading-relaxed ${
        mono  ? "font-mono" : "font-sans"
      } ${
        dark
          ? "bg-stone-950 text-stone-200 border-stone-700"
          : "bg-white text-stone-800 border-stone-200"
      }`}
    />
  );
}

export function EditorSelect({
  value, onChange, children,
}: {
  value:    string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2.5 focus:outline-none focus:border-amber-400 bg-white"
    >
      {children}
    </select>
  );
}