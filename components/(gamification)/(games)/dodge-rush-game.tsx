// =============================================================================
// GAME 8: DODGE RUSH — Move your avatar left/right to dodge falling obstacles
// components/(gamification)/(games)/dodge-rush-game.tsx
//
// Mechanic: Player controls a glowing orb at the bottom. Obstacles fall from
// the top. Use arrow keys or tap left/right halves of the screen to dodge.
// Surviving longer = more tokens. Collect gold coins for bonus points.
// Speed escalates every 5 seconds. One hit = game over.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Trophy, Zap, Coins } from "lucide-react";
import type { GameProps } from "./game-types";

interface Obstacle {
  id: string;
  x: number;       // % 0-100
  lane: number;    // 0-5
  y: number;       // % from top, animated by rAF
  speed: number;   // % per frame
  type: "spike" | "block" | "laser";
  width: number;   // % width
}

interface Coin {
  id: string;
  lane: number;
  x: number;
  y: number;
  speed: number;
  collected: boolean;
}

const LANES     = 6;
const LANE_W    = 100 / LANES; // ~16.67%
const PLAYER_Y  = 84;          // % from top (player position)
const PLAYER_W  = 12;          // % width of player hitbox
const HIT_TOL   = 10;          // % tolerance for collision

const OBS_CFG = {
  spike: { color: "#ef4444", glow: "#ef444480", label: "▼" },
  block: { color: "#f97316", glow: "#f9731680", label: "■" },
  laser: { color: "#8b5cf6", glow: "#8b5cf680", label: "━" },
};

function makeLanes(n: number) {
  return Array.from({ length: n }, (_, i) => (i * LANE_W) + LANE_W / 2);
}

const LANE_CENTERS = makeLanes(LANES);

export function DodgeRushGame({
  gameId, rewardTokens, duration = 20, onComplete, isFlash = false,
}: GameProps) {
  const [playerLane, setPlayerLane] = useState(Math.floor(LANES / 2));
  const [obstacles,  setObstacles]  = useState<Obstacle[]>([]);
  const [coins,      setCoins]      = useState<Coin[]>([]);
  const [score,      setScore]      = useState(0);
  const [survived,   setSurvived]   = useState(0);   // seconds survived
  const [timeLeft,   setTimeLeft]   = useState(duration);
  const [lives,      setLives]      = useState(3);
  const [done,       setDone]       = useState(false);
  const [hit,        setHit]        = useState(false);  // flash on hit
  const [pops,       setPops]       = useState<{ id: string; x: number; text: string }[]>([]);

  const livesRef       = useRef(3);
  const playerLaneRef  = useRef(Math.floor(LANES / 2));
  const doneRef        = useRef(false);
  const frameRef       = useRef<number>(0);
  const obstaclesRef   = useRef<Obstacle[]>([]);
  const coinsRef       = useRef<Coin[]>([]);
  const scoreRef       = useRef(0);
  const survivedRef    = useRef(0);
  const speedMultRef   = useRef(1);
  const gameAreaRef    = useRef<HTMLDivElement>(null);

  const showPop = useCallback((text: string, x: number) => {
    const id = `pop-${Date.now()}`;
    setPops(prev => [...prev, { id, x, text }]);
    setTimeout(() => setPops(prev => prev.filter(p => p.id !== id)), 700);
  }, []);

  // ── Spawn obstacles ──────────────────────────────────────────────────────────
  const spawnObstacle = useCallback(() => {
    if (doneRef.current) return;
    const lane    = Math.floor(Math.random() * LANES);
    const type    = Math.random() < 0.5 ? "spike" : Math.random() < 0.7 ? "block" : "laser";
    const width   = type === "laser" ? LANE_W * 2 : LANE_W * 0.85;
    const id      = `obs-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const speed   = (0.9 + Math.random() * 0.5) * speedMultRef.current;
    const newObs: Obstacle = { id, x: LANE_CENTERS[lane], lane, y: -8, speed, type, width };
    obstaclesRef.current = [...obstaclesRef.current, newObs];
    setObstacles([...obstaclesRef.current]);
  }, []);

  const spawnCoin = useCallback(() => {
    if (doneRef.current) return;
    const lane = Math.floor(Math.random() * LANES);
    const id   = `coin-${Date.now()}`;
    const coin: Coin = { id, lane, x: LANE_CENTERS[lane], y: -6, speed: 1.2 * speedMultRef.current, collected: false };
    coinsRef.current = [...coinsRef.current, coin];
    setCoins([...coinsRef.current]);
  }, []);

  // ── Game loop (rAF) ──────────────────────────────────────────────────────────
  const gameLoop = useCallback(() => {
    if (doneRef.current) return;

    // Move obstacles
    obstaclesRef.current = obstaclesRef.current
      .map(o => ({ ...o, y: o.y + o.speed }))
      .filter(o => {
        if (o.y > 105) return false;

        // Collision check when obstacle reaches player zone
        if (o.y >= PLAYER_Y - HIT_TOL && o.y <= PLAYER_Y + HIT_TOL) {
          const playerX = LANE_CENTERS[playerLaneRef.current];
          const dist    = Math.abs(playerX - o.x);
          if (dist < (PLAYER_W + o.width) / 2) {
            // HIT
            livesRef.current -= 1;
            setLives(livesRef.current);
            setHit(true);
            setTimeout(() => setHit(false), 300);
            if (livesRef.current <= 0) {
              doneRef.current = true;
              setDone(true);
            }
            return false; // remove obstacle after hit
          }
        }
        return true;
      });

    // Move coins
    coinsRef.current = coinsRef.current
      .map(c => ({ ...c, y: c.y + c.speed }))
      .filter(c => {
        if (c.y > 105 || c.collected) return false;
        if (c.y >= PLAYER_Y - 8 && c.y <= PLAYER_Y + 8) {
          const playerX = LANE_CENTERS[playerLaneRef.current];
          if (Math.abs(playerX - c.x) < LANE_W) {
            scoreRef.current += 15;
            setScore(scoreRef.current);
            showPop("+15 🪙", c.x);
            return false;
          }
        }
        return true;
      });

    setObstacles([...obstaclesRef.current]);
    setCoins([...coinsRef.current]);

    frameRef.current = requestAnimationFrame(gameLoop);
  }, [showPop]);

  // ── Timers ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Main timer
    const timer = setInterval(() => {
      if (doneRef.current) { clearInterval(timer); return; }
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); doneRef.current = true; setDone(true); return 0; }
        return prev - 1;
      });
      survivedRef.current += 1;
      setSurvived(survivedRef.current);
      scoreRef.current += 5;
      setScore(scoreRef.current);
      // Speed ramp
      if (survivedRef.current % 5 === 0) speedMultRef.current = Math.min(2.8, speedMultRef.current + 0.18);
    }, 1000);

    // Obstacle spawner
    let spawnDelay = 1000;
    const scheduleSpawn = () => {
      if (doneRef.current) return;
      setTimeout(() => { spawnObstacle(); spawnDelay = Math.max(400, spawnDelay - 20); scheduleSpawn(); }, spawnDelay);
    };
    scheduleSpawn();

    // Coin spawner
    const coinInterval = setInterval(() => { if (!doneRef.current) spawnCoin(); }, 2800);

    // Start loop
    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      clearInterval(timer);
      clearInterval(coinInterval);
      cancelAnimationFrame(frameRef.current);
    };
  }, [gameLoop, spawnObstacle, spawnCoin]);

  // ── Game over ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!done) return;
    cancelAnimationFrame(frameRef.current);
    const survival  = survivedRef.current / duration;
    const coinBonus = Math.floor(scoreRef.current / 15);
    const final     = Math.max(1, Math.round(rewardTokens * (0.3 + survival * 1.7)));
    setTimeout(() => onComplete(final, scoreRef.current), 1400);
  }, [done]);

  // ── Controls ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (doneRef.current) return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        playerLaneRef.current = Math.max(0, playerLaneRef.current - 1);
        setPlayerLane(playerLaneRef.current);
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        playerLaneRef.current = Math.min(LANES - 1, playerLaneRef.current + 1);
        setPlayerLane(playerLaneRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (done || !gameAreaRef.current) return;
    const rect   = gameAreaRef.current.getBoundingClientRect();
    const tapX   = e.clientX - rect.left;
    const pct    = (tapX / rect.width) * 100;
    const lane   = Math.min(LANES - 1, Math.floor(pct / LANE_W));
    playerLaneRef.current = lane;
    setPlayerLane(lane);
  };

  return (
    <div
      ref={gameAreaRef}
      onClick={handleTap}
      className="relative w-full rounded-xs overflow-hidden select-none cursor-pointer"
      style={{
        height: 280,
        background: hit
          ? "linear-gradient(135deg, #3f0a0a 0%, #1e0a0a 100%)"
          : "linear-gradient(180deg, #050b1a 0%, #0a1628 60%, #0d1f3c 100%)",
        transition: "background 0.15s",
      }}
    >
      {/* Lane dividers */}
      {LANE_CENTERS.slice(0, -1).map((_, i) => (
        <div key={i} className="absolute top-0 bottom-0 w-px"
          style={{ left: `${(i + 1) * LANE_W}%`, background: "rgba(255,255,255,0.04)" }} />
      ))}

      {/* Stars */}
      {[...Array(20)].map((_, i) => (
        <div key={i} className="absolute w-px h-px bg-white rounded-full"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 80}%`, opacity: 0.2 + Math.random() * 0.3 }} />
      ))}

      {/* Stats bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 z-20"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-white font-black text-sm" style={{ letterSpacing: "-0.02em" }}>
            <Shield className="w-3.5 h-3.5 text-cyan-400" />{score}
          </div>
          <div className="flex gap-0.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-3 h-3 rounded-full transition-all"
                style={{ background: i < lives ? "#ef4444" : "rgba(255,255,255,0.12)", boxShadow: i < lives ? "0 0 6px #ef4444" : "none" }} />
            ))}
          </div>
        </div>
        <div className="font-black text-lg tabular-nums"
          style={{ color: timeLeft <= 5 ? "#ef4444" : "#fff", letterSpacing: "-0.03em" }}>
          {timeLeft}s
        </div>
      </div>

      {/* Obstacles */}
      {obstacles.map(o => {
        const cfg = OBS_CFG[o.type];
        return (
          <div key={o.id} className="absolute flex items-center justify-center font-black text-sm rounded-xs"
            style={{
              left: `${o.x - o.width / 2}%`,
              top: `${o.y}%`,
              width: `${o.width}%`,
              height: o.type === "laser" ? 6 : 22,
              background: cfg.color,
              boxShadow: `0 0 12px ${cfg.glow}`,
              transform: "translateY(-50%)",
              zIndex: 5,
              color: "white",
              fontSize: o.type === "laser" ? 8 : 14,
            }}>
            {o.type === "laser" ? "" : cfg.label}
          </div>
        );
      })}

      {/* Coins */}
      {coins.map(c => (
        <div key={c.id} className="absolute text-base flex items-center justify-center z-5"
          style={{ left: `${c.x}%`, top: `${c.y}%`, transform: "translate(-50%,-50%)", fontSize: 18, filter: "drop-shadow(0 0 6px #f59e0b)" }}>
          🪙
        </div>
      ))}

      {/* Player */}
      <motion.div
        animate={{ left: `${LANE_CENTERS[playerLane]}%`, scale: hit ? 1.2 : 1 }}
        transition={{ type: "spring", damping: 18, stiffness: 380 }}
        className="absolute z-10 flex items-center justify-center"
        style={{
          top: `${PLAYER_Y}%`,
          width: `${PLAYER_W}%`,
          height: 28,
          transform: "translate(-50%,-50%)",
          background: "radial-gradient(circle at 40% 35%, #7dd3fc, #3b82f6)",
          borderRadius: "50%",
          boxShadow: hit ? "0 0 30px #ef4444, 0 0 60px #ef444440" : "0 0 18px #3b82f6, 0 0 40px #3b82f640",
          border: "1.5px solid rgba(255,255,255,0.5)",
        }}
      >
        <Zap className="w-3.5 h-3.5 text-white" />
      </motion.div>

      {/* Score pops */}
      {pops.map(p => (
        <motion.div key={p.id}
          initial={{ opacity: 1, y: 0 }} animate={{ opacity: 0, y: -35 }}
          transition={{ duration: 0.6 }}
          className="absolute pointer-events-none font-black text-xs z-30 whitespace-nowrap"
          style={{ left: `${p.x}%`, top: "60%", transform: "translateX(-50%)", color: "#fbbf24", textShadow: "0 2px 6px #000" }}>
          {p.text}
        </motion.div>
      ))}

      {/* Controls hint */}
      {!done && survived < 3 && (
        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px]"
          style={{ color: "rgba(255,255,255,0.25)" }}>
          ← → keys or tap left/right to dodge
        </div>
      )}

      {/* Game over */}
      {done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(5px)" }}>
          <Trophy className="w-10 h-10 text-amber-400" />
          <p className="text-3xl font-black text-white" style={{ letterSpacing: "-0.04em" }}>{survived}s survived</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{score} pts · {3 - lives} hit{3 - lives !== 1 ? "s" : ""}</p>
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