"use client";

// =============================================================================
// isaacpaha.com — Blog Rich Text Toolbar
// components/admin/blog/rich-text-toolbar.tsx
// =============================================================================

import React from "react";
import {
  Bold, Italic, Code, Link2, Quote, List, ListOrdered, Heading2,
  Heading3, Image, Minus, Table, AlertCircle, Highlighter,
 
} from "lucide-react";

interface ToolbarProps {
  onInsert: (markdown: string, cursorOffset?: number) => void;
  onWrap:   (prefix: string, suffix: string) => void;
}

type FormatGroup = {
  label:   string;
  items:   FormatItem[];
};

type FormatItem = {
  label:   string;
  icon:    React.ElementType;
  action:  (props: { onInsert: ToolbarProps["onInsert"]; onWrap: ToolbarProps["onWrap"] }) => void;
  tooltip: string;
  shortcut?: string;
};

const FORMAT_GROUPS: FormatGroup[] = [
  {
    label: "Text",
    items: [
      {
        label: "Bold", icon: Bold, tooltip: "Bold", shortcut: "⌘B",
        action: ({ onWrap }) => onWrap("**", "**"),
      },
      {
        label: "Italic", icon: Italic, tooltip: "Italic", shortcut: "⌘I",
        action: ({ onWrap }) => onWrap("*", "*"),
      },
      {
        label: "Highlight", icon: Highlighter, tooltip: "Highlight",
        action: ({ onWrap }) => onWrap("==", "=="),
      },
      {
        label: "Inline code", icon: Code, tooltip: "Inline code", shortcut: "⌘`",
        action: ({ onWrap }) => onWrap("`", "`"),
      },
      {
        label: "Link", icon: Link2, tooltip: "Link", shortcut: "⌘K",
        action: ({ onWrap }) => onWrap("[", "](https://)"),
      },
    ],
  },
  {
    label: "Headings",
    items: [
      {
        label: "H2 Heading", icon: Heading2, tooltip: "H2 Section heading",
        action: ({ onInsert }) => onInsert("\n## "),
      },
      {
        label: "H3 Heading", icon: Heading3, tooltip: "H3 Sub-heading",
        action: ({ onInsert }) => onInsert("\n### "),
      },
    ],
  },
  {
    label: "Blocks",
    items: [
      {
        label: "Blockquote", icon: Quote, tooltip: "Blockquote",
        action: ({ onInsert }) => onInsert("\n> "),
      },
      {
        label: "Bullet list", icon: List, tooltip: "Bullet list",
        action: ({ onInsert }) => onInsert("\n- "),
      },
      {
        label: "Numbered list", icon: ListOrdered, tooltip: "Numbered list",
        action: ({ onInsert }) => onInsert("\n1. "),
      },
      {
        label: "Divider", icon: Minus, tooltip: "Horizontal divider",
        action: ({ onInsert }) => onInsert("\n\n---\n\n"),
      },
      {
        label: "Code block", icon: Code, tooltip: "Code block",
        action: ({ onInsert }) => onInsert("\n```typescript\n\n```\n", -5),
      },
    ],
  },
  {
    label: "Media",
    items: [
      {
        label: "Image", icon: Image, tooltip: "Insert image",
        action: ({ onInsert }) => onInsert("\n![Alt text](https://)\n"),
      },
    ],
  },
  {
    label: "Special",
    items: [
      {
        label: "Callout", icon: AlertCircle, tooltip: "Callout box",
        action: ({ onInsert }) => onInsert("\n> **Note:** "),
      },
      {
        label: "Table", icon: Table, tooltip: "Insert table",
        action: ({ onInsert }) => onInsert(
          "\n| Column 1 | Column 2 | Column 3 |\n|----------|----------|----------|\n| Cell 1   | Cell 2   | Cell 3   |\n"
        ),
      },
    ],
  },
];

export function RichTextToolbar({ onInsert, onWrap }: ToolbarProps) {
//   const [activeGroup, setActiveGroup] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-stone-200 bg-stone-50/60 flex-wrap">
      {FORMAT_GROUPS.map((group) => (
        <div key={group.label} className="flex items-center gap-0.5">
          {group.items.map((item) => (
            <button
              key={item.label}
              onClick={() => item.action({ onInsert, onWrap })}
              title={`${item.tooltip}${item.shortcut ? ` (${item.shortcut})` : ""}`}
              className="group relative w-7 h-7 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-white rounded-sm transition-colors border border-transparent hover:border-stone-200"
            >
              <item.icon className="w-3.5 h-3.5" />
              {/* Tooltip */}
              <span className="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold bg-stone-900 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                {item.tooltip}
                {item.shortcut && <span className="ml-1 text-stone-400">{item.shortcut}</span>}
              </span>
            </button>
          ))}
          <div className="w-px h-4 bg-stone-200 mx-1" />
        </div>
      ))}

      {/* Word count hint */}
      <div className="ml-auto flex items-center gap-1">
        <span className="text-[10px] text-stone-400">Markdown</span>
      </div>
    </div>
  );
}

// ─── Keyboard shortcut handler hook ──────────────────────────────────────────

export function useEditorShortcuts(
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  onChange: (value: string) => void
) {
  const insertAtCursor = (markdown: string, cursorOffset = 0) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const value = el.value;
    const before = value.slice(0, start);
    const after  = value.slice(end);
    const newVal = before + markdown + after;
    onChange(newVal);
    setTimeout(() => {
      const pos = start + markdown.length + cursorOffset;
      el.focus();
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  const wrapSelection = (prefix: string, suffix: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start    = el.selectionStart;
    const end      = el.selectionEnd;
    const selected = el.value.slice(start, end);
    const newText  = prefix + (selected || "text") + suffix;
    const value    = el.value;
    const newVal   = value.slice(0, start) + newText + value.slice(end);
    onChange(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected || "text").length);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    if (e.key === "b") { e.preventDefault(); wrapSelection("**", "**"); }
    if (e.key === "i") { e.preventDefault(); wrapSelection("*", "*"); }
    if (e.key === "`") { e.preventDefault(); wrapSelection("`", "`"); }
    if (e.key === "k") { e.preventDefault(); wrapSelection("[", "](https://)"); }
    // Tab indent
    if (e.key === "Tab") {
      e.preventDefault();
      insertAtCursor("  ");
    }
  };

  return { insertAtCursor, wrapSelection, handleKeyDown };
}