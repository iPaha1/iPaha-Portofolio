// components/game/game-debug-button.tsx (only in development)
"use client";

import { useGame } from "./game-provider";

export function GameDebugButton() {
  const { triggerGame, isGameActive, canPlay } = useGame();
  
  if (process.env.NODE_ENV !== "development") return null;
  if (!canPlay || isGameActive) return null;
  
  return (
    <button
      onClick={() => triggerGame?.()}
      className="fixed bottom-4 left-4 z-50 bg-purple-600 text-white text-xs px-3 py-1.5 rounded-full shadow-lg hover:bg-purple-700 transition-colors opacity-50 hover:opacity-100"
    >
      🎮 Test Game
    </button>
  );
}





// // components/game/GameDebugButton.tsx
// "use client";

// import { useGame } from "./game-provider";


// export function GameDebugButton() {
//   const { canPlay, triggerGame, isGameActive } = useGame();
  
//   // Add triggerGame to the context if not already there
//   // You'll need to expose triggerGame from GameProvider
  
//   if (process.env.NODE_ENV !== "development") return null;
  
//   return (
//     <button
//       onClick={() => triggerGame?.()}
//       disabled={!canPlay || isGameActive}
//       className="fixed bottom-4 left-4 z-50 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-50 hover:opacity-100"
//       title="Debug: Force trigger game"
//     >
//       🎮 Force Game
//     </button>
//   );
// }