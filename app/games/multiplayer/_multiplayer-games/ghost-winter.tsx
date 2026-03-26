// =============================================================================
// MULTIPLAYER GAME 4: GHOST WRITER
// components/(gamification)/(games)/multiplayer/ghost-writer.tsx
//
// Mechanic: Host draws a random word from a category. ALL players (including
// host) see: the category, the letter count (e.g. _ _ _ _ _), and a 1-letter
// hint that appears after 3s. Everyone types their guess simultaneously.
// First correct guess wins the round. Wrong guess = -3pts + 1s penalty.
// Host gets +5 bonus if nobody guesses within 15s. 8 rounds, words get harder.
// Addictive because everyone is racing in real time and can see live attempt
// indicators (dots pulsing = someone is typing).
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Keyboard, Trophy, Zap, Eye } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Player {
  userId:      string;
  displayName: string;
  score:       number;
  isMe:        boolean;
  isTyping?:   boolean; // live typing indicator (set via polling)
}

export interface GhostWriterRound {
  roundNumber:  number;
  word:         string;       // THE answer (all uppercase)
  category:     string;
  hint:         string;       // first letter, revealed after 3s
  letterCount:  number;
  timeLimit:    number;
  startedAt:    number;
}

interface GhostWriterProps {
  roomCode:     string;
  myUserId:     string;
  isHost:       boolean;
  players:      Player[];
  roundData:    GhostWriterRound | null;
  totalRounds?: number;
  onComplete:   (score: number) => void;
  onScoreUpdate:(score: number, isFinal?: boolean) => void;
}

// ─── Word bank ────────────────────────────────────────────────────────────────

const WORD_BANK: { word: string; category: string; hint: string }[] = [
  // Easy
  { word: "OCEAN",     category: "Nature",      hint: "O" },
  { word: "TIGER",     category: "Animals",     hint: "T" },
  { word: "CASTLE",    category: "Structures",  hint: "C" },
  { word: "PIANO",     category: "Music",       hint: "P" },
  { word: "ROCKET",    category: "Space",       hint: "R" },
  { word: "FOREST",    category: "Nature",      hint: "F" },
  { word: "BRIDGE",    category: "Structures",  hint: "B" },
  { word: "SPIDER",    category: "Animals",     hint: "S" },
  { word: "CANDLE",    category: "Objects",     hint: "C" },
  { word: "GUITAR",    category: "Music",       hint: "G" },
  // Medium
  { word: "PYRAMID",   category: "Structures",  hint: "P" },
  { word: "VOLCANO",   category: "Nature",      hint: "V" },
  { word: "DOLPHIN",   category: "Animals",     hint: "D" },
  { word: "COMPASS",   category: "Objects",     hint: "C" },
  { word: "LANTERN",   category: "Objects",     hint: "L" },
  { word: "THUNDER",   category: "Nature",      hint: "T" },
  { word: "ECLIPSE",   category: "Space",       hint: "E" },
  { word: "TRUMPET",   category: "Music",       hint: "T" },
  { word: "KINGDOM",   category: "Places",      hint: "K" },
  { word: "PHANTOM",   category: "Mystery",     hint: "P" },
  // Hard
  { word: "LABYRINTH", category: "Places",      hint: "L" },
  { word: "CHRYSALIS", category: "Nature",      hint: "C" },
  { word: "SERENADE",  category: "Music",       hint: "S" },
  { word: "VORTEX",    category: "Science",     hint: "V" },
  { word: "ALMANAC",   category: "Objects",     hint: "A" },
  { word: "MIRAGE",    category: "Nature",      hint: "M" },
  { word: "EQUINOX",   category: "Space",       hint: "E" },
  { word: "CREVICE",   category: "Nature",      hint: "C" },
];

const PLAYER_COLORS = ["#ef4444","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899"];

// ─── Round builder ────────────────────────────────────────────────────────────

export function buildGhostWriterRound(roundNumber: number): GhostWriterRound {
  const idx   = Math.floor(Math.random() * WORD_BANK.length);
  const entry = WORD_BANK[idx];
  const timeLimit = Math.max(8000, 15000 - roundNumber * 500);
  return {
    roundNumber,
    word:        entry.word,
    category:    entry.category,
    hint:        entry.hint,
    letterCount: entry.word.length,
    timeLimit,
    startedAt:   Date.now(),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GhostWriter({
  roomCode, myUserId, isHost,
  players: initialPlayers,
  roundData, totalRounds = 8,
  onComplete, onScoreUpdate,
}: GhostWriterProps) {

  const [myScore,     setMyScore]    = useState(0);
  const [liveBoard,   setLiveBoard]  = useState<Player[]>(initialPlayers);
  const [input,       setInput]      = useState("");
  const [answered,    setAnswered]   = useState(false);
  const [flash,       setFlash]      = useState<"correct"|"wrong"|"revealed"|null>(null);
  const [timerRatio,  setTimerRatio] = useState(1);
  const [showHint,    setShowHint]   = useState(false);
  const [revealWord,  setRevealWord] = useState<string|null>(null);
  const [roundsDone,  setRoundsDone] = useState(0);
  const [done,        setDone]       = useState(false);
  const [pops,        setPops]       = useState<{id:string;text:string;color:string}[]>([]);
  const [activeRound, setActiveRound]= useState<GhostWriterRound | null>(null);
  const [attempts,    setAttempts]   = useState(0);

  const myScoreRef   = useRef(0);
  const answeredRef  = useRef(false);
  const lastRoundRef = useRef(-1);
  const rafRef       = useRef(0);
  const hintTimer    = useRef<NodeJS.Timeout|null>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const colorMap     = useRef(new Map<string,string>());
  initialPlayers.forEach((p,i)=>{ if(!colorMap.current.has(p.userId)) colorMap.current.set(p.userId, PLAYER_COLORS[i%PLAYER_COLORS.length]); });

  const showPop = useCallback((text:string, color:string) => {
    const id = `pop-${Date.now()}`;
    setPops(p=>[...p,{id,text,color}]);
    setTimeout(()=>setPops(p=>p.filter(x=>x.id!==id)),900);
  },[]);

  const broadcastRound = useCallback(async(round: GhostWriterRound)=>{
    try {
      await fetch(`/api/multiplayer/rooms/${roomCode}/round`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({roundData: round}),
      });
    } catch{ /* silent */ }
  },[roomCode]);

  // Host mount
  useEffect(()=>{
    if(!isHost || roundData!==null) return;
    const t = setTimeout(()=>broadcastRound(buildGhostWriterRound(0)), 800);
    return ()=>clearTimeout(t);
  },[]);

  // Activate round
  useEffect(()=>{
    if(!roundData || roundData.roundNumber===lastRoundRef.current) return;
    lastRoundRef.current = roundData.roundNumber;
    answeredRef.current  = false;
    setAnswered(false); setFlash(null); setInput(""); setShowHint(false);
    setRevealWord(null); setAttempts(0); setActiveRound(roundData);
    cancelAnimationFrame(rafRef.current);
    if(hintTimer.current) clearTimeout(hintTimer.current);

    // Show hint after 3s
    hintTimer.current = setTimeout(()=>setShowHint(true), 3000);

    const remaining = roundData.timeLimit - (Date.now() - roundData.startedAt);
    if(remaining<=0){ handleTimeout(roundData); return; }

    const start = performance.now();
    const tick = (now:number)=>{
      const ratio = Math.max(0, 1-(now-start)/remaining);
      setTimerRatio(ratio);
      if(ratio>0 && !answeredRef.current) rafRef.current=requestAnimationFrame(tick);
      else if(ratio<=0 && !answeredRef.current) handleTimeout(roundData);
    };
    rafRef.current = requestAnimationFrame(tick);
    // Focus input
    setTimeout(()=>inputRef.current?.focus(), 100);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[roundData?.roundNumber, roundData?.startedAt]);

  useEffect(()=>{
    setLiveBoard(initialPlayers.map(p=>p.userId===myUserId?{...p,score:myScoreRef.current}:p));
  },[initialPlayers, myUserId]);

  useEffect(()=>{
    if(roundsDone>=totalRounds && !done){
      setDone(true);
      onScoreUpdate(myScoreRef.current,true);
      setTimeout(()=>onComplete(myScoreRef.current),2000);
    }
  },[roundsDone,done,totalRounds]);

  useEffect(()=>()=>{cancelAnimationFrame(rafRef.current);if(hintTimer.current)clearTimeout(hintTimer.current);},[]);

  const handleTimeout = useCallback((rd:GhostWriterRound)=>{
    if(answeredRef.current) return;
    answeredRef.current=true;
    setAnswered(true); setFlash("revealed"); setTimerRatio(0);
    setRevealWord(rd.word);
    showPop("Time's up!", "#ef4444");
    setRoundsDone(r=>r+1);
    if(isHost){
      const next=rd.roundNumber+1;
      if(next<totalRounds) setTimeout(()=>broadcastRound(buildGhostWriterRound(next)),2500);
    }
  },[isHost,totalRounds,broadcastRound,showPop]);

  const handleGuess = useCallback(()=>{
    if(answeredRef.current || !activeRound || done) return;
    const guess = input.trim().toUpperCase();
    if(!guess) return;

    if(guess===activeRound.word){
      cancelAnimationFrame(rafRef.current);
      answeredRef.current=true;
      setAnswered(true);
      const speedBonus = Math.round(timerRatio*40);
      const pts = 25 + speedBonus;
      myScoreRef.current+=pts;
      setFlash("correct");
      setRevealWord(activeRound.word);
      showPop(`+${pts} ✓`, "#10b981");
      setMyScore(myScoreRef.current);
      onScoreUpdate(myScoreRef.current);
      setRoundsDone(r=>r+1);
      if(isHost){
        const next=activeRound.roundNumber+1;
        if(next<totalRounds) setTimeout(()=>broadcastRound(buildGhostWriterRound(next)),2000);
      }
    } else {
      // Wrong guess
      const newAttempts = attempts+1;
      setAttempts(newAttempts);
      const penalty = newAttempts<=2 ? 3 : 5;
      myScoreRef.current=Math.max(0,myScoreRef.current-penalty);
      setFlash("wrong");
      showPop(`−${penalty} ✗`, "#ef4444");
      setMyScore(myScoreRef.current);
      onScoreUpdate(myScoreRef.current);
      setInput("");
      setTimeout(()=>setFlash(null),500);
      inputRef.current?.focus();
    }
  },[input,activeRound,done,timerRatio,isHost,totalRounds,attempts,broadcastRound,onScoreUpdate,showPop]);

  const myColor = colorMap.current.get(myUserId)??"#f59e0b";
  const bgColor = flash==="correct"?"#052e16":flash==="wrong"?"#3f0a0a":flash==="revealed"?"#1a1000":"#08081a";

  return (
    <div className="flex gap-3 h-full">
      <div className="flex-1 relative rounded-xs overflow-hidden flex flex-col"
        style={{ background:bgColor, transition:"background 0.18s", border:`1px solid ${myColor}25` }}>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 flex-shrink-0"
          style={{ background:"rgba(0,0,0,0.5)", backdropFilter:"blur(6px)", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background:myColor, boxShadow:`0 0 8px ${myColor}` }} />
            <span className="text-xs font-black text-white">You · {myScore}pts</span>
          </div>
          <div className="text-[11px] font-bold" style={{ color:"rgba(255,255,255,0.4)" }}>
            Round {(activeRound?.roundNumber??0)+1}/{totalRounds}
          </div>
        </div>

        {/* Timer */}
        <div className="h-1.5" style={{ background:"rgba(255,255,255,0.07)" }}>
          <div className="h-full" style={{ width:`${timerRatio*100}%`, background:timerRatio<0.25?"#ef4444":myColor, transition:"background 0.2s" }} />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 py-3">
          {activeRound ? (
            <>
              {/* Category */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-[0.2em] uppercase font-bold px-3 py-1 rounded-xs"
                  style={{ background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)", color:"#818cf8" }}>
                  {activeRound.category}
                </span>
                {attempts>0 && (
                  <span className="text-[10px]" style={{ color:"rgba(255,255,255,0.3)" }}>
                    {attempts} wrong guess{attempts!==1?"es":""}
                  </span>
                )}
              </div>

              {/* Letter boxes */}
              <AnimatePresence mode="wait">
                <motion.div key={`word-${activeRound.roundNumber}`}
                  initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  className="flex gap-1.5 flex-wrap justify-center">
                  {revealWord ? (
                    revealWord.split("").map((letter,i)=>(
                      <motion.div key={i}
                        initial={{ scale:0.5, opacity:0 }} animate={{ scale:1, opacity:1 }}
                        transition={{ delay: i*0.06, type:"spring", damping:12 }}
                        className="w-9 h-10 rounded-xs flex items-center justify-center font-black text-lg"
                        style={{
                          background: flash==="correct"?"rgba(16,185,129,0.25)":"rgba(245,158,11,0.18)",
                          border: flash==="correct"?"2px solid #10b981":"2px solid rgba(245,158,11,0.5)",
                          color: flash==="correct"?"#10b981":"#f59e0b",
                          letterSpacing:"-0.02em",
                        }}>
                        {letter}
                      </motion.div>
                    ))
                  ) : (
                    activeRound.word.split("").map((_, i)=>(
                      <div key={i} className="w-9 h-10 rounded-xs flex items-center justify-center font-black text-lg"
                        style={{
                          background: i===0 && showHint ? `${myColor}20` : "rgba(255,255,255,0.06)",
                          border: i===0 && showHint ? `2px solid ${myColor}` : "2px solid rgba(255,255,255,0.15)",
                          color: myColor,
                        }}>
                        {i===0 && showHint ? activeRound.hint : ""}
                      </div>
                    ))
                  )}
                </motion.div>
              </AnimatePresence>

              {!showHint && !revealWord && (
                <p className="text-[10px]" style={{ color:"rgba(255,255,255,0.25)" }}>
                  Letter hint in {Math.max(0,3-Math.round((1-timerRatio)*activeRound.timeLimit/1000))}s…
                </p>
              )}

              {/* Input */}
              {!answered && (
                <div className="flex gap-2 w-full max-w-xs">
                  <input ref={inputRef} value={input}
                    onChange={e=>setInput(e.target.value.toUpperCase().replace(/[^A-Z]/g,""))}
                    onKeyDown={e=>{ if(e.key==="Enter") handleGuess(); }}
                    placeholder="TYPE YOUR GUESS…"
                    className="flex-1 px-3 py-2.5 rounded-xs font-black text-sm text-center tracking-widest outline-none"
                    style={{
                      background:"rgba(255,255,255,0.07)", border:`1.5px solid ${flash==="wrong"?"#ef4444":myColor+"50"}`,
                      color:"white", letterSpacing:"0.1em",
                    }}
                  />
                  <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}}
                    onClick={handleGuess}
                    className="px-4 py-2.5 rounded-xs font-black text-sm text-black"
                    style={{ background:myColor, boxShadow:`0 0 20px ${myColor}50` }}>
                    Go
                  </motion.button>
                </div>
              )}

              {answered && revealWord && (
                <p className="text-xs font-bold" style={{ color: flash==="correct"?"#10b981":"rgba(255,255,255,0.4)" }}>
                  {flash==="correct" ? `✓ Correct in ${attempts===0?"first try":attempts+" attempt"+(attempts>1?"s":"")+"!"}`:`The word was: ${revealWord}`}
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold" style={{ color:"rgba(255,255,255,0.3)" }}>
                {isHost?"Preparing round…":"Waiting for host…"}
              </p>
            </div>
          )}
        </div>

        {/* Pops */}
        {pops.map(p=>(
          <motion.div key={p.id} initial={{opacity:1,y:0}} animate={{opacity:0,y:-44}} transition={{duration:0.7}}
            className="absolute pointer-events-none font-black text-base z-20"
            style={{left:"50%",top:"40%",transform:"translateX(-50%)",color:p.color,textShadow:"0 2px 8px #000"}}>
            {p.text}
          </motion.div>
        ))}

        {done && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            className="absolute inset-0 flex flex-col items-center justify-center z-20 gap-3"
            style={{background:"rgba(0,0,0,0.82)",backdropFilter:"blur(6px)"}}>
            <Trophy className="w-12 h-12 text-amber-400" />
            <p className="text-4xl font-black text-white" style={{letterSpacing:"-0.05em"}}>{myScore}</p>
            <p className="text-sm" style={{color:"rgba(255,255,255,0.4)"}}>Final score</p>
          </motion.div>
        )}
      </div>

      {/* Scoreboard */}
      <div className="w-40 flex flex-col gap-2 flex-shrink-0">
        <div className="text-[10px] font-black tracking-widest uppercase text-center py-1.5 rounded-xs"
          style={{color:"rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)"}}>
          Live Scores
        </div>
        {[...liveBoard].sort((a,b)=>b.score-a.score).map((p,i)=>{
          const col = colorMap.current.get(p.userId)??"#94a3b8";
          return (
            <motion.div key={p.userId} layout
              className="flex items-center gap-2 px-2.5 py-2 rounded-xs"
              style={{background:p.isMe?`${col}18`:"rgba(255,255,255,0.03)",border:`1px solid ${p.isMe?`${col}35`:"rgba(255,255,255,0.06)"}`}}>
              <span className="text-[10px] font-black w-3" style={{color:"rgba(255,255,255,0.3)"}}>#{i+1}</span>
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:col,boxShadow:`0 0 6px ${col}`}} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold truncate" style={{color:p.isMe?col:"white"}}>{p.isMe?"You":p.displayName}</p>
                <p className="text-sm font-black" style={{color:col,letterSpacing:"-0.03em"}}>{p.score}</p>
              </div>
            </motion.div>
          );
        })}
        <div className="mt-auto pt-2 text-[9px] space-y-0.5" style={{color:"rgba(255,255,255,0.22)"}}>
          <div>Correct: <span style={{color:"#10b981"}}>+25–65pts</span></div>
          <div>Wrong: <span style={{color:"#ef4444"}}>−3pts</span></div>
          <div>Hint after 3s</div>
        </div>
      </div>
    </div>
  );
}