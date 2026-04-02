// components/game/game-provider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { FloatingGame } from "./floating-game";
import { TokenNotification } from "./token-notification";
import { GameSettingsModal } from "./game-settings-modal";
import { GamificationInitializer } from "./gamification-initializer";
import { GameType } from "./game-factory";

interface GameContextType {
  isGameActive: boolean;
  currentGame: GameEvent | null;
  tokenBalance: number;
  streak: number;
  canPlay: boolean | undefined;
  settings: GameSettings;
  triggerGame: () => Promise<void>;
  optOut: () => void;
  optIn: () => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  awardTokens: (amount: number, reason: string, gameId?: string, performance?: string, gameType?: string) => Promise<void>;
}

interface GameEvent {
  id: string;
  // type: "CLICK_HUNT" | "TOKEN_RAIN" | "MYSTERY_BOX" | "REACTION" | string;
  type: GameType;
  subType?: string;
  rewardTokens: number;
  bonusTokens?: number;
  title: string;
  description?: string;
  duration: number;
  isFlash?: boolean;
}

interface GameSettings {
  gameEnabled: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  minGameDelay?: number;
}

// Helper to map game titles to performance ratings
function determinePerformance(score: number, maxPossibleReward: number): string {
  const percentage = (score / maxPossibleReward) * 100;
  if (percentage >= 90) return "perfect";
  if (percentage >= 70) return "good";
  if (percentage >= 50) return "partial";
  return "fail";
}

// Helper to map game type to economy categories
function mapGameTypeToEconomy(gameTitle: string, gameType: string): string {
  const title = gameTitle.toLowerCase();
  const type = gameType.toLowerCase();
  
  // Memory games
  if (title.includes("memory") || title.includes("match") || title.includes("pulse") || 
      title.includes("sequence") || title.includes("vault") || title.includes("shadow") ||
      title.includes("pixel") || title.includes("star") || title.includes("frequency")) {
    return "memory";
  }
  
  // Quiz/brain games
  if (title.includes("math") || title.includes("colour") || title.includes("color") ||
      title.includes("word") || title.includes("hunt") || title.includes("auction") ||
      title.includes("sonar") || title.includes("mind") || title.includes("echo")) {
    return "quiz";
  }
  
  // Puzzle/skill games
  if (title.includes("puzzle") || title.includes("chain") || title.includes("gravity") ||
      title.includes("signal") || title.includes("laser") || title.includes("orbit") ||
      title.includes("flood") || title.includes("mirror") || title.includes("tile") ||
      title.includes("ice") || title.includes("precision") || title.includes("neon") ||
      title.includes("warp") || title.includes("black hole") || title.includes("plasma")) {
    return "puzzle";
  }
  
  // Daily challenge / luck games
  if (title.includes("mystery") || title.includes("box") || title.includes("luck") ||
      type === "MYSTERY_BOX") {
    return "daily_challenge";
  }
  
  // Reflex games default to memory
  return "memory";
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { user, isSignedIn, isLoaded } = useUser();
  const [isGameActive, setIsGameActive] = useState(false);
  const [currentGame, setCurrentGame] = useState<GameEvent | null>(null);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [streak, setStreak] = useState(0);
  const [settings, setSettings] = useState<GameSettings>({ 
    gameEnabled: true, 
    soundEnabled: true, 
    notificationsEnabled: true 
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showTokenNotification, setShowTokenNotification] = useState<{ amount: number; reason: string } | null>(null);
  
  const lastGameTime = useRef<Date | null>(null);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Listen for manual game requests
  useEffect(() => {
    const handleGameRequest = (event: CustomEvent) => {
      console.log("🎮 GameProvider received manual game request:", event.detail);
      if (event.detail) {
        setCurrentGame(event.detail);
        setIsGameActive(true);
      }
    };
    
    window.addEventListener("game-requested", handleGameRequest as EventListener);
    console.log("🎮 GameProvider listening for game-requested events");
    
    return () => {
      window.removeEventListener("game-requested", handleGameRequest as EventListener);
    };
  }, []);

  // Auto-initialize gamification for new/existing users
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    
    const checkAndInitialize = async () => {
      try {
        const response = await fetch("/api/game/init", { method: "GET" });
        const data = await response.json();
        
        if (data.success && data.initialized) {
          toast(data.message || "🎉 Welcome to the Gamification System!");
          
          const walletRes = await fetch("/api/game/wallet");
          const walletData = await walletRes.json();
          setTokenBalance(walletData.balance);
        }
      } catch (error) {
        console.error("Failed to initialize gamification:", error);
      }
    };
    
    checkAndInitialize();
  }, [isLoaded, isSignedIn]);

  // Fetch user game settings and token balance
  useEffect(() => {
    if (!isSignedIn) return;

    const fetchData = async () => {
      try {
        const [settingsRes, walletRes, streakRes] = await Promise.all([
          fetch("/api/game/settings"),
          fetch("/api/game/wallet"),
          fetch("/api/game/streak"),
        ]);
        
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings(data);
        }
        if (walletRes.ok) {
          const data = await walletRes.json();
          setTokenBalance(data.balance);
        }
        if (streakRes.ok) {
          const data = await streakRes.json();
          setStreak(data.currentStreak);
        }
      } catch (error) {
        console.error("Failed to fetch game data:", error);
      }
    };

    fetchData();
  }, [isSignedIn]);

  // Debug: Log when provider mounts
  useEffect(() => {
    console.log("🎮 GameProvider mounted, isSignedIn:", isSignedIn, "user:", user?.id);
  }, [isSignedIn, user]);

  const triggerGame = useCallback(async (manual = true) => {
    if (!settings.gameEnabled || !isSignedIn) return;
 
    // For manual plays we skip the client-side cooldown check so the button
    // always responds immediately. The server handles cooldowns for auto-drops.
    if (!manual && lastGameTime.current) {
      const minutesSince = (Date.now() - lastGameTime.current.getTime()) / 60000;
      if (settings.minGameDelay && minutesSince < settings.minGameDelay) return;
    }
 
    try {
      const response = await fetch("/api/game/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manual }),
      });
 
      const data = await response.json();
 
      if (data.game) {
        setCurrentGame(data.game);
        setIsGameActive(true);
        lastGameTime.current = new Date();
 
        if (data.game.isFlash && settings.notificationsEnabled) {
          toast(`⚡ ${data.game.title} — Flash event!`);
        }
      }
    } catch (error) {
      console.error("Failed to trigger game:", error);
    }
  }, [settings, isSignedIn]);

  // Random interval for game drops (every 2-5 minutes)
  useEffect(() => {
    if (!settings.gameEnabled || !isSignedIn) return;

    const scheduleRandomGame = () => {
      const delay = Math.random() * (5 * 60 * 1000 - 2 * 60 * 1000) + 2 * 60 * 1000; // 2-5 minutes
      checkInterval.current = setTimeout(() => {
        triggerGame();
        scheduleRandomGame();
      }, delay);
    };

    scheduleRandomGame();

    return () => {
      if (checkInterval.current) clearTimeout(checkInterval.current);
    };
  }, [settings.gameEnabled, isSignedIn, triggerGame]);

  // ============================================================
  // FIXED: Award tokens handler with economy fields
  // ============================================================
  const awardTokens = useCallback(async (
    amount: number, 
    reason: string, 
    gameId?: string, 
    performance?: string, 
    gameType?: string
  ) => {
    try {
      // If performance not provided, infer from amount
      let finalPerformance = performance;
      let finalGameType = gameType;
      
      if (!finalPerformance && currentGame) {
        const maxReward = currentGame.bonusTokens ?? currentGame.rewardTokens * 2;
        finalPerformance = determinePerformance(amount, maxReward);
      }
      
      if (!finalGameType && currentGame) {
        finalGameType = mapGameTypeToEconomy(currentGame.title, currentGame.type);
      }
      
      // Default fallbacks
      finalPerformance = finalPerformance || "good";
      finalGameType = finalGameType || "memory";
      
      console.log(`[GameProvider] Awarding tokens: amount=${amount}, gameType=${finalGameType}, performance=${finalPerformance}`);
      
      const response = await fetch("/api/game/award", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount, 
          reason, 
          gameId,
          gameType: finalGameType,      // ✅ ADD THIS
          performance: finalPerformance, // ✅ ADD THIS
          currentStreak: streak
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTokenBalance(data.newBalance);
        setShowTokenNotification({ amount: data.awarded || amount, reason });
        
        // Show daily cap warning if applicable
        if (data.economics && data.economics.dailyCapRemaining === 0) {
          toast.info("🎯 Daily token limit reached! Come back tomorrow for more rewards.");
        }
        
        if (gameId) {
          const streakRes = await fetch("/api/game/streak/update", { method: "POST" });
          const streakData = await streakRes.json();
          if (streakData.currentStreak) setStreak(streakData.currentStreak);
        }
        
        setTimeout(() => setShowTokenNotification(null), 3000);
      } else if (data.reason === "DAILY_CAP_REACHED") {
        // User hit daily cap
        toast.info(data.message || "Daily token limit reached! Play again tomorrow.");
        console.log("[GameProvider] Daily cap reached:", data);
      } else {
        console.warn("[GameProvider] Award failed:", data);
      }
    } catch (error) {
      console.error("Failed to award tokens:", error);
    }
  }, [currentGame, streak]);

  const optOut = useCallback(async () => {
    await fetch("/api/game/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameEnabled: false }),
    });
    setSettings(prev => ({ ...prev, gameEnabled: false }));
    setIsGameActive(false);
    setCurrentGame(null);
  }, []);

  const optIn = useCallback(async () => {
    await fetch("/api/game/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameEnabled: true }),
    });
    setSettings(prev => ({ ...prev, gameEnabled: true }));
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<GameSettings>) => {
    await fetch("/api/game/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings),
    });
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const canPlay = settings.gameEnabled && isSignedIn;

  return (
    <GameContext.Provider value={{
      isGameActive,
      currentGame,
      tokenBalance,
      streak,
      canPlay,
      settings,
      triggerGame,
      optOut,
      optIn,
      updateSettings,
      showSettings,
      setShowSettings,
      awardTokens,
    }}>
      {children}
      <GamificationInitializer />
      {canPlay && isGameActive && currentGame && (
        <FloatingGame
          game={currentGame}
          onClose={() => {
            console.log("🎮 FloatingGame onClose called");
            setIsGameActive(false);
            setCurrentGame(null);
          }}
          onComplete={(reward, score) => {
            console.log("🎮 FloatingGame onComplete called with reward:", reward, "score:", score);
            
            // Determine performance based on score/reward
            const maxReward = currentGame.bonusTokens ?? currentGame.rewardTokens * 2;
            const performance = determinePerformance(reward, maxReward);
            const gameType = mapGameTypeToEconomy(currentGame.title, currentGame.type);
            
            // Pass performance and gameType to awardTokens
            awardTokens(reward, `Game: ${currentGame.title}`, currentGame.id, performance, gameType);
          }}
        />
      )}
      {showTokenNotification && (
        <TokenNotification amount={showTokenNotification.amount} reason={showTokenNotification.reason} />
      )}
      <GameSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onUpdate={updateSettings}
      />
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
}








// components/game/game-provider.tsx
// "use client";

// import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
// import { useUser } from "@clerk/nextjs";
// import { toast } from "sonner";
// import { FloatingGame } from "./floating-game";
// import { TokenNotification } from "./token-notification";
// import { GameSettingsModal } from "./game-settings-modal";
// import { GamificationInitializer } from "./gamification-initializer";

// interface GameContextType {
//   isGameActive: boolean;
//   currentGame: GameEvent | null;
//   tokenBalance: number;
//   streak: number;
//   canPlay: boolean | undefined;
//   settings: GameSettings;
//   triggerGame: () => Promise<void>;  // ← ADD THIS
//   optOut: () => void;
//   optIn: () => void;
//   updateSettings: (settings: Partial<GameSettings>) => void;
//   showSettings: boolean;
//   setShowSettings: (show: boolean) => void;
//   awardTokens: (amount: number, reason: string, gameId?: string) => Promise<void>;
// }

// interface GameEvent {
//   id: string;
//   type: "CLICK_HUNT" | "TOKEN_RAIN" | "MYSTERY_BOX" | "REACTION";
//   subType?: string;
//   rewardTokens: number;
//   bonusTokens?: number;
//   title: string;
//   description?: string;
//   duration: number;
//   isFlash?: boolean;
// }

// interface GameSettings {
//   gameEnabled: boolean;
//   soundEnabled: boolean;
//   notificationsEnabled: boolean;
//   minGameDelay?: number;
// }

// const GameContext = createContext<GameContextType | undefined>(undefined);

// export function GameProvider({ children }: { children: React.ReactNode }) {
//   const { user, isSignedIn, isLoaded } = useUser();
//   const [isGameActive, setIsGameActive] = useState(false);
//   const [currentGame, setCurrentGame] = useState<GameEvent | null>(null);
//   const [tokenBalance, setTokenBalance] = useState(0);
//   const [streak, setStreak] = useState(0);
//   const [settings, setSettings] = useState<GameSettings>({ 
//     gameEnabled: true, 
//     soundEnabled: true, 
//     notificationsEnabled: true 
//   });
//   const [showSettings, setShowSettings] = useState(false);
//   const [showTokenNotification, setShowTokenNotification] = useState<{ amount: number; reason: string } | null>(null);
  
//   const lastGameTime = useRef<Date | null>(null);
//   const checkInterval = useRef<NodeJS.Timeout | null>(null);
  
//   // Listen for manual game requests
//   useEffect(() => {
//     const handleGameRequest = (event: CustomEvent) => {
//       console.log("🎮 GameProvider received manual game request:", event.detail);
//       if (event.detail) {
//         setCurrentGame(event.detail);
//         setIsGameActive(true);
//       }
//     };
    
//     window.addEventListener("game-requested", handleGameRequest as EventListener);
//     console.log("🎮 GameProvider listening for game-requested events");
    
//     return () => {
//       window.removeEventListener("game-requested", handleGameRequest as EventListener);
//     };
//   }, []);

//   // Auto-initialize gamification for new/existing users
//   useEffect(() => {
//     if (!isLoaded || !isSignedIn) return;
    
//     const checkAndInitialize = async () => {
//       try {
//         const response = await fetch("/api/game/init", { method: "GET" });
//         const data = await response.json();
        
//         if (data.success && data.initialized) {
//           toast(data.message || "🎉 Welcome to the Gamification System!");
          
//           const walletRes = await fetch("/api/game/wallet");
//           const walletData = await walletRes.json();
//           setTokenBalance(walletData.balance);
//         }
//       } catch (error) {
//         console.error("Failed to initialize gamification:", error);
//       }
//     };
    
//     checkAndInitialize();
//   }, [isLoaded, isSignedIn, toast]);

//   // Fetch user game settings and token balance
//   useEffect(() => {
//     if (!isSignedIn) return;

//     const fetchData = async () => {
//       try {
//         const [settingsRes, walletRes, streakRes] = await Promise.all([
//           fetch("/api/game/settings"),
//           fetch("/api/game/wallet"),
//           fetch("/api/game/streak"),
//         ]);
        
//         if (settingsRes.ok) {
//           const data = await settingsRes.json();
//           setSettings(data);
//         }
//         if (walletRes.ok) {
//           const data = await walletRes.json();
//           setTokenBalance(data.balance);
//         }
//         if (streakRes.ok) {
//           const data = await streakRes.json();
//           setStreak(data.currentStreak);
//         }
//       } catch (error) {
//         console.error("Failed to fetch game data:", error);
//       }
//     };

//     fetchData();
//   }, [isSignedIn]);

//   // Debug: Log when provider mounts
//   useEffect(() => {
//     console.log("🎮 GameProvider mounted, isSignedIn:", isSignedIn, "user:", user?.id);
//   }, [isSignedIn, user]);

//   // Trigger game function
//   // const triggerGame = useCallback(async () => {
//   //   console.log("🎮 triggerGame called");
//   //   console.log("🎮 settings.gameEnabled:", settings.gameEnabled);
//   //   console.log("🎮 isSignedIn:", isSignedIn);
    
//   //   if (!settings.gameEnabled || !isSignedIn) {
//   //     console.log("🎮 Game not triggered: settings disabled or not signed in");
//   //     return;
//   //   }
    
//   //   // Check minimum delay between games
//   //   if (lastGameTime.current) {
//   //     const minutesSince = (Date.now() - lastGameTime.current.getTime()) / 60000;
//   //     console.log("🎮 Minutes since last game:", minutesSince);
//   //     if (settings.minGameDelay && minutesSince < settings.minGameDelay) {
//   //       console.log("🎮 Game not triggered: cooldown active");
//   //       return;
//   //     }
//   //   }

//   //   try {
//   //     console.log("🎮 Fetching game from /api/game/trigger...");
//   //     const response = await fetch("/api/game/trigger", {
//   //       method: "POST",
//   //       headers: { "Content-Type": "application/json" },
//   //     });
      
//   //     console.log("🎮 Response status:", response.status);
//   //     const data = await response.json();
//   //     console.log("🎮 Response data:", data);
      
//   //     if (data.game) {
//   //       console.log("🎮 Setting current game:", data.game);
//   //       setCurrentGame(data.game);
//   //       setIsGameActive(true);
//   //       lastGameTime.current = new Date();
        
//   //       // Show notification for flash events
//   //       if (data.game.isFlash && settings.notificationsEnabled) {
//   //         toast(`⚡ ${data.game.title} - ${data.game.description || `Win ${data.game.rewardTokens} tokens!`}`);
//   //       }
//   //     } else {
//   //       console.log("🎮 No game returned, reason:", data.reason);
//   //     }
//   //   } catch (error) {
//   //     console.error("🎮 Failed to trigger game:", error);
//   //   }
//   // }, [settings.gameEnabled, isSignedIn, settings.minGameDelay, settings.notificationsEnabled, toast]);

//   const triggerGame = useCallback(async (manual = true) => {
//   if (!settings.gameEnabled || !isSignedIn) return;
 
//   // For manual plays we skip the client-side cooldown check so the button
//   // always responds immediately. The server handles cooldowns for auto-drops.
//   if (!manual && lastGameTime.current) {
//     const minutesSince = (Date.now() - lastGameTime.current.getTime()) / 60000;
//     if (settings.minGameDelay && minutesSince < settings.minGameDelay) return;
//   }
 
//   try {
//     const response = await fetch("/api/game/trigger", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ manual }),
//     });
 
//     const data = await response.json();
 
//     if (data.game) {
//       setCurrentGame(data.game);
//       setIsGameActive(true);
//       lastGameTime.current = new Date();
 
//       if (data.game.isFlash && settings.notificationsEnabled) {
//         toast(`⚡ ${data.game.title} — Flash event!`);
//       }
//     }
//   } catch (error) {
//     console.error("Failed to trigger game:", error);
//   }
// }, [settings, isSignedIn]);


//   // Debug: Log when currentGame changes
//   useEffect(() => {
//     console.log("🎮 currentGame changed:", currentGame);
//     console.log("🎮 isGameActive:", isGameActive);
//   }, [currentGame, isGameActive]);

//   // Random interval for game drops (every 2-5 minutes)
//   useEffect(() => {
//     if (!settings.gameEnabled || !isSignedIn) return;

//     const scheduleRandomGame = () => {
//       const delay = Math.random() * (5 * 60 * 1000 - 2 * 60 * 1000) + 2 * 60 * 1000; // 2-5 minutes
//       checkInterval.current = setTimeout(() => {
//         triggerGame();
//         scheduleRandomGame();
//       }, delay);
//     };

//     scheduleRandomGame();

//     return () => {
//       if (checkInterval.current) clearTimeout(checkInterval.current);
//     };
//   }, [settings.gameEnabled, isSignedIn, triggerGame]);

//   // Award tokens handler
//   const awardTokens = useCallback(async (amount: number, reason: string, gameId?: string) => {
//     try {
//       const response = await fetch("/api/game/award", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ amount, reason, gameId }),
//       });
      
//       const data = await response.json();
//       if (data.success) {
//         setTokenBalance(data.newBalance);
//         setShowTokenNotification({ amount, reason });
        
//         if (gameId) {
//           const streakRes = await fetch("/api/game/streak/update", { method: "POST" });
//           const streakData = await streakRes.json();
//           if (streakData.newStreak) setStreak(streakData.newStreak);
//         }
        
//         setTimeout(() => setShowTokenNotification(null), 3000);
//       }
//     } catch (error) {
//       console.error("Failed to award tokens:", error);
//     }
//   }, []);

//   const optOut = useCallback(async () => {
//     await fetch("/api/game/settings", {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ gameEnabled: false }),
//     });
//     setSettings(prev => ({ ...prev, gameEnabled: false }));
//     setIsGameActive(false);
//     setCurrentGame(null);
//   }, []);

//   const optIn = useCallback(async () => {
//     await fetch("/api/game/settings", {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ gameEnabled: true }),
//     });
//     setSettings(prev => ({ ...prev, gameEnabled: true }));
//   }, []);

//   const updateSettings = useCallback(async (newSettings: Partial<GameSettings>) => {
//     await fetch("/api/game/settings", {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(newSettings),
//     });
//     setSettings(prev => ({ ...prev, ...newSettings }));
//   }, []);

//   const canPlay = settings.gameEnabled && isSignedIn;
//   console.log("🎮 GameProvider render, canPlay:", canPlay, "isGameActive:", isGameActive, "currentGame:", currentGame);

//   return (
//     <GameContext.Provider value={{
//       isGameActive,
//       currentGame,
//       tokenBalance,
//       streak,
//       canPlay,
//       settings,
//       triggerGame,  // ← ADD THIS TO THE PROVIDER
//       optOut,
//       optIn,
//       updateSettings,
//       showSettings,
//       setShowSettings,
//       awardTokens,
//     }}>
//       {/* Debug indicator */}
//       {/* {process.env.NODE_ENV === "development" && (
//         <div className="fixed bottom-4 right-4 z-50 bg-black/50 text-white text-xs px-2 py-1 rounded">
//           Game Active: {isGameActive ? "YES" : "NO"} | 
//           Current Game: {currentGame?.title || "None"}
//         </div>
//       )} */}
//       {children}
//       <GamificationInitializer />
//       {canPlay && isGameActive && currentGame && (
//         <FloatingGame
//           game={currentGame}
//           onClose={() => {
//             console.log("🎮 FloatingGame onClose called");
//             setIsGameActive(false);
//             setCurrentGame(null);
//           }}
//           onComplete={(reward) => {
//             console.log("🎮 FloatingGame onComplete called with reward:", reward);
//             awardTokens(reward, `Game: ${currentGame.title}`, currentGame.id);
//           }}
//         />
//       )}
//       {showTokenNotification && (
//         <TokenNotification amount={showTokenNotification.amount} reason={showTokenNotification.reason} />
//       )}
//       <GameSettingsModal
//         isOpen={showSettings}
//         onClose={() => setShowSettings(false)}
//         settings={settings}
//         onUpdate={updateSettings}
//       />
//     </GameContext.Provider>
//   );
// }

// export function useGame() {
//   const context = useContext(GameContext);
//   if (!context) throw new Error("useGame must be used within GameProvider");
//   return context;
// }






// // =============================================================================
// // GAMIFICATION PROVIDER - Global Game Context
// // components/game/GameProvider.tsx
// // =============================================================================

// "use client";

// import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
// import { useUser } from "@clerk/nextjs";
// import { toast } from "sonner";
// import { FloatingGame } from "./floating-game";
// import { TokenNotification } from "./token-notification";
// import { GameSettingsModal } from "./game-settings-modal";
// import { GamificationInitializer } from "./gamification-initializer";



// interface GameContextType {
//   isGameActive: boolean;
//   currentGame: GameEvent | null;
//   tokenBalance: number;
//   streak: number;
//   canPlay: boolean | undefined;
//   settings: GameSettings;
//   optOut: () => void;
//   optIn: () => void;
//   updateSettings: (settings: Partial<GameSettings>) => void;
//   showSettings: boolean;
//   setShowSettings: (show: boolean) => void;
// }

// interface GameEvent {
//   id: string;
//   type: "CLICK_HUNT" | "TOKEN_RAIN" | "MYSTERY_BOX" | "REACTION";
//   // type: "CLICK_HUNT" | "TOKEN_RAIN" | "QUIZ" | "MYSTERY_BOX" | "REACTION";
//   subType?: string;
//   rewardTokens: number;
//   bonusTokens?: number;
//   title: string;
//   description?: string;
//   duration: number;
//   isFlash?: boolean;
// }

// interface GameSettings {
//   gameEnabled: boolean;
//   soundEnabled: boolean;
//   notificationsEnabled: boolean;
//   minGameDelay?: number;
// }

// const GameContext = createContext<GameContextType | undefined>(undefined);

// export function GameProvider({ children }: { children: React.ReactNode }) {
//   const { user, isSignedIn, isLoaded } = useUser();
//   const [isGameActive, setIsGameActive] = useState(false);
//   const [currentGame, setCurrentGame] = useState<GameEvent | null>(null);
//   const [tokenBalance, setTokenBalance] = useState(0);
//   const [streak, setStreak] = useState(0);
//   const [settings, setSettings] = useState<GameSettings>({ gameEnabled: true, soundEnabled: true, notificationsEnabled: true });
//   const [showSettings, setShowSettings] = useState(false);
//   const [showTokenNotification, setShowTokenNotification] = useState<{ amount: number; reason: string } | null>(null);
  
//   const lastGameTime = useRef<Date | null>(null);
//   const checkInterval = useRef<NodeJS.Timeout | null>(null);
  

//   useEffect(() => {
//   const handleGameRequest = (event: CustomEvent) => {
//     console.log("🎮 GameProvider received manual game request:", event.detail);
//     if (event.detail) {
//       setCurrentGame(event.detail);
//       setIsGameActive(true);
//     }
//   };
  
//   window.addEventListener("game-requested", handleGameRequest as EventListener);
//   console.log("🎮 GameProvider listening for game-requested events");
  
//   return () => {
//     window.removeEventListener("game-requested", handleGameRequest as EventListener);
//   };
// }, []);

//   useEffect(() => {
//   const handleGameRequest = (event: CustomEvent) => {
//     console.log("🎮 Manual game request received:", event.detail);
//     setCurrentGame(event.detail);
//     setIsGameActive(true);
//   };
  
//   window.addEventListener("game-requested", handleGameRequest as EventListener);
  
//   return () => {
//     window.removeEventListener("game-requested", handleGameRequest as EventListener);
//   };
// }, []);

//   // Auto-initialize gamification for new/existing users
//   useEffect(() => {
//     if (!isLoaded || !isSignedIn) return;
    
//     const checkAndInitialize = async () => {
//       try {
//         const response = await fetch("/api/game/init", { method: "GET" });
//         const data = await response.json();
        
//         if (data.success && data.initialized) {
//           // Show welcome toast if this is first initialization
//           toast(data.message || "🎉 Welcome to the Gamification System!");
          
//           // Refresh token balance
//           const walletRes = await fetch("/api/game/wallet");
//           const walletData = await walletRes.json();
//           setTokenBalance(walletData.balance);
//         }
//       } catch (error) {
//         console.error("Failed to initialize gamification:", error);
//       }
//     };
    
//     checkAndInitialize();
//   }, [isLoaded, isSignedIn, toast]);

//   // Fetch user game settings and token balance
//   useEffect(() => {
//     if (!isSignedIn) return;

//     const fetchData = async () => {
//       try {
//         const [settingsRes, walletRes, streakRes] = await Promise.all([
//           fetch("/api/game/settings"),
//           fetch("/api/game/wallet"),
//           fetch("/api/game/streak"),
//         ]);
        
//         if (settingsRes.ok) {
//           const data = await settingsRes.json();
//           setSettings(data);
//         }
//         if (walletRes.ok) {
//           const data = await walletRes.json();
//           setTokenBalance(data.balance);
//         }
//         if (streakRes.ok) {
//           const data = await streakRes.json();
//           setStreak(data.currentStreak);
//         }
//       } catch (error) {
//         console.error("Failed to fetch game data:", error);
//       }
//     };

//     fetchData();
//   }, [isSignedIn]);

//   // Debug: Log when provider mounts
//   useEffect(() => {
//     console.log("🎮 GameProvider mounted, isSignedIn:", isSignedIn, "user:", user?.id);
//   }, [isSignedIn, user]);

//   // Random game trigger system
//   // const triggerGame = useCallback(async () => {
//   //   console.log("🎮 triggerGame called, settings.gameEnabled:", settings.gameEnabled, "isSignedIn:", isSignedIn);
//   //   if (!settings.gameEnabled || !isSignedIn) return;
    
//   //   // Check minimum delay between games
//   //   if (lastGameTime.current) {
//   //     console.log("🎮 Game not triggered: settings disabled or not signed in");
//   //     const minutesSince = (Date.now() - lastGameTime.current.getTime()) / 60000;
//   //     if (settings.minGameDelay && minutesSince < settings.minGameDelay) {
//   //       console.log("🎮 Game not triggered: cooldown active");
//   //       return;
//   //     }
//   //   }

//   //   try {
//   //     console.log("🎮 Fetching game from /api/game/trigger...");
//   //     const response = await fetch("/api/game/trigger", {
//   //       method: "POST",
//   //       headers: { "Content-Type": "application/json" },
//   //       body: JSON.stringify({ userId: user?.id }),
//   //     });
      
//   //     const data = await response.json();
//   //     console.log("🎮 Game trigger response:", data);
      
//   //     if (data.game) {
//   //       console.log("🎮 Setting current game:", data.game);
//   //       setCurrentGame(data.game);
//   //       setIsGameActive(true);
//   //       lastGameTime.current = new Date();
        
//   //       // Show notification for flash events
//   //       if (data.game.isFlash && settings.notificationsEnabled) {
//   //         toast(`⚡ ${data.game.title} - ${data.game.description || `Win ${data.game.rewardTokens} tokens!`}`);
//   //       }
//   //     } else {
//   //       console.log("🎮 No game returned from API");
      
//   //     }
//   //   } catch (error) {
//   //     console.error("Failed to trigger game:", error);
//   //   }
//   // }, [settings.gameEnabled, isSignedIn, user?.id, settings.minGameDelay, settings.notificationsEnabled, toast]);


//   const triggerGame = useCallback(async () => {
//   console.log("🎮 triggerGame called");
//   console.log("🎮 settings.gameEnabled:", settings.gameEnabled);
//   console.log("🎮 isSignedIn:", isSignedIn);
  
//   if (!settings.gameEnabled || !isSignedIn) {
//     console.log("🎮 Game not triggered: settings disabled or not signed in");
//     return;
//   }
  
//   // Check minimum delay between games
//   if (lastGameTime.current) {
//     const minutesSince = (Date.now() - lastGameTime.current.getTime()) / 60000;
//     console.log("🎮 Minutes since last game:", minutesSince);
//     if (settings.minGameDelay && minutesSince < settings.minGameDelay) {
//       console.log("🎮 Game not triggered: cooldown active");
//       return;
//     }
//   }

//   try {
//     console.log("🎮 Fetching game from /api/game/trigger...");
//     const response = await fetch("/api/game/trigger", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//     });
    
//     console.log("🎮 Response status:", response.status);
//     const data = await response.json();
//     console.log("🎮 Response data:", data);
    
//     if (data.game) {
//       console.log("🎮 Setting current game:", data.game);
//       setCurrentGame(data.game);
//       setIsGameActive(true);
//       lastGameTime.current = new Date();
//     } else {
//       console.log("🎮 No game returned, reason:", data.reason);
//     }
//   } catch (error) {
//     console.error("🎮 Failed to trigger game:", error);
//   }
// }, [settings.gameEnabled, isSignedIn, settings.minGameDelay]);


//   // Debug: Log when currentGame changes
//   useEffect(() => {
//     console.log("🎮 currentGame changed:", currentGame);
//     console.log("🎮 isGameActive:", isGameActive);
//   }, [currentGame, isGameActive]);

//   // Random interval for game drops (every 2-5 minutes)
//   useEffect(() => {
//     if (!settings.gameEnabled || !isSignedIn) return;

//     const scheduleRandomGame = () => {
//       const delay = Math.random() * (5 * 60 * 1000 - 2 * 60 * 1000) + 2 * 60 * 1000; // 2-5 minutes
//       checkInterval.current = setTimeout(() => {
//         triggerGame();
//         scheduleRandomGame(); // Re-schedule
//       }, delay);
//     };

//     scheduleRandomGame();

//     return () => {
//       if (checkInterval.current) clearTimeout(checkInterval.current);
//     };
//   }, [settings.gameEnabled, isSignedIn, triggerGame]);

//   // Award tokens handler
//   const awardTokens = useCallback(async (amount: number, reason: string, gameId?: string) => {
//     try {
//       const response = await fetch("/api/game/award", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ amount, reason, gameId }),
//       });
      
//       const data = await response.json();
//       if (data.success) {
//         setTokenBalance(data.newBalance);
//         setShowTokenNotification({ amount, reason });
        
//         // Update streak if it's a game completion
//         if (gameId) {
//           const streakRes = await fetch("/api/game/streak/update", { method: "POST" });
//           const streakData = await streakRes.json();
//           if (streakData.newStreak) setStreak(streakData.newStreak);
//         }
        
//         setTimeout(() => setShowTokenNotification(null), 3000);
//       }
//     } catch (error) {
//       console.error("Failed to award tokens:", error);
//     }
//   }, []);

//   const optOut = useCallback(async () => {
//     await fetch("/api/game/settings", {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ gameEnabled: false }),
//     });
//     setSettings(prev => ({ ...prev, gameEnabled: false }));
//     setIsGameActive(false);
//     setCurrentGame(null);
//   }, []);

//   const optIn = useCallback(async () => {
//     await fetch("/api/game/settings", {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ gameEnabled: true }),
//     });
//     setSettings(prev => ({ ...prev, gameEnabled: true }));
//   }, []);

//   const updateSettings = useCallback(async (newSettings: Partial<GameSettings>) => {
//     await fetch("/api/game/settings", {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(newSettings),
//     });
//     setSettings(prev => ({ ...prev, ...newSettings }));
//   }, []);

//   const canPlay = settings.gameEnabled && isSignedIn;

//   return (
//     <GameContext.Provider value={{
//       isGameActive,
//       currentGame,
//       tokenBalance,
//       streak,
//       canPlay,
//       settings,
//       optOut,
//       optIn,
//       updateSettings,
//       showSettings,
//       setShowSettings,
//     }}>
//       {/* Debug indicator */}
//     {process.env.NODE_ENV === "development" && (
//       <div className="fixed bottom-4 right-4 z-50 bg-black/50 text-white text-xs px-2 py-1 rounded">
//         Game Active: {isGameActive ? "YES" : "NO"} | 
//         Current Game: {currentGame?.title || "None"}
//       </div>
//     )}
//       {children}
//       <GamificationInitializer />
//       {canPlay && isGameActive && currentGame && (
//         <FloatingGame
//           game={currentGame}
//           onClose={() => {
//           console.log("🎮 FloatingGame onClose called");
//           setIsGameActive(false);
//           setCurrentGame(null);
//         }}
//           onComplete={(reward) => {
//           console.log("🎮 FloatingGame onComplete called with reward:", reward);
//           awardTokens(reward, `Game: ${currentGame.title}`, currentGame.id);
//         }}
//         />
//       )}
//       {showTokenNotification && (
//         <TokenNotification amount={showTokenNotification.amount} reason={showTokenNotification.reason} />
//       )}
//       <GameSettingsModal
//         isOpen={showSettings}
//         onClose={() => setShowSettings(false)}
//         settings={settings}
//         onUpdate={updateSettings}
//       />
//     </GameContext.Provider>
//   );
// }

// export function useGame() {
//   const context = useContext(GameContext);
//   if (!context) throw new Error("useGame must be used within GameProvider");
//   return context;
// }