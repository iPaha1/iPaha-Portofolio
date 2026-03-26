// =============================================================================
// MULTIPLAYER GAME 5: SPEED SCRAMBLE
// components/(gamification)/(games)/multiplayer/speed-scramble.tsx
//
// Mechanic: Everyone sees the SAME scrambled word. Race to unscramble it and
// type the answer first. Points scale with speed: 50pts instantly → 10pts near
// timeout. Second and third correct also score (35, 20pts) so non-first players
// still compete hard. Wrong answer = -5pts and a 2s lockout.
// Words get longer and harder each round. 10 rounds total.
// The tension of KNOWING the word but battling your fingers is peak addictive.
// =============================================================================
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shuffle, Trophy, Lock } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Player { userId: string; displayName: string; score: number; isMe: boolean }

export interface SpeedScrambleRound {
  roundNumber: number;
  word:        string;        // actual word (all caps)
  scrambled:   string;        // shuffled letters
  category:    string;
  timeLimit:   number;
  startedAt:   number;
  solvedBy:    string[];      // userIds who solved it (populated server-side via events)
}

interface SpeedScrambleProps {
  roomCode:     string;
  myUserId:     string;
  isHost:       boolean;
  players:      Player[];
  roundData:    SpeedScrambleRound | null;
  totalRounds?: number;
  onComplete:   (score: number) => void;
  onScoreUpdate:(score: number, isFinal?: boolean) => void;
}

// ─── Word bank ────────────────────────────────────────────────────────────────

const SCRAMBLE_WORDS: { word: string; category: string }[] = [
  // 4 letters
  { word: "STAR",    category: "Space"     },
  { word: "FISH",    category: "Animals"   },
  { word: "FIRE",    category: "Elements"  },
  { word: "WIND",    category: "Nature"    },
  { word: "BOLT",    category: "Weather"   },
  // 5 letters
  { word: "BRAIN",   category: "Body"      },
  { word: "STORM",   category: "Weather"   },
  { word: "FLAME",   category: "Elements"  },
  { word: "DREAM",   category: "Mind"      },
  { word: "CLOCK",   category: "Objects"   },
  { word: "SWORD",   category: "Weapons"   },
  { word: "CLOUD",   category: "Weather"   },
  { word: "GLOBE",   category: "Geography" },
  // 6 letters
  { word: "PLANET",  category: "Space"     },
  { word: "FROZEN",  category: "States"    },
  { word: "MIRROR",  category: "Objects"   },
  { word: "JUNGLE",  category: "Nature"    },
  { word: "CASTLE",  category: "Places"    },
  { word: "WIZARD",  category: "Fantasy"   },
  { word: "SPIDER",  category: "Animals"   },
  // 7 letters
  { word: "DIAMOND", category: "Gems"      },
  { word: "HORIZON", category: "Nature"    },
  { word: "CAPTAIN", category: "Titles"    },
  { word: "JOURNEY", category: "Adventure" },
  { word: "BALANCE", category: "Concepts"  },
  { word: "PYRAMID", category: "Structures"},
  { word: "LANTERN", category: "Objects"   },
];

const PLAYER_COLORS = ["#ef4444","#3b82f6","#10b981","#f59e0b","#8b5cf6","#ec4899"];
const POSITION_PTS  = [50, 35, 20, 10]; // pts for 1st, 2nd, 3rd, 4th+ correct

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scramble(word: string): string {
  const arr = word.split("");
  // Guarantee it's different from the original
  let result = word;
  let attempts = 0;
  while (result === word && attempts < 20) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    result = arr.join("");
    attempts++;
  }
  return result;
}

// ─── Round builder ────────────────────────────────────────────────────────────

export function buildSpeedScrambleRound(roundNumber: number): SpeedScrambleRound {
  const pool = roundNumber < 4
    ? SCRAMBLE_WORDS.filter(w => w.word.length <= 5)
    : roundNumber < 7
    ? SCRAMBLE_WORDS.filter(w => w.word.length === 6)
    : SCRAMBLE_WORDS.filter(w => w.word.length >= 7);

  const entry    = pool[Math.floor(Math.random() * pool.length)];
  const timeLimit = Math.max(6000, 12000 - roundNumber * 400);

  return {
    roundNumber,
    word:      entry.word,
    scrambled: scramble(entry.word),
    category:  entry.category,
    timeLimit,
    startedAt: Date.now(),
    solvedBy:  [],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SpeedScramble({
  roomCode, myUserId, isHost,
  players: initialPlayers,
  roundData, totalRounds = 10,
  onComplete, onScoreUpdate,
}: SpeedScrambleProps) {

  const [myScore,     setMyScore]    = useState(0);
  const [liveBoard,   setLiveBoard]  = useState<Player[]>(initialPlayers);
  const [input,       setInput]      = useState("");
  const [answered,    setAnswered]   = useState(false);
  const [locked,      setLocked]     = useState(false);   // 2s penalty lockout
  const [lockTimer,   setLockTimer]  = useState(0);
  const [flash,       setFlash]      = useState<"correct"|"wrong"|null>(null);
  const [timerRatio,  setTimerRatio] = useState(1);
  const [roundsDone,  setRoundsDone] = useState(0);
  const [done,        setDone]       = useState(false);
  const [pops,        setPops]       = useState<{id:string;text:string;color:string}[]>([]);
  const [activeRound, setActiveRound]= useState<SpeedScrambleRound|null>(null);
  const [solvedCount, setSolvedCount]= useState(0); // how many others solved before me

  const myScoreRef    = useRef(0);
  const answeredRef   = useRef(false);
  const solvedRef     = useRef(0);
  const lastRoundRef  = useRef(-1);
  const rafRef        = useRef(0);
  const lockRef       = useRef<NodeJS.Timeout|null>(null);
  const lockRafRef    = useRef(0);
  const inputRef      = useRef<HTMLInputElement>(null);
  const colorMap      = useRef(new Map<string,string>());
  initialPlayers.forEach((p,i)=>{ if(!colorMap.current.has(p.userId)) colorMap.current.set(p.userId, PLAYER_COLORS[i%PLAYER_COLORS.length]); });

  const showPop = useCallback((text:string,color:string)=>{
    const id=`pop-${Date.now()}`;
    setPops(p=>[...p,{id,text,color}]);
    setTimeout(()=>setPops(p=>p.filter(x=>x.id!==id)),900);
  },[]);

  const broadcastRound = useCallback(async(round:SpeedScrambleRound)=>{
    try {
      await fetch(`/api/multiplayer/rooms/${roomCode}/round`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({roundData:round}),
      });
    } catch{ /* silent */ }
  },[roomCode]);

  // Host mount
  useEffect(()=>{
    if(!isHost || roundData!==null) return;
    const t=setTimeout(()=>broadcastRound(buildSpeedScrambleRound(0)),800);
    return ()=>clearTimeout(t);
  },[]);

  // Activate round
  useEffect(()=>{
    if(!roundData || roundData.roundNumber===lastRoundRef.current) return;
    lastRoundRef.current=roundData.roundNumber;
    answeredRef.current=false; solvedRef.current=0;
    setAnswered(false); setFlash(null); setInput(""); setLocked(false);
    setSolvedCount(0); setActiveRound(roundData);
    cancelAnimationFrame(rafRef.current);
    if(lockRef.current) clearTimeout(lockRef.current);

    const remaining=roundData.timeLimit-(Date.now()-roundData.startedAt);
    if(remaining<=0){ handleTimeout(roundData); return; }

    const start=performance.now();
    const tick=(now:number)=>{
      const ratio=Math.max(0,1-(now-start)/remaining);
      setTimerRatio(ratio);
      if(ratio>0 && !answeredRef.current) rafRef.current=requestAnimationFrame(tick);
      else if(ratio<=0 && !answeredRef.current) handleTimeout(roundData);
    };
    rafRef.current=requestAnimationFrame(tick);
    setTimeout(()=>inputRef.current?.focus(),100);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[roundData?.roundNumber,roundData?.startedAt]);

  // Sync solved count from roundData.solvedBy (updated via polling)
  useEffect(()=>{
    if(!roundData) return;
    const others=(roundData.solvedBy||[]).filter(id=>id!==myUserId).length;
    solvedRef.current=others;
    setSolvedCount(others);
  },[roundData?.solvedBy]);

  useEffect(()=>{
    setLiveBoard(initialPlayers.map(p=>p.userId===myUserId?{...p,score:myScoreRef.current}:p));
  },[initialPlayers,myUserId]);

  useEffect(()=>{
    if(roundsDone>=totalRounds && !done){
      setDone(true);
      onScoreUpdate(myScoreRef.current,true);
      setTimeout(()=>onComplete(myScoreRef.current),2000);
    }
  },[roundsDone,done,totalRounds]);

  useEffect(()=>()=>{cancelAnimationFrame(rafRef.current);if(lockRef.current)clearTimeout(lockRef.current);},[]);

  const handleTimeout=useCallback((rd:SpeedScrambleRound)=>{
    if(answeredRef.current) return;
    answeredRef.current=true;
    setAnswered(true); setFlash(null); setTimerRatio(0);
    showPop("Time's up!", "#ef4444");
    setRoundsDone(r=>r+1);
    if(isHost){
      const next=rd.roundNumber+1;
      if(next<totalRounds) setTimeout(()=>broadcastRound(buildSpeedScrambleRound(next)),2000);
    }
  },[isHost,totalRounds,broadcastRound,showPop]);

  const handleGuess=useCallback(()=>{
    if(answeredRef.current||locked||!activeRound||done) return;
    const guess=input.trim().toUpperCase();
    if(!guess) return;

    if(guess===activeRound.word){
      cancelAnimationFrame(rafRef.current);
      answeredRef.current=true;
      setAnswered(true);
      // Score based on position (how many already solved)
      const position=solvedRef.current;
      const basePts=POSITION_PTS[Math.min(position,POSITION_PTS.length-1)];
      const speedBonus=Math.round(timerRatio*15);
      const pts=basePts+speedBonus;
      myScoreRef.current+=pts;
      setFlash("correct");
      const posLabel=position===0?"🥇 First!":position===1?"🥈 Second":position===2?"🥉 Third":"";
      showPop(`+${pts} ${posLabel}`, "#10b981");
      setMyScore(myScoreRef.current);
      onScoreUpdate(myScoreRef.current);
      setRoundsDone(r=>r+1);
      if(isHost){
        const next=activeRound.roundNumber+1;
        if(next<totalRounds) setTimeout(()=>broadcastRound(buildSpeedScrambleRound(next)),2000);
      }
    } else {
      // Wrong — 2s lockout
      myScoreRef.current=Math.max(0,myScoreRef.current-5);
      setFlash("wrong");
      setLocked(true); setInput("");
      setMyScore(myScoreRef.current);
      onScoreUpdate(myScoreRef.current);
      showPop("−5 ✗", "#ef4444");

      // Lockout countdown
      let t=2;
      setLockTimer(t);
      const countdown=()=>{
        t--;
        setLockTimer(t);
        if(t<=0){ setLocked(false); setFlash(null); inputRef.current?.focus(); }
        else lockRef.current=setTimeout(countdown,1000);
      };
      lockRef.current=setTimeout(countdown,1000);
    }
  },[input,activeRound,done,locked,timerRatio,isHost,totalRounds,broadcastRound,onScoreUpdate,showPop]);

  const myColor=colorMap.current.get(myUserId)??"#f59e0b";
  const bgColor=flash==="correct"?"#052e16":flash==="wrong"?"#3f0a0a":"#08081a";

  // Letter tiles for the scrambled word
  const scrambledLetters = activeRound?.scrambled.split("") ?? [];

  return (
    <div className="flex gap-3 h-full">
      <div className="flex-1 relative rounded-xs overflow-hidden flex flex-col"
        style={{background:bgColor,transition:"background 0.18s",border:`1px solid ${myColor}25`}}>

        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 flex-shrink-0"
          style={{background:"rgba(0,0,0,0.5)",backdropFilter:"blur(6px)",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{background:myColor,boxShadow:`0 0 8px ${myColor}`}} />
            <span className="text-xs font-black text-white">You · {myScore}pts</span>
            {solvedCount>0 && (
              <span className="text-[10px] font-bold" style={{color:"rgba(255,255,255,0.35)"}}>
                · {solvedCount} solved
              </span>
            )}
          </div>
          <div className="text-[11px] font-bold" style={{color:"rgba(255,255,255,0.4)"}}>
            Round {(activeRound?.roundNumber??0)+1}/{totalRounds}
          </div>
        </div>

        {/* Timer */}
        <div className="h-1.5" style={{background:"rgba(255,255,255,0.07)"}}>
          <div className="h-full" style={{width:`${timerRatio*100}%`,background:timerRatio<0.25?"#ef4444":myColor,transition:"background 0.2s"}} />
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-5 py-3">
          {activeRound ? (
            <>
              {/* Category */}
              <span className="text-[10px] tracking-[0.2em] uppercase font-bold px-3 py-1 rounded-xs"
                style={{background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.3)",color:"#818cf8"}}>
                {activeRound.category}
              </span>

              {/* Scrambled letter tiles */}
              <AnimatePresence mode="wait">
                <motion.div key={`scramble-${activeRound.roundNumber}`}
                  initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.05}}
                  className="flex gap-1.5 flex-wrap justify-center">
                  {scrambledLetters.map((letter,i)=>(
                    <motion.div key={`${activeRound.roundNumber}-${i}`}
                      initial={{scale:0,rotate:-90}} animate={{scale:1,rotate:0}}
                      transition={{type:"spring",damping:14,stiffness:300,delay:i*0.04}}
                      className="w-10 h-11 rounded-xs flex items-center justify-center font-black text-xl"
                      style={{
                        background: answered&&flash==="correct"
                          ? "rgba(16,185,129,0.25)"
                          : "rgba(255,255,255,0.08)",
                        border: answered&&flash==="correct"
                          ? "2px solid #10b981"
                          : `2px solid rgba(255,255,255,0.15)`,
                        color: answered&&flash==="correct"?"#10b981":"rgba(255,255,255,0.9)",
                        letterSpacing:"-0.03em",
                      }}>
                      {answered&&flash==="correct" ? activeRound.word[i] : letter}
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>

              {/* Lockout indicator */}
              {locked && (
                <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xs"
                  style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)"}}>
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-black text-red-400">Wrong — wait {lockTimer}s</span>
                </motion.div>
              )}

              {/* Input */}
              {!answered && (
                <div className="flex gap-2 w-full max-w-xs">
                  <input ref={inputRef} value={input}
                    onChange={e=>setInput(e.target.value.toUpperCase().replace(/[^A-Z]/g,""))}
                    onKeyDown={e=>{ if(e.key==="Enter") handleGuess(); }}
                    placeholder="UNSCRAMBLE IT…"
                    disabled={locked}
                    maxLength={activeRound.word.length}
                    className="flex-1 px-3 py-2.5 rounded-xs font-black text-sm text-center tracking-widest outline-none"
                    style={{
                      background:locked?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.07)",
                      border:`1.5px solid ${locked?"#ef4444":flash==="wrong"?"#ef4444":`${myColor}50`}`,
                      color:"white",letterSpacing:"0.1em",opacity:locked?0.5:1,
                    }}
                  />
                  <motion.button whileHover={{scale:locked?1:1.05}} whileTap={{scale:locked?1:0.95}}
                    onClick={handleGuess} disabled={locked}
                    className="px-4 py-2.5 rounded-xs font-black text-sm text-black disabled:opacity-40"
                    style={{background:myColor,boxShadow:locked?"none":`0 0 20px ${myColor}50`}}>
                    Go
                  </motion.button>
                </div>
              )}

              {answered && (
                <p className="text-xs font-bold" style={{color:flash==="correct"?"#10b981":"rgba(255,255,255,0.4)"}}>
                  {flash==="correct" ? `✓ ${activeRound.word} — well done!` : `The word was: ${activeRound.word}`}
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold" style={{color:"rgba(255,255,255,0.3)"}}>
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
          const col=colorMap.current.get(p.userId)??"#94a3b8";
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
          <div>1st: <span style={{color:"#f59e0b"}}>+50pts</span></div>
          <div>2nd: <span style={{color:"#94a3b8"}}>+35pts</span></div>
          <div>Wrong: <span style={{color:"#ef4444"}}>−5pts + lockout</span></div>
        </div>
      </div>
    </div>
  );
}