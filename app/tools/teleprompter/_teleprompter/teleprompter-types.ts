// =============================================================================
// isaacpaha.com — Teleprompter — Shared Types & Constants
// app/tools/teleprompter/_teleprompter/types.ts
// =============================================================================

export interface TeleprompterSettings {
  scrollSpeed:    number;     // 1–20
  fontSize:       number;     // px
  fontFamily:     "SANS" | "SERIF" | "MONO";
  lineHeight:     number;     // e.g. 1.75
  textWidth:      number;     // % of stage width
  textColorHex:   string;
  bgColorHex:     string;
  focusLinePos:   number;     // % from top
  showFocusLine:  boolean;
  showEdgeFade:   boolean;
  useCountdown:   boolean;
  loopScript:     boolean;
  tapToPause:     boolean;
  wpm:            number;     // words per minute
}

export interface TeleprompterSession {
  scriptWordCount: number;
  durationSeconds: number;
  completed:       boolean;
  maxProgress:     number;    // 0–100
  speedUsed:       number;
  pauseCount:      number;
  restartCount:    number;
}

export interface ScriptStats {
  words:     number;
  chars:     number;
  lines:     number;
  readTime:  string;  // "4:32"
  totalSecs: number;
}

export const DEFAULT_SETTINGS: TeleprompterSettings = {
  scrollSpeed:    6,
  fontSize:       46,
  fontFamily:     "SANS",
  lineHeight:     1.75,
  textWidth:      80,
  textColorHex:   "#ffffff",
  bgColorHex:     "#000000",
  focusLinePos:   28,
  showFocusLine:  true,
  showEdgeFade:   true,
  useCountdown:   true,
  loopScript:     false,
  tapToPause:     true,
  wpm:            130,
};

export const FONT_CLASS_MAP: Record<TeleprompterSettings["fontFamily"], string> = {
  SANS:  "font-sans",
  SERIF: "font-serif",
  MONO:  "font-mono",
};

export const PRESET_THEMES = [
  { id: "BLACK_WHITE", label: "Studio",    text: "#ffffff", bg: "#000000" },
  { id: "BLACK_AMBER", label: "Warm",      text: "#fbbf24", bg: "#000000" },
  { id: "BLACK_GREEN", label: "Matrix",    text: "#86efac", bg: "#000000" },
  { id: "DARK_WHITE",  label: "Deep Dark", text: "#f0f0f0", bg: "#0d0d0d" },
  { id: "NAVY_WHITE",  label: "Navy",      text: "#e0f2fe", bg: "#0f172a" },
  { id: "PAPER",       label: "Paper",     text: "#1c1917", bg: "#fffbf0" },
] as const;

export const TEXT_COLORS = [
  { hex: "#ffffff", label: "White"       },
  { hex: "#fbbf24", label: "Amber"       },
  { hex: "#86efac", label: "Green"       },
  { hex: "#93c5fd", label: "Blue"        },
  { hex: "#f0abfc", label: "Purple"      },
  { hex: "#fda4af", label: "Rose"        },
  { hex: "#1c1917", label: "Black"       },
  { hex: "#292524", label: "Dark"        },
];

export const BG_COLORS = [
  { hex: "#000000", label: "Pure Black"  },
  { hex: "#0d0d0d", label: "Near Black"  },
  { hex: "#0f172a", label: "Navy"        },
  { hex: "#1a0a00", label: "Dark Amber"  },
  { hex: "#0a1a0a", label: "Dark Green"  },
  { hex: "#1a0a1a", label: "Dark Purple" },
  { hex: "#fffbf0", label: "Cream"       },
  { hex: "#f8fafc", label: "White"       },
];

export function calcStats(text: string, wpm: number): ScriptStats {
  const trimmed = text.trim();
  const words   = trimmed ? trimmed.split(/\s+/).length : 0;
  const chars   = text.length;
  const lines   = text.split("\n").length;
  const secs    = Math.round((words / wpm) * 60);
  const m       = Math.floor(secs / 60);
  const s       = secs % 60;
  return { words, chars, lines, readTime: `${m}:${String(s).padStart(2, "0")}`, totalSecs: secs };
}

export function renderScript(raw: string): string {
  if (!raw.trim()) return "Your script will appear here.\n\nPaste text in the editor above and press Launch.";
  return raw
    .replace(/\[PAUSE\]/g,   '<span class="tp-cue tp-cue-pause">⏸ PAUSE</span>')
    .replace(/\[BREATHE\]/g, '<span class="tp-cue tp-cue-breathe">↕ BREATHE</span>')
    .replace(/\[EMPHASIS\]/g,'<span class="tp-cue tp-cue-emphasis">★ EMPHASIS</span>')
    .replace(/\[SECTION\]/g, '<span class="tp-cue tp-cue-section">— SECTION —</span>');
}