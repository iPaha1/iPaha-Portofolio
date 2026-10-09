"use client";

// =============================================================================
// isaacpaha.com — Teleprompter — Settings Panel Component
// app/tools/teleprompter/_teleprompter/settings-panel.tsx
// =============================================================================

import React, { useState }        from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Save, Loader2  } from "lucide-react";
import {
  TeleprompterSettings,
  PRESET_THEMES, TEXT_COLORS, BG_COLORS,
} from "./teleprompter-types";


interface SettingsPanelProps {
  open:        boolean;
  onClose:     () => void;
  settings:    TeleprompterSettings;
  onChange:    (patch: Partial<TeleprompterSettings>) => void;
  isSignedIn:  boolean;
  onSave?:     () => Promise<void>;
}

const ACCENT = "#14b8a6";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} type="button"
      className="relative flex-shrink-0 transition-colors rounded-full"
      style={{ width: 40, height: 22, background: checked ? ACCENT : "#333" }}>
      <span className="absolute top-[3px] transition-all rounded-full"
        style={{ width: 16, height: 16, background: "#fff", left: checked ? 21 : 3 }} />
    </button>
  );
}

function SliderRow({
  label, min, max, value, step = 1, unit = "",
  onChange,
}: { label: string; min: number; max: number; value: number; step?: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm" style={{ color: "#ccc" }}>{label}</span>
      <div className="flex items-center gap-2">
        <input type="range" min={min} max={max} value={value} step={step}
          onChange={e => onChange(Number(e.target.value))}
          className="w-28 h-1 rounded-full outline-none cursor-pointer"
          style={{ accentColor: ACCENT }}
        />
        <span className="text-xs font-bold w-14 text-right" style={{ color: ACCENT }}>
          {typeof value === "number" && !Number.isInteger(value) ? value.toFixed(2) : value}{unit}
        </span>
      </div>
    </div>
  );
}

export function SettingsPanel({ open, onClose, settings, onChange, isSignedIn, onSave }: SettingsPanelProps) {
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    await onSave();
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,.8)" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={e => e.target === e.currentTarget && onClose()}>

          <motion.div
            initial={{ opacity: 0, y: 20, scale: .97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: .97 }}
            transition={{ duration: .2 }}
            className="relative rounded-xl overflow-y-auto"
            style={{ background: "#141414", border: "1px solid #2a2a2a", width: "min(480px,94vw)", maxHeight: "88vh", fontFamily: "Sora, sans-serif" }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
              style={{ background: "#141414", borderBottom: "1px solid #1f1f1f" }}>
              <span className="text-sm font-black text-white">Teleprompter Settings</span>
              <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pb-6 space-y-6 pt-4">

              {/* Preset Themes */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color: "#555" }}>Quick Themes</p>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_THEMES.map(t => {
                    const active = settings.textColorHex === t.text && settings.bgColorHex === t.bg;
                    return (
                      <button key={t.id}
                        onClick={() => onChange({ textColorHex: t.text, bgColorHex: t.bg })}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all"
                        style={{
                          background: t.bg, color: t.text,
                          border: active ? `2px solid ${ACCENT}` : "1px solid #2a2a2a",
                        }}>
                        {active && <Check size={11} />}
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Colour */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color: "#555" }}>Text Colour</p>
                <div className="flex flex-wrap gap-2">
                  {TEXT_COLORS.map(c => (
                    <button key={c.hex}
                      onClick={() => onChange({ textColorHex: c.hex })}
                      title={c.label}
                      className="w-8 h-8 rounded-lg transition-all"
                      style={{
                        background: c.hex,
                        border: settings.textColorHex === c.hex ? `2px solid ${ACCENT}` : "1px solid #333",
                        boxShadow: settings.textColorHex === c.hex ? `0 0 0 1px ${ACCENT}` : "none",
                      }} />
                  ))}
                </div>
              </div>

              {/* Background Colour */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color: "#555" }}>Background</p>
                <div className="flex flex-wrap gap-2">
                  {BG_COLORS.map(c => (
                    <button key={c.hex}
                      onClick={() => onChange({ bgColorHex: c.hex })}
                      title={c.label}
                      className="w-8 h-8 rounded-lg transition-all"
                      style={{
                        background: c.hex,
                        border: settings.bgColorHex === c.hex ? `2px solid ${ACCENT}` : "1px solid #444",
                        boxShadow: settings.bgColorHex === c.hex ? `0 0 0 1px ${ACCENT}` : "none",
                      }} />
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color: "#555" }}>Typography</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: "#ccc" }}>Font family</span>
                    <div className="flex gap-1.5">
                      {(["SANS", "SERIF", "MONO"] as const).map(f => (
                        <button key={f}
                          onClick={() => onChange({ fontFamily: f })}
                          className="text-xs font-bold px-3 py-1.5 rounded-md transition-all"
                          style={{
                            background: settings.fontFamily === f ? ACCENT : "#1f1f1f",
                            color:      settings.fontFamily === f ? "#000" : "#888",
                            border:     `1px solid ${settings.fontFamily === f ? ACCENT : "#2a2a2a"}`,
                          }}>
                          {f === "SANS" ? "Sans" : f === "SERIF" ? "Serif" : "Mono"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <SliderRow label="Font size" min={18} max={90} value={settings.fontSize} unit="px"
                    onChange={v => onChange({ fontSize: v })} />
                  <SliderRow label="Line height" min={120} max={260} step={5}
                    value={Math.round(settings.lineHeight * 100)}
                    onChange={v => onChange({ lineHeight: v / 100 })} />
                  <SliderRow label="Text width" min={40} max={95} step={5} value={settings.textWidth} unit="%"
                    onChange={v => onChange({ textWidth: v })} />
                </div>
              </div>

              {/* Reading Guide */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color: "#555" }}>Reading Guide</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm" style={{ color: "#ccc" }}>Focus line</span>
                      <p className="text-[11px] mt-0.5" style={{ color: "#555" }}>Amber guide at reading position</p>
                    </div>
                    <Toggle checked={settings.showFocusLine} onChange={v => onChange({ showFocusLine: v })} />
                  </div>
                  {settings.showFocusLine && (
                    <SliderRow label="Focus line position" min={10} max={70} value={settings.focusLinePos} unit="%"
                      onChange={v => onChange({ focusLinePos: v })} />
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm" style={{ color: "#ccc" }}>Edge fade</span>
                      <p className="text-[11px] mt-0.5" style={{ color: "#555" }}>Fade top and bottom edges</p>
                    </div>
                    <Toggle checked={settings.showEdgeFade} onChange={v => onChange({ showEdgeFade: v })} />
                  </div>
                </div>
              </div>

              {/* Behaviour */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider mb-3" style={{ color: "#555" }}>Behaviour</p>
                <div className="space-y-3">
                  {[
                    { label: "Countdown before start", sub: "3-second countdown timer",           key: "useCountdown" as const },
                    { label: "Loop script",            sub: "Restart automatically at end",       key: "loopScript"   as const },
                    { label: "Tap to pause",           sub: "Tap scroll area to play/pause",      key: "tapToPause"   as const },
                  ].map(r => (
                    <div key={r.key} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm" style={{ color: "#ccc" }}>{r.label}</span>
                        <p className="text-[11px] mt-0.5" style={{ color: "#555" }}>{r.sub}</p>
                      </div>
                      <Toggle checked={settings[r.key] as boolean} onChange={v => onChange({ [r.key]: v })} />
                    </div>
                  ))}
                  <SliderRow label="Reading speed (WPM)" min={60} max={250} step={10} value={settings.wpm}
                    onChange={v => onChange({ wpm: v })} />
                  <p className="text-[11px]" style={{ color: "#444" }}>
                    Used for read-time estimates in the editor. Does not affect scroll speed.
                  </p>
                </div>
              </div>

              {/* Save settings */}
              {isSignedIn && (
                <div className="pt-2 border-t" style={{ borderColor: "#1f1f1f" }}>
                  <button onClick={handleSave} disabled={saving}
                    className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-lg transition-colors"
                    style={{ background: saved ? "#10b981" : ACCENT, color: "#000" }}>
                    {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
                    {saving ? "Saving…" : saved ? "Settings Saved!" : "Save Settings to Account"}
                  </button>
                  <p className="text-[11px] text-center mt-2" style={{ color: "#444" }}>
                    Your settings and last script will be restored next visit.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}