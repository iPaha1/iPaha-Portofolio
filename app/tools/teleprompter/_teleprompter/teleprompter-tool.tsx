"use client";

// =============================================================================
// isaacpaha.com — Teleprompter — Main Tool Component
// app/tools/teleprompter/_teleprompter/teleprompter-tool.tsx
//
// Orchestrates: ScriptEditor + TeleprompterEngine + SettingsPanel
// Handles: settings state, session reporting, auto-save
// =============================================================================

import React, { useState, useCallback, useEffect } from "react";
import {
  Play, Settings, FlipHorizontal, FlipVertical,
  Minus, Plus, Type, Info, Check, Loader2,
} from "lucide-react";


import {
  TeleprompterSettings, TeleprompterSession, DEFAULT_SETTINGS, calcStats,
} from "./teleprompter-types";
import { ScriptEditor } from "./teleprompter-script-editor";
import { TeleprompterEngine } from "./teleprompter-engine";
import { SettingsPanel } from "./teleprompter-settings-panel";


const ACCENT = "#14b8a6";

interface TeleprompterToolProps {
  isSignedIn:    boolean;
  savedSettings: Partial<TeleprompterSettings> & {
    lastScript?:     string | null;
    lastScriptName?: string | null;
  } | null;
}

export function TeleprompterTool({ isSignedIn, savedSettings }: TeleprompterToolProps) {
  // Settings state (merged from DB + defaults)
  const [settings, setSettings] = useState<TeleprompterSettings>({
    ...DEFAULT_SETTINGS,
    ...(savedSettings ? {
      scrollSpeed:   savedSettings.scrollSpeed  ?? DEFAULT_SETTINGS.scrollSpeed,
      fontSize:      savedSettings.fontSize     ?? DEFAULT_SETTINGS.fontSize,
      fontFamily:    savedSettings.fontFamily   ?? DEFAULT_SETTINGS.fontFamily,
      lineHeight:    savedSettings.lineHeight   ?? DEFAULT_SETTINGS.lineHeight,
      textWidth:     savedSettings.textWidth    ?? DEFAULT_SETTINGS.textWidth,
      textColorHex:  savedSettings.textColorHex ?? DEFAULT_SETTINGS.textColorHex,
      bgColorHex:    savedSettings.bgColorHex   ?? DEFAULT_SETTINGS.bgColorHex,
      focusLinePos:  savedSettings.focusLinePos ?? DEFAULT_SETTINGS.focusLinePos,
      showFocusLine: savedSettings.showFocusLine ?? DEFAULT_SETTINGS.showFocusLine,
      showEdgeFade:  savedSettings.showEdgeFade  ?? DEFAULT_SETTINGS.showEdgeFade,
      useCountdown:  savedSettings.useCountdown  ?? DEFAULT_SETTINGS.useCountdown,
      loopScript:    savedSettings.loopScript    ?? DEFAULT_SETTINGS.loopScript,
      tapToPause:    savedSettings.tapToPause    ?? DEFAULT_SETTINGS.tapToPause,
      wpm:           savedSettings.wpm           ?? DEFAULT_SETTINGS.wpm,
    } : {}),
  });

  // Script state
  const [script,     setScript]     = useState(savedSettings?.lastScript     ?? "");
  const [scriptName, setScriptName] = useState(savedSettings?.lastScriptName ?? "Untitled script");

  // UI state
  const [tpOpen,       setTpOpen]       = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mirror,       setMirror]       = useState(false);
  const [flipV,        setFlipV]        = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [lastAutoSave,   setLastAutoSave]   = useState<Date | null>(null);

  const stats = calcStats(script, settings.wpm);

  // ── Patch settings helper ────────────────────────────────────────────
  const patchSettings = useCallback((patch: Partial<TeleprompterSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }));
  }, []);

  // ── Auto-save script for signed-in users (debounced) ─────────────────
  useEffect(() => {
    if (!isSignedIn || !script.trim()) return;
    const timer = setTimeout(async () => {
      try {
        await fetch("/api/tools/teleprompter/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...settings,
            lastScript:     script,
            lastScriptName: scriptName,
          }),
        });
        setLastAutoSave(new Date());
      } catch {}
    }, 3000);
    return () => clearTimeout(timer);
  }, [script, scriptName, isSignedIn]);

  // ── Save settings to DB ───────────────────────────────────────────────
  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await fetch("/api/tools/teleprompter/settings", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...settings,
          lastScript:     script,
          lastScriptName: scriptName,
        }),
      });
    } catch {}
    setSavingSettings(false);
  };

  // ── Handle session end (from teleprompter engine) ─────────────────────
  const handleSessionEnd = useCallback(async (session: TeleprompterSession) => {
    setTpOpen(false);
    if (session.durationSeconds >= 5) {
      try {
        await fetch("/api/tools/teleprompter/session", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(session),
        });
      } catch {}
    }
  }, []);

  // ── Launch teleprompter ────────────────────────────────────────────────
  const launch = () => {
    if (!script.trim()) return;
    setTpOpen(true);
  };

  const TB_BTN = "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all border";

  return (
    <div className="flex flex-col" style={{ height: "100%", minHeight: 520, fontFamily: "Sora, sans-serif" }}>

      {/* ── Control strip (full-width, cinematic dark) ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap flex-shrink-0"
        style={{ background: "#0d0d0d", borderBottom: "1px solid #1f1f1f" }}>

        {/* Speed */}
        <div className="flex items-center gap-1.5 pr-3" style={{ borderRight: "1px solid #1f1f1f" }}>
          <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: "#444" }}>Speed</span>
          <button onClick={() => patchSettings({ scrollSpeed: Math.max(1, settings.scrollSpeed - 1) })}
            className={TB_BTN} style={{ background: "#1a1a1a", borderColor: "#2a2a2a", color: "#888", padding: "5px 9px" }}>
            <Minus size={12} />
          </button>
          <span className="text-sm font-black min-w-[20px] text-center" style={{ color: ACCENT }}>{settings.scrollSpeed}</span>
          <button onClick={() => patchSettings({ scrollSpeed: Math.min(20, settings.scrollSpeed + 1) })}
            className={TB_BTN} style={{ background: "#1a1a1a", borderColor: "#2a2a2a", color: "#888", padding: "5px 9px" }}>
            <Plus size={12} />
          </button>
          <input type="range" min={1} max={20} value={settings.scrollSpeed} step={1}
            onChange={e => patchSettings({ scrollSpeed: Number(e.target.value) })}
            className="w-20 h-1 rounded-full outline-none cursor-pointer ml-1"
            style={{ accentColor: ACCENT }} />
        </div>

        {/* Font size */}
        <div className="flex items-center gap-1.5 pr-3" style={{ borderRight: "1px solid #1f1f1f" }}>
          <Type size={12} style={{ color: "#444" }} />
          <input type="range" min={18} max={88} value={settings.fontSize} step={2}
            onChange={e => patchSettings({ fontSize: Number(e.target.value) })}
            className="w-20 h-1 rounded-full outline-none cursor-pointer"
            style={{ accentColor: ACCENT }} />
          <span className="text-xs font-bold" style={{ color: ACCENT }}>{settings.fontSize}px</span>
        </div>

        {/* Mirror / Flip — visual transforms on stage */}
        <div className="flex items-center gap-1.5 pr-3" style={{ borderRight: "1px solid #1f1f1f" }}>
          <button onClick={() => setMirror(p => !p)}
            className={TB_BTN}
            style={{
              background: mirror ? ACCENT : "#1a1a1a",
              borderColor: mirror ? ACCENT : "#2a2a2a",
              color: mirror ? "#000" : "#888",
            }}>
            <FlipHorizontal size={13} />Mirror
          </button>
          <button onClick={() => setFlipV(p => !p)}
            className={TB_BTN}
            style={{
              background: flipV ? ACCENT : "#1a1a1a",
              borderColor: flipV ? ACCENT : "#2a2a2a",
              color: flipV ? "#000" : "#888",
            }}>
            <FlipVertical size={13} />Flip V
          </button>
        </div>

        {/* Settings */}
        <button onClick={() => setSettingsOpen(true)}
          className={TB_BTN}
          style={{ background: "#1a1a1a", borderColor: "#2a2a2a", color: "#888" }}>
          <Settings size={13} />Settings
        </button>

        {/* Auto-save indicator */}
        {isSignedIn && lastAutoSave && (
          <span className="text-[10px] flex items-center gap-1" style={{ color: "#333" }}>
            <Check size={10} style={{ color: "#10b981" }} />
            Saved {lastAutoSave.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}

        {/* Launch button */}
        <button onClick={launch} disabled={!script.trim()}
          className="ml-auto flex items-center gap-2 text-sm font-black px-5 py-2 rounded-lg transition-all disabled:opacity-30"
          style={{ background: script.trim() ? ACCENT : "#1f1f1f", color: "#000", border: "none" }}>
          <Play size={15} fill="currentColor" />
          Launch Teleprompter
        </button>
      </div>

      {/* ── Script editor ── */}
      <div className="flex-1 overflow-hidden" style={{
        transform: `scaleX(${mirror ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
      }}>
        <ScriptEditor
          script={script}
          scriptName={scriptName}
          wpm={settings.wpm}
          onChange={setScript}
          onNameChange={setScriptName}
        />
      </div>

      {/* ── Empty state call to action ── */}
      {!script.trim() && (
        <div className="flex-shrink-0 px-6 py-4 flex items-center gap-3"
          style={{ background: "#0a0a0a", borderTop: "1px solid #1a1a1a" }}>
          <Info size={14} style={{ color: "#444", flexShrink: 0 }} />
          <p className="text-xs" style={{ color: "#444" }}>
            Paste or type your script above, then click <span style={{ color: ACCENT, fontWeight: 700 }}>Launch Teleprompter</span> to start reading.
            {isSignedIn ? " Your script auto-saves to your account." : " Sign in to save your settings and last script."}
          </p>
        </div>
      )}

      {/* ── Teleprompter engine (fullscreen overlay) ── */}
      {tpOpen && (
        <TeleprompterEngine
          script={script}
          settings={settings}
          totalSecs={stats.totalSecs}
          onExit={handleSessionEnd}
        />
      )}

      {/* ── Settings panel ── */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={patchSettings}
        isSignedIn={isSignedIn}
        onSave={isSignedIn ? saveSettings : undefined}
      />
    </div>
  );
}