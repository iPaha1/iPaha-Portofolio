"use client";

// =============================================================================
// isaacpaha.com — Developer Hub: Shared UI Atoms
// components/admin/hub/shared/ui-atoms.tsx
//
// ConfirmDialog   — modal confirm/cancel
// TagInput        — add/remove tag manager
// EntryMenu       — ⋯ dropdown for entry row actions
// FlagButtons     — Favourite + Pin toggles
// SectionLabel    — uppercase section label
// ProseBlock      — rendered plain text panel
// FieldRow        — label + value display row
// =============================================================================

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle, Loader2, X, Star, Pin,
  Edit2, Copy, Trash2, MoreHorizontal,
} from "lucide-react";

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open:          boolean;
  title:         string;
  message:       string;
  danger?:       boolean;
  confirmLabel?: string;
  onConfirm:     () => void;
  onCancel:      () => void;
  loading:       boolean;
}

export function ConfirmDialog({
  open, title, message, danger = false, confirmLabel = "Confirm",
  onConfirm, onCancel, loading,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
            className="bg-white rounded-sm border border-stone-100 shadow-2xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${danger ? "bg-red-50" : "bg-amber-50"}`}>
                <AlertCircle className={`w-4 h-4 ${danger ? "text-red-500" : "text-amber-500"}`} />
              </div>
              <div>
                <p className="text-sm font-black text-stone-900">{title}</p>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">{message}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={onCancel}
                className="text-xs font-semibold text-stone-500 border border-stone-200 px-4 py-2 rounded-sm hover:border-stone-400 transition-colors">
                Cancel
              </button>
              <button onClick={onConfirm} disabled={loading}
                className={`text-xs font-bold text-white px-4 py-2 rounded-sm transition-colors disabled:opacity-60 flex items-center gap-2 ${
                  danger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"
                }`}>
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Tag Input ────────────────────────────────────────────────────────────────
interface TagInputProps {
  tags?: unknown;                    // ← accept anything (safer than lying with string[])
  onChange: (newTags: string[]) => void;
}

export function TagInput({ tags: rawTags = [], onChange }: TagInputProps) {
  // Normalize to string[] immediately – prevents .map crash forever
  const tags: string[] = Array.isArray(rawTags)
    ? rawTags.filter((item): item is string => typeof item === "string" && item.trim() !== "")
    : [];

  const [input, setInput] = useState("");

  const addTag = () => {
    const newTag = input.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      onChange([...tags, newTag]);
    }
    setInput("");
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(t => t !== tagToRemove));
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 text-[11px] font-semibold bg-stone-100 text-stone-600 px-2.5 py-1 rounded-sm"
          >
            {t}
            <button
              onClick={() => removeTag(t)}
              className="hover:text-red-500 transition-colors"
              aria-label={`Remove tag ${t}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Add tag and press Enter…"
          className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
        />
        <button
          onClick={addTag}
          className="text-xs font-bold text-amber-600 border border-amber-200 px-3 py-2 rounded-sm hover:bg-amber-50 transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}

// ─── Entry Context Menu ───────────────────────────────────────────────────────

interface EntryMenuProps {
  isFavourite:      boolean;
  isPinned:         boolean;
  onEdit:           () => void;
  onDuplicate:      () => void;
  onToggleFav:      () => void;
  onTogglePin:      () => void;
  onDelete:         () => void;
}

export function EntryMenu({
  isFavourite, isPinned,
  onEdit, onDuplicate, onToggleFav, onTogglePin, onDelete,
}: EntryMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const items = [
    { label: "Edit",                                           icon: Edit2,       action: onEdit },
    { label: "Duplicate",                                      icon: Copy,        action: onDuplicate },
    { label: isFavourite ? "Unfavourite" : "Favourite",       icon: Star,        action: onToggleFav },
    { label: isPinned    ? "Unpin"       : "Pin to top",      icon: Pin,         action: onTogglePin },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-7 h-7 flex items-center justify-center text-stone-300 hover:text-stone-600 rounded-sm hover:bg-stone-100 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-8 z-20 w-44 bg-white border border-stone-200 rounded-sm shadow-xl overflow-hidden"
          >
            {items.map((m) => (
              <button key={m.label}
                onClick={() => { m.action(); setOpen(false); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors">
                <m.icon className="w-3.5 h-3.5 text-stone-400" />{m.label}
              </button>
            ))}
            <div className="border-t border-stone-100" />
            <button
              onClick={() => { onDelete(); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Flag Buttons (Favourite + Pin) ───────────────────────────────────────────

interface FlagButtonsProps {
  isFavourite: boolean;
  isPinned:    boolean;
  onToggleFav: () => void;
  onTogglePin: () => void;
}

export function FlagButtons({ isFavourite, isPinned, onToggleFav, onTogglePin }: FlagButtonsProps) {
  return (
    <div className="flex gap-2">
      <button onClick={onToggleFav}
        className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-sm border transition-colors ${
          isFavourite ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-stone-50 text-stone-400 border-stone-200 hover:border-amber-300"
        }`}>
        <Star className={`w-3.5 h-3.5 ${isFavourite ? "fill-amber-400 text-amber-400" : ""}`} />
        {isFavourite ? "Favourited" : "Favourite"}
      </button>
      <button onClick={onTogglePin}
        className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-sm border transition-colors ${
          isPinned ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-stone-50 text-stone-400 border-stone-200 hover:border-blue-300"
        }`}>
        <Pin className={`w-3.5 h-3.5 ${isPinned ? "text-blue-500" : ""}`} />
        {isPinned ? "Pinned" : "Pin to top"}
      </button>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">
      {children}
    </p>
  );
}

// ─── Prose Block ──────────────────────────────────────────────────────────────

export function ProseBlock({
  content, className,
}: { content: string; className?: string }) {
  return (
    <div className={`bg-stone-50 border border-stone-200 rounded-sm p-3 ${className ?? ""}`}>
      <pre className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed font-sans">
        {content}
      </pre>
    </div>
  );
}

// ─── Field Row ────────────────────────────────────────────────────────────────

export function FieldRow({
  label, value, mono = false,
}: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex gap-3 py-1.5 border-b border-stone-50 last:border-0">
      <span className="text-[11px] text-stone-400 w-28 flex-shrink-0">{label}</span>
      <span className={`text-[11px] text-stone-700 font-semibold ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

// ─── Category Quick-Chips ────────────────────────────────────────────────────

interface CategoryChipsProps {
  suggestions: string[];
  current:     string;
  onSelect:    (c: string) => void;
}

export function CategoryChips({ suggestions, current, onSelect }: CategoryChipsProps) {
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {suggestions.slice(0, 8).map((c) => (
        <button key={c} onClick={() => onSelect(c)}
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm border transition-colors ${
            current === c
              ? "border-amber-300 bg-amber-50 text-amber-700"
              : "border-stone-200 text-stone-400 hover:border-amber-300 hover:text-amber-600"
          }`}>
          {c}
        </button>
      ))}
    </div>
  );
}