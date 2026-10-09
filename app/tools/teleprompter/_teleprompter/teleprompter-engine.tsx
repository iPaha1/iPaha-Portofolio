"use client";

// =============================================================================
// isaacpaha.com — Teleprompter — Teleprompter Engine Component
// app/tools/teleprompter/_teleprompter/teleprompter-engine.tsx
//
// The actual scrolling teleprompter view — fullscreen, self-contained.
// Accepts all settings as props, handles scroll animation internally.
// Reports session data back via onSessionEnd callback.
// =============================================================================

import React, {
  useEffect, useRef, useCallback, useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, Maximize, Minimize,
  X, ChevronUp, ChevronDown, Keyboard,
} from "lucide-react";
import { TeleprompterSettings, TeleprompterSession, FONT_CLASS_MAP, renderScript } from "./teleprompter-types";


interface TeleprompterEngineProps {
  script:       string;
  settings:     TeleprompterSettings;
  totalSecs:    number;
  onExit:       (session: TeleprompterSession) => void;
}

const ACCENT = "#14b8a6";

// ─── Countdown overlay ─────────────────────────────────────────────────────

function Countdown({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    const iv = setInterval(() => {
      setN(prev => {
        if (prev <= 1) { clearInterval(iv); onDone(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [onDone]);
  return (
    <motion.div className="absolute inset-0 z-30 flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,.96)" }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div key={n}
        initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: .4, ease: [0.22, 1, 0.36, 1] }}
        style={{ fontSize: 140, fontWeight: 800, color: ACCENT, lineHeight: 1, fontFamily: "Sora, sans-serif" }}>
        {n || "Go!"}
      </motion.div>
      <p style={{ fontSize: 15, color: "#666", letterSpacing: ".12em", textTransform: "uppercase", marginTop: 16, fontFamily: "Sora, sans-serif" }}>
        Get ready
      </p>
    </motion.div>
  );
}

// ─── Keyboard hints ────────────────────────────────────────────────────────

function KbHints({ visible }: { visible: boolean }) {
  const SHORTCUTS = [
    { keys: ["Space", "K"], label: "Play / Pause"    },
    { keys: ["↑", "↓"],     label: "Speed +/−"       },
    { keys: ["←", "→"],     label: "Manual scroll"   },
    { keys: ["F"],           label: "Focus guide"     },
    { keys: ["R"],           label: "Restart"         },
    { keys: ["Esc"],         label: "Exit"            },
  ];
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }} transition={{ duration: .2 }}
          className="absolute bottom-20 right-4 z-20 rounded-xl p-3.5 text-[11px] space-y-2"
          style={{ background: "rgba(0,0,0,.85)", border: "1px solid rgba(255,255,255,.1)", pointerEvents: "none" }}>
          {SHORTCUTS.map(s => (
            <div key={s.label} className="flex items-center gap-2.5">
              <div className="flex gap-1">
                {s.keys.map(k => (
                  <kbd key={k} className="rounded px-1.5 py-0.5 text-[10px] font-mono"
                    style={{ background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.15)", color: "#fff" }}>
                    {k}
                  </kbd>
                ))}
              </div>
              <span style={{ color: "#888" }}>{s.label}</span>
            </div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Engine ───────────────────────────────────────────────────────────

export function TeleprompterEngine({ script, settings, totalSecs, onExit }: TeleprompterEngineProps) {
  // Scroll state
  const [isPlaying,    setIsPlaying]    = useState(false);
  const [scrollY,      setScrollY]      = useState(0);
  const [elapsed,      setElapsed]      = useState(0);
  const [progress,     setProgress]     = useState(0);
  const [isFull,       setIsFull]       = useState(false);
  const [showHints,    setShowHints]    = useState(false);
  const [showCountdown,setShowCountdown]= useState(settings.useCountdown);
  const [showFocus,    setShowFocus]    = useState(settings.showFocusLine);

  // Session tracking
  const sessionRef = useRef<TeleprompterSession>({
    scriptWordCount: script.trim().split(/\s+/).length,
    durationSeconds: 0,
    completed:       false,
    maxProgress:     0,
    speedUsed:       settings.scrollSpeed,
    pauseCount:      0,
    restartCount:    0,
  });

  // Refs
  const stageRef     = useRef<HTMLDivElement>(null);
  const innerRef     = useRef<HTMLDivElement>(null);
  const animRef      = useRef<number | null>(null);
  const lastTsRef    = useRef<number | null>(null);
  const scrollRef    = useRef(0);
  const elapsedRef   = useRef(0);
  const speedRef     = useRef(settings.scrollSpeed);
  const playingRef   = useRef(false);
  const hintTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep speed ref in sync
  useEffect(() => { speedRef.current = settings.scrollSpeed; }, [settings.scrollSpeed]);

  // ── Scroll engine ──────────────────────────────────────────────────────
  const tick = useCallback((ts: number) => {
    if (!playingRef.current) return;
    if (lastTsRef.current === null) lastTsRef.current = ts;
    const dt = Math.min((ts - lastTsRef.current) / 1000, 0.1);
    lastTsRef.current = ts;

    scrollRef.current  += speedRef.current * 18 * dt;
    elapsedRef.current += dt;

    const stage = stageRef.current;
    const inner = innerRef.current;
    if (!stage || !inner) { animRef.current = requestAnimationFrame(tick); return; }

    const max  = Math.max(0, inner.scrollHeight - stage.clientHeight);
    if (scrollRef.current >= max) {
      if (settings.loopScript) {
        scrollRef.current = 0;
      } else {
        scrollRef.current = max;
        sessionRef.current.completed = true;
        doStop();
        setProgress(100);
        setElapsed(elapsedRef.current);
        return;
      }
    }

    inner.style.transform = `translateY(-${Math.round(scrollRef.current)}px)`;
    const pct = max > 0 ? Math.min(100, Math.round((scrollRef.current / max) * 100)) : 0;
    sessionRef.current.maxProgress  = Math.max(sessionRef.current.maxProgress, pct);
    sessionRef.current.speedUsed    = speedRef.current;
    sessionRef.current.durationSeconds = Math.round(elapsedRef.current);

    setProgress(pct);
    setScrollY(scrollRef.current);
    setElapsed(elapsedRef.current);

    animRef.current = requestAnimationFrame(tick);
  }, [settings.loopScript]);

  const doPlay = useCallback(() => {
    playingRef.current = true;
    lastTsRef.current  = null;
    setIsPlaying(true);
    animRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const doStop = useCallback(() => {
    playingRef.current = false;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
    lastTsRef.current = null;
    setIsPlaying(false);
    sessionRef.current.pauseCount += 1;
  }, []);

  const togglePlay = useCallback(() => {
    playingRef.current ? doStop() : doPlay();
  }, [doPlay, doStop]);

  const restart = useCallback(() => {
    doStop();
    scrollRef.current  = 0;
    elapsedRef.current = 0;
    if (innerRef.current) innerRef.current.style.transform = "translateY(0)";
    setScrollY(0); setElapsed(0); setProgress(0);
    sessionRef.current.restartCount += 1;
  }, [doStop]);

  const manualScroll = useCallback((dir: "up" | "down") => {
    const delta = dir === "down" ? 100 : -100;
    scrollRef.current = Math.max(0, scrollRef.current + delta);
    if (innerRef.current) innerRef.current.style.transform = `translateY(-${Math.round(scrollRef.current)}px)`;
    setScrollY(scrollRef.current);
  }, []);

  // ── Countdown done → start playing ────────────────────────────────────
  const handleCountdownDone = useCallback(() => {
    setShowCountdown(false);
    flashHints();
    doPlay();
  }, [doPlay]);

  // ── Hints flash ────────────────────────────────────────────────────────
  const flashHints = () => {
    setShowHints(true);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setShowHints(false), 4500);
  };

  // ── Fullscreen API ─────────────────────────────────────────────────────
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(() => {});
      setIsFull(true);
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFull(false);
    }
  };
  useEffect(() => {
    const handler = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      switch (e.key) {
        case " ": case "k": case "K":
          e.preventDefault(); togglePlay(); break;
        case "ArrowUp":
          e.preventDefault();
          speedRef.current = Math.min(20, speedRef.current + 1);
          flashHints(); break;
        case "ArrowDown":
          e.preventDefault();
          speedRef.current = Math.max(1, speedRef.current - 1);
          flashHints(); break;
        case "ArrowRight":
          e.preventDefault(); manualScroll("down"); break;
        case "ArrowLeft":
          e.preventDefault(); manualScroll("up"); break;
        case "f": case "F":
          setShowFocus(p => !p); break;
        case "r": case "R":
          restart(); break;
        case "Escape":
          handleExit(); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [togglePlay, manualScroll, restart]);

  // ── Touch scroll ───────────────────────────────────────────────────────
  const touchStart = useRef(0);
  const scrollStart = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current  = e.touches[0].clientY;
    scrollStart.current = scrollRef.current;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dy  = touchStart.current - e.touches[0].clientY;
    const max = innerRef.current ? innerRef.current.scrollHeight - (stageRef.current?.clientHeight ?? 0) : 0;
    scrollRef.current = Math.max(0, Math.min(max, scrollStart.current + dy));
    if (innerRef.current) innerRef.current.style.transform = `translateY(-${Math.round(scrollRef.current)}px)`;
    setScrollY(scrollRef.current);
    const pct = max > 0 ? Math.min(100, Math.round((scrollRef.current / max) * 100)) : 0;
    setProgress(pct);
  };

  // ── Click to pause ─────────────────────────────────────────────────────
  const handleStageClick = (e: React.MouseEvent) => {
    if (!settings.tapToPause) return;
    if ((e.target as HTMLElement).closest("button")) return;
    togglePlay();
  };

  // ── Exit ────────────────────────────────────────────────────────────────
  const handleExit = () => {
    doStop();
    sessionRef.current.durationSeconds = Math.round(elapsedRef.current);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onExit(sessionRef.current);
  };

  // ── Render ──────────────────────────────────────────────────────────────
  const elapsed_m = Math.floor(elapsed / 60);
  const elapsed_s = Math.floor(elapsed % 60);
  const remaining = Math.max(0, Math.round(totalSecs - elapsed));
  const remain_m  = Math.floor(remaining / 60);
  const remain_s  = remaining % 60;

  const fontClass = FONT_CLASS_MAP[settings.fontFamily];

  return (
    <div className="fixed inset-0 z-[200] flex flex-col"
      style={{ background: settings.bgColorHex, fontFamily: "Sora, sans-serif" }}>

      {/* ── Top bar ── */}
      {/* Controls Bar */}
<div 
  className="sticky top-16 z-50 flex items-center justify-between bg-zinc-950/95 backdrop-blur-md border-b border-white/10 px-6 py-4"
  style={{ marginTop: '0' }} // safety
>
  {/* Progress Bar */}
  <div className="flex-1 h-[3px] rounded-full overflow-hidden mr-8" 
       style={{ background: "rgba(255,255,255,.1)" }}>
    <motion.div 
      className="h-full rounded-full"
      style={{ background: ACCENT }}
      animate={{ width: `${progress}%` }} 
      transition={{ duration: .25 }} 
    />
  </div>

  {/* Controls */}
  <div className="flex items-center gap-2">
    <button 
      onClick={() => speedRef.current = Math.max(1, speedRef.current - 1)}
      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
      style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }}
    >
      −
    </button>

    <button 
      onClick={togglePlay}
      className="flex items-center justify-center gap-2 px-5 py-1.5 rounded-lg font-bold text-sm min-w-[100px] transition-colors"
      style={{ background: ACCENT, border: `1px solid ${ACCENT}`, color: "#000" }}
    >
      {isPlaying ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Play</>}
    </button>

    <button 
      onClick={() => speedRef.current = Math.min(20, speedRef.current + 1)}
      className="text-xs px-3 py-1.5 rounded-lg transition-colors"
      style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }}
    >
      +
    </button>

    <button 
      onClick={restart}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
      style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }}
    >
      <RotateCcw size={13} /> Restart
    </button>

    <button 
      onClick={toggleFullscreen}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
      style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.12)", color: "#fff" }}
    >
      {isFull ? <Minimize size={13} /> : <Maximize size={13} />}
      {isFull ? "Exit Full" : "Fullscreen"}
    </button>

    <button 
      onClick={handleExit}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
      style={{ background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", color: "#f87171" }}
    >
      <X size={13} /> Exit
    </button>
  </div>
</div>

      {/* ── Stage ── */}
      <div
        ref={stageRef}
        className="flex-1 relative overflow-hidden"
        style={{ background: settings.bgColorHex, cursor: settings.tapToPause ? "pointer" : "default" }}
        onClick={handleStageClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}>

        {/* Focus line */}
        {showFocus && (
          <div className="absolute left-0 right-0 z-10 pointer-events-none"
            style={{ top: `${settings.focusLinePos}%`, height: 4,
              background: "rgba(20,184,166,.18)",
              borderTop: "1px solid rgba(20,184,166,.3)",
              borderBottom: "1px solid rgba(20,184,166,.3)" }} />
        )}

        {/* Edge fades */}
        {settings.showEdgeFade && (
          <>
            <div className="absolute left-0 right-0 top-0 h-[18%] pointer-events-none z-10"
              style={{ background: `linear-gradient(to bottom, ${settings.bgColorHex} 0%, transparent 100%)` }} />
            <div className="absolute left-0 right-0 bottom-0 h-[22%] pointer-events-none z-10"
              style={{ background: `linear-gradient(to top, ${settings.bgColorHex} 0%, transparent 100%)` }} />
          </>
        )}

        {/* Script text */}
        <div ref={innerRef} className="absolute left-0 right-0 top-0" style={{ padding: `8vh ${(100 - settings.textWidth) / 2}%` }}>
          <div
            className={`${fontClass} tp-rendered-script`}
            style={{
              fontSize:   settings.fontSize,
              lineHeight: settings.lineHeight,
              color:      settings.textColorHex,
              fontWeight: 500,
              whiteSpace: "pre-wrap",
              wordBreak:  "break-word",
              letterSpacing: ".01em",
            }}
            dangerouslySetInnerHTML={{ __html: renderScript(script) }}
          />
        </div>

        {/* Countdown */}
        <AnimatePresence>
          {showCountdown && <Countdown onDone={handleCountdownDone} />}
        </AnimatePresence>

        {/* KB hints */}
        <KbHints visible={showHints} />
      </div>

      {/* ── Bottom HUD ── */}
      <div className="flex items-center gap-5 px-4 flex-shrink-0 text-[11px] flex-wrap"
        style={{ background: "rgba(0,0,0,.88)", borderTop: "1px solid rgba(255,255,255,.06)", height: 38, color: "#555" }}>
        <span>Progress: <b style={{ color: ACCENT }}>{progress}%</b></span>
        <span>Elapsed: <b style={{ color: ACCENT }}>{elapsed_m}:{String(elapsed_s).padStart(2,"0")}</b></span>
        <span>Remaining: <b style={{ color: ACCENT }}>{remain_m}:{String(remain_s).padStart(2,"0")}</b></span>
        <span style={{ marginLeft: "auto", color: "#333", fontSize: 10, letterSpacing: ".05em", textTransform: "uppercase" }}>
          {settings.fontFamily} · {settings.fontSize}px · speed {speedRef.current}
        </span>
        <button onClick={() => { setShowFocus(p => !p); }}
          className="text-[10px] transition-colors"
          style={{ color: showFocus ? ACCENT : "#444" }}>
          F: focus
        </button>
        <button onClick={() => { setShowHints(p => !p); }}
          className="text-[10px] transition-colors"
          style={{ color: "#444" }}>
          <Keyboard size={11} />
        </button>
      </div>

      {/* Global cue styles injected */}
      <style>{`
        .tp-cue{display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:4px;font-weight:700;vertical-align:middle;letter-spacing:.04em;margin:0 4px;font-size:.52em}
        .tp-cue-pause{background:rgba(245,158,11,.18);color:#fbbf24;border:1px solid rgba(245,158,11,.35)}
        .tp-cue-breathe{background:rgba(59,130,246,.18);color:#93c5fd;border:1px solid rgba(59,130,246,.35)}
        .tp-cue-emphasis{background:rgba(168,85,247,.18);color:#d8b4fe;border:1px solid rgba(168,85,247,.35)}
        .tp-cue-section{display:block;text-align:center;font-size:.42em;padding:6px 20px;margin:24px 0;background:rgba(20,184,166,.1);color:#5eead4;border-top:1px solid rgba(20,184,166,.25);border-bottom:1px solid rgba(20,184,166,.25);letter-spacing:.1em}
        @font-face{font-family:'Sora';src:local('Sora')}
        .font-sans{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif}
        .font-serif{font-family:Georgia,'Times New Roman',serif}
        .font-mono{font-family:'Courier New',Courier,monospace}
      `}</style>
    </div>
  );
}