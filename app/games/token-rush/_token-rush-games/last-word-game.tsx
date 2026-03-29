// =============================================================================
// TOKEN RUSH — Game 14: Last Word
// app/token-rush/_games/last-word.tsx
//
// A linguistic endgame duel. Both players share the same starting word.
// They alternate changing exactly ONE letter per turn to form a new valid word.
// Each word played scores its Scrabble letter-value sum.
// Players may CHALLENGE a word (claim it's invalid) — correct challenge nulls
// the opponent's score that turn; wrong challenge costs the challenger 10 pts.
// A player who cannot form a valid one-letter change within 12s loses the
// round. 6 rounds total.
//
// ANTI-CHEAT: Word validity validated server-side against a word list.
// Challenges resolved server-side — client cannot fake valid words.
//
// DEMO MODE: Validation uses a local word set. Replace with server endpoint.
// =============================================================================
"use client";

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check, X, ArrowRight } from "lucide-react";
import { useGameSound } from "../_token-rush/use-game-sound";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface LastWordProps {
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

const TOTAL_ROUNDS     = 6;
const TURN_SECONDS     = 12;
const CHALLENGE_PENALTY = 10; // wrong challenge cost
const FORFEIT_PENALTY  = 15;  // can't form a word

// ── Scrabble letter values ────────────────────────────────────────────────────
const LETTER_VALUES: Record<string, number> = {
  A:1, B:3, C:3, D:2, E:1, F:4, G:2, H:4, I:1, J:8,
  K:5, L:1, M:3, N:1, O:1, P:3, Q:10,R:1, S:1, T:1,
  U:1, V:4, W:4, X:8, Y:4, Z:10,
};

function wordValue(word: string): number {
  return word.toUpperCase().split("").reduce((a, ch) => a + (LETTER_VALUES[ch] ?? 0), 0);
}

// ── Starting words by round ───────────────────────────────────────────────────
const START_WORDS = ["STORM", "LIGHT", "BRAIN", "TRADE", "FLAME", "SHARP"];

// ── DEMO word set — common 5-letter words ─────────────────────────────────────
// In production, replace isValidWord() with a server endpoint call.
const VALID_WORDS = new Set([
  "ABOUT","ABOVE","ABUSE","ACTOR","ACUTE","ADMIT","ADOPT","ADULT","AFTER","AGAIN",
  "AGENT","AGREE","AHEAD","ALARM","ALBUM","ALERT","ALIBI","ALIEN","ALIGN","ALIVE",
  "ALLEY","ALLOW","ALONE","ALONG","ALTER","ANGEL","ANGER","ANGLE","ANGRY","ANIME",
  "ANNEX","ANTIC","APART","APPLE","APPLY","APRIL","APRON","ARGUE","ARISE","ARMOR",
  "AROSE","ARRAY","ARROW","AROSE","ASSET","ATLAS","ATTIC","AUDIO","AVAIL","AVOID",
  "AWAKE","AWARE","BADLY","BAGEL","BAKER","BASIC","BASIS","BATCH","BEACH","BEARD",
  "BEAST","BEGAN","BEGIN","BEING","BELOW","BENCH","BIRTH","BISON","BLADE","BLAME",
  "BLAND","BLANK","BLAST","BLAZE","BLEED","BLEND","BLESS","BLIND","BLOCK","BLOOD",
  "BLOOM","BLOWN","BOARD","BOOST","BOUND","BRACE","BRAIN","BRAND","BRAVE","BREAD",
  "BREAK","BREED","BRICK","BRIDE","BRIEF","BRING","BROAD","BROKE","BROOK","BROTH",
  "BROWN","BRUSH","BUILD","BUILT","BUNCH","BURNT","BUYER","CABIN","CABLE","CACHE",
  "CAMEL","CARGO","CARRY","CARVE","CATCH","CAUSE","CHAIN","CHAIR","CHAOS","CHARM",
  "CHASE","CHEAP","CHEAT","CHECK","CHESS","CHEST","CHICK","CHIEF","CHILD","CHINA",
  "CHOIR","CHORD","CIVIC","CIVIL","CLAIM","CLASH","CLASS","CLEAN","CLEAR","CLERK",
  "CLICK","CLIFF","CLOCK","CLONE","CLOSE","CLOUD","COACH","COAST","COULD","COUNT",
  "COURT","COVER","CRAFT","CRANE","CRASH","CRAZY","CREAM","CREEK","CRIME","CRISP",
  "CROSS","CROWD","CROWN","CRUDE","CRUSH","CRYPT","CURVE","CYCLE","DANCE","DEALT",
  "DEATH","DEBUT","DECAY","DELAY","DELTA","DEPOT","DEPTH","DERBY","DETOX","DIGIT",
  "DIRTY","DISCO","DITCH","DITTO","DODGE","DOING","DRAWN","DREAM","DRESS","DRIFT",
  "DRINK","DRIVE","DROVE","DROWN","DRYER","DUMMY","DUNES","EARLY","EARTH","EIGHT",
  "ELITE","EMPTY","ENEMY","ENJOY","ENTER","ENTRY","EQUAL","ERROR","ESSAY","EVENT",
  "EXACT","EXTRA","FABLE","FACED","FAIRY","FALSE","FATAL","FAULT","FEAST","FIBRE",
  "FIELD","FIFTH","FIFTY","FIGHT","FINAL","FIRST","FIXED","FJORD","FIZZY","FLARE",
  "FLASH","FLAME","FLASK","FLEET","FLESH","FLOAT","FLOOD","FLOOR","FLOUR","FLUID",
  "FOCAL","FOCUS","FOLKS","FORCE","FORGE","FORTH","FORUM","FOUND","FRAME","FRANK",
  "FRAUD","FRESH","FRONT","FROST","FROZE","FRUIT","FULLY","FUNNY","FUZZY","GIANT",
  "GIVEN","GLARE","GLASS","GLEAM","GLIDE","GLOBE","GLOOM","GLOSS","GLYPH","GRACE",
  "GRADE","GRAIN","GRAND","GRANT","GRASP","GRASS","GRAVE","GREAT","GREED","GREET",
  "GRIEF","GRILL","GRIPE","GROAN","GROAT","GROIN","GROOM","GROSS","GROUP","GROVE",
  "GROWN","GUARD","GUESS","GUEST","GUIDE","GUILD","GUILE","GUILT","GUISE","GULCH",
  "HABIT","HAPPY","HARSH","HASTE","HAUNT","HEART","HEDGE","HEIST","HELIX","HENCE",
  "HERON","HERTZ","HINGE","HIPPO","HOIST","HOTEL","HOUND","HOUSE","HUMAN","HUSKY",
  "IDEAL","IMAGE","IMPLY","INDEX","INDIE","INFER","INNER","INPUT","INTER","INTRO",
  "IONIC","IRATE","IRONY","ISSUE","IVORY","JEWEL","JOINT","JOUST","JUDGE","JUICE",
  "JUMBO","KAPUT","KNACK","KNEEL","KNIFE","KNOCK","KNOWN","LABEL","LANCE","LARGE",
  "LASER","LATER","LAYER","LEARN","LEASE","LEAST","LEGAL","LEVEL","LIGHT","LIMIT",
  "LIVER","LOCAL","LODGE","LOGIC","LOOSE","LOVER","LOWER","LOYAL","LUCID","LUCKY",
  "LUNAR","LUSTY","LYRIC","MAGIC","MAJOR","MAKER","MATCH","MAVEN","MAYBE","MEDIA",
  "MERIT","MINOR","MINUS","MODEL","MONEY","MONTH","MORAL","MOUNT","MOUSE","MOUTH",
  "MOVIE","MURAL","MUSIC","NAIVE","NERVE","NEVER","NIGHT","NOBLE","NOISE","NORTH",
  "NOTED","NOVEL","NURSE","NYMPH","OCCUR","OFFER","OLIVE","ONSET","OPTIC","ORBIT",
  "ORDER","OTHER","OUGHT","OUNCE","OUTER","OWNED","OXIDE","OZONE","PAINT","PANEL",
  "PANIC","PAPER","PARTY","PASTE","PATCH","PAUSE","PEARL","PEDAL","PENNY","PHASE",
  "PHONE","PHOTO","PIANO","PIECE","PILOT","PIXEL","PIZZA","PLACE","PLAIN","PLAN",
  "PLANE","PLANT","PLAZA","PLEAD","PLUMB","PLUME","POINT","POLAR","POUND","POWER",
  "PRESS","PRICE","PRIDE","PRIME","PRINT","PRIOR","PRIZE","PROBE","PROOF","PROSE",
  "PROUD","PROVE","PROXY","PSALM","PUBIC","PUPIL","QUEEN","QUERY","QUEST","QUEUE",
  "QUICK","QUIET","QUITE","QUOTA","QUOTE","RACER","RADAR","RADIO","RAISE","RALLY",
  "RANGE","RAPID","RATIO","REACH","REALM","REBEL","RECAP","REIGN","RELAX","REMIX",
  "REPAY","REPLY","RIDER","RIDGE","RIGHT","RIGID","RISKY","RIVER","ROBOT","ROCKY",
  "ROMAN","ROUGE","ROUGH","ROUND","ROUTE","ROYAL","RUGBY","RULER","RURAL","RUSTY",
  "SADLY","SANDY","SAUCE","SCALE","SCARE","SCENE","SCOPE","SCORE","SCOUT","SEIZE",
  "SENSE","SERVE","SETUP","SEVEN","SHADE","SHAKE","SHALL","SHAME","SHAPE","SHARE",
  "SHARK","SHARP","SHEEP","SHEET","SHELF","SHELL","SHIFT","SHIRT","SHOCK","SHOOT",
  "SHORT","SHOUT","SHOWN","SIGHT","SILLY","SINCE","SIXTH","SIXTY","SIZED","SKILL",
  "SLACK","SLANT","SLASH","SLICE","SLIDE","SLOPE","SMALL","SMART","SMELL","SMILE",
  "SMOKE","SNAKE","SOLAR","SOLVE","SOUTH","SPACE","SPARE","SPARK","SPEAK","SPEED",
  "SPEND","SPILL","SPINE","SPOKE","SPOON","SPORT","SPRAY","SQUAD","STACK","STAFF",
  "STAGE","STAIN","STAKE","STALE","STAND","STARE","STARK","STARS","START","STATE",
  "STAYS","STEAM","STEEL","STEEP","STEER","STERN","STICK","STILL","STOCK","STONE",
  "STOOD","STORE","STORM","STORY","STRAW","STRAP","STRAY","STRIP","STUCK","STUDY",
  "STYLE","SUGAR","SUITE","SUPER","SWAMP","SWARM","SWEAR","SWEEP","SWEET","SWEPT",
  "SWIFT","SWING","SWIPE","SWORD","SWORE","SWORN","SYRUP","TABOO","TALON","TASTE",
  "TAUNT","TEACH","TEASE","TEMPO","TENSE","TENTH","THICK","THIRD","THOSE","THREE",
  "THREW","THROW","THUMB","TIGER","TITHE","TITLE","TODAY","TOKEN","TORCH","TOTAL",
  "TOUCH","TOUGH","TOXIC","TRACE","TRACK","TRADE","TRAIL","TRAIN","TRAIT","TRAMP",
  "STRAP","TRASH","TREAD","TREAT","TREND","TRIAL","TRIBE","TRICK","TRIED","TROOP",
  "TRUCK","TRULY","TRUNK","TRUSS","TRUST","TRUTH","TUMID","TUNER","TWEAK","TWICE",
  "TWIST","TYING","ULTRA","UNCLE","UNDER","UNION","UNITY","UNLIT","UNTIL","UPPER",
  "UPSET","URBAN","USAGE","USUAL","UTTER","VALID","VALUE","VALVE","VAULT","VENUE",
  "VERSE","VIDEO","VIGIL","VIRAL","VIRUS","VISIT","VISOR","VISTA","VITAL","VIVID",
  "VOCAL","VOICE","VOTER","VROUW","WAIST","WASTE","WATCH","WATER","WEARY","WEAVE",
  "WEDGE","WEIGH","WEIRD","WHALE","WHEAT","WHEEL","WHERE","WHILE","WHITE","WHOLE",
  "WHOSE","WIDEN","WITCH","WITTY","WOMAN","WORLD","WORRY","WORSE","WORST","WORTH",
  "WOULD","WOUND","WRATH","WRIST","WROTE","YACHT","YOUNG","YOUTH","ZEBRA","ZESTY",
]);

function isValidWord(word: string): boolean {
  return VALID_WORDS.has(word.toUpperCase());
}

function differsByOneLetter(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diffs = 0;
  for (let i = 0; i < a.length; i++) { if (a[i] !== b[i]) diffs++; }
  return diffs === 1;
}

// ── AI word generator ─────────────────────────────────────────────────────────
function aiNextWord(current: string, used: Set<string>): string | null {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const candidates: string[] = [];
  for (let i = 0; i < current.length; i++) {
    for (const ch of chars) {
      if (ch === current[i]) continue;
      const candidate = current.slice(0, i) + ch + current.slice(i + 1);
      if (!used.has(candidate) && isValidWord(candidate)) candidates.push(candidate);
    }
  }
  if (candidates.length === 0) return null;
  // Prefer higher scoring words
  candidates.sort((a, b) => wordValue(b) - wordValue(a));
  return candidates[Math.floor(Math.random() * Math.min(5, candidates.length))];
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function LastWordGame({
  challengeId, myUserId, opponentName, netPrize,
  soundEnabled = true, onComplete, onScoreUpdate,
}: LastWordProps) {
  const { play } = useGameSound(soundEnabled);

  type Phase = "myturn" | "oppturn" | "reveal" | "done";

  const [round,        setRound]        = useState(1);
  const [phase,        setPhase]        = useState<Phase>("myturn");
  const [currentWord,  setCurrentWord]  = useState(START_WORDS[0]);
  const [input,        setInput]        = useState("");
  const [chain,        setChain]        = useState<{ word: string; player: "me" | "opp"; pts: number }[]>([]);
  const [usedWords,    setUsedWords]    = useState<Set<string>>(new Set([START_WORDS[0]]));
  const [myScore,      setMyScore]      = useState(0);
  const [oppScore,     setOppScore]     = useState(0);
  const [myRoundPts,   setMyRoundPts]   = useState(0);
  const [oppRoundPts,  setOppRoundPts]  = useState(0);
  const [timeLeft,     setTimeLeft]     = useState(TURN_SECONDS);
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null);
  const [canChallenge, setCanChallenge] = useState(false);
  const [challenged,   setChallenged]   = useState(false);
  const [roundResult,  setRoundResult]  = useState<{
    myPts: number; oppPts: number; headline: string; reason: string;
  } | null>(null);

  const myScoreRef    = useRef(0);
  const oppScoreRef   = useRef(0);
  const myRndRef      = useRef(0);
  const oppRndRef     = useRef(0);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRef    = useRef(START_WORDS[0]);
  const usedRef       = useRef(new Set([START_WORDS[0]]));
  const myRoundRef    = useRef(0);
  const oppRoundRef   = useRef(0);

  // ── Start round ───────────────────────────────────────────────────────────
  const startRound = useCallback((rnd: number) => {
    const start = START_WORDS[(rnd - 1) % START_WORDS.length];
    setCurrentWord(start);
    currentRef.current = start;
    const used = new Set([start]);
    setUsedWords(used);
    usedRef.current = used;
    setChain([]);
    setInput("");
    setErrorMsg(null);
    setCanChallenge(false);
    setChallenged(false);
    setRoundResult(null);
    myRoundRef.current = 0;
    oppRoundRef.current = 0;
    setMyRoundPts(0);
    setOppRoundPts(0);
    setTimeLeft(TURN_SECONDS);
    // Host goes first
    setPhase("myturn");
    play("roundStart");
  }, [play]);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    clearInterval(timerRef.current!);
    setTimeLeft(TURN_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []);

  // ── Player turn timeout ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "myturn") return;
    startTimer();
    return () => clearInterval(timerRef.current!);
  }, [phase, round]); // eslint-disable-line

  useEffect(() => {
    if (phase !== "myturn" || timeLeft !== 0) return;
    // Forfeit — can't form a word in time
    endRound("forfeit-me");
  }, [timeLeft, phase]); // eslint-disable-line

  // ── Opponent turn ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "oppturn") return;
    startTimer();
    // AI decides
    const delay = 1500 + Math.random() * 4000;
    const t = setTimeout(() => {
      const next = aiNextWord(currentRef.current, usedRef.current);
      if (!next) { endRound("forfeit-opp"); return; }
      const pts = wordValue(next);
      oppRoundRef.current += pts;
      setOppRoundPts(oppRoundRef.current);
      setChain(c => [...c, { word: next, player: "opp", pts }]);
      currentRef.current = next;
      usedRef.current = new Set([...usedRef.current, next]);
      setCurrentWord(next);
      setUsedWords(new Set(usedRef.current));
      setCanChallenge(true); // player can challenge after opp plays
      play("probeMiss");
      clearInterval(timerRef.current!);
      // Brief window to challenge, then move to my turn
      setTimeout(() => {
        setCanChallenge(false);
        setChallenged(false);
        setPhase("myturn");
      }, 2500);
    }, delay);
    return () => { clearTimeout(t); clearInterval(timerRef.current!); };
  }, [phase, round, play]); // eslint-disable-line

  // ── Submit word ───────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (phase !== "myturn") return;
    const w = input.trim().toUpperCase();
    setInput("");

    if (w.length !== currentRef.current.length) {
      setErrorMsg(`Must be ${currentRef.current.length} letters`); return;
    }
    if (!differsByOneLetter(w, currentRef.current)) {
      setErrorMsg("Must differ by exactly one letter"); return;
    }
    if (usedRef.current.has(w)) {
      setErrorMsg("Word already used in this chain"); return;
    }
    if (!isValidWord(w)) {
      setErrorMsg("Not a valid word"); return;
    }

    setErrorMsg(null);
    clearInterval(timerRef.current!);
    const pts = wordValue(w);
    myRoundRef.current += pts;
    setMyRoundPts(myRoundRef.current);
    setChain(c => [...c, { word: w, player: "me", pts }]);
    currentRef.current = w;
    usedRef.current = new Set([...usedRef.current, w]);
    setCurrentWord(w);
    setUsedWords(new Set(usedRef.current));
    play("phantomPlace");
    setPhase("oppturn");
  }, [phase, input, play]);

  // ── Challenge ─────────────────────────────────────────────────────────────
  const handleChallenge = useCallback(() => {
    if (!canChallenge || challenged) return;
    setChallenged(true);
    // Check last opp word
    const lastOpp = chain.filter(c => c.player === "opp").at(-1);
    if (!lastOpp) return;
    const valid = isValidWord(lastOpp.word);
    if (!valid) {
      // Correct challenge — reverse that word's score
      oppRoundRef.current -= lastOpp.pts;
      setOppRoundPts(oppRoundRef.current);
      play("predCorrect");
    } else {
      // Wrong challenge — penalise challenger
      myRoundRef.current -= CHALLENGE_PENALTY;
      setMyRoundPts(myRoundRef.current);
      play("predWrong");
    }
  }, [canChallenge, challenged, chain, play]);

  // ── End round ─────────────────────────────────────────────────────────────
  const endRound = useCallback((reason: string) => {
    clearInterval(timerRef.current!);
    const myPts  = Math.max(0, myRoundRef.current)  + (reason === "forfeit-opp" ? FORFEIT_PENALTY : 0);
    const oppPts = Math.max(0, oppRoundRef.current) + (reason === "forfeit-me"  ? FORFEIT_PENALTY : 0);

    myScoreRef.current  += myPts;
    oppScoreRef.current += oppPts;
    setMyScore(myScoreRef.current);
    setOppScore(oppScoreRef.current);
    onScoreUpdate(myScoreRef.current);

    const headline =
      reason === "forfeit-me"  ? `⏰ You ran out of moves — ${opponentName} earns bonus` :
      reason === "forfeit-opp" ? `🏆 ${opponentName} ran out of moves — bonus to you!` :
      myPts > oppPts ? "✅ You scored more letter value!" : "💀 They scored higher this round";

    play(myPts > oppPts ? "predCorrect" : "predWrong");
    setRoundResult({ myPts, oppPts, headline, reason });
    setPhase("reveal");

    const isLast = round >= TOTAL_ROUNDS;
    setTimeout(() => {
      if (isLast) {
        setPhase("done");
        play(myScoreRef.current > oppScoreRef.current ? "gameWin" : "gameLose");
        onComplete(myScoreRef.current, oppScoreRef.current);
      } else {
        setRound(r => r + 1);
        startRound(round + 1);
      }
    }, 3500);
  }, [round, opponentName, onComplete, onScoreUpdate, play, startRound]);

  useEffect(() => { startRound(1); return () => clearInterval(timerRef.current!); }, []); // eslint-disable-line

  const timerColor = timeLeft <= 3 ? "#ef4444" : timeLeft <= 6 ? "#f59e0b" : "#10b981";

  // ── Render word with changed letter highlighted ───────────────────────────
  const WordDisplay = ({ word, prev }: { word: string; prev?: string }) => (
    <div className="flex gap-1 justify-center">
      {word.split("").map((ch, i) => {
        const changed = prev ? ch !== prev[i] : false;
        return (
          <div key={i} className="w-9 h-10 rounded-xs flex items-center justify-center text-lg font-black"
            style={{
              background: changed ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.06)",
              border:     changed ? "2px solid #f59e0b" : "1px solid rgba(255,255,255,0.12)",
              color:      changed ? "#f59e0b" : "rgba(255,255,255,0.85)",
              boxShadow:  changed ? "0 0 12px rgba(245,158,11,0.4)" : "none",
            }}>
            {ch}
          </div>
        );
      })}
    </div>
  );

  const lastChainWord = chain.length > 0 ? chain[chain.length - 1].word : undefined;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 max-w-lg mx-auto w-full select-none"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}>

      {/* ── Scores ── */}
      <div className="grid grid-cols-3 items-center gap-2">
        <div className="text-center">
          <motion.div key={myScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#10b981", letterSpacing: "-0.05em" }}>{myScore}</motion.div>
          <div className="text-[9px] text-white/30 font-bold">You</div>
          <div className="text-[9px] font-black" style={{ color: "#10b981" }}>+{myRoundPts} this round</div>
        </div>
        <div className="text-center">
          <div className="text-[9px] uppercase tracking-widest font-black text-white/22">Round</div>
          <div className="text-lg font-black text-white">{Math.min(round, TOTAL_ROUNDS)}/{TOTAL_ROUNDS}</div>
        </div>
        <div className="text-center">
          <motion.div key={oppScore} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
            className="text-3xl font-black" style={{ color: "#06b6d4", letterSpacing: "-0.05em" }}>{oppScore}</motion.div>
          <div className="text-[9px] text-white/30 font-bold truncate">{opponentName}</div>
          <div className="text-[9px] font-black" style={{ color: "#06b6d4" }}>+{oppRoundPts} this round</div>
        </div>
      </div>

      {/* ── Current word ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest font-black text-white/25">Current Word</span>
          {phase !== "reveal" && phase !== "done" && (
            <span className="font-black text-lg" style={{ color: timerColor }}>{timeLeft}s</span>
          )}
        </div>
        <WordDisplay word={currentWord} prev={lastChainWord} />
        <div className="text-center text-[10px] text-white/30">
          Letter value: <strong className="text-white">{wordValue(currentWord)}</strong>
        </div>
      </div>

      {/* ── Phase content ── */}
      <AnimatePresence mode="wait">
        {(phase === "myturn" || phase === "oppturn") && (
          <motion.div key="play" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-3">

            {/* Turn indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xs"
              style={{
                background: phase === "myturn" ? "rgba(16,185,129,0.08)" : "rgba(6,182,212,0.06)",
                border: `1px solid ${phase === "myturn" ? "rgba(16,185,129,0.22)" : "rgba(6,182,212,0.18)"}`,
              }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: phase === "myturn" ? "#10b981" : "#06b6d4" }} />
              <span className="text-[11px] font-bold"
                style={{ color: phase === "myturn" ? "#10b981" : "#06b6d4" }}>
                {phase === "myturn" ? "Your turn — change one letter" : `${opponentName} is thinking…`}
              </span>
            </div>

            {/* Challenge button */}
            {canChallenge && !challenged && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={handleChallenge} whileTap={{ scale: 0.95 }}
                className="w-full py-2.5 rounded-xs text-xs font-black flex items-center justify-center gap-2"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.28)", color: "#f87171" }}>
                <AlertTriangle className="w-3.5 h-3.5" />
                Challenge {opponentName}'s word (wrong = −{CHALLENGE_PENALTY} pts)
              </motion.button>
            )}
            {challenged && (
              <div className="text-center text-[10px] text-white/30">Challenge submitted</div>
            )}

            {/* Input */}
            {phase === "myturn" && (
              <div className="flex gap-2">
                <input autoFocus value={input}
                  onChange={e => { setInput(e.target.value.toUpperCase().replace(/[^A-Z]/g,"").slice(0, currentWord.length)); setErrorMsg(null); }}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder={`Change 1 letter in ${currentWord}`}
                  maxLength={currentWord.length}
                  className="flex-1 px-4 py-3 text-lg font-black text-white tracking-widest outline-none rounded-xs"
                  style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.15)", letterSpacing:"0.2em" }} />
                <motion.button whileTap={{ scale: 0.95 }} onClick={handleSubmit}
                  disabled={input.length !== currentWord.length}
                  className="px-4 rounded-xs font-black text-white disabled:opacity-30"
                  style={{ background: input.length === currentWord.length ? "#10b981" : "rgba(255,255,255,0.05)" }}>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </div>
            )}
            {errorMsg && <p className="text-xs text-red-400">{errorMsg}</p>}

            {/* Word chain scroll */}
            {chain.length > 0 && (
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {[...chain].reverse().map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-xs"
                    style={{ background: c.player === "me" ? "rgba(16,185,129,0.06)" : "rgba(6,182,212,0.06)", border: `1px solid ${c.player === "me" ? "rgba(16,185,129,0.12)" : "rgba(6,182,212,0.12)"}` }}>
                    <span className="text-sm font-black tracking-widest text-white">{c.word}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black" style={{ color: c.player === "me" ? "#10b981" : "#06b6d4" }}>
                        {c.player === "me" ? "You" : opponentName.split(" ")[0]}
                      </span>
                      <span className="text-[10px] font-black text-amber-400">+{c.pts}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Reveal ── */}
        {phase === "reveal" && roundResult && (
          <motion.div key="reveal" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xs p-5 space-y-4"
            style={{ background: "rgba(6,6,18,0.9)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <p className="text-base font-black text-white text-center">{roundResult.headline}</p>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#10b981" }}>+{roundResult.myPts}</div>
                <div className="text-[9px] text-white/30">You</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: "#06b6d4" }}>+{roundResult.oppPts}</div>
                <div className="text-[9px] text-white/30">{opponentName}</div>
              </div>
            </div>
            <p className="text-center text-[10px] text-white/25">Chain length: {chain.length} words</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}