// =============================================================================
// TOKEN RUSH — Game Registry
// app/token-rush/_games/game-registry.ts
//
// Single source of truth for every Token Rush wagering game.
// To add a new game:
//   1. Add its ID to TokenRushGameId
//   2. Add its definition to TOKEN_RUSH_GAMES
//   3. Add its lazy import to GAME_COMPONENTS in token-rush-client.tsx
// =============================================================================

// ── Game IDs — extend this union to add new games ────────────────────────────
export type TokenRushGameId =
  | "NEURAL_DOMINANCE"
  | "PHANTOM_GRID"
  | "ECHO_CHAMBER"
  | "CIPHER_DUEL"
  | "GRAVITY_MIND"
  | "MIRAGE_AUCTION"
  | "TEMPORAL_DUEL"
  | "MIND_MIRROR"
  | "PRESSURE_COOKER"
  | "PHANTOM_WORD"
  | "RORSCHACH_DUEL"
  | "SIGNAL_THIEF"
  | "COLOUR_COURT"
  | "LAST_WORD"
  | "FREQUENCY"
  | "DEAD_RECKONING"
  | "CONTRABAND"
  | "PULSE"
  | "CARTOGRAPHER"
  | "VOLTAGE";
  // Future examples:
  // | "CIPHER_DUEL"       ← future game example
  // | "ECHO_CHAMBER"
  // | "QUANTUM_BLUFF"


// ── Full game definition ──────────────────────────────────────────────────────
export interface TokenRushGameDef {
  id:            TokenRushGameId;
  name:          string;
  emoji:         string;
  tagline:       string;
  /** Primary brand colour */
  accent:        string;
  /** Darker shade for button gradients */
  accentDark:    string;
  /** rgba() glow for box-shadow */
  glow:          string;
  description:   string;
  minPlayers:    2;
  maxPlayers:    2;         // update per game when group modes land
  rounds:        number;
  durationLabel: string;
  difficulty:    "Medium" | "Hard" | "Extreme" | "Legendary";
  tags:          string[];
  rules:         string[];
  /** Short anti-cheat disclosure shown in the UI */
  anticheat:     string;
}

// ── Game catalogue ────────────────────────────────────────────────────────────
export const TOKEN_RUSH_GAMES: Record<TokenRushGameId, TokenRushGameDef> = {

  NEURAL_DOMINANCE: {
    id:            "NEURAL_DOMINANCE",
    name:          "Neural Dominance",
    emoji:         "🧠",
    tagline:       "Out-think the human across the table",
    accent:        "#a855f7",
    accentDark:    "#7c3aed",
    glow:          "rgba(168,85,247,0.4)",
    description:
      "A 12-round psychological prediction war. Each round you pick a move (Alpha/Beta/Gamma) AND predict your opponent's move simultaneously. Correct prediction = +15 pts. Playing a move they failed to predict = +10 pts. Adapt, deceive, and dominate.",
    minPlayers:    2,
    maxPlayers:    2,
    rounds:        12,
    durationLabel: "~4 min",
    difficulty:    "Extreme",
    tags:          ["Psychology", "Prediction", "Deception", "Speed"],
    rules: [
      "Both players choose a move (Alpha / Beta / Gamma) simultaneously",
      "You also predict what move your opponent will play",
      "+15 pts if your prediction of their move is correct",
      "+10 pts if they failed to predict YOUR move",
      "Both bonuses can stack in one round for a maximum of +25 pts",
      "8 seconds per round — your move locks automatically if you hesitate",
      "12 rounds total — highest cumulative score wins the prize pool",
    ],
    anticheat:
      "Moves are committed to the server as one-way hashes before reveal. Neither player sees the other's choice until both have locked in.",
  },

  PHANTOM_GRID: {
    id:            "PHANTOM_GRID",
    name:          "Phantom Grid",
    emoji:         "👻",
    tagline:       "Claim territory in the fog of war",
    accent:        "#06b6d4",
    accentDark:    "#0891b2",
    glow:          "rgba(6,182,212,0.4)",
    description:
      "An 8×8 fog-of-war territory battle. Place 8 invisible phantom pieces in your zone — your opponent cannot see them. Alternate probing cells to destroy their phantoms. Miss and your opponent earns points. You may move an unrevealed phantom every 3 turns to deceive. Most captures wins.",
    minPlayers:    2,
    maxPlayers:    2,
    rounds:        16,
    durationLabel: "~6 min",
    difficulty:    "Legendary",
    tags:          ["Strategy", "Deduction", "Bluff", "Spatial"],
    rules: [
      "Place 8 phantom pieces anywhere in your half of the 8×8 grid",
      "Turns alternate — probe any enemy cell to reveal it",
      "Hit a phantom: it's destroyed, +20 pts to you",
      "Miss a probe: +5 pts to your opponent (distraction bonus)",
      "Once every 3 turns you may move one of your unrevealed phantoms",
      "16 total probes are played across both players",
      "Most phantom captures after all probes wins the prize pool",
    ],
    anticheat:
      "Phantom positions are stored server-side only — clients never receive the opponent's layout. All probe results are validated server-authoritatively.",
  },

  ECHO_CHAMBER: {
    id:            "ECHO_CHAMBER",
    name:          "Echo Chamber",
    emoji:         "🎵",
    tagline:       "Hear it once. Repeat it perfectly.",
    accent:        "#f59e0b",
    accentDark:    "#d97706",
    glow:          "rgba(245,158,11,0.4)",
    description:
      "A live audio memory war. The server plays a sequence of synthesised tones through your speakers — you must tap the exact frequencies back in order. Every round adds one tone. A wrong tap gifts your opponent bonus points. Pure listening intelligence — no visuals to copy, no patterns to memorise.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        10,
    durationLabel: "~5 min",
    difficulty:    "Extreme" as const,
    tags:          ["Audio", "Memory", "Speed", "Precision"],
    rules: [
      "Both players hear the same tone sequence played once",
      "Tap the frequency nodes in the exact order they were played",
      "Correct full sequence: +20 pts",
      "Each correct consecutive tone before a mistake: +2 pts",
      "Wrong tap: opponent gets +5 pts distraction bonus",
      "Round sequences grow by 1 tone each round (starts at 3)",
      "10 rounds — highest total wins the prize pool",
    ],
    anticheat:
      "Tone sequences are generated server-side per challenge and streamed to both clients simultaneously. Submission order is timestamped server-side — replay attacks are rejected.",
  },
 
  CIPHER_DUEL: {
    id:            "CIPHER_DUEL",
    name:          "Cipher Duel",
    emoji:         "🔐",
    tagline:       "Decode faster. Encode smarter.",
    accent:        "#10b981",
    accentDark:    "#059669",
    glow:          "rgba(16,185,129,0.4)",
    description:
      "A real-time encryption war. Each round you receive a scrambled message encoded with a unique substitution cipher. Race to decode it while simultaneously encoding a trap word to mislead your opponent. The fastest correct decode wins points — a wrong submission costs them. Pure logic under pressure.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        8,
    durationLabel: "~6 min",
    difficulty:    "Legendary" as const,
    tags:          ["Cryptography", "Logic", "Speed", "Deception"],
    rules: [
      "Each round: receive a scrambled word + your personal cipher key",
      "Decode it by applying the reverse cipher substitution",
      "Submit your decoded answer — fastest correct answer wins the round",
      "Correct decode: +15 pts + speed bonus (up to +10 extra pts)",
      "Wrong decode: costs you 5 pts",
      "Also submit an encoded trap word to send to your opponent — slows them down",
      "8 rounds — highest total score wins the prize pool",
    ],
    anticheat:
      "Cipher keys and encoded messages are generated server-side per player. Submissions are validated against the stored answer — no client-side cipher logic is trusted.",
  },
 
  GRAVITY_MIND: {
    id:            "GRAVITY_MIND",
    name:          "Gravity Mind",
    emoji:         "🌌",
    tagline:       "Bend space. Predict the impossible.",
    accent:        "#6366f1",
    accentDark:    "#4f46e5",
    glow:          "rgba(99,102,241,0.4)",
    description:
      "A physics-based spatial reasoning duel. On a shared 10×10 grid, both players place gravity wells that bend the path of a shared projectile. Before launch, each player predicts exactly which cell the projectile will land in after 5 bounces. Closest prediction wins — with a perfect prediction earning a massive bonus. Spatial thinking meets psychological misdirection.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        7,
    durationLabel: "~7 min",
    difficulty:    "Legendary" as const,
    tags:          ["Physics", "Spatial", "Strategy", "Prediction"],
    rules: [
      "Players alternate placing gravity wells on a 10×10 grid (3 each)",
      "Once placed, a projectile is launched from a fixed start position",
      "Both players secretly predict which cell it will land in",
      "The projectile bounces 5 times, affected by all gravity wells",
      "Perfect prediction (exact cell): +30 pts",
      "Adjacent cell prediction (within 1): +15 pts",
      "Miss: 0 pts. Closest prediction gets +5 pts tie-break bonus",
      "7 rounds — new well configuration each round — highest total wins",
    ],
    anticheat:
      "Projectile physics are computed server-side using a deterministic engine. Both predictions are committed before the simulation runs — neither player sees the result until both have locked in.",
  },
  MIRAGE_AUCTION: {
    id:            "MIRAGE_AUCTION",
    name:          "Mirage Auction",
    emoji:         "🏛️",
    tagline:       "Bid smart. Win profit. Outread your opponent.",
    accent:        "#a855f7",
    accentDark:    "#7c3aed",
    glow:          "rgba(168,85,247,0.4)",
    description:
      "A psychological bidding war. Each round both players receive 100 bid-coins to spread across 5 mystery items. Items have hidden true values revealed only after bidding closes. Win an item by outbidding your opponent — your profit is the true value minus what you paid. Read your opponent's desperation, bluff your interest, and maximise profit over 6 rounds.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        6,
    durationLabel: "~5 min",
    difficulty:    "Hard" as const,
    tags:          ["Game Theory", "Bluffing", "Economics", "Psychology"],
    rules: [
      "Each round: 100 bid-coins to split across 5 mystery items however you like",
      "The player with the higher bid on each item wins that item",
      "Ties on bids go to the current player",
      "Your profit = item's true value − what you bid for it",
      "A zero profit win is still a win — it denies your opponent",
      "True values are hidden until both players lock their bids",
      "6 rounds — most cumulative profit wins the prize pool",
    ],
    anticheat:
      "Item true values are generated server-side per round. Bids are submitted simultaneously — neither player sees the other's allocations until both have locked in.",
  },
 
  TEMPORAL_DUEL: {
    id:            "TEMPORAL_DUEL",
    name:          "Temporal Duel",
    emoji:         "⏱️",
    tagline:       "No clock. Just your mind against time itself.",
    accent:        "#f59e0b",
    accentDark:    "#d97706",
    glow:          "rgba(245,158,11,0.4)",
    description:
      "A time-estimation battle with no visible timer. Both players watch the same abstract visual event — a morphing blob, rising orbs, a glitch grid — and must press STOP at the exact millisecond they believe a secret target duration has elapsed. The closest estimate wins each round. No patterns to copy. No visuals to decode. Pure internal clock calibration.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        9,
    durationLabel: "~4 min",
    difficulty:    "Extreme" as const,
    tags:          ["Timing", "Perception", "Focus", "Mind"],
    rules: [
      "Each round: a target duration is shown before the event begins (e.g. 1.500s)",
      "Once the event starts, ALL timers disappear — nothing tells you how long has passed",
      "Press STOP when you believe the exact target time has elapsed",
      "Within 50ms: +25 pts (Perfect) | Within 150ms: +18 | Within 350ms: +10 | Within 700ms: +4",
      "Both players' stop-times are recorded server-side — no spoofing",
      "9 rounds with varying target durations — highest total wins",
    ],
    anticheat:
      "Target durations are generated server-side. Stop-times are recorded with server-side millisecond precision. Client-reported timestamps are validated against server receive time.",
  },
 
  MIND_MIRROR: {
    id:            "MIND_MIRROR",
    name:          "Mind Mirror",
    emoji:         "🪞",
    tagline:       "Build to deceive. Guess to prevail.",
    accent:        "#ec4899",
    accentDark:    "#db2777",
    glow:          "rgba(236,72,153,0.4)",
    description:
      "A pattern-completion war with alternating roles. As the Builder: create a 4-symbol sequence — your opponent sees only the first 2 steps and must complete the rest. You score for every step they get wrong. As the Guesser: study the 2 revealed steps and predict what comes next. You score for every correct completion. Roles swap every round. Read minds — or mislead them.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        8,
    durationLabel: "~5 min",
    difficulty:    "Legendary" as const,
    tags:          ["Pattern", "Deception", "Prediction", "Psychology"],
    rules: [
      "Roles alternate each round: Builder and Guesser",
      "Builder creates a 4-symbol sequence from 8 possible symbols",
      "Guesser sees the first 2 symbols and must guess steps 3 and 4",
      "Guesser: +20 pts for each correct step guessed",
      "Builder: +12 pts for each step the Guesser gets WRONG",
      "Builder wants to be unpredictable — Guesser wants to find the pattern",
      "8 rounds total — highest cumulative score wins the prize pool",
    ],
    anticheat:
      "Builder's full sequence is committed to the server before any reveal. The Guesser never receives steps 3–4 until after their submission is locked. Server validates all outcomes.",
  },
  PRESSURE_COOKER: {
    id:            "PRESSURE_COOKER",
    name:          "Pressure Cooker",
    emoji:         "🍲",
    tagline:       "Demand smart. Split or clash.",
    accent:        "#ef4444",
    accentDark:    "#dc2626",
    glow:          "rgba(239,68,68,0.4)",
    description:
      "The most studied human decision-making game, weaponised. Each round, both players simultaneously name the share of 100 points they demand. If combined demands ≤ 100, both get what they asked for. If they exceed 100 — nobody scores. 10 rounds with twist modifiers: winner-take-all, generosity bonuses, mirror rounds, clash penalties. Pure game theory under escalating pressure.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        10,
    durationLabel: "~4 min",
    difficulty:    "Hard" as const,
    tags:          ["Game Theory", "Negotiation", "Psychology", "Risk"],
    rules: [
      "Each round: name any number 0–100 as your demand",
      "If your demand + opponent's demand ≤ 100: both earn what they demanded",
      "If combined demands > 100: nobody scores that round (greedy clash)",
      "10 rounds, each with a unique modifier (winner-take-all, bonuses, penalties…)",
      "You never see your opponent's demand until both have locked in",
      "12 seconds per round — hesitation locks your current slider position",
      "Highest cumulative score wins the prize pool",
    ],
    anticheat:
      "Demands are committed server-side simultaneously. Neither player sees the other's choice until both have locked in. Server resolves all outcomes.",
  },
 
  PHANTOM_WORD: {
    id:            "PHANTOM_WORD",
    name:          "Phantom Word",
    emoji:         "🔍",
    tagline:       "Guess the word. Feel the heat.",
    accent:        "#10b981",
    accentDark:    "#059669",
    glow:          "rgba(16,185,129,0.4)",
    description:
      "A linguistic deduction duel with alternating roles. The Keeper thinks of a 5-letter word. The Seeker probes with guesses — but receives only a heat score (0–5): how many letters from their guess exist anywhere in the secret word, with no position information. Pure information theory and vocabulary intuition. Fewer guesses used = more points. Keeper earns if Seeker fails all 7 attempts.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        6,
    durationLabel: "~6 min",
    difficulty:    "Extreme" as const,
    tags:          ["Language", "Deduction", "Strategy", "Logic"],
    rules: [
      "Roles alternate each round: Keeper and Seeker",
      "Keeper picks any 5-letter English word",
      "Seeker has 7 guesses to identify the word",
      "Each guess returns a heat score: how many letters overlap in ANY position (0–5)",
      "No position information — only raw letter intersection count",
      "Seeker earns more points for cracking it in fewer guesses (max +30 pts)",
      "Keeper earns +20 pts if Seeker fails all 7 attempts",
    ],
    anticheat:
      "Keeper's word is committed to the server as a hash before any guesses begin. Heat scores are computed server-side — the Seeker never receives the word until after all guesses or a correct answer.",
  },
 
  RORSCHACH_DUEL: {
    id:            "RORSCHACH_DUEL",
    name:          "Rorschach Duel",
    emoji:         "🪞",
    tagline:       "See the same thing. Think the same thought.",
    accent:        "#6366f1",
    accentDark:    "#4f46e5",
    glow:          "rgba(99,102,241,0.4)",
    description:
      "A shared cognition game unlike any other on Earth. Both players see the same procedurally generated ink-blot shape for exactly 3 seconds — then it disappears. Each player independently picks ONE word from a 12-word palette that best describes what they saw. Points only awarded when BOTH players choose the same word. You are trying to think like the same human mind as a stranger. Culture, empathy, and instinct all matter.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        10,
    durationLabel: "~5 min",
    difficulty:    "Legendary" as const,
    tags:          ["Psychology", "Empathy", "Perception", "Culture"],
    rules: [
      "Both players see the same abstract ink-blot shape for 3 seconds",
      "The shape disappears — then you have 10 seconds to pick one word",
      "Choose from a palette of 12 words that best describes what you saw",
      "Match your opponent's word exactly: +25 pts each",
      "Pick a word in the same semantic category as your opponent: +10 pts each",
      "Different words: 0 pts for both this round",
      "Build a matching streak for bonus points — 3+ consecutive matches add +15",
    ],
    anticheat:
      "Both word selections are committed server-side before reveal. Neither player sees the other's choice until both have locked in. Ink-blot shapes are generated deterministically server-side — both players see identical shapes.",
  },

  SIGNAL_THIEF: {
    id:            "SIGNAL_THIEF",
    name:          "Signal Thief",
    emoji:         "📡",
    tagline:       "Boost. Jam. Dominate the airwaves.",
    accent:        "#6366f1",
    accentDark:    "#4f46e5",
    glow:          "rgba(99,102,241,0.4)",
    description:
      "A real-time resource warfare game on a shared 4×4 grid of transmission nodes. Both players manage a live energy economy — spend 1 energy to Boost a node (+2 signal) or spend 2 energy to Jam an enemy node (−3 enemy signal). Energy regenerates every second. After 90 seconds, the player with the most total signal across all nodes wins. Read your opponent's priorities, deny their power nodes, and protect your own. Zero language barrier — pure strategic resource management.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        1,
    durationLabel: "90 sec",
    difficulty:    "Hard" as const,
    tags:          ["Real-Time", "Strategy", "Resource", "Tactics"],
    rules: [
      "16 transmission nodes on a shared 4×4 grid — anyone can Boost or Jam any node",
      "Boost: costs 1 energy, adds +2 signal to one of your nodes",
      "Jam: costs 2 energy, removes −3 signal from an opponent's node",
      "Energy regenerates 1 per second, maximum 10 stored",
      "Actions have a short cooldown between them",
      "Game runs for 90 seconds with live score tracking",
      "Player with the most total signal when time expires wins",
    ],
    anticheat:
      "All actions validated server-side. Energy state is authoritative on the server — the client cannot fake energy or signal levels. Action timestamps are validated to prevent replay attacks.",
  },
 
  COLOUR_COURT: {
    id:            "COLOUR_COURT",
    name:          "Colour Court",
    emoji:         "🎨",
    tagline:       "See it. Remember it. Find it first.",
    accent:        "#f59e0b",
    accentDark:    "#d97706",
    glow:          "rgba(245,158,11,0.4)",
    description:
      "A perceptual discrimination speed battle requiring zero language, knowledge, or cultural familiarity. Both players see a target colour swatch for 2 seconds. Then 9 swatches appear — one matches exactly, the rest are subtly shifted. Swatches drift slowly every 0.6 seconds. First player to correctly identify the exact match wins points plus a speed bonus. Wrong pick = −5 pts and a 3-second lockout. Difficulty escalates each round. Universally accessible to any human with colour vision.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        12,
    durationLabel: "~5 min",
    difficulty:    "Extreme" as const,
    tags:          ["Perception", "Speed", "Memory", "Universal"],
    rules: [
      "See the target colour for exactly 2 seconds — memorise it",
      "Then 9 swatches appear — one is the exact match",
      "Swatches drift subtly every 0.6s to increase difficulty",
      "First correct pick wins: +30/+24/+18/+12/+8 pts based on speed",
      "Wrong pick: −5 pts and a 3-second lockout before you can try again",
      "12 rounds — perceptual difficulty increases each round",
      "Highest total score wins the prize pool",
    ],
    anticheat:
      "Target colours generated server-side per round. Correct swatch index validated server-side — the client cannot determine which swatch is correct before submitting.",
  },
 
  LAST_WORD: {
    id:            "LAST_WORD",
    name:          "Last Word",
    emoji:         "🔠",
    tagline:       "Change one letter. Score the value. Outlast them.",
    accent:        "#10b981",
    accentDark:    "#059669",
    glow:          "rgba(16,185,129,0.4)",
    description:
      "A linguistic endgame duel. Both players share a starting word and alternate changing exactly one letter per turn to form a new valid word. Each word scores its Scrabble letter value. Players may CHALLENGE any word their opponent plays — a correct challenge nulls the score; a wrong challenge costs the challenger 10 pts. The player who cannot form a valid one-letter change within 12 seconds forfeits the round. 6 rounds of escalating vocabulary warfare.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        6,
    durationLabel: "~7 min",
    difficulty:    "Legendary" as const,
    tags:          ["Language", "Strategy", "Bluffing", "Vocabulary"],
    rules: [
      "Both players see the same starting word each round",
      "Alternate turns: change exactly ONE letter to form a new valid 5-letter word",
      "Each valid word scores its Scrabble letter value (sum of all letters)",
      "No word may be repeated in the same chain",
      "CHALLENGE: claim opponent's word is invalid — correct = their score reversed; wrong = −10 pts to you",
      "Fail to form a valid word within 12s = forfeit round (+15 pts bonus to opponent)",
      "6 rounds — highest cumulative score wins",
    ],
    anticheat:
      "Word validity validated server-side against a full English word dictionary. Challenges resolved server-side — the client cannot use an invalid word. All submissions timestamped server-side.",
  },

  FREQUENCY: {
    id:            "FREQUENCY",
    name:          "Frequency",
    emoji:         "📡",
    tagline:       "One word. One dial. Same wavelength.",
    accent:        "#6366f1",
    accentDark:    "#4f46e5",
    glow:          "rgba(99,102,241,0.4)",
    description:
      "A theory-of-mind clue-giving duel on a spectrum dial. Each round both players see the same two polar opposites — like HOT ↔ COLD or ANCIENT ↔ MODERN. A secret position is set somewhere between them. The Transmitter gives ONE word that maps to that position. The Receiver drags a dial to where they think that word sits on the spectrum. Closer = more points. Requires deep empathy — you must think about how another human will interpret your word. Roles swap each round.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        8,
    durationLabel: "~6 min",
    difficulty:    "Hard" as const,
    tags:          ["Empathy", "Language", "Theory of Mind", "Universal"],
    rules: [
      "Both players see the same two polar-opposite concepts (e.g. HOT ↔ COLD)",
      "A secret dial position (0–100) is hidden — only the Transmitter sees it",
      "Transmitter gives ONE word as a clue — no part of the spectrum label allowed",
      "Receiver drags the dial to where they believe that word sits on the spectrum",
      "Distance ≤5: +30 pts | ≤12: +22 | ≤20: +14 | ≤30: +7 pts",
      "Transmitter also scores based on how well their clue was received",
      "8 rounds alternating roles — highest total wins",
    ],
    anticheat:
      "Dial positions are generated server-side before any clue is given. Clues are committed server-side. Receiver's guess validated against stored position — no client spoofing.",
  },
 
  DEAD_RECKONING: {
    id:            "DEAD_RECKONING",
    name:          "Dead Reckoning",
    emoji:         "🧭",
    tagline:       "Track it with your mind. Mark where it stopped.",
    accent:        "#f59e0b",
    accentDark:    "#d97706",
    glow:          "rgba(245,158,11,0.4)",
    description:
      "A navigation memory challenge where no information remains after the event. Both players watch an animated dot travel a path across a blank canvas for 4 seconds — turns, curves, speed changes included. The dot disappears and the canvas goes dark. Players must click exactly where they believe the dot stopped. No grid, no reference, no trail. Pure spatial memory and mental motion tracking. Works identically for every human regardless of culture or language.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        8,
    durationLabel: "~5 min",
    difficulty:    "Extreme" as const,
    tags:          ["Spatial Memory", "Navigation", "Focus", "Universal"],
    rules: [
      "Watch a dot travel a random path on a blank canvas for 4 seconds",
      "The dot disappears — canvas goes dark with no reference markers",
      "Click where you believe the dot ended up — 10 seconds to decide",
      "Distance ≤4%: +30 pts | ≤10%: +22 | ≤18%: +14 | ≤28%: +7 pts",
      "Scored as a percentage of canvas diagonal — scale-independent",
      "Both players' guesses and the true endpoint are revealed each round",
      "8 rounds of escalating path complexity — highest total wins",
    ],
    anticheat:
      "Paths generated and end positions stored server-side before display. End coordinates never sent to clients until both have submitted guesses. Client timestamps validated server-side.",
  },
 
  CONTRABAND: {
    id:            "CONTRABAND",
    name:          "Contraband",
    emoji:         "🧳",
    tagline:       "Hide it. Find it. Outsmart the other side.",
    accent:        "#f97316",
    accentDark:    "#ea580c",
    glow:          "rgba(249,115,22,0.4)",
    description:
      "A deception duel with alternating roles. As the Smuggler: secretly mark 2 of 5 suitcases as containing contraband — your opponent can't see which. Earn points each turn your contraband goes uninspected. Use your one-time Bluff Switch to swap two suitcase appearances and confuse the Inspector. As the Inspector: open 2 suitcases per turn for 3 turns — find contraband for big points. Roles swap each round. Pure deduction meets psychological misdirection.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        6,
    durationLabel: "~5 min",
    difficulty:    "Hard" as const,
    tags:          ["Deception", "Deduction", "Psychology", "Strategy"],
    rules: [
      "Roles alternate: Smuggler places contraband, Inspector tries to find it",
      "Smuggler secretly marks 2 of 5 suitcases as contraband before the round",
      "Inspector opens 2 suitcases per turn for 3 turns per round",
      "Inspector: +20 pts per contraband found",
      "Smuggler: +6 pts per turn each uninspected suitcase survives",
      "Smuggler may use ONE Bluff Switch per round (reorders suitcase appearances)",
      "6 rounds alternating roles — highest total wins the prize pool",
    ],
    anticheat:
      "Contraband positions committed server-side before any inspection begins. Inspector never receives the layout — only results of suitcases they open. Bluff Switch processed server-side.",
  },

  PULSE: {
    id:            "PULSE",
    name:          "Pulse",
    emoji:         "🎵",
    tagline:       "Listen. Remember. Tap it back perfectly.",
    accent:        "#a855f7",
    accentDark:    "#7c3aed",
    glow:          "rgba(168,85,247,0.4)",
    description:
      "A rhythm synchronisation duel. The server synthesises a unique beat pattern using Web Audio — you hear it play for 4.5 seconds. Then silence. You must tap a button to recreate the exact rhythm from memory. The server scores both players' tap sequences against the original using a timing-match algorithm that finds the best alignment offset. Heavy beats require tighter timing than lighter ones. 8 rounds, patterns grow from 4 to 10 beats. Works for every human who has ever experienced music — zero language, zero cultural advantage.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        8,
    durationLabel: "~5 min",
    difficulty:    "Extreme" as const,
    tags:          ["Rhythm", "Memory", "Audio", "Universal"],
    rules: [
      "Both players hear the same synthesised beat pattern for 4.5 seconds",
      "Then silence — tap the TAP button (or Spacebar) to recreate the rhythm",
      "7 seconds to reproduce the full sequence from memory",
      "Heavy beats require tighter timing (±80ms); lighter beats allow ±160ms",
      "Scoring uses best-alignment matching — you can start slightly early or late",
      "Round 1: 4 beats. Each round adds 1 more beat up to 10",
      "+30/+22/+14/+7 pts based on overall accuracy — highest total wins",
    ],
    anticheat:
      "Beat patterns generated server-side. Tap timestamps recorded server-side with millisecond precision. Scores computed server-side against stored pattern — timing cannot be faked.",
  },
 
  CARTOGRAPHER: {
    id:            "CARTOGRAPHER",
    name:          "Cartographer",
    emoji:         "🗺️",
    tagline:       "Survey the land. Map the unknown. Remember everything.",
    accent:        "#4ade80",
    accentDark:    "#22c55e",
    glow:          "rgba(74,222,128,0.4)",
    description:
      "A sequential map-building deduction challenge. Both players share a hidden 5×5 terrain grid (mountains, water, forest, desert, plains). Each player gets 8 survey probes to click cells and reveal terrain types. After probing, 10 mystery cells are shown — you must identify their terrain from memory and deduction. Your opponent probed different cells — what did they learn that you didn't? 6 rounds, each with a fresh grid. Pure information management and spatial memory.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        6,
    durationLabel: "~6 min",
    difficulty:    "Hard" as const,
    tags:          ["Deduction", "Memory", "Strategy", "Spatial"],
    rules: [
      "Both players share the same hidden 5×5 terrain grid each round",
      "You have 8 survey probes — click any cell to reveal its terrain type",
      "After all probes are used, a quiz begins: 10 mystery cells to identify",
      "Each correct terrain identification: +3 pts",
      "Both players probe different cells — they may know what you don't",
      "Use edge patterns, terrain clusters, and elimination to deduce unprobed cells",
      "6 rounds, new grid each time — highest cumulative score wins",
    ],
    anticheat:
      "Grid generated server-side per round. Player probes validated server-side. Quiz questions generated server-side after probing phase — cannot be pre-computed by clients.",
  },
 
  VOLTAGE: {
    id:            "VOLTAGE",
    name:          "Voltage",
    emoji:         "⚡",
    tagline:       "Bid energy. Win circuits. Manage your reserves.",
    accent:        "#6366f1",
    accentDark:    "#4f46e5",
    glow:          "rgba(99,102,241,0.4)",
    description:
      "An energy management auction with compounding consequences — the most strategically deep game in the arena. Both players start with 30 energy. Each round, 5 circuits appear with point values. Simultaneously allocate energy bids across them. Highest bid wins each circuit. But energy does NOT reset — only +3 regenerates per round. Overspend early and you're crippled in the endgame. Build a sustainable strategy or risk running completely dry. 8 rounds of resource warfare with escalating stakes.",
    minPlayers:    2 as const,
    maxPlayers:    2 as const,
    rounds:        8,
    durationLabel: "~5 min",
    difficulty:    "Legendary" as const,
    tags:          ["Strategy", "Resource", "Economics", "Planning"],
    rules: [
      "Both players start with 30 energy — this is your total budget across the game",
      "Each round: 5 circuits appear, each with a point value",
      "Simultaneously allocate your energy as bids across any circuits you want",
      "Highest bid wins each circuit and earns its points — tied bids go to you",
      "Spent energy is gone — only +3 energy regenerates per round (max 30)",
      "20 seconds to allocate bids — timer auto-locks your current allocation",
      "8 rounds — manage your energy reserves or be outspent late-game",
    ],
    anticheat:
      "Bids submitted simultaneously — neither player sees the other's allocation until both lock in. Server validates energy limits against stored player state. Energy cannot be faked or over-allocated.",
  },
 


  // ── Template for future games ─────────────────────────────────────────────
  // CIPHER_DUEL: {
  //   id:            "CIPHER_DUEL",
  //   name:          "Cipher Duel",
  //   emoji:         "🔐",
  //   tagline:       "Encode, decode, outwit",
  //   accent:        "#f59e0b",
  //   accentDark:    "#d97706",
  //   glow:          "rgba(245,158,11,0.4)",
  //   description:   "...",
  //   minPlayers:    2, maxPlayers: 2,
  //   rounds:        8, durationLabel: "~5 min", difficulty: "Hard",
  //   tags:          ["Cryptography", "Logic", "Speed"],
  //   rules:         [...],
  //   anticheat:     "...",
  // },
};

export const GAME_LIST: TokenRushGameDef[] = Object.values(TOKEN_RUSH_GAMES);

// ── Platform constants ────────────────────────────────────────────────────────
export const PLATFORM_FEE_PCT = 0.05;        // 5 % taken from prize pool
export const CASHOUT_MINIMUM  = 1_000_000;   // tokens
export const CASHOUT_RATE_GBP = 0.0001;      // 1 M tokens = £100
export const WAGER_PRESETS    = [100, 500, 1_000, 5_000, 10_000, 50_000] as const;
export const CHALLENGE_TTL_MS = 10 * 60 * 1000; // challenges expire after 10 min

// ── Helpers ───────────────────────────────────────────────────────────────────
export function calcPrize(wagerPerPlayer: number, players = 2) {
  const pool = wagerPerPlayer * players;
  const fee  = Math.ceil(pool * PLATFORM_FEE_PCT);
  return { pool, fee, net: pool - fee };
}

export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}