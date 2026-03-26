// =============================================================================
// GAME 22: MIRROR PAINTER — Draw on one half, the axis mirrors it live
// components/(gamification)/(games)/mirror-painter-game.tsx
//
// Mechanic: The canvas is split by a vertical axis. A target silhouette is
// shown on BOTH halves (mirrored). You can only draw on the LEFT half — your
// strokes are instantly reflected to the right. Fill in as much of the target
// silhouette as possible before the ink runs out. Accuracy = coverage %.
// Each round the silhouette grows more complex. Completely novel — requires
// training your brain to draw one thing while visualising its mirror.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trophy, Eye } from "lucide-react";
import type { GameProps } from "./game-types";

const CW = 320, CH = 200;   // canvas dimensions
const HALF = CW / 2;
const BRUSH = 14;            // brush radius px
const INK_PER_STROKE = 0.4; // % ink used per pixel of stroke

// ── Target shape generator — blob silhouette ─────────────────────────────────
function buildTargetMask(complexity: number): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = CW; canvas.height = CH;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, CW, CH);

  // Draw a mirrored blob on the left half, then mirror right
  ctx.fillStyle = "#fff";
  const blobCount = 2 + Math.floor(complexity / 2);
  for (let b = 0; b < blobCount; b++) {
    const cx = 20 + Math.random() * (HALF - 40);
    const cy = 20 + Math.random() * (CH - 40);
    const rx = 18 + Math.random() * 30;
    const ry = 18 + Math.random() * 28;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
    // Mirror right
    ctx.beginPath();
    ctx.ellipse(CW - cx, cy, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  return ctx.getImageData(0, 0, CW, CH);
}

function pixelWhite(data: Uint8ClampedArray, x: number, y: number, w: number): boolean {
  if (x < 0 || x >= w || y < 0) return false;
  const i = (Math.floor(y) * w + Math.floor(x)) * 4;
  return data[i] > 128;
}

function calcCoverage(painted: Set<number>, target: ImageData): number {
  const data = target.data;
  let targetCount = 0, hitCount = 0;
  for (let y = 0; y < CH; y++) {
    for (let x = 0; x < CW; x++) {
      const isTarget = pixelWhite(data, x, y, CW);
      if (!isTarget) continue;
      targetCount++;
      if (painted.has(y * CW + x)) hitCount++;
    }
  }
  return targetCount === 0 ? 0 : Math.round((hitCount / targetCount) * 100);
}

export function MirrorPainterGame({
  gameId, rewardTokens, duration = 90, onComplete, isFlash = false,
}: GameProps) {
  const [round,      setRound]      = useState(1);
  const [ink,        setInk]        = useState(100);
  const [score,      setScore]      = useState(0);
  const [timeLeft,   setTimeLeft]   = useState(duration);
  const [done,       setDone]       = useState(false);
  const [coverage,   setCoverage]   = useState<number | null>(null);
  const [submitted,  setSubmitted]  = useState(false);

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const overlayRef  = useRef<HTMLCanvasElement>(null);  // painted strokes
  const isDrawing   = useRef(false);
  const lastPos     = useRef<{ x: number; y: number } | null>(null);
  const inkRef      = useRef(100);
  const scoreRef    = useRef(0);
  const roundRef    = useRef(1);
  const doneRef     = useRef(false);
  const targetRef   = useRef<ImageData | null>(null);
  const paintedRef  = useRef<Set<number>>(new Set());

  const initRound = useCallback((r: number) => {
    const complexity = r;
    const target = buildTargetMask(complexity);
    targetRef.current = target;
    paintedRef.current = new Set();
    inkRef.current = 100;
    setInk(100);
    setCoverage(null);
    setSubmitted(false);

    // Draw target on base canvas
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    ctx.clearRect(0, 0, CW, CH);

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, CW, CH);

    // Target silhouette
    const imgData = target;
    for (let y = 0; y < CH; y++) {
      for (let x = 0; x < CW; x++) {
        if (pixelWhite(imgData.data, x, y, CW)) {
          ctx.fillStyle = "rgba(139,92,246,0.18)";
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    // Mirror axis line
    ctx.strokeStyle = "rgba(245,158,11,0.4)";
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(HALF, 0); ctx.lineTo(HALF, CH); ctx.stroke();
    ctx.setLineDash([]);

    // Labels
    ctx.fillStyle = "rgba(245,158,11,0.4)";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("DRAW HERE", HALF / 2, 14);
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.fillText("MIRROR", HALF + HALF / 2, 14);

    // Clear overlay
    const ov = overlayRef.current;
    if (ov) { const oc = ov.getContext("2d")!; oc.clearRect(0, 0, CW, CH); }
  }, []);

  useEffect(() => { initRound(1); }, [initRound]);

  useEffect(() => {
    const t = setInterval(() => {
      if (doneRef.current) { clearInterval(t); return; }
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); doneRef.current = true; setDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!done) return;
    const final = Math.max(1, Math.round(rewardTokens * (0.3 + (scoreRef.current / Math.max(1, roundRef.current * 70)) * 1.7)));
    setTimeout(() => onComplete(final, scoreRef.current), 1500);
  }, [done]);

  // ── Draw stroke on overlay ────────────────────────────────────────────────────
  const paintAt = useCallback((x: number, y: number) => {
    if (x > HALF || inkRef.current <= 0 || !targetRef.current) return;
    const ov = overlayRef.current;
    if (!ov) return;
    const ctx = ov.getContext("2d")!;

    const mirrorX = CW - x;

    ctx.globalAlpha = 0.85;
    ctx.fillStyle = "#8b5cf6";

    // Draw circle left
    ctx.beginPath(); ctx.arc(x, y, BRUSH, 0, Math.PI * 2); ctx.fill();
    // Mirror right
    ctx.beginPath(); ctx.arc(mirrorX, y, BRUSH, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Mark painted pixels
    for (let dy = -BRUSH; dy <= BRUSH; dy++) {
      for (let dx = -BRUSH; dx <= BRUSH; dx++) {
        if (dx * dx + dy * dy > BRUSH * BRUSH) continue;
        const px = Math.round(x + dx), py = Math.round(y + dy);
        const mpx = Math.round(mirrorX + dx);
        if (px >= 0 && px < CW && py >= 0 && py < CH) paintedRef.current.add(py * CW + px);
        if (mpx >= 0 && mpx < CW && py >= 0 && py < CH) paintedRef.current.add(py * CW + mpx);
      }
    }

    inkRef.current = Math.max(0, inkRef.current - INK_PER_STROKE);
    setInk(Math.round(inkRef.current));
    if (inkRef.current <= 0) handleSubmit();
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const cv = overlayRef.current;
    if (!cv) return null;
    const rect = cv.getBoundingClientRect();
    const scaleX = CW / rect.width, scaleY = CH / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (submitted || doneRef.current) return;
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    if (pos && pos.x <= HALF) { lastPos.current = pos; paintAt(pos.x, pos.y); }
  };

  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || submitted) return;
    e.preventDefault();
    const pos = getPos(e);
    if (!pos || pos.x > HALF) return;
    paintAt(pos.x, pos.y);
    lastPos.current = pos;
  };

  const onUp = () => { isDrawing.current = false; lastPos.current = null; };

  const handleSubmit = useCallback(() => {
    if (submitted || doneRef.current || !targetRef.current) return;
    setSubmitted(true);
    isDrawing.current = false;
    const cov = calcCoverage(paintedRef.current, targetRef.current);
    setCoverage(cov);
    const pts = Math.round(cov * 1.2) + (cov >= 80 ? 30 : cov >= 60 ? 15 : 0);
    scoreRef.current += pts;
    setScore(scoreRef.current);

    setTimeout(() => {
      if (doneRef.current) return;
      roundRef.current++;
      setRound(roundRef.current);
      initRound(roundRef.current);
    }, 1400);
  }, [submitted, initRound]);

  const inkColor = ink > 50 ? "#8b5cf6" : ink > 20 ? "#f59e0b" : "#ef4444";
  const covColor = coverage === null ? "#fff" : coverage >= 75 ? "#10b981" : coverage >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative w-full rounded-xs overflow-hidden select-none"
      style={{ background: "linear-gradient(135deg,#0f172a 0%,#1a0a2e 100%)", minHeight: 310 }}>

      {/* Stats */}
      <div className="flex items-center justify-between px-3 py-2"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />{score}
          </div>
          <div className="text-[10px] px-1.5 py-0.5 rounded-xs font-bold"
            style={{ background: "rgba(139,92,246,0.15)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.3)" }}>
            Round {round}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs font-bold" style={{ color: inkColor }}>🖌 {ink}%</div>
          <div className="font-black text-base tabular-nums"
            style={{ color: timeLeft <= 10 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Ink bar */}
      <div className="h-1" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className="h-full" style={{ background: inkColor }}
          animate={{ width: `${ink}%` }} transition={{ duration: 0.1 }} />
      </div>

      {/* Canvas stack */}
      <div className="flex justify-center px-3 pt-3 pb-1">
        <div className="relative" style={{ width: "100%", maxWidth: CW }}>
          <canvas ref={canvasRef} width={CW} height={CH}
            style={{ display: "block", width: "100%", borderRadius: 4, border: "1px solid rgba(255,255,255,0.07)" }} />
          <canvas ref={overlayRef} width={CW} height={CH}
            onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
            onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
            style={{ position: "absolute", inset: 0, display: "block", width: "100%", borderRadius: 4,
              opacity: 0.7, cursor: submitted ? "default" : "crosshair", touchAction: "none" }} />
        </div>
      </div>

      {/* Coverage + submit */}
      <div className="px-3 pb-3 flex items-center justify-between">
        <AnimatePresence>
          {coverage !== null && (
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2">
              <p className="text-xl font-black" style={{ color: covColor, letterSpacing: "-0.03em" }}>
                {coverage}% covered
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                {coverage >= 75 ? "Amazing!" : coverage >= 50 ? "Good work" : "Keep practising"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        {!submitted && !doneRef.current && (
          <button onClick={handleSubmit}
            className="ml-auto px-3 py-1.5 rounded-xs text-xs font-black"
            style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.4)", color: "#c4b5fd" }}>
            Submit ✓
          </button>
        )}
      </div>

      <p className="text-center pb-2 text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
        Draw on the left — watch it mirror. Fill the purple target shape.
      </p>

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{score} pts</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{round - 1} paintings completed</p>
        </motion.div>
      )}

      {isFlash && (
        <div className="absolute top-8 right-2 text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-xs animate-pulse z-10"
          style={{ background: "rgba(245,158,11,0.25)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)" }}>
          2× Flash
        </div>
      )}
    </div>
  );
}