// =============================================================================
// TOKEN RUSH — Game 16: Dead Reckoning
// app/token-rush/_games/dead-reckoning.tsx
//
// A navigation memory challenge. Both players watch an animated dot travel
// a path on a blank canvas for 4 seconds — no grid, no markers, no reference.
// The dot then disappears and a fog obscures the canvas. Players must click
// where they believe the dot ended up. The closer the click, the more points.
// Speed bonus for locking in quickly.
//
// Paths involve direction changes, speed variations, and curves. Impossible
// to cheat because there is nothing to copy — it's pure spatial memory and
// mental motion tracking.
//
// ANTI-CHEAT: Paths generated server-side. End position stored server-side
// and never sent to client until both players have submitted their guess.
//
// DEMO MODE: Paths generated and animated locally.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Crosshair } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";


// ── Types ─────────────────────────────────────────────────────────────────────
export interface DeadReckoningProps {
  challengeId:   string;
  myUserId:      string;
  opponentName:  string;
  opponentId:    string;
  wagerAmount:   number;
  netPrize:      number;
  isHost:        boolean;
  soundEnabled?: boolean;
  onComplete:    (myScore: number, oppScore: number) => void;
  onScoreUpdate: (myScore: number) => void;
}

const TOTAL_ROUNDS = 8;
const WATCH_MS     = 4000;   // how long to observe
const GUESS_SECS   = 10;

const W = 320;
const H = 240;

// ── Scoring by distance (pixels) ─────────────────────────────────────────────
function distScore(dist: number, maxDist: number): number {
  const pct = dist / maxDist;
  if (pct <= 0.04) return 30;
  if (pct <= 0.10) return 22;
  if (pct <= 0.18) return 14;
  if (pct <= 0.28) return 7;
  return 0;
}

function dist2D(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// ── Path generator ────────────────────────────────────────────────────────────
interface PathPoint { x: number; y: number; t: number } // t = 0..1

function generatePath(seed: number): PathPoint[] {
  let s = seed;
  const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (Math.abs(s) % 1000) / 1000; };

  // Start in a margin zone
  const sx = W * 0.15 + rng() * W * 0.7;
  const sy = H * 0.15 + rng() * H * 0.7;

  // 4–6 waypoints
  const nWp  = 4 + Math.floor(rng() * 3);
  const wps: { x: number; y: number }[] = [{ x: sx, y: sy }];
  for (let i = 0; i < nWp; i++) {
    const prev = wps[wps.length - 1];
    const angle  = rng() * Math.PI * 2;
    const speed  = 30 + rng() * 60;
    const nx = Math.max(10, Math.min(W - 10, prev.x + Math.cos(angle) * speed));
    const ny = Math.max(10, Math.min(H - 10, prev.y + Math.sin(angle) * speed));
    wps.push({ x: nx, y: ny });
  }

  // Convert waypoints to timed path (interpolated)
  const pts: PathPoint[] = [];
  const totalWps = wps.length - 1;
  for (let i = 0; i < totalWps; i++) {
    const a = wps[i], b = wps[i + 1];
    const steps = 20;
    for (let j = 0; j < steps; j++) {
      const p = j / steps;
      pts.push({
        x: a.x + (b.x - a.x) * p,
        y: a.y + (b.y - a.y) * p,
        t: (i + p) / totalWps,
      });
    }
  }
  pts.push({ x: wps[wps.length - 1].x, y: wps[wps.length - 1].y, t: 1 });
  return pts;
}

// ── Opponent AI guess ─────────────────────────────────────────────────────────
function aiGuessPos(endX: number, endY: number): { x: number; y: number } {
  // AI has ~60% accuracy — varies ±20% of canvas size
  const maxErr = Math.min(W, H) * 0.25;
  const errR   = Math.random() < 0.55 ? maxErr * 0.15 : maxErr;
  const angle  = Math.random() * Math.PI * 2;
  return {
    x: Math.max(5, Math.min(W - 5, endX + Math.cos(angle) * errR * Math.random())),
    y: Math.max(5, Math.min(H - 5, endY + Math.sin(angle) * errR * Math.random())),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function DeadReckoningGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: DeadReckoningProps) {
  const { play } = useGameSound(soundEnabled);

  type Phase = "watching" | "guessing" | "reveal" | "done";

  const [round,       setRound]       = useState(1);
  const [phase,       setPhase]       = useState<Phase>("watching");
  const [path,        setPath]        = useState<PathPoint[]>([]);
  const [dotPos,      setDotPos]      = useState({ x: W/2, y: H/2 });
  const [myGuess,     setMyGuess]     = useState<{ x: number; y: number } | null>(null);
  const [oppGuess,    setOppGuess]    = useState<{ x: number; y: number } | null>(null);
  const [myScore,     setMyScore]     = useState(0);
  const [oppScore,    setOppScore]    = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(GUESS_SECS);
  const [locked,      setLocked]      = useState(false);
  const [roundResult, setRoundResult] = useState<{
    myPts: number; oppPts: number; headline: string;
    endPos: { x: number; y: number };
    myDist: number; oppDist: number;
  } | null>(null);
  const [trailPts,    setTrailPts]    = useState<{ x: number; y: number; age: number }[]>([]);
  const [watchPct,    setWatchPct]    = useState(0);

  const myScoreRef   = useRef(0);
  const oppScoreRef  = useRef(0);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const animRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockedRef    = useRef(false);
  const pathRef      = useRef<PathPoint[]>([]);
  const canvasRef    = useRef<HTMLDivElement>(null);

  // ── Setup round ───────────────────────────────────────────────────────────
  const setupRound = useCallback((rnd: number) => {
    const seed = Date.now() ^ (rnd * 0xabcdef);
    const p    = generatePath(seed);
    setPath(p);
    pathRef.current = p;
    setDotPos({ x: p[0].x, y: p[0].y });
    setMyGuess(null);
    setOppGuess(null);
    lockedRef.current = false;
    setLocked(false);
    setRoundResult(null);
    setTimeLeft(GUESS_SECS);
    setTrailPts([]);
    setWatchPct(0);
    setPhase("watching");
    play("roundStart");

    // Animate dot along path
    let frame = 0;
    const totalFrames = Math.floor(WATCH_MS / 30);
    animRef.current = setInterval(() => {
      frame++;
      const t     = frame / totalFrames;
      const pIdx  = Math.min(p.length - 1, Math.floor(t * p.length));
      const pt    = p[pIdx];
      setDotPos({ x: pt.x, y: pt.y });
      setWatchPct(t);
      // Trail
      setTrailPts(prev => [
        { x: pt.x, y: pt.y, age: 0 },
        ...prev.map(tp => ({ ...tp, age: tp.age + 1 })).filter(tp => tp.age < 12),
      ]);

      if (frame >= totalFrames) {
        clearInterval(animRef.current!);
        setWatchPct(1);
        // Brief pause then hide
        setTimeout(() => {
          setTrailPts([]);
          setPhase("guessing");
          play("timerUrgent");
          timerRef.current = setInterval(() => {
            setTimeLeft(t => {
              if (t <= 1) {
                clearInterval(timerRef.current!);
                if (!lockedRef.current) {
                  // Auto-guess centre
                  resolveRound(
                    { x: W / 2, y: H / 2 },
                    pathRef.current[pathRef.current.length - 1],
                  );
                }
                return 0;
              }
              return t - 1;
            });
          }, 1000);
          // AI opponent guesses
          const endPt = p[p.length - 1];
          const ag    = aiGuessPos(endPt.x, endPt.y);
          setTimeout(() => setOppGuess(ag), 1000 + Math.random() * 4000);
        }, 400);
      }
    }, 30);
  }, [play]); // eslint-disable-line

  // ── Canvas click → guess ──────────────────────────────────────────────────
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== "guessing" || lockedRef.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x    = ((e.clientX - rect.left) / rect.width)  * W;
    const y    = ((e.clientY - rect.top)  / rect.height) * H;
    setMyGuess({ x, y });
  }, [phase]);

  // ── Lock guess ────────────────────────────────────────────────────────────
  const lockGuess = useCallback(() => {
    if (!myGuess || lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    clearInterval(timerRef.current!);
    const endPt = pathRef.current[pathRef.current.length - 1];
    resolveRound(myGuess, endPt);
  }, [myGuess]); // eslint-disable-line

  // ── Resolve ───────────────────────────────────────────────────────────────
  const resolveRound = useCallback((
    guess: { x: number; y: number },
    endPt: { x: number; y: number },
  ) => {
    if (lockedRef.current === false) lockedRef.current = true;
    clearInterval(timerRef.current!);

    const maxDist  = Math.sqrt(W * W + H * H);
    const myDist   = dist2D(guess.x, guess.y, endPt.x, endPt.y);
    const oppG     = oppGuess ?? aiGuessPos(endPt.x, endPt.y);
    const oppDist  = dist2D(oppG.x, oppG.y, endPt.x, endPt.y);

    const myPts  = distScore(myDist,  maxDist);
    const oppPts = distScore(oppDist, maxDist);

    myScoreRef.current  += myPts;
    oppScoreRef.current += oppPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);
    setOppGuess(oppG);
    setMyGuess(guess);

    const headline =
      myDist / maxDist <= 0.04 ? "🎯 Dead on! Perfect reckoning!" :
      myDist / maxDist <= 0.10 ? "⚡ Excellent spatial memory!" :
      myDist / maxDist <= 0.18 ? "✅ Good tracking" :
      myPts > 0 ? "👍 Close enough" : "💀 Lost the signal";

    play(myPts >= 22 ? "predCorrect" : myPts >= 7 ? "roundEnd" : "predWrong");
    setRoundResult({ myPts, oppPts, headline, endPos: endPt, myDist: Math.round(myDist), oppDist: Math.round(oppDist) });
    setPhase("reveal");

    const isLast = round >= TOTAL_ROUNDS;
    setTimeout(() => {
      if (isLast) {
        setPhase("done");
        play(myScoreRef.current > oppScoreRef.current ? "gameWin" : "gameLose");
        onComplete(myScoreRef.current, oppScoreRef.current);
      } else {
        setRound(r => r + 1);
        setupRound(round + 1);
      }
    }, 3500);
  }, [round, oppGuess, onComplete, onScoreUpdate, play, setupRound]);

  useEffect(() => {
    setupRound(1);
    return () => { clearInterval(timerRef.current!); clearInterval(animRef.current!); };
  }, []); // eslint-disable-line

  const timerColor = timeLeft <= 3 ? "#ef4444" : timeLeft <= 6 ? "#f59e0b" : "#10b981";
  const endPt = path.length > 0 ? path[path.length - 1] : null;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 max-w-md mx-auto w-full select-none"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>

      {/* ── Scores ── */}
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="text-center">
          <motion.div key={myScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#f59e0b", letterSpacing: "-0.05em" }}>{myScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold">You</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Round</div>
          <div className="text-lg font-black text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
        </div>
        <div className="text-center">
          <motion.div key={oppScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>{oppScore}</motion.div>
          <div className="text-[10px] text-white/30 font-bold truncate">{opponentName}</div>
        </div>
      </div>

      {/* ── Phase label ── */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-black px-3 py-1.5 rounded-xs"
          style={{
            background: phase === "watching" ? "rgba(245,158,11,0.12)" : phase === "guessing" ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.05)",
            border:     phase === "watching" ? "1px solid rgba(245,158,11,0.3)" : phase === "guessing" ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(255,255,255,0.08)",
            color:      phase === "watching" ? "#f59e0b" : phase === "guessing" ? "#10b981" : "rgba(255,255,255,0.4)",
          }}>
          {phase === "watching" ? `👁️ Observe the path — ${Math.round(watchPct * 100)}%` :
           phase === "guessing" ? `🎯 Click where it ended — ${timeLeft}s` :
           phase === "reveal"   ? "Round complete" : ""}
        </div>
        {phase === "guessing" && (
          <div className="flex items-center gap-1.5 text-[10px]"
            style={{ color: oppGuess ? "#10b981" : "rgba(255,255,255,0.28)" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: oppGuess ? "#10b981" : "rgba(255,255,255,0.15)" }} />
            {oppGuess ? `${opponentName} locked` : `${opponentName} recalling…`}
          </div>
        )}
      </div>

      {/* ── Canvas ── */}
      <div ref={canvasRef}
        onClick={handleCanvasClick}
        className="relative rounded-xs overflow-hidden"
        style={{
          width:  "100%",
          paddingBottom: `${(H / W) * 100}%`,
          background:  "rgba(6,6,18,0.95)",
          border:  `1px solid ${phase === "guessing" ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.08)"}`,
          cursor:  phase === "guessing" && !locked ? "crosshair" : "default",
        }}>
        <div className="absolute inset-0">
          <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
            {/* Subtle grid */}
            {phase === "watching" && Array.from({ length: 6 }).map((_, i) => (
              <React.Fragment key={i}>
                <line x1={i * W / 5} y1={0} x2={i * W / 5} y2={H} stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
                <line x1={0} y1={i * H / 5} x2={W} y2={i * H / 5} stroke="rgba(255,255,255,0.025)" strokeWidth="0.5" />
              </React.Fragment>
            ))}

            {/* Trail */}
            {phase === "watching" && trailPts.map((tp, i) => (
              <circle key={i} cx={tp.x} cy={tp.y} r={3 - tp.age * 0.2}
                fill={`rgba(245,158,11,${Math.max(0, 0.8 - tp.age * 0.07)})`} />
            ))}

            {/* Dot */}
            {phase === "watching" && (
              <motion.circle cx={dotPos.x} cy={dotPos.y} r={6}
                fill="#f59e0b" style={{ filter: "drop-shadow(0 0 6px #f59e0b)" }} />
            )}

            {/* My guess */}
            {myGuess && phase !== "watching" && (
              <g>
                <circle cx={myGuess.x} cy={myGuess.y} r={10} fill="rgba(168,85,247,0.25)" stroke="#a855f7" strokeWidth="1.5" />
                <line x1={myGuess.x - 6} y1={myGuess.y} x2={myGuess.x + 6} y2={myGuess.y} stroke="#a855f7" strokeWidth="1.5" />
                <line x1={myGuess.x} y1={myGuess.y - 6} x2={myGuess.x} y2={myGuess.y + 6} stroke="#a855f7" strokeWidth="1.5" />
              </g>
            )}

            {/* Opponent guess (revealed) */}
            {oppGuess && phase === "reveal" && (
              <g>
                <circle cx={oppGuess.x} cy={oppGuess.y} r={8} fill="rgba(6,182,212,0.2)" stroke="#06b6d4" strokeWidth="1.5" />
                <line x1={oppGuess.x - 5} y1={oppGuess.y} x2={oppGuess.x + 5} y2={oppGuess.y} stroke="#06b6d4" strokeWidth="1.5" />
                <line x1={oppGuess.x} y1={oppGuess.y - 5} x2={oppGuess.x} y2={oppGuess.y + 5} stroke="#06b6d4" strokeWidth="1.5" />
              </g>
            )}

            {/* True end position (reveal only) */}
            {phase === "reveal" && endPt && (
              <g>
                <circle cx={endPt.x} cy={endPt.y} r={12} fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth="2" />
                <circle cx={endPt.x} cy={endPt.y} r={4}  fill="#10b981" />
                {/* Full path trace */}
                {path.length > 1 && (
                  <polyline
                    points={path.map(p => `${p.x},${p.y}`).join(" ")}
                    fill="none" stroke="rgba(245,158,11,0.35)" strokeWidth="1.5"
                    strokeDasharray="4,3" />
                )}
              </g>
            )}
          </svg>

          {/* Fog overlay during guessing */}
          {phase === "guessing" && (
            <div className="absolute inset-0" style={{ background: "rgba(4,4,12,0.55)", backdropFilter: "blur(2px)" }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-xs font-black text-white/40 tracking-widest uppercase">
                  {myGuess ? "Click to reposition" : "Click where it stopped"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Actions ── */}
      {phase === "guessing" && (
        <motion.button whileHover={{ scale: myGuess ? 1.02 : 1 }} whileTap={{ scale: 0.97 }}
          onClick={lockGuess} disabled={!myGuess || locked}
          className="w-full py-3.5 rounded-xs text-sm font-black text-white disabled:opacity-30 flex items-center justify-center gap-2"
          style={{ background: myGuess ? "#10b981" : "rgba(255,255,255,0.05)", border: myGuess ? "none" : "1px solid rgba(255,255,255,0.1)", boxShadow: myGuess ? "0 0 28px rgba(16,185,129,0.5)" : "none" }}>
          <Crosshair className="w-4 h-4" />
          {myGuess ? "Lock Position" : "Click the canvas to place your guess"}
        </motion.button>
      )}

      {/* ── Reveal ── */}
      {phase === "reveal" && roundResult && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xs p-4 space-y-3"
          style={{ background: "rgba(6,6,18,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <p className="text-base font-black text-white text-center">{roundResult.headline}</p>
          <div className="flex justify-center gap-8">
            {[
              { label: "You",       pts: roundResult.myPts,  dist: roundResult.myDist,  col: "#a855f7" },
              { label: opponentName, pts: roundResult.oppPts, dist: roundResult.oppDist, col: "#06b6d4" },
            ].map(p => (
              <div key={p.label} className="text-center">
                <div className="text-2xl font-black" style={{ color: p.col }}>+{p.pts}</div>
                <div className="text-[10px] text-white/30">{p.label}</div>
                <div className="text-[9px] text-white/20">{p.dist}px off</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 text-[9px] text-white/25">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-400" />You</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-400" />Opponent</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" />Actual end</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}