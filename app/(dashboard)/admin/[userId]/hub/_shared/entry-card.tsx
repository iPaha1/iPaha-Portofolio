"use client";

// =============================================================================
// isaacpaha.com — Developer Hub: Entry Card Shell
// components/admin/hub/shared/entry-card.tsx
//
// Universal card shell: header with checkbox, type icon, title, meta badges,
// copy button, expand toggle, and context menu. The expanded body is
// type-specific and injected via CardBody dispatcher.
// =============================================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star, Copy, CheckSquare, Square, ChevronDown,
} from "lucide-react";
import { EntryMenu } from "./ui-atoms";
import { CopyBtn } from "./copy-button";
import { CardBody } from "../_cards/card-bodies";
import {
  TAB_CFG, LANG_LABELS, LANG_COLOR, HTTP_METHOD_COLOR, RESOURCE_TYPE_CFG,
  parseTags, fmtDate, type HubEntry, type ResourceType,
} from "../_shared/hub-types";

// ─── Helper: get the primary copy content for a type ─────────────────────────

function getPrimaryContent(entry: HubEntry): string {
  switch (entry.type) {
    case "ERROR":    return entry.solution   ?? entry.content;
    case "RESOURCE": return entry.resourceUrl ?? entry.content;
    case "API":      return entry.endpointUrl ?? entry.content;
    default:         return entry.content;
  }
}

// ─── Type-specific inline meta badges ────────────────────────────────────────

function TypeMeta({ entry }: { entry: HubEntry }) {
  switch (entry.type) {
    case "SNIPPET": {
      const color = LANG_COLOR[entry.language ?? ""] ?? LANG_COLOR.DEFAULT;
      return (
        <>
          {entry.language && entry.language !== "PLAINTEXT" && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
              style={{ color, backgroundColor: `${color}20` }}>
              {LANG_LABELS[entry.language]}
            </span>
          )}
          {entry.framework && (
            <span className="text-[10px] text-stone-400 bg-stone-50 border border-stone-200 px-1.5 py-0.5 rounded-sm">
              {entry.framework}
            </span>
          )}
        </>
      );
    }
    case "PROMPT": {
      return entry.aiModel ? (
        <span className="text-[10px] font-semibold bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-sm flex items-center gap-1">
          ✦ {entry.aiModel}
        </span>
      ) : null;
    }
    case "ERROR": {
      return entry.technology ? (
        <span className="text-[10px] bg-red-50 border border-red-200 text-red-500 px-1.5 py-0.5 rounded-sm">
          {entry.technology}
        </span>
      ) : null;
    }
    case "NOTE": {
      return entry.difficulty ? (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
          entry.difficulty === "Beginner"     ? "bg-emerald-50 text-emerald-700" :
          entry.difficulty === "Intermediate" ? "bg-amber-50 text-amber-700" :
          "bg-red-50 text-red-700"
        }`}>
          {entry.difficulty}
        </span>
      ) : null;
    }
    case "API": {
      const method = entry.httpMethod ?? "GET";
      const color  = HTTP_METHOD_COLOR[method] ?? "#6b7280";
      return (
        <>
          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm"
            style={{ color, backgroundColor: `${color}20` }}>
            {method}
          </span>
          {entry.endpointUrl && (
            <span className="text-[10px] font-mono text-stone-400 max-w-[180px] truncate">
              {entry.endpointUrl}
            </span>
          )}
        </>
      );
    }
    case "TEMPLATE": {
      return entry.templateType ? (
        <span className="text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-sm">
          {entry.templateType}
        </span>
      ) : null;
    }
    case "PLAYBOOK": {
      return entry.estimatedTime ? (
        <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">
          ⏱ {entry.estimatedTime}
        </span>
      ) : null;
    }
    case "RESOURCE": {
      const resType = (entry.resourceType ?? "OTHER") as ResourceType;
      const cfg = RESOURCE_TYPE_CFG[resType];
      return (
        <>
          <span className="text-[10px] font-bold bg-lime-50 text-lime-700 border border-lime-200 px-1.5 py-0.5 rounded-sm">
            {cfg?.emoji} {cfg?.label}
          </span>
          {entry.rating && (
            <span className="text-[10px] text-amber-500">{"⭐".repeat(entry.rating)}</span>
          )}
        </>
      );
    }
    default: return null;
  }
}

// ─── Entry Card ───────────────────────────────────────────────────────────────

interface EntryCardProps {
  entry:       HubEntry;
  selected:    boolean;
  onSelect:    (id: string) => void;
  onEdit:      (entry: HubEntry) => void;
  onDelete:    (id: string, title: string) => void;
  onToggleFav: (id: string) => void;
  onTogglePin: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function EntryCard({
  entry, selected, onSelect, onEdit, onDelete, onToggleFav, onTogglePin, onDuplicate,
}: EntryCardProps) {
  const [expanded, setExpanded] = useState(false);
  const tags    = parseTags(entry.tags);
  const typeCfg = Object.values(TAB_CFG).find((c) => c.type === entry.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.16 }}
      className={`border rounded-sm overflow-hidden transition-colors ${
        entry.isPinned
          ? "border-blue-200 bg-blue-50/20"
          : selected
          ? "border-amber-300 bg-amber-50/20"
          : "bg-white border-stone-200 hover:border-stone-300"
      }`}
    >
      {/* ── Card header ─────────────────────────────────────────────────── */}
      <div className="flex items-start gap-2.5 p-3.5">

        {/* Checkbox */}
        <button onClick={() => onSelect(entry.id)} className="flex-shrink-0 mt-0.5">
          {selected
            ? <CheckSquare className="w-4 h-4 text-amber-500" />
            : <Square className="w-4 h-4 text-stone-200 hover:text-stone-400 transition-colors" />}
        </button>

        {/* Type icon pill */}
        {typeCfg && (
          <div className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-sm flex items-center justify-center"
            style={{ backgroundColor: `${typeCfg.color}18` }}>
            <typeCfg.icon className="w-3.5 h-3.5" style={{ color: typeCfg.color }} />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onEdit(entry)}
              className="text-sm font-bold text-stone-800 hover:text-amber-600 transition-colors text-left leading-snug"
            >
              {entry.title}
            </button>
            {entry.isPinned && (
              <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex-shrink-0">
                Pinned
              </span>
            )}
            {entry.isFavourite && (
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
            )}
          </div>

          {/* Description */}
          {entry.description && (
            <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{entry.description}</p>
          )}

          {/* Meta badges row */}
          <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
            {entry.category && (
              <span className="text-[10px] font-semibold bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-sm">
                {entry.category}
              </span>
            )}
            <TypeMeta entry={entry} />
            {tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] text-stone-400 px-1.5 py-0.5 rounded-sm border border-stone-100">
                {t}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[10px] text-stone-300">+{tags.length - 3}</span>
            )}
            <span className="text-[10px] text-stone-300">·</span>
            <span className="text-[10px] text-stone-300">{fmtDate(entry.updatedAt)}</span>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {entry.copyCount > 0 && (
            <span className="text-[10px] text-stone-400 flex items-center gap-0.5 mr-1">
              <Copy className="w-2.5 h-2.5" />{entry.copyCount}
            </span>
          )}

          {/* Main copy */}
          <CopyBtn text={getPrimaryContent(entry)} entryId={entry.id} size="sm" />

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded((p) => !p)}
            className={`w-7 h-7 flex items-center justify-center rounded-sm transition-colors ${
              expanded ? "text-stone-600 bg-stone-100" : "text-stone-300 hover:text-stone-600 hover:bg-stone-100"
            }`}
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
          </button>

          {/* ⋯ menu */}
          <EntryMenu
            isFavourite={entry.isFavourite}
            isPinned={entry.isPinned}
            onEdit={() => onEdit(entry)}
            onDuplicate={() => onDuplicate(entry.id)}
            onToggleFav={() => onToggleFav(entry.id)}
            onTogglePin={() => onTogglePin(entry.id)}
            onDelete={() => onDelete(entry.id, entry.title)}
          />
        </div>
      </div>

      {/* ── Expanded body ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-stone-100"
          >
            <div className="p-3.5 pt-3">
              <CardBody entry={entry} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}